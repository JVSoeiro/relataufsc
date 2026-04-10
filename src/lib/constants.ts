import type { CampusId } from "@/config/campuses";

export const complaintStatuses = ["pending", "approved", "rejected"] as const;

export type ComplaintStatus = (typeof complaintStatuses)[number];

export const mediaKinds = ["image", "video"] as const;

export type MediaKind = (typeof mediaKinds)[number];

export const acceptedImageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const acceptedVideoMimeTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const acceptedUploadMimeTypes = [
  ...acceptedImageMimeTypes,
  ...acceptedVideoMimeTypes,
] as const;

export const uploadExtensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export const mimeTypeByExtension: Record<string, string> = Object.fromEntries(
  Object.entries(uploadExtensionByMimeType).map(([mimeType, extension]) => [
    extension,
    mimeType,
  ]),
);

export const complaintDescriptionLimit = {
  min: 12,
  max: 800,
} as const;

export const publicNameLimit = 80;

export const honeypotFieldName = "website";

export const moderationTokenPurposes = [
  "approve",
  "reject",
  "preview",
] as const;

export type ModerationTokenPurpose =
  (typeof moderationTokenPurposes)[number];

export function getMediaKindFromMimeType(mimeType: string): MediaKind | null {
  if (acceptedImageMimeTypes.includes(mimeType as (typeof acceptedImageMimeTypes)[number])) {
    return "image";
  }

  if (acceptedVideoMimeTypes.includes(mimeType as (typeof acceptedVideoMimeTypes)[number])) {
    return "video";
  }

  return null;
}

export const campusIdSet = new Set<string>([
  "florianopolis",
  "ararangua",
  "blumenau",
  "curitibanos",
  "joinville",
]);

export function isCampusId(value: string): value is CampusId {
  return campusIdSet.has(value);
}
