import {
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, normalize, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import { env, flags } from "@/lib/env";
import {
  getMediaKindFromMimeType,
  mimeTypeByExtension,
  uploadExtensionByMimeType,
} from "@/lib/constants";
import { resolveRuntimePath } from "@/lib/runtime-paths";

const dataRoot = resolveRuntimePath(env.dataDir);
const pendingUploadRoot = resolveRuntimePath(env.uploadPendingDir);
const publicUploadRoot = resolveRuntimePath(env.uploadPublicDir);

const ensuredBuckets = new Set<string>();

function normalizeStoredRelativePath(relativePath: string) {
  const normalizedPath = normalize(relativePath).replaceAll("\\", "/");

  if (
    normalizedPath.length === 0 ||
    normalizedPath.startsWith("/") ||
    normalizedPath.startsWith("../") ||
    normalizedPath.includes("/../")
  ) {
    throw new Error("Invalid storage path.");
  }

  return normalizedPath;
}

function splitStoredRelativePath(relativePath: string) {
  const safeRelativePath = normalizeStoredRelativePath(relativePath);
  const [bucket, ...segments] = safeRelativePath.split("/");

  if ((bucket !== "pending" && bucket !== "public") || segments.length === 0) {
    throw new Error("Invalid storage bucket.");
  }

  return {
    bucket: bucket as "pending" | "public",
    safeRelativePath,
    relativeSubpath: segments.join("/"),
  };
}

function getSupabaseBucketName(bucket: "pending" | "public") {
  return bucket === "pending"
    ? env.supabaseStoragePendingBucket
    : env.supabaseStoragePublicBucket;
}

function getSupabaseStorageBaseUrl() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Supabase Storage is not configured.");
  }

  return `${env.supabaseUrl}/storage/v1`;
}

async function supabaseStorageFetch(
  path: string,
  init: RequestInit & { expectOk?: boolean } = {},
) {
  const { expectOk = true, headers, ...rest } = init;
  const response = await fetch(`${getSupabaseStorageBaseUrl()}${path}`, {
    ...rest,
    headers: {
      apikey: env.supabaseServiceRoleKey!,
      authorization: `Bearer ${env.supabaseServiceRoleKey!}`,
      ...headers,
    },
  });

  if (expectOk && !response.ok) {
    const body = await response.text().catch(() => "<unreadable body>");
    throw new Error(
      `Supabase Storage request failed: ${response.status} ${response.statusText} - ${body}`,
    );
  }

  return response;
}

async function ensureSupabaseBucket(bucket: "pending" | "public") {
  if (!flags.supabaseStorageConfigured) {
    return;
  }

  const bucketName = getSupabaseBucketName(bucket);

  if (ensuredBuckets.has(bucketName)) {
    return;
  }

  const response = await supabaseStorageFetch("/bucket", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id: bucketName,
      name: bucketName,
      public: bucket === "public",
    }),
    expectOk: false,
  });

  if (!response.ok && response.status !== 400 && response.status !== 409) {
    const body = await response.text().catch(() => "<unreadable body>");
    throw new Error(
      `Unable to ensure Supabase bucket ${bucketName}: ${response.status} ${response.statusText} - ${body}`,
    );
  }

  ensuredBuckets.add(bucketName);
}

async function uploadToSupabaseStorage(
  relativePath: string,
  fileBuffer: Uint8Array | Buffer,
  mimeType: string,
) {
  const { bucket, relativeSubpath } = splitStoredRelativePath(relativePath);
  const bucketName = getSupabaseBucketName(bucket);

  await ensureSupabaseBucket(bucket);

  await supabaseStorageFetch(
    `/object/${encodeURIComponent(bucketName)}/${relativeSubpath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")}`,
    {
      method: "POST",
      headers: {
        "content-type": mimeType,
        "x-upsert": "false",
      },
      body: new Uint8Array(fileBuffer),
    },
  );
}

async function deleteFromSupabaseStorage(relativePath: string) {
  const { bucket, relativeSubpath } = splitStoredRelativePath(relativePath);
  const bucketName = getSupabaseBucketName(bucket);

  await supabaseStorageFetch(
    `/object/${encodeURIComponent(bucketName)}/${relativeSubpath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")}`,
    {
    method: "DELETE",
      expectOk: false,
    },
  );
}

async function readFromSupabaseStorage(relativePath: string) {
  const { bucket, relativeSubpath } = splitStoredRelativePath(relativePath);
  const bucketName = getSupabaseBucketName(bucket);
  const visibilityPath =
    bucket === "public" ? "public" : "authenticated";
  const response = await supabaseStorageFetch(
    `/object/${visibilityPath}/${encodeURIComponent(bucketName)}/${relativeSubpath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")}`,
    {
      method: "GET",
    },
  );

  return Buffer.from(await response.arrayBuffer());
}

export function ensureStorageDirectories() {
  if (flags.supabaseStorageConfigured) {
    return;
  }

  const legacyApprovedRoot = resolve(dataRoot, "uploads", "approved");
  const publicRootExistedBeforeBootstrap = existsSync(publicUploadRoot);

  mkdirSync(dataRoot, { recursive: true });
  mkdirSync(pendingUploadRoot, { recursive: true });
  mkdirSync(publicUploadRoot, { recursive: true });

  if (
    legacyApprovedRoot !== publicUploadRoot &&
    existsSync(legacyApprovedRoot) &&
    !publicRootExistedBeforeBootstrap
  ) {
    mkdirSync(dirname(publicUploadRoot), { recursive: true });
    renameSync(legacyApprovedRoot, publicUploadRoot);
  }
}

export function resolveStoredMediaPath(relativePath: string) {
  if (flags.supabaseStorageConfigured) {
    throw new Error("Absolute filesystem paths are not available in Supabase Storage mode.");
  }

  const { bucket, relativeSubpath } = splitStoredRelativePath(relativePath);
  const bucketRoot = bucket === "pending" ? pendingUploadRoot : publicUploadRoot;
  const absolutePath = resolve(bucketRoot, relativeSubpath);

  if (absolutePath !== bucketRoot && !absolutePath.startsWith(`${bucketRoot}/`)) {
    throw new Error("Unsafe storage path.");
  }

  return absolutePath;
}

export function getMimeTypeFromStoredPath(relativePath: string) {
  const { safeRelativePath } = splitStoredRelativePath(relativePath);
  const extension = safeRelativePath.split(".").pop()?.toLowerCase();

  if (!extension) {
    return "application/octet-stream";
  }

  return mimeTypeByExtension[extension] ?? "application/octet-stream";
}

export function createPublicMediaUrl(relativePath: string) {
  const { safeRelativePath, bucket, relativeSubpath } =
    splitStoredRelativePath(relativePath);

  if (bucket !== "public") {
    throw new Error("Only public media can be exposed.");
  }

  if (flags.supabaseStorageConfigured) {
    const bucketName = getSupabaseBucketName("public");

    return `${env.supabaseUrl}/storage/v1/object/public/${encodeURIComponent(
      bucketName,
    )}/${relativeSubpath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")}`;
  }

  return `/media/${safeRelativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

export async function savePendingUpload(file: File) {
  ensureStorageDirectories();

  const extension = uploadExtensionByMimeType[file.type];

  if (!extension) {
    throw new Error("Unsupported upload type.");
  }

  const date = new Date();
  const relativePath = [
    "pending",
    String(date.getUTCFullYear()),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    `${randomUUID()}.${extension}`,
  ].join("/");
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const mediaKind = getMediaKindFromMimeType(file.type);

  if (flags.supabaseStorageConfigured) {
    await uploadToSupabaseStorage(relativePath, fileBuffer, file.type);
  } else {
    const absolutePath = resolveStoredMediaPath(relativePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, fileBuffer);
  }

  return {
    relativePath,
    sizeBytes: fileBuffer.byteLength,
    mediaKind,
    mimeType: file.type,
  };
}

export function getPublicDestinationPath(pendingPath: string) {
  const safePendingPath = normalizeStoredRelativePath(pendingPath);

  if (!safePendingPath.startsWith("pending/")) {
    throw new Error("Only pending uploads can be published.");
  }

  return safePendingPath.replace(/^pending\//, "public/");
}

export async function moveUploadToPublic(
  pendingRelativePath: string,
  publicRelativePath: string,
) {
  if (flags.supabaseStorageConfigured) {
    const fileBuffer = await readFromSupabaseStorage(pendingRelativePath);
    await uploadToSupabaseStorage(
      publicRelativePath,
      fileBuffer,
      getMimeTypeFromStoredPath(pendingRelativePath),
    );
    await deleteFromSupabaseStorage(pendingRelativePath);
    return;
  }

  const fromAbsolutePath = resolveStoredMediaPath(pendingRelativePath);
  const toAbsolutePath = resolveStoredMediaPath(publicRelativePath);

  mkdirSync(dirname(toAbsolutePath), { recursive: true });
  renameSync(fromAbsolutePath, toAbsolutePath);
}

export async function deleteStoredMedia(relativePath: string | null | undefined) {
  if (!relativePath) {
    return;
  }

  if (flags.supabaseStorageConfigured) {
    await deleteFromSupabaseStorage(relativePath);
    return;
  }

  const absolutePath = resolveStoredMediaPath(relativePath);
  rmSync(absolutePath, { force: true });
}

export async function readStoredMedia(relativePath: string) {
  if (flags.supabaseStorageConfigured) {
    return readFromSupabaseStorage(relativePath);
  }

  const absolutePath = resolveStoredMediaPath(relativePath);
  const { readFile } = await import("node:fs/promises");
  return readFile(absolutePath);
}

export function describeStoredMedia(relativePath: string) {
  const { bucket, relativeSubpath } = splitStoredRelativePath(relativePath);

  if (flags.supabaseStorageConfigured) {
    return `supabase://${getSupabaseBucketName(bucket)}/${relativeSubpath}`;
  }

  return resolveStoredMediaPath(relativePath);
}
