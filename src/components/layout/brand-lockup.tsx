import { Github } from "lucide-react";

type BrandLockupProps = {
  compact?: boolean;
};

export function BrandLockup({ compact = false }: BrandLockupProps) {
  return (
    <div
      className={
        compact
          ? "mx-auto w-full max-w-[34rem]"
          : "w-full"
      }
    >
      <div className="min-w-0 text-center">
        <h1
          className={
            compact
              ? "text-[clamp(0.92rem,2.9vw,1.08rem)] leading-[0.95] text-center"
              : "text-[clamp(1.16rem,1.85vw,1.45rem)] leading-[0.94] text-center"
          }
          style={{
            color: "#0a2724",
            fontFamily: '"Milliard", var(--font-display), sans-serif',
            fontWeight: 600,
          }}
        >
          RelataUFSC
        </h1>
        <div className="mt-1.5 flex justify-center">
          <a
            className="inline-flex items-center justify-center gap-1.5 text-center no-underline transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
            href="https://github.com/JVSoeiro/relataufsc"
            rel="noreferrer"
            target="_blank"
          >
            <span
              className={
                compact
                  ? "text-[clamp(0.48rem,1.5vw,0.6rem)] leading-none"
                  : "text-[clamp(0.56rem,0.95vw,0.72rem)] leading-none"
              }
              style={{
                color: "#0a2724",
                fontFamily: '"Milliard", var(--font-display), sans-serif',
                fontWeight: 400,
              }}
            >
              desenvolvido por
            </span>
            <Github
              className={compact ? "size-3.5 shrink-0 text-[#0a2724]" : "size-4 shrink-0 text-[#0a2724]"}
            />
            <span
              className={
                compact
                  ? "text-[clamp(0.54rem,1.65vw,0.66rem)]"
                  : "text-[clamp(0.62rem,1vw,0.76rem)]"
              }
              style={{
                color: "#0a2724",
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontWeight: 600,
              }}
            >
              JVSoeiro
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
