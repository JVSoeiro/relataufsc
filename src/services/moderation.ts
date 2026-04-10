import {
  applyModerationDecision,
  clearComplaintMedia,
  getPendingComplaintForModeration,
} from "@/db/repositories/complaints-repository";
import { sendApprovalEmail } from "@/services/email";
import {
  deleteStoredMedia,
  getPublicDestinationPath,
  moveUploadToPublic,
} from "@/services/storage";
import { readModerationToken } from "@/services/tokens";

export async function moderateComplaintFromToken(
  token: string,
  action: "approve" | "reject",
) {
  const tokenResult = readModerationToken(token, {
    expectedPurpose: action,
  });

  if (!tokenResult.ok) {
    return {
      success: false as const,
      reason: tokenResult.reason,
    };
  }

  const complaint = getPendingComplaintForModeration(
    tokenResult.payload.complaintId,
  );

  if (!complaint) {
    return {
      success: false as const,
      reason: "unavailable",
    };
  }

  const now = new Date().toISOString();
  const shouldApprove = action === "approve";
  const nextMediaPath =
    shouldApprove && complaint.mediaPath
      ? getPublicDestinationPath(complaint.mediaPath)
      : null;
  const emailToNotify = complaint.submitterEmail;

  // Privacy-first order: capture the email in memory, atomically conclude moderation,
  // and null the stored email immediately before any external side effects run.
  const changed = applyModerationDecision({
    complaintId: complaint.id,
    action,
    moderatedAt: now,
    nextMediaPath,
  });

  if (!changed) {
    return {
      success: false as const,
      reason: "unavailable",
    };
  }

  if (shouldApprove && complaint.mediaPath && nextMediaPath) {
    try {
      moveUploadToPublic(complaint.mediaPath, nextMediaPath);
    } catch (error) {
      console.error("Failed to publish media for approved complaint:", error);
      clearComplaintMedia(complaint.id);
    }
  }

  if (!shouldApprove && complaint.mediaPath) {
    try {
      deleteStoredMedia(complaint.mediaPath);
    } catch (error) {
      console.error("Failed to delete rejected media:", error);
    }
  }

  if (shouldApprove && emailToNotify) {
    try {
      await sendApprovalEmail(emailToNotify);
    } catch (error) {
      console.error("Failed to send approval email:", error);
    }
  }

  return {
    success: true as const,
    action,
    complaintId: complaint.id,
  };
}
