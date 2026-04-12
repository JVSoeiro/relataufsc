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
  const [isPhoneViewport, setIsPhoneViewport] = useState(false);
  const [isMobileLocationPickerOpen, setIsMobileLocationPickerOpen] =
    useState(false);
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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => {
      setIsPhoneViewport(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
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

    if (isPhoneViewport && isMobileLocationPickerOpen) {
      setIsMobileLocationPickerOpen(false);
      setIsReportOpen(true);
    }

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
    if (isPhoneViewport) {
      setDraftLocation(null);
      setIsReportOpen(false);
      setIsMobileLocationPickerOpen(true);
      return;
    }

    setIsReportOpen(true);
  }

  function closeReportSheet() {
    setIsReportOpen(false);
    setIsMobileLocationPickerOpen(false);
  }

  function reopenMobileLocationPicker() {
    setDraftLocation(null);
    setIsReportOpen(false);
    setIsMobileLocationPickerOpen(true);
  }

  const activeCampus = campusById[activeCampusId];

  const isMobileLocationSelectionMode =
    isPhoneViewport && isMobileLocationPickerOpen;

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
            reportMode={isReportOpen || isMobileLocationSelectionMode}
            selectedComplaintId={selectedComplaint?.id ?? null}
          />

          {!isMobileLocationSelectionMode ? (
            <div className="absolute inset-x-3 top-3 z-[705] lg:hidden">
              <div className="rounded-[1.5rem] border border-white/70 bg-[rgba(255,255,255,0.76)] px-4 py-3 backdrop-blur-xl">
                <BrandLockup compact />
              </div>
            </div>
          ) : null}

          {!isMobileLocationSelectionMode ? (
            <div className="pointer-events-none absolute left-3 top-[5.55rem] z-[704] lg:left-4 lg:top-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-[rgba(255,255,255,0.9)] px-3 py-2 text-[0.72rem] font-medium text-slate-700 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#7f1d1d] text-xs font-bold text-white">
                  !
                </span>
                <span>Relato publicado</span>
              </div>
            </div>
          ) : null}

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
            {isInstagramPopupVisible && !isReportOpen && !isMobileLocationSelectionMode ? (
              <motion.div
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-3 top-[5.55rem] z-[709] w-[min(10.75rem,calc(100%-8.5rem))] lg:bottom-4 lg:left-4 lg:right-auto lg:top-auto lg:w-[min(24rem,calc(100%-2rem))]"
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="rounded-[1.3rem] border border-white/80 bg-[rgba(255,255,255,0.95)] p-3 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                  <div className="flex items-start gap-2 lg:hidden">
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.82rem] font-semibold leading-4 text-slate-900 lg:text-[0.9rem] lg:leading-5">
                        Gostou?
                      </p>
                      <p className="mt-0.5 text-[0.78rem] font-normal leading-4 text-slate-600">
                        Conheça a chapa 41!
                      </p>
                    </div>

                    <button
                      aria-label="Fechar convite"
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 lg:size-8"
                      onClick={() => setIsInstagramPopupVisible(false)}
                      type="button"
                    >
                      <X className="size-3.5 lg:size-4" />
                    </button>
                  </div>

                  <div className="hidden items-start gap-3 lg:flex">
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.96rem] font-semibold leading-5 text-slate-900">
                        Gostou da aplicação e quer conhecer mais propostas para a
                        UFSC?
                      </p>
                      <p className="mt-1 text-sm font-normal leading-5 text-slate-600">
                        Conheça a chapa 41!
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

                  <div className="mt-2 flex justify-start lg:mt-3">
                    <a
                      className="inline-flex min-h-9 items-center justify-center rounded-full px-3.5 text-[0.82rem] font-semibold text-slate-950 transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1cd927] lg:min-h-10 lg:px-4 lg:text-sm"
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

          {!isMobileLocationSelectionMode ? (
            <ComplaintDetailCard
              complaint={selectedComplaint}
              onClose={() => setSelectedComplaint(null)}
            />
          ) : null}

          <AnimatePresence>
            {isMobileLocationSelectionMode ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-none absolute inset-x-3 top-3 z-[731] lg:hidden"
                exit={{ opacity: 0, y: -14 }}
                initial={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="pointer-events-auto max-w-[calc(100%-3.5rem)] rounded-[1.4rem] border border-white/80 bg-[rgba(255,255,255,0.95)] px-4 py-3 shadow-[0_20px_52px_rgba(15,23,42,0.16)] backdrop-blur-xl">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Novo relato
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      Selecione o local do relato
                    </p>
                  </div>

                  <button
                    className="pointer-events-auto inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/80 bg-[rgba(255,255,255,0.95)] text-slate-600 shadow-[0_18px_44px_rgba(15,23,42,0.14)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                    onClick={closeReportSheet}
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <ReportSheet
            activeCampusId={activeCampusId}
            draftLocation={draftLocation}
            isMobileLocationFlow={isPhoneViewport}
            onCampusChange={handleCampusChange}
            onClose={closeReportSheet}
            onLocationClear={() => setDraftLocation(null)}
            onLocationReselect={
              isPhoneViewport ? reopenMobileLocationPicker : undefined
            }
            onSubmitted={() =>
              void fetchApprovedComplaintCount().then((nextTotal) => {
                if (typeof nextTotal === "number") {
                  setTotalApprovedComplaints(nextTotal);
                }
              })
            }
            open={isReportOpen}
          />

          {!isReportOpen && !isMobileLocationSelectionMode ? (
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
