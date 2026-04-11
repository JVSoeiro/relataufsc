import { brandConfig } from "@/config/brand";
import { siteConfig } from "@/config/site";

type BrandLockupProps = {
  compact?: boolean;
};

export function BrandLockup({ compact = false }: BrandLockupProps) {
  return (
    <div
      className={`flex items-center justify-between ${
        compact ? "gap-3" : "gap-4"
      }`}
    >
      <div className="min-w-0 flex-1">
        <h1
          className={
            compact
              ? "font-[family:var(--font-display)] text-[clamp(1.15rem,4.5vw,1.4rem)] font-semibold tracking-tight text-slate-950"
              : "font-[family:var(--font-display)] text-[clamp(1.9rem,3vw,2.3rem)] font-semibold tracking-tight text-slate-950"
          }
        >
          {siteConfig.name}
        </h1>
      </div>

      {brandConfig.partnerLogoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={brandConfig.partnerLogoAlt}
          className={
            compact
              ? "block h-12 w-auto max-w-[8.25rem] shrink-0 object-contain"
              : "block h-20 w-auto max-w-[12rem] shrink-0 object-contain"
          }
          src={brandConfig.partnerLogoSrc}
        />
      ) : (
        <span className="text-sm text-slate-500">{brandConfig.placeholderLabel}</span>
      )}
    </div>
  );
}
