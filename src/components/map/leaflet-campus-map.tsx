"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import Supercluster from "supercluster";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";

import type { CampusConfig } from "@/config/campuses";
import { formatPublicDate } from "@/lib/format";
import type { DraftLocation, PublicComplaint } from "@/lib/types";

type LeafletCampusMapProps = {
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

type ClusterFeature = GeoJSON.Feature<
  GeoJSON.Point,
  {
    cluster?: boolean;
    cluster_id?: number;
    point_count?: number;
    complaint?: PublicComplaint;
  }
>;

type ComplaintFeature = GeoJSON.Feature<
  GeoJSON.Point,
  {
    complaint: PublicComplaint;
  }
>;

type ClusterPickerState = {
  total: number;
  complaints: PublicComplaint[];
  position: [number, number];
} | null;

function getBoundsFromCenterRadius(
  center: [number, number],
  radiusMeters: number,
): [[number, number], [number, number]] {
  const [latitude, longitude] = center;
  const latitudeDelta = radiusMeters / 111_320;
  const longitudeDelta =
    radiusMeters /
    (111_320 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.01));

  return [
    [latitude - latitudeDelta, longitude - longitudeDelta],
    [latitude + latitudeDelta, longitude + longitudeDelta],
  ];
}

function createMarkerIcon(color: string, selected = false) {
  const size = selected ? 30 : 24;

  return L.divIcon({
    className: "ufsc-marker-icon",
    iconAnchor: [size / 2, size / 2],
    iconSize: [size, size],
    html: `
      <span
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:${size}px;
          height:${size}px;
          border-radius:9999px;
          background:${color};
          border:${selected ? 5 : 4}px solid rgba(255,255,255,0.98);
          box-shadow:0 12px 32px rgba(15,23,42,0.24);
        "
      >
        <span
          style="
            color:white;
            font-size:${selected ? 18 : 15}px;
            font-weight:800;
            line-height:1;
            transform:translateY(-0.5px);
          "
        >!</span>
      </span>
    `,
  });
}

function createClusterIcon(color: string, count: number) {
  const size = count > 24 ? 52 : count > 8 ? 46 : 40;

  return L.divIcon({
    className: "ufsc-cluster-icon",
    iconAnchor: [size / 2, size / 2],
    iconSize: [size, size],
    html: `
      <span
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:${size}px;
          height:${size}px;
          border-radius:9999px;
          background:${color};
          color:white;
          font-size:13px;
          font-weight:700;
          border:4px solid rgba(255,255,255,0.98);
          box-shadow:0 18px 36px rgba(15,23,42,0.22);
        "
      >${count}</span>
    `,
  });
}

function createDraftPinIcon(color: string) {
  return L.divIcon({
    className: "ufsc-draft-icon",
    iconAnchor: [15, 30],
    iconSize: [30, 30],
    html: `
      <span
        style="
          position:relative;
          display:flex;
          width:30px;
          height:30px;
          border-radius:9999px;
          background:${color};
          border:4px solid rgba(255,255,255,0.98);
          box-shadow:0 18px 36px rgba(15,23,42,0.22);
        "
      >
        <span
          style="
            position:absolute;
            inset:-8px;
            border-radius:9999px;
            border:1px solid ${color};
            opacity:.55;
          "
        ></span>
      </span>
    `,
  });
}

function CampusViewport({
  campus,
  focusNonce,
}: {
  campus: CampusConfig;
  focusNonce: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.stop();
    map.invalidateSize();

    const size = map.getSize();
    const padding = size.x < 640 ? 18 : 34;
    const highlightBounds = campus.fitRadiusMeters
      ? getBoundsFromCenterRadius(campus.centro, campus.fitRadiusMeters)
      : null;

    map.flyToBounds(highlightBounds ?? campus.viewBounds, {
      animate: true,
      maxZoom: 17,
      padding: [padding, padding],
      duration: 0.65,
    });
  }, [
    campus.centro,
    campus.fitRadiusMeters,
    campus.id,
    campus.viewBounds,
    focusNonce,
    map,
  ]);

  return null;
}

function MapEvents({
  reportMode,
  onBoundsChange,
  onDraftLocationChange,
  onNonReportMapClick,
}: {
  reportMode: boolean;
  onBoundsChange: (bbox: [number, number, number, number], zoom: number) => void;
  onDraftLocationChange: (location: DraftLocation) => void;
  onNonReportMapClick?: () => void;
}) {
  const map = useMapEvents({
    click(event) {
      if (!reportMode) {
        map.closePopup();
        onNonReportMapClick?.();
        return;
      }

      onDraftLocationChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
    moveend() {
      const bounds = map.getBounds();
      onBoundsChange(
        [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ],
        map.getZoom(),
      );
    },
    zoomend() {
      const bounds = map.getBounds();
      onBoundsChange(
        [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ],
        map.getZoom(),
      );
    },
  });

  useEffect(() => {
    const bounds = map.getBounds();
    onBoundsChange(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      map.getZoom(),
    );
  }, [map, onBoundsChange]);

  return null;
}

export function LeafletCampusMap({
  campus,
  campusFocusNonce,
  complaints,
  isLoading,
  reportMode,
  selectedComplaintId,
  draftLocation,
  onComplaintSelect,
  onDraftLocationChange,
}: LeafletCampusMapProps) {
  const alertColor = "#7f1d1d";
  const mapRef = useRef<L.Map | null>(null);
  const [clusterPicker, setClusterPicker] = useState<ClusterPickerState>(null);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(
    null,
  );
  const [zoom, setZoom] = useState(15);
  const handleBoundsChange = useCallback(
    (nextBounds: [number, number, number, number], nextZoom: number) => {
      setBounds(nextBounds);
      setZoom(nextZoom);
    },
    [],
  );
  const clusterIndex = useMemo(() => {
    const index = new Supercluster<
      ComplaintFeature["properties"],
      ClusterFeature["properties"]
    >({
      maxZoom: 19,
      radius: 65,
    });

    index.load(
      complaints.map(
        (complaint) =>
          ({
            type: "Feature",
            properties: {
              complaint,
            },
            geometry: {
              type: "Point",
              coordinates: [complaint.longitude, complaint.latitude],
            },
          }) satisfies ComplaintFeature,
      ),
    );

    return index;
  }, [complaints]);

  const clusters = useMemo(() => {
    if (!bounds) {
      return [] as ClusterFeature[];
    }

    return clusterIndex.getClusters(bounds, Math.round(zoom)) as ClusterFeature[];
  }, [bounds, clusterIndex, zoom]);

  useEffect(() => {
    mapRef.current?.invalidateSize();
  }, [campus.id]);

  useEffect(() => {
    setClusterPicker(null);
  }, [campus.id]);

  useEffect(() => {
    if (reportMode) {
      setClusterPicker(null);
    }
  }, [reportMode]);

  useEffect(() => {
    if (selectedComplaintId) {
      setClusterPicker(null);
    }
  }, [selectedComplaintId]);

  useEffect(() => {
    if (!clusterPicker || reportMode) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      // Do not close when interacting inside the picker itself.
      if (target.closest(".ufsc-cluster-picker-root")) {
        return;
      }

      mapRef.current?.closePopup();
      setClusterPicker(null);
    };

    // Capture phase: ensures we also close when clicking on floating overlays.
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [clusterPicker, reportMode]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        key={`${campus.id}-${campusFocusNonce}`}
        center={campus.centro}
        className="h-full w-full"
        ref={mapRef}
        scrollWheelZoom
        wheelDebounceTime={28}
        wheelPxPerZoomLevel={140}
        zoom={15}
        zoomDelta={0.25}
        zoomControl={false}
        zoomSnap={0.25}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
        />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          pane="overlayPane"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
        />

        <ZoomControl position="bottomright" />
        <CampusViewport campus={campus} focusNonce={campusFocusNonce} />
        <MapEvents
          onBoundsChange={handleBoundsChange}
          onDraftLocationChange={onDraftLocationChange}
          onNonReportMapClick={() => setClusterPicker(null)}
          reportMode={reportMode}
        />

        {clusters.map((feature) => {
          const [longitude, latitude] = feature.geometry.coordinates;

          if (feature.properties.cluster && feature.properties.cluster_id) {
            const pointCount = feature.properties.point_count ?? 0;

            return (
              <Marker
                eventHandlers={{
                  click() {
                    if (reportMode) {
                      return;
                    }

                    const clusterId = feature.properties.cluster_id!;
                    const expansionZoom =
                      clusterIndex.getClusterExpansionZoom(clusterId);

                    const shouldOfferPicker =
                      pointCount <= 12 ||
                      typeof expansionZoom !== "number" ||
                      expansionZoom <= zoom + 0.5 ||
                      zoom >= 18.5;

                    if (shouldOfferPicker) {
                      const leaves = clusterIndex.getLeaves(
                        clusterId,
                        Math.min(pointCount, 25),
                        0,
                      ) as Array<ComplaintFeature>;

                      const leafComplaints = leaves
                        .map((leaf) => leaf.properties.complaint)
                        .filter(Boolean);

                      setClusterPicker({
                        total: pointCount,
                        complaints: leafComplaints,
                        position: [latitude, longitude],
                      });
                      return;
                    }

                    mapRef.current?.flyTo([latitude, longitude], expansionZoom, {
                      duration: 0.4,
                    });
                  },
                }}
                icon={createClusterIcon(alertColor, pointCount)}
                key={`cluster-${feature.properties.cluster_id}`}
                position={[latitude, longitude]}
              />
            );
          }

          const complaint = feature.properties.complaint!;
          const isSelected = complaint.id === selectedComplaintId;

          return (
            <Marker
              eventHandlers={{
                click() {
                  if (!reportMode) {
                    onComplaintSelect(complaint);
                  }
                },
              }}
              icon={createMarkerIcon(alertColor, isSelected)}
              key={complaint.id}
              position={[complaint.latitude, complaint.longitude]}
            />
          );
        })}

        {clusterPicker ? (
          <Popup
            autoClose
            autoPan
            autoPanPadding={[16, 16]}
            className="ufsc-cluster-picker-popup"
            closeButton={false}
            closeOnClick
            eventHandlers={{
              remove: () => setClusterPicker(null),
            }}
            offset={[0, -18]}
            position={clusterPicker.position}
          >
            <section className="ufsc-cluster-picker-root overflow-hidden rounded-[1.55rem] border border-white/80 bg-[rgba(255,255,255,0.94)] shadow-[0_25px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl">
              <header className="flex items-start justify-between gap-3 px-4 pt-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Relatos próximos
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {clusterPicker.total} relatos nesta área
                  </p>
                </div>

                <button
                  aria-label="Fechar lista de relatos próximos"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  onClick={() => {
                    mapRef.current?.closePopup();
                    setClusterPicker(null);
                  }}
                  type="button"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </header>

              <div className="mt-3 max-h-[min(38svh,20rem)] overflow-y-auto overscroll-contain px-2 pb-3">
                {clusterPicker.complaints.map((complaint) => (
                  <button
                    className="flex w-full items-start gap-3 rounded-[1.1rem] px-3 py-2.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    key={complaint.id}
                    onClick={() => {
                      onComplaintSelect(complaint);
                      mapRef.current?.closePopup();
                      setClusterPicker(null);
                    }}
                    type="button"
                  >
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#7f1d1d] text-sm font-bold text-white">
                      !
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-slate-900">
                        {complaint.description}
                      </span>
                      <span className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-[0.78rem] font-medium text-slate-500">
                        {formatPublicDate(complaint.publishedAt)} ·{" "}
                        {complaint.displayName}
                      </span>
                    </span>
                  </button>
                ))}

                {clusterPicker.total > clusterPicker.complaints.length ? (
                  <p className="px-3 pt-2 text-xs font-medium text-slate-500">
                    Mostrando os {clusterPicker.complaints.length} mais
                    próximos. Aproxime o mapa para separar mais relatos.
                  </p>
                ) : null}
              </div>
            </section>
          </Popup>
        ) : null}

        {draftLocation ? (
          <Marker
            icon={createDraftPinIcon(alertColor)}
            position={[draftLocation.latitude, draftLocation.longitude]}
          />
        ) : null}
      </MapContainer>

      {isLoading ? (
        <div className="pointer-events-none absolute inset-x-4 top-4 z-[610] inline-flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/92 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <span className="size-2 animate-pulse rounded-full bg-teal-600" />
          Atualizando relatos públicos...
        </div>
      ) : null}

      {complaints.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-24 z-[610] rounded-[1.4rem] border border-white/80 bg-white/92 p-4 text-sm leading-6 text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.12)] lg:bottom-4 lg:right-4 lg:left-auto lg:w-[18rem]">
          Ainda não há relatos públicos aprovados neste
          campus.
        </div>
      ) : null}
    </div>
  );
}
