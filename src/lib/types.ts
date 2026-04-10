import type { CampusId } from "@/config/campuses";
import type { MediaKind } from "@/lib/constants";

export type PublicComplaint = {
  id: string;
  description: string;
  campusId: CampusId;
  latitude: number;
  longitude: number;
  mediaUrl: string | null;
  mediaKind: MediaKind | null;
  mediaMimeType: string | null;
  publicName: string | null;
  displayName: string;
  publishedAt: string;
  approximateLocationLabel: string;
};

export type DraftLocation = {
  latitude: number;
  longitude: number;
};
