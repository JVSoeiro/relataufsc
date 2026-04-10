import Image from "next/image";

import { brandConfig } from "@/config/brand";
import { siteConfig } from "@/config/site";

type BrandLockupProps = {
  compact?: boolean;
};

export function BrandLockup({ compact = false }: BrandLockupProps) {
  return (
    <div className={`flex items-center ${compact ? "gap-2.5" : "gap-3.5"}`}>
      <div className="min-w-0">
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

      <div className="flex min-h-11 min-w-[6.5rem] items-center justify-center rounded-[1.1rem] border border-white/70 bg-white/88 px-3 py-2 text-center text-[0.7rem] font-medium text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        {brandConfig.partnerLogoSrc ? (
          <img
            alt={brandConfig.partnerLogoAlt}
            className="h-7 w-auto object-contain"
            src={brandConfig.partnerLogoSrc}
          />
        ) : (
          <span>{brandConfig.placeholderLabel}</span>
        )}
      </div>
    </div>
  );
}
