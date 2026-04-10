import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import type { ModerationTokenPurpose } from "@/lib/constants";
import { env } from "@/lib/env";

type ModerationTokenPayload = {
  version: 1;
  tokenId: string;
  complaintId: string;
  purpose: ModerationTokenPurpose;
  issuedAt: number;
  expiresAt: number;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", env.moderationSecret)
    .update(payload)
    .digest("base64url");
}

export function createModerationToken(input: {
  complaintId: string;
  purpose: ModerationTokenPurpose;
  expiresAt?: number;
}) {
  const payload = base64UrlEncode(
    JSON.stringify({
      version: 1,
      tokenId: randomUUID(),
      complaintId: input.complaintId,
      purpose: input.purpose,
      issuedAt: Date.now(),
      expiresAt:
        input.expiresAt ??
        Date.now() + env.moderationTokenTtlMinutes * 60 * 1000,
    } satisfies ModerationTokenPayload),
  );

  return `${payload}.${signPayload(payload)}`;
}

export function readModerationToken(
  token: string,
  options?: {
    expectedPurpose?: ModerationTokenPurpose;
    expectedComplaintId?: string;
  },
) {
  const [payloadPart, signaturePart] = token.split(".");

  if (!payloadPart || !signaturePart) {
    return {
      ok: false as const,
      reason: "invalid",
    };
  }

  const expectedSignature = signPayload(payloadPart);
  const providedSignature = Buffer.from(signaturePart, "utf8");
  const safeExpectedSignature = Buffer.from(expectedSignature, "utf8");

  if (
    providedSignature.byteLength !== safeExpectedSignature.byteLength ||
    !timingSafeEqual(providedSignature, safeExpectedSignature)
  ) {
    return {
      ok: false as const,
      reason: "invalid",
    };
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(payloadPart),
    ) as ModerationTokenPayload;

    if (
      payload.version !== 1 ||
      typeof payload.tokenId !== "string" ||
      typeof payload.complaintId !== "string" ||
      typeof payload.purpose !== "string" ||
      typeof payload.issuedAt !== "number" ||
      typeof payload.expiresAt !== "number"
    ) {
      return {
        ok: false as const,
        reason: "invalid",
      };
    }

    if (payload.expiresAt < Date.now()) {
      return {
        ok: false as const,
        reason: "expired",
      };
    }

    if (
      options?.expectedPurpose &&
      payload.purpose !== options.expectedPurpose
    ) {
      return {
        ok: false as const,
        reason: "invalid",
      };
    }

    if (
      options?.expectedComplaintId &&
      payload.complaintId !== options.expectedComplaintId
    ) {
      return {
        ok: false as const,
        reason: "invalid",
      };
    }

    return {
      ok: true as const,
      payload,
    };
  } catch {
    return {
      ok: false as const,
      reason: "invalid",
    };
  }
}

export function verifyModerationToken(
  token: string,
  options?: Parameters<typeof readModerationToken>[1],
) {
  const result = readModerationToken(token, options);

  return result.ok ? result.payload : null;
}
