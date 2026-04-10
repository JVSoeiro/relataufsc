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

      {brandConfig.partnerLogoSrc ? (
        <img
          alt={brandConfig.partnerLogoAlt}
          className={compact ? "h-10 w-auto object-contain" : "h-16 w-auto object-contain"}
          src={brandConfig.partnerLogoSrc}
        />
      ) : (
        <span className="text-sm text-slate-500">{brandConfig.placeholderLabel}</span>
      )}
    </div>
  );
}
