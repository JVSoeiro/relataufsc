import { and, desc, eq, sql } from "drizzle-orm";

import { type CampusId } from "@/config/campuses";
import { db } from "@/db";
import { complaints } from "@/db/schema";
import type { MediaKind } from "@/lib/constants";

type InsertPendingComplaintInput = {
  id: string;
  campusId: CampusId;
  description: string;
  latitude: number;
  longitude: number;
  mediaPath: string | null;
  mediaKind: MediaKind | null;
  mediaMimeType: string | null;
  mediaSizeBytes: number | null;
  publicName: string | null;
  submitterEmail: string | null;
  createdAt: string;
};

export function insertPendingComplaint(input: InsertPendingComplaintInput) {
  db.insert(complaints)
    .values({
      id: input.id,
      campusId: input.campusId,
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      mediaPath: input.mediaPath,
      mediaKind: input.mediaKind,
      mediaMimeType: input.mediaMimeType,
      mediaSizeBytes: input.mediaSizeBytes,
      publicName: input.publicName,
      submitterEmail: input.submitterEmail,
      status: "pending",
      createdAt: input.createdAt,
    })
    .run();
}

export function listApprovedComplaintsByCampus(campusId: CampusId) {
  return db
    .select({
      id: complaints.id,
      description: complaints.description,
      campusId: complaints.campusId,
      latitude: complaints.latitude,
      longitude: complaints.longitude,
      mediaPath: complaints.mediaPath,
      mediaKind: complaints.mediaKind,
      mediaMimeType: complaints.mediaMimeType,
      publicName: complaints.publicName,
      approvedAt: complaints.approvedAt,
      createdAt: complaints.createdAt,
    })
    .from(complaints)
    .where(
      and(eq(complaints.status, "approved"), eq(complaints.campusId, campusId)),
    )
    .orderBy(desc(complaints.createdAt))
    .all();
}

export function getApprovedComplaintCount() {
  const result = db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(complaints)
    .where(eq(complaints.status, "approved"))
    .get();

  return result?.total ?? 0;
}

export function getPendingComplaintForModeration(id: string) {
  return db
    .select({
      id: complaints.id,
      campusId: complaints.campusId,
      description: complaints.description,
      latitude: complaints.latitude,
      longitude: complaints.longitude,
      mediaPath: complaints.mediaPath,
      mediaKind: complaints.mediaKind,
      mediaMimeType: complaints.mediaMimeType,
      mediaSizeBytes: complaints.mediaSizeBytes,
      publicName: complaints.publicName,
      submitterEmail: complaints.submitterEmail,
      createdAt: complaints.createdAt,
      status: complaints.status,
    })
    .from(complaints)
    .where(and(eq(complaints.id, id), eq(complaints.status, "pending")))
    .get();
}

export function applyModerationDecision(args: {
  complaintId: string;
  action: "approve" | "reject";
  moderatedAt: string;
  nextMediaPath: string | null;
}) {
  const isApproval = args.action === "approve";

  const result = db
    .update(complaints)
    .set({
      status: isApproval ? "approved" : "rejected",
      approvedAt: isApproval ? args.moderatedAt : null,
      moderatedAt: args.moderatedAt,
      mediaPath: isApproval ? args.nextMediaPath : null,
      submitterEmail: null,
    })
    .where(
      and(eq(complaints.id, args.complaintId), eq(complaints.status, "pending")),
    )
    .run();

  return result.changes > 0;
}

export function clearComplaintMedia(id: string) {
  db.update(complaints)
    .set({
      mediaPath: null,
      mediaKind: null,
      mediaMimeType: null,
      mediaSizeBytes: null,
    })
    .where(eq(complaints.id, id))
    .run();
}
