import {
  getMimeTypeFromStoredPath,
  readStoredMedia,
} from "@/services/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const relativePath = path.join("/");

  if (!relativePath.startsWith("public/")) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const fileBuffer = await readStoredMedia(relativePath);

    return new Response(fileBuffer, {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
        "content-type": getMimeTypeFromStoredPath(relativePath),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
