import { brandConfig } from "@/config/brand";

type BrandLockupProps = {
  compact?: boolean;
};

export function BrandLockup({ compact = false }: BrandLockupProps) {
  return (
    <div className="grid grid-cols-2 items-center gap-[clamp(0.95rem,2.2vw,1.7rem)]">
      <div className="min-w-0">
        <h1
          className={
            compact
              ? "text-[clamp(0.92rem,2.9vw,1.08rem)] leading-[0.95]"
              : "text-[clamp(1.16rem,1.85vw,1.45rem)] leading-[0.94]"
          }
          style={{
            color: "#0a2724",
            fontFamily: '"Milliard", var(--font-display), sans-serif',
            fontWeight: 600,
          }}
        >
          RelataUFSC
        </h1>
        <div className="mt-1 flex justify-end">
          <p
            className={
              compact
                ? "text-[clamp(0.5rem,1.55vw,0.62rem)] leading-none"
                : "text-[clamp(0.56rem,0.95vw,0.72rem)] leading-none"
            }
            style={{
              color: "#0a2724",
              fontFamily: '"Milliard", var(--font-display), sans-serif',
              fontStyle: "italic",
              fontWeight: 300,
            }}
          >
            feito pela chapa
          </p>
        </div>
      </div>

      {brandConfig.partnerLogoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={brandConfig.partnerLogoAlt}
          className={
            compact
              ? "block h-[2.9rem] w-full justify-self-end object-contain object-right"
              : "block h-[4.05rem] w-full justify-self-end object-contain object-right"
          }
          src={brandConfig.partnerLogoSrc}
        />
      ) : (
        <span className="text-sm text-slate-500">{brandConfig.placeholderLabel}</span>
      )}
    </div>
  );
}
