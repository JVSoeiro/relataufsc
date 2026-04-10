import { campuses, type CampusId } from "@/config/campuses";

type CampusSwitcherProps = {
  activeCampusId: CampusId;
  onSelect: (campusId: CampusId) => void;
  compact?: boolean;
};

export function CampusSwitcher({
  activeCampusId,
  onSelect,
  compact = false,
}: CampusSwitcherProps) {
  return (
    <div className={compact ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "grid gap-2"}>
      {campuses.map((campus) => {
        const isActive = campus.id === activeCampusId;

        return (
          <button
            aria-pressed={isActive}
            className={
              compact
                ? "group rounded-[1.15rem] border border-white/85 px-3 py-3 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                : "group rounded-[1.25rem] border border-white/85 px-4 py-3 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            }
            key={campus.id}
            onClick={() => onSelect(campus.id)}
            style={{
              backgroundColor: isActive ? `${campus.accent}18` : "rgba(255,255,255,0.72)",
              borderColor: isActive ? `${campus.accent}75` : undefined,
            }}
            type="button"
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ backgroundColor: campus.accent }}
              />
              <span className="font-medium text-slate-900">{campus.nome}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
