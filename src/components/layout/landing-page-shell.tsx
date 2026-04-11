"use client";

import { AnimatePresence, motion } from "framer-motion";
import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";
import { X } from "lucide-react";

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
  const [campusFocusNonce, setCampusFocusNonce] = useState(0);
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
  const [isInstagramPopupVisible, setIsInstagramPopupVisible] = useState(false);
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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsInstagramPopupVisible(true);
    }, 5_000);

    return () => window.clearTimeout(timeout);
  }, []);

  function handleCampusChange(campusId: CampusId) {
    setCampusFocusNonce((current) => current + 1);

    if (campusId !== activeCampusId) {
      startTransition(() => {
        setActiveCampusId(campusId);
        setDraftLocation(null);
        setSelectedComplaint(null);
      });
    } else {
      setDraftLocation(null);
      setSelectedComplaint(null);
    }

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
            campusFocusNonce={campusFocusNonce}
            complaints={complaints}
            draftLocation={draftLocation}
            isLoading={isCampusLoading}
            onComplaintSelect={setSelectedComplaint}
            onDraftLocationChange={handleDraftLocationChange}
            reportMode={isReportOpen}
            selectedComplaintId={selectedComplaint?.id ?? null}
          />

          <div className="absolute left-3 top-3 z-[705] lg:hidden">
            <div className="rounded-[1.5rem] border border-white/70 bg-[rgba(255,255,255,0.76)] px-4 py-3 backdrop-blur-xl">
              <BrandLockup compact />
            </div>
          </div>

          <div className="pointer-events-none absolute left-3 top-[5.55rem] z-[704] lg:left-4 lg:top-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-[rgba(255,255,255,0.9)] px-3 py-2 text-[0.72rem] font-medium text-slate-700 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#7f1d1d] text-xs font-bold text-white">
                !
              </span>
              <span>Relato publicado</span>
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

          <AnimatePresence>
            {isInstagramPopupVisible && !isReportOpen ? (
              <motion.div
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute bottom-[5.8rem] left-3 z-[709] w-[min(20rem,calc(100%-1.5rem))] lg:bottom-4 lg:left-4 lg:w-[min(24rem,calc(100%-2rem))]"
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="rounded-[1.45rem] border border-white/80 bg-[rgba(255,255,255,0.95)] p-3 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9rem] font-semibold leading-5 text-slate-900">
                        Gostou da aplicação e quer conhecer mais propostas para a
                        UFSC?
                      </p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">
                        Conheça-nos melhor!
                      </p>
                    </div>

                    <button
                      aria-label="Fechar convite"
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                      onClick={() => setIsInstagramPopupVisible(false)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex justify-start">
                    <a
                      className="inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-slate-950 transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1cd927]"
                      href="https://www.instagram.com/mudarparatransformaraufsc/"
                      rel="noreferrer"
                      style={{ backgroundColor: "#1cd927" }}
                      target="_blank"
                    >
                      Conhecer
                    </a>
                  </div>
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
