import Image from "next/image";

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
        <div
          className={`shrink-0 rounded-[1.15rem] border border-white/85 bg-white/92 shadow-[0_14px_34px_rgba(15,23,42,0.08)] ${
            compact ? "px-3 py-2" : "px-4 py-3"
          }`}
        >
          <Image
            alt={brandConfig.partnerLogoAlt}
            className={compact ? "h-9 w-auto object-contain" : "h-14 w-auto object-contain"}
            height={compact ? 36 : 56}
            priority
            src={brandConfig.partnerLogoSrc}
            width={compact ? 92 : 142}
          />
        </div>
      ) : (
        <span className="text-sm text-slate-500">{brandConfig.placeholderLabel}</span>
      )}
    </div>
  );
}
