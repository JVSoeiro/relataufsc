"use client";

import { AnimatePresence, motion } from "framer-motion";
import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";

import {
  campusById,
  detectarCampusPorCoordenada,
  type CampusId,
} from "@/config/campuses";
import { ComplaintDetailCard } from "@/components/complaints/complaint-detail-card";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { MapSurface } from "@/components/map/map-surface";
import { ReportSheet } from "@/components/report/report-sheet";
import type { DraftLocation, PublicComplaint } from "@/lib/types";

type LandingPageShellProps = {
  initialCampusId: CampusId;
  initialComplaints: PublicComplaint[];
  initialTotalApprovedComplaints: number;
};

type SurfaceNoticeKind = "info" | "error";

type SurfaceNotice = {
  kind: SurfaceNoticeKind;
  message: string;
} | null;

async function fetchApprovedComplaintCount() {
  const response = await fetch("/api/public/stats", {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    totalApprovedComplaints: number;
  };

  return payload.totalApprovedComplaints;
}

export function LandingPageShell({
  initialCampusId,
  initialComplaints,
  initialTotalApprovedComplaints,
}: LandingPageShellProps) {
  const [activeCampusId, setActiveCampusId] = useState(initialCampusId);
  const [complaints, setComplaints] = useState(initialComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState<PublicComplaint | null>(
    null,
  );
  const [totalApprovedComplaints, setTotalApprovedComplaints] = useState(
    initialTotalApprovedComplaints,
  );
  const [isCampusLoading, setIsCampusLoading] = useState(false);
  const [campusError, setCampusError] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [draftLocation, setDraftLocation] = useState<DraftLocation | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [surfaceNotice, setSurfaceNotice] = useState<SurfaceNotice>(null);
  const noticeTimeoutRef = useRef<number | null>(null);

  function clearSurfaceNotice() {
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
      noticeTimeoutRef.current = null;
    }
  }

  function showSurfaceNotice(message: string, kind: SurfaceNoticeKind = "info") {
    clearSurfaceNotice();
    setSurfaceNotice({ kind, message });
    noticeTimeoutRef.current = window.setTimeout(() => {
      setSurfaceNotice(null);
      noticeTimeoutRef.current = null;
    }, 3200);
  }

  const fetchCampusComplaints = useEffectEvent(async (campusId: CampusId) => {
    setIsCampusLoading(true);
    setCampusError(null);

    try {
      const response = await fetch(
        `/api/public/complaints?campusId=${encodeURIComponent(campusId)}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Não foi possível atualizar os relatos públicos agora.");
      }

      const payload = (await response.json()) as {
        complaints: PublicComplaint[];
      };

      setComplaints(payload.complaints);
      setSelectedComplaint(null);
    } catch (error) {
      setCampusError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar os relatos públicos agora.",
      );
    } finally {
      setIsCampusLoading(false);
    }
  });

  const refreshStats = useEffectEvent(async () => {
    try {
      const nextTotal = await fetchApprovedComplaintCount();

      if (typeof nextTotal === "number") {
        setTotalApprovedComplaints(nextTotal);
      }
    } catch {
      // Mantém o valor atual em silêncio no cliente.
    }
  });

  useEffect(() => {
    void fetchCampusComplaints(activeCampusId);
  }, [activeCampusId]);

  useEffect(() => {
    void refreshStats();

    const interval = window.setInterval(() => {
      void refreshStats();
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(
    () => () => {
      clearSurfaceNotice();
    },
    [],
  );

  function handleCampusChange(campusId: CampusId) {
    if (campusId === activeCampusId) {
      return;
    }

    startTransition(() => {
      setActiveCampusId(campusId);
      setDraftLocation(null);
      setSelectedComplaint(null);
    });
    setIsMobileDrawerOpen(false);
  }

  function handleDraftLocationChange(location: DraftLocation) {
    const detectedCampus = detectarCampusPorCoordenada(
      location.latitude,
      location.longitude,
    );

    if (!detectedCampus) {
      showSurfaceNotice(
        "Clique dentro de uma das áreas dos campi atendidos pela UFSC.",
        "error",
      );
      return;
    }

    setDraftLocation(location);
    setSelectedComplaint(null);

    if (detectedCampus.id !== activeCampusId) {
      startTransition(() => {
        setActiveCampusId(detectedCampus.id);
      });

      showSurfaceNotice(
        `Campus ajustado automaticamente para ${detectedCampus.nome}.`,
      );
    }
  }

  function openReportSheet() {
    setSelectedComplaint(null);
    setIsMobileDrawerOpen(false);
    setIsReportOpen(true);
  }

  function closeReportSheet() {
    setIsReportOpen(false);
  }

  const activeCampus = campusById[activeCampusId];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--page-bg)] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.10),transparent_28%)]" />

      <div className="relative grid h-full min-h-0 gap-[clamp(0.75rem,1.2vw,1rem)] p-[clamp(0.75rem,1.2vw,1rem)] lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <DesktopSidebar
          activeCampusId={activeCampusId}
          onCampusChange={handleCampusChange}
          onReportClick={openReportSheet}
          totalApprovedComplaints={totalApprovedComplaints}
        />

        <div className="relative h-full min-h-0 overflow-hidden rounded-[clamp(1.55rem,3vw,2rem)] border border-white/75 bg-[rgba(255,255,255,0.42)] shadow-[0_32px_90px_rgba(15,23,42,0.10)]">
          <MapSurface
            campus={activeCampus}
            complaints={complaints}
            draftLocation={draftLocation}
            isLoading={isCampusLoading}
            onComplaintSelect={setSelectedComplaint}
            onDraftLocationChange={handleDraftLocationChange}
            reportMode={isReportOpen}
            selectedComplaintId={selectedComplaint?.id ?? null}
          />

          <div className="absolute left-3 top-3 z-[705] lg:hidden">
            <div className="rounded-[1.5rem] border border-white/75 bg-[rgba(255,255,255,0.9)] px-4 py-3 shadow-[0_20px_45px_rgba(15,23,42,0.14)] backdrop-blur-xl">
              <BrandLockup compact />
            </div>
          </div>

          <AnimatePresence>
            {surfaceNotice ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-x-3 top-[4.85rem] z-[708] lg:inset-x-auto lg:left-1/2 lg:top-5 lg:w-fit lg:-translate-x-1/2"
                exit={{ opacity: 0, y: -12 }}
                initial={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="rounded-full border px-4 py-2 text-sm font-medium shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl"
                  style={{
                    backgroundColor:
                      surfaceNotice.kind === "error"
                        ? "rgba(255,241,242,0.96)"
                        : "rgba(255,255,255,0.92)",
                    borderColor:
                      surfaceNotice.kind === "error"
                        ? "rgba(251,113,133,0.32)"
                        : "rgba(255,255,255,0.82)",
                    color:
                      surfaceNotice.kind === "error" ? "#881337" : "#334155",
                  }}
                >
                  {surfaceNotice.message}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {campusError ? (
            <div className="absolute inset-x-3 top-[8.35rem] z-[707] rounded-[1.1rem] border border-rose-200 bg-rose-50/95 px-4 py-3 text-sm text-rose-900 shadow-[0_16px_36px_rgba(15,23,42,0.12)] lg:inset-x-auto lg:left-1/2 lg:top-[4.7rem] lg:w-fit lg:-translate-x-1/2">
              {campusError}
            </div>
          ) : null}

          <ComplaintDetailCard
            complaint={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
          />

          <ReportSheet
            activeCampusId={activeCampusId}
            draftLocation={draftLocation}
            onCampusChange={handleCampusChange}
            onClose={closeReportSheet}
            onLocationClear={() => setDraftLocation(null)}
            onSubmitted={() =>
              void fetchApprovedComplaintCount().then((nextTotal) => {
                if (typeof nextTotal === "number") {
                  setTotalApprovedComplaints(nextTotal);
                }
              })
            }
            open={isReportOpen}
          />

          {!isReportOpen ? (
            <MobileDrawer
              activeCampusId={activeCampusId}
              isOpen={isMobileDrawerOpen}
              onCampusChange={handleCampusChange}
              onReportClick={openReportSheet}
              onToggle={() => setIsMobileDrawerOpen((current) => !current)}
              totalApprovedComplaints={totalApprovedComplaints}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
