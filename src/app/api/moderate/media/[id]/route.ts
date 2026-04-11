import { bootstrapApp } from "@/db/bootstrap";
import { getPendingComplaintForModeration } from "@/db/repositories/complaints-repository";
import { readStoredMedia } from "@/services/storage";
import { readModerationToken } from "@/services/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await bootstrapApp();

  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return new Response("Not found", { status: 404 });
  }

  const tokenResult = readModerationToken(token, {
    expectedPurpose: "preview",
    expectedComplaintId: id,
  });

  if (!tokenResult.ok) {
    return new Response("Not found", { status: 404 });
  }

  const complaint = await getPendingComplaintForModeration(id);

  if (!complaint?.mediaPath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const fileBuffer = await readStoredMedia(complaint.mediaPath);

    return new Response(fileBuffer, {
      headers: {
        "cache-control": "no-store, private",
        "content-type":
          complaint.mediaMimeType ?? "application/octet-stream",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
