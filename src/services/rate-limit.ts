import { createHmac } from "node:crypto";

import { consumeSubmissionRateLimit } from "@/db/repositories/submission-rate-limits-repository";
import { env, flags } from "@/lib/env";

function extractSubmissionKey(request: Request) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const userAgent = request.headers.get("user-agent")?.trim();

  return forwardedFor || realIp || userAgent || "anonymous";
}

function hashSubmissionKey(value: string) {
  return createHmac("sha256", env.moderationSecret)
    .update(`submission:${value}`)
    .digest("hex");
}

export async function assertSubmissionRateLimit(request: Request) {
  if (flags.mockMode) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  const now = new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(
    now.getTime() + env.submissionRateLimitWindowSeconds * 1000,
  ).toISOString();
  const allowed = await consumeSubmissionRateLimit({
    keyHash: hashSubmissionKey(extractSubmissionKey(request)),
    createdAt,
    expiresAt,
    maxAttempts: env.submissionRateLimitMaxAttempts,
  });

  return {
    allowed,
    retryAfterSeconds: env.submissionRateLimitWindowSeconds,
  };
}
