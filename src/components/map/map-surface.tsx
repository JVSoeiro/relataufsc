"use client";

import dynamic from "next/dynamic";

import type { CampusConfig } from "@/config/campuses";
import type { DraftLocation, PublicComplaint } from "@/lib/types";

const LeafletCampusMap = dynamic(
  () =>
    import("@/components/map/leaflet-campus-map").then(
      (module) => module.LeafletCampusMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,rgba(216,233,227,0.88),rgba(241,245,249,0.95))]">
        <div className="rounded-full border border-white/70 bg-white/92 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          Carregando mapa...
        </div>
      </div>
    ),
  },
);

type MapSurfaceProps = {
  campus: CampusConfig;
  campusFocusNonce: number;
  complaints: PublicComplaint[];
  isLoading: boolean;
  reportMode: boolean;
  selectedComplaintId: string | null;
  draftLocation: DraftLocation | null;
  onComplaintSelect: (complaint: PublicComplaint) => void;
  onDraftLocationChange: (location: DraftLocation) => void;
};

export function MapSurface(props: MapSurfaceProps) {
  return <LeafletCampusMap {...props} />;
}
