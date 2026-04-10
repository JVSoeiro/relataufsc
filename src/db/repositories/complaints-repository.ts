import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

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

type ApprovedComplaintRow = RowDataPacket & {
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

type PendingComplaintRow = RowDataPacket & {
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

type CountRow = RowDataPacket & {
  total: number | string;
};

export async function insertPendingComplaint(input: InsertPendingComplaintInput) {
  await pool.execute<ResultSetHeader>(
    `
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `,
    [
      input.id,
      input.campusId,
      input.description,
      input.latitude,
      input.longitude,
      input.mediaPath,
      input.mediaKind,
      input.mediaMimeType,
      input.mediaSizeBytes,
      input.publicName,
      input.submitterEmail,
      input.createdAt,
    ],
  );
}

export async function listApprovedComplaintsByCampus(campusId: CampusId) {
  const [rows] = await pool.query<ApprovedComplaintRow[]>(
    `
      SELECT
        id,
        description,
        campus_id AS campusId,
        latitude,
        longitude,
        media_path AS mediaPath,
        media_kind AS mediaKind,
        media_mime_type AS mediaMimeType,
        public_name AS publicName,
        approved_at AS approvedAt,
        created_at AS createdAt
      FROM complaints
      WHERE status = 'approved' AND campus_id = ?
      ORDER BY created_at DESC
    `,
    [campusId],
  );

  return rows;
}

export async function getApprovedComplaintCount() {
  const [rows] = await pool.query<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM complaints
      WHERE status = 'approved'
    `,
  );

  return Number(rows[0]?.total ?? 0);
}

export async function getPendingComplaintForModeration(id: string) {
  const [rows] = await pool.query<PendingComplaintRow[]>(
    `
      SELECT
        id,
        campus_id AS campusId,
        description,
        latitude,
        longitude,
        media_path AS mediaPath,
        media_kind AS mediaKind,
        media_mime_type AS mediaMimeType,
        media_size_bytes AS mediaSizeBytes,
        public_name AS publicName,
        submitter_email AS submitterEmail,
        created_at AS createdAt,
        status
      FROM complaints
      WHERE id = ? AND status = 'pending'
      LIMIT 1
    `,
    [id],
  );

  return rows[0] ?? null;
}

export async function applyModerationDecision(args: {
  complaintId: string;
  action: "approve" | "reject";
  moderatedAt: string;
  nextMediaPath: string | null;
}) {
  const isApproval = args.action === "approve";

  const [result] = await pool.execute<ResultSetHeader>(
    `
      UPDATE complaints
      SET
        status = ?,
        approved_at = ?,
        moderated_at = ?,
        media_path = ?,
        submitter_email = NULL
      WHERE id = ? AND status = 'pending'
    `,
    [
      isApproval ? "approved" : "rejected",
      isApproval ? args.moderatedAt : null,
      args.moderatedAt,
      isApproval ? args.nextMediaPath : null,
      args.complaintId,
    ],
  );

  return result.affectedRows > 0;
}

export async function clearComplaintMedia(id: string) {
  await pool.execute<ResultSetHeader>(
    `
      UPDATE complaints
      SET
        media_path = NULL,
        media_kind = NULL,
        media_mime_type = NULL,
        media_size_bytes = NULL
      WHERE id = ?
    `,
    [id],
  );
}
