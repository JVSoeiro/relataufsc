"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import Supercluster from "supercluster";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";

import type { CampusConfig } from "@/config/campuses";
import type { DraftLocation, PublicComplaint } from "@/lib/types";

type LeafletCampusMapProps = {
  campus: CampusConfig;
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

function CampusViewport({ campus }: { campus: CampusConfig }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();

    const size = map.getSize();
    const padding = size.x < 640 ? 18 : 34;

    map.fitBounds(campus.viewBounds, {
      animate: true,
      maxZoom: 17,
      padding: [padding, padding],
    });
  }, [campus, map]);

  return null;
}

function MapEvents({
  reportMode,
  onBoundsChange,
  onDraftLocationChange,
}: {
  reportMode: boolean;
  onBoundsChange: (bbox: [number, number, number, number], zoom: number) => void;
  onDraftLocationChange: (location: DraftLocation) => void;
}) {
  const map = useMapEvents({
    click(event) {
      if (!reportMode) {
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
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(
    null,
  );
  const [zoom, setZoom] = useState(15);
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

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={campus.centro}
        className="h-full w-full"
        ref={mapRef}
        zoom={15}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />
        <CampusViewport campus={campus} />
        <MapEvents
          onBoundsChange={(nextBounds, nextZoom) => {
            setBounds(nextBounds);
            setZoom(nextZoom);
          }}
          onDraftLocationChange={onDraftLocationChange}
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
                    mapRef.current?.flyTo(
                      [latitude, longitude],
                      Math.min(
                        clusterIndex.getClusterExpansionZoom(
                          feature.properties.cluster_id!,
                        ) ?? zoom + 2,
                        18,
                      ),
                      { duration: 0.4 },
                    );
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
