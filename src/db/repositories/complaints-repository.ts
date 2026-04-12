import { type CampusId } from "@/config/campuses";
import { pool } from "@/db";
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

type ApprovedComplaintRow = {
  id: string;
  description: string;
  campusId: string;
  latitude: number;
  longitude: number;
  mediaPath: string | null;
  mediaKind: string | null;
  mediaMimeType: string | null;
  publicName: string | null;
  approvedAt: string | null;
  createdAt: string;
};

type PendingComplaintRow = {
  id: string;
  campusId: string;
  description: string;
  latitude: number;
  longitude: number;
  mediaPath: string | null;
  mediaKind: string | null;
  mediaMimeType: string | null;
  mediaSizeBytes: number | null;
  publicName: string | null;
  submitterEmail: string | null;
  createdAt: string;
  status: string;
};

type CountRow = {
  total: number;
};

type ComplaintRemovalRow = {
  id: string;
  status: string;
  mediaPath: string | null;
};

export async function insertPendingComplaint(input: InsertPendingComplaintInput) {
  await pool`
    INSERT INTO complaints (
      id,
      campus_id,
      description,
      latitude,
      longitude,
      media_path,
      media_kind,
      media_mime_type,
      media_size_bytes,
      public_name,
      submitter_email,
      status,
      created_at
    ) VALUES (
      ${input.id},
      ${input.campusId},
      ${input.description},
      ${input.latitude},
      ${input.longitude},
      ${input.mediaPath},
      ${input.mediaKind},
      ${input.mediaMimeType},
      ${input.mediaSizeBytes},
      ${input.publicName},
      ${input.submitterEmail},
      'pending',
      ${input.createdAt}
    )
  `;
}

export async function listApprovedComplaintsByCampus(campusId: CampusId) {
  return pool<ApprovedComplaintRow[]>`
    SELECT
      id,
      description,
      campus_id AS "campusId",
      latitude,
      longitude,
      media_path AS "mediaPath",
      media_kind AS "mediaKind",
      media_mime_type AS "mediaMimeType",
      public_name AS "publicName",
      approved_at AS "approvedAt",
      created_at AS "createdAt"
    FROM complaints
    WHERE status = 'approved' AND campus_id = ${campusId}
    ORDER BY created_at DESC
  `;
}

export async function getApprovedComplaintCount() {
  const rows = await pool<CountRow[]>`
    SELECT COUNT(*)::int AS total
    FROM complaints
    WHERE status = 'approved'
  `;

  return Number(rows[0]?.total ?? 0);
}

export async function getPendingComplaintForModeration(id: string) {
  const rows = await pool<PendingComplaintRow[]>`
    SELECT
      id,
      campus_id AS "campusId",
      description,
      latitude,
      longitude,
      media_path AS "mediaPath",
      media_kind AS "mediaKind",
      media_mime_type AS "mediaMimeType",
      media_size_bytes AS "mediaSizeBytes",
      public_name AS "publicName",
      submitter_email AS "submitterEmail",
      created_at AS "createdAt",
      status
    FROM complaints
    WHERE id = ${id} AND status = 'pending'
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function applyModerationDecision(args: {
  complaintId: string;
  action: "approve" | "reject";
  moderatedAt: string;
  nextMediaPath: string | null;
}) {
  const isApproval = args.action === "approve";

  const rows = await pool<{ id: string }[]>`
    UPDATE complaints
    SET
      status = ${isApproval ? "approved" : "rejected"},
      approved_at = ${isApproval ? args.moderatedAt : null},
      moderated_at = ${args.moderatedAt},
      media_path = ${isApproval ? args.nextMediaPath : null},
      submitter_email = NULL
    WHERE id = ${args.complaintId} AND status = 'pending'
    RETURNING id
  `;

  return rows.length > 0;
}

export async function clearComplaintMedia(id: string) {
  await pool`
    UPDATE complaints
    SET
      media_path = NULL,
      media_kind = NULL,
      media_mime_type = NULL,
      media_size_bytes = NULL
    WHERE id = ${id}
  `;
}

export async function getComplaintForRemoval(id: string) {
  const rows = await pool<ComplaintRemovalRow[]>`
    SELECT
      id,
      status,
      media_path AS "mediaPath"
    FROM complaints
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function listComplaintIdsByPrefix(prefix: string, limit = 3) {
  const rows = await pool<{ id: string }[]>`
    SELECT id
    FROM complaints
    WHERE id ILIKE ${`${prefix}%`}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => row.id);
}

export async function removeComplaintById(args: { complaintId: string; moderatedAt: string }) {
  const rows = await pool<{ id: string }[]>`
    UPDATE complaints
    SET
      status = 'rejected',
      moderated_at = ${args.moderatedAt},
      approved_at = NULL,
      submitter_email = NULL,
      media_path = NULL,
      media_kind = NULL,
      media_mime_type = NULL,
      media_size_bytes = NULL
    WHERE id = ${args.complaintId}
    RETURNING id
  `;

  return rows.length > 0;
}
