import { randomUUID } from "node:crypto";

import { campusById, type CampusId } from "@/config/campuses";
import {
  getApprovedComplaintCount as getApprovedComplaintCountFromRepository,
  getComplaintForRemoval,
  insertPendingComplaint,
  listApprovedComplaintsByCampus,
  listComplaintIdsByPrefix,
  removeComplaintById,
} from "@/db/repositories/complaints-repository";
import type { MediaKind } from "@/lib/constants";
import { flags } from "@/lib/env";
import type { PublicComplaint } from "@/lib/types";
import {
  createMockComplaint,
  getMockApprovedComplaintCount,
  listMockPublicComplaintsByCampus,
} from "@/services/mock-complaints";
import {
  createPublicMediaUrl,
  deleteStoredMedia,
  savePendingUpload,
} from "@/services/storage";

type PendingComplaintInput = {
  description: string;
  campusId: CampusId;
  latitude: number;
  longitude: number;
  publicName: string | null;
  submitterEmail: string | null;
  media: File | null;
};

function serializePublicComplaint(row: {
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
}): PublicComplaint {
  const campus = campusById[row.campusId as CampusId];

  return {
    id: row.id,
    description: row.description,
    campusId: row.campusId as CampusId,
    latitude: row.latitude,
    longitude: row.longitude,
    mediaKind: row.mediaKind as MediaKind | null,
    mediaMimeType: row.mediaMimeType,
    mediaUrl:
      row.mediaPath && row.mediaPath.startsWith("public/")
        ? createPublicMediaUrl(row.mediaPath)
        : null,
    publicName: row.publicName,
    displayName: row.publicName ?? "Anônimo",
    publishedAt: row.approvedAt ?? row.createdAt,
    approximateLocationLabel: `Entorno do campus de ${campus.nome}`,
  };
}

export async function listPublicComplaintsByCampus(campusId: CampusId) {
  if (flags.mockMode) {
    return listMockPublicComplaintsByCampus(campusId);
  }

  const rows = await listApprovedComplaintsByCampus(campusId);

  return rows.map(serializePublicComplaint);
}

export async function getApprovedComplaintCount() {
  if (flags.mockMode) {
    return getMockApprovedComplaintCount();
  }

  return getApprovedComplaintCountFromRepository();
}

export async function createPendingComplaint(input: PendingComplaintInput) {
  if (flags.mockMode) {
    return createMockComplaint(input);
  }

  const complaintId = `cmp_${randomUUID()}`;
  const now = new Date().toISOString();
  let uploadedMedia:
    | {
        relativePath: string;
        mediaKind: "image" | "video" | null;
        sizeBytes: number;
        mimeType: string;
      }
    | null = null;

  try {
    if (input.media) {
      uploadedMedia = await savePendingUpload(input.media);
    }

    await insertPendingComplaint({
      id: complaintId,
      campusId: input.campusId,
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      publicName: input.publicName,
      submitterEmail: input.submitterEmail,
      mediaPath: uploadedMedia?.relativePath ?? null,
      mediaKind: uploadedMedia?.mediaKind ?? null,
      mediaMimeType: uploadedMedia?.mimeType ?? null,
      mediaSizeBytes: uploadedMedia?.sizeBytes ?? null,
      createdAt: now,
    });

    return {
      id: complaintId,
      description: input.description,
      campusId: input.campusId,
      latitude: input.latitude,
      longitude: input.longitude,
      publicName: input.publicName,
      submitterEmail: input.submitterEmail,
      mediaPath: uploadedMedia?.relativePath ?? null,
      mediaKind: uploadedMedia?.mediaKind ?? null,
      mediaMimeType: uploadedMedia?.mimeType ?? null,
      mediaSizeBytes: uploadedMedia?.sizeBytes ?? null,
      createdAt: now,
    };
  } catch (error) {
    await deleteStoredMedia(uploadedMedia?.relativePath);
    throw error;
  }
}

export type RemoveComplaintResult =
  | { ok: true; id: string }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "ambiguous"; candidates: string[] };

function normalizeRemoveIdInput(raw: string) {
  return raw.trim().replaceAll(/\s+/g, " ");
}

async function resolveComplaintIdForRemoval(raw: string) {
  const input = normalizeRemoveIdInput(raw);
  if (!input) return null;

  if (input.startsWith("cmp_") && input.length >= 12) {
    return { kind: "exact" as const, id: input };
  }

  // Accept short codes such as the first UUID segment.
  const short = input.replace(/^cmp_/, "");
  if (/^[a-f0-9]{6,64}$/i.test(short)) {
    const prefix = `cmp_${short}`;
    const matches = await listComplaintIdsByPrefix(prefix, 5);
    if (matches.length === 1) return { kind: "exact" as const, id: matches[0] };
    if (matches.length > 1) return { kind: "ambiguous" as const, candidates: matches };
    return null;
  }

  return null;
}

export async function removeComplaintByTelegramId(rawId: string): Promise<RemoveComplaintResult> {
  if (flags.mockMode) {
    // No-op in mock mode to avoid touching real persistence.
    return { ok: false, reason: "not_found" };
  }

  const resolved = await resolveComplaintIdForRemoval(rawId);
  if (!resolved) return { ok: false, reason: "not_found" };
  if (resolved.kind === "ambiguous") {
    return { ok: false, reason: "ambiguous", candidates: resolved.candidates };
  }

  const complaint = await getComplaintForRemoval(resolved.id);
  if (!complaint) return { ok: false, reason: "not_found" };

  // Delete media first (idempotent: safe if missing), then drop from public pipeline.
  await deleteStoredMedia(complaint.mediaPath);
  await removeComplaintById({ complaintId: complaint.id, moderatedAt: new Date().toISOString() });

  return { ok: true, id: complaint.id };
}
