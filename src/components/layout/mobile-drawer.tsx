"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2, MapPinned } from "lucide-react";

import { campusById, type CampusId } from "@/config/campuses";
import { siteConfig } from "@/config/site";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { CampusSwitcher } from "@/components/layout/campus-switcher";

type MobileDrawerProps = {
  isOpen: boolean;
  onToggle: () => void;
  totalApprovedComplaints: number;
  activeCampusId: CampusId;
  onCampusChange: (campusId: CampusId) => void;
  onReportClick: () => void;
};

export function MobileDrawer({
  isOpen,
  onToggle,
  totalApprovedComplaints,
  activeCampusId,
  onCampusChange,
  onReportClick,
}: MobileDrawerProps) {
  const activeCampus = campusById[activeCampusId];

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[720] lg:hidden">
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="pointer-events-auto mb-3 rounded-[1.65rem] border border-white/80 bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_25px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl"
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {siteConfig.mobileCampusLabel}
            </p>
            <div className="mt-3">
              <CampusSwitcher
                activeCampusId={activeCampusId}
                compact
                onSelect={(campusId) => {
                  onCampusChange(campusId);
                  onToggle();
                }}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        animate={{ y: 0 }}
        className="pointer-events-auto rounded-[1.8rem] border border-white/80 bg-[rgba(255,255,255,0.9)] p-3 shadow-[0_28px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl"
        layout
      >
        <div className="grid grid-cols-2 gap-2.5">
          <div className="col-span-2 min-w-0 rounded-[1.25rem] border border-white/80 bg-white/85 px-3 py-2.5">
            <AnimatedCounter
              className="overflow-hidden text-ellipsis whitespace-nowrap font-[family:var(--font-display)] text-[clamp(1rem,4.8vw,1.28rem)] font-semibold leading-none tracking-tight text-rose-600"
              formatter={siteConfig.metricLabel}
              value={totalApprovedComplaints}
            />
            <p className="mt-1 truncate text-[0.72rem] font-medium text-slate-500">
              {activeCampus.nome}
            </p>
          </div>

          <button
            className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-[1.15rem] border border-slate-200 bg-white px-3 text-center text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            onClick={onToggle}
            type="button"
          >
            <Building2 className="size-4" />
            <span className="truncate">{siteConfig.mobileCampusLabel}</span>
          </button>

          <button
            className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-[1.15rem] bg-rose-600 px-3 text-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            onClick={onReportClick}
            type="button"
          >
            <MapPinned className="size-4" />
            <span className="truncate">{siteConfig.reportButtonLabel}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
