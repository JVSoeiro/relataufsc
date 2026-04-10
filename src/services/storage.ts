import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, normalize, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import { env } from "@/lib/env";
import {
  getMediaKindFromMimeType,
  mimeTypeByExtension,
  uploadExtensionByMimeType,
} from "@/lib/constants";
import { resolveRuntimePath } from "@/lib/runtime-paths";

const dataRoot = resolveRuntimePath(env.dataDir);
const pendingUploadRoot = resolveRuntimePath(env.uploadPendingDir);
const publicUploadRoot = resolveRuntimePath(env.uploadPublicDir);

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

export function ensureStorageDirectories() {
  const legacyApprovedRoot = resolve(dataRoot, "uploads", "approved");
  const publicRootExistedBeforeBootstrap = existsSync(publicUploadRoot);

  mkdirSync(dataRoot, { recursive: true });
  mkdirSync(dirname(resolveRuntimePath(env.sqliteDbPath)), { recursive: true });
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

function splitStoredRelativePath(relativePath: string) {
  const safeRelativePath = normalizeStoredRelativePath(relativePath);
  const [bucket, ...segments] = safeRelativePath.split("/");

  if (
    (bucket !== "pending" && bucket !== "public") ||
    segments.length === 0
  ) {
    throw new Error("Invalid storage bucket.");
  }

  return {
    bucket,
    safeRelativePath,
    relativeSubpath: segments.join("/"),
  };
}

export function resolveStoredMediaPath(relativePath: string) {
  const { bucket, relativeSubpath } = splitStoredRelativePath(relativePath);
  const bucketRoot = bucket === "pending" ? pendingUploadRoot : publicUploadRoot;
  const absolutePath = resolve(bucketRoot, relativeSubpath);

  if (
    absolutePath !== bucketRoot &&
    !absolutePath.startsWith(`${bucketRoot}/`)
  ) {
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
  const { safeRelativePath, bucket } = splitStoredRelativePath(relativePath);

  if (bucket !== "public") {
    throw new Error("Only public media can be exposed.");
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
  const absolutePath = resolveStoredMediaPath(relativePath);
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const mediaKind = getMediaKindFromMimeType(file.type);

  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, fileBuffer);

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

export function moveUploadToPublic(
  pendingRelativePath: string,
  publicRelativePath: string,
) {
  const fromAbsolutePath = resolveStoredMediaPath(pendingRelativePath);
  const toAbsolutePath = resolveStoredMediaPath(publicRelativePath);

  mkdirSync(dirname(toAbsolutePath), { recursive: true });
  renameSync(fromAbsolutePath, toAbsolutePath);
}

export function deleteStoredMedia(relativePath: string | null | undefined) {
  if (!relativePath) {
    return;
  }

  const absolutePath = resolveStoredMediaPath(relativePath);
  rmSync(absolutePath, { force: true });
}
