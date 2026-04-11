import { type CampusId } from "@/config/campuses";
import { siteConfig } from "@/config/site";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { CampusSwitcher } from "@/components/layout/campus-switcher";

type DesktopSidebarProps = {
  totalApprovedComplaints: number;
  activeCampusId: CampusId;
  onCampusChange: (campusId: CampusId) => void;
  onReportClick: () => void;
};

export function DesktopSidebar({
  totalApprovedComplaints,
  activeCampusId,
  onCampusChange,
  onReportClick,
}: DesktopSidebarProps) {
  return (
    <aside className="hidden h-full min-h-0 w-[clamp(18rem,24vw,22rem)] shrink-0 lg:flex">
      <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[clamp(1.55rem,2.8vw,2rem)] border border-white/70 bg-[rgba(255,255,255,0.84)] p-[clamp(1rem,1.5vw,1.4rem)] shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
        <BrandLockup />

        <div
          className="mt-[clamp(0.95rem,1.6vw,1.2rem)] rounded-[clamp(1.35rem,2vw,1.8rem)] border border-white/80 p-[clamp(1rem,1.5vw,1.25rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
          style={{ background: "rgba(255,255,255,0.96)" }}
        >
          <AnimatedCounter
            className="overflow-hidden text-ellipsis whitespace-nowrap font-[family:var(--font-display)] text-[clamp(1.8rem,2.7vw,2.35rem)] font-semibold leading-none tracking-tight text-[#7f1d1d]"
            formatter={siteConfig.metricLabel}
            value={totalApprovedComplaints}
          />
        </div>

        <div className="mt-[clamp(0.8rem,1.2vw,1rem)] rounded-[clamp(1.25rem,1.8vw,1.6rem)] border border-white/80 bg-white/72 p-[clamp(0.95rem,1.35vw,1.2rem)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Campus
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Selecione um campus para reposicionar o mapa e carregar os relatos
            públicos aprovados dessa área.
          </p>
          <div className="mt-4">
            <CampusSwitcher
              activeCampusId={activeCampusId}
              onSelect={onCampusChange}
            />
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Relate calçadas danificadas, vazamentos, fios expostos, problemas de
          acessibilidade, má iluminação e outros riscos visíveis.
        </p>

        <button
          className="mt-auto inline-flex min-h-14 w-full items-center justify-center rounded-[1.2rem] bg-slate-950 px-5 text-center text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
          onClick={onReportClick}
          type="button"
        >
          {siteConfig.reportButtonLabel}
        </button>
      </div>
    </aside>
  );
}
