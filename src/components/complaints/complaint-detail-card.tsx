"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Copy, MapPin, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";

import { campusById } from "@/config/campuses";
import { formatPublicDate } from "@/lib/format";
import type { PublicComplaint } from "@/lib/types";

type ComplaintDetailCardProps = {
  complaint: PublicComplaint | null;
  onClose: () => void;
};

export function ComplaintDetailCard({
  complaint,
  onClose,
}: ComplaintDetailCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [complaint?.id]);

  function shortCodeFromId(id: string) {
    const raw = id.startsWith("cmp_") ? id.slice("cmp_".length) : id;
    const firstSegment = raw.split("-")[0] ?? raw;
    return firstSegment.slice(0, 8);
  }

  return (
    <AnimatePresence>
      {complaint ? (
        <motion.section
          animate={{ opacity: 1, y: 0, x: 0 }}
          className="pointer-events-none absolute inset-x-3 top-3 z-[710] lg:inset-x-auto lg:right-4 lg:top-4 lg:w-[24rem]"
          exit={{ opacity: 0, y: 18 }}
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="pointer-events-auto flex max-h-[min(78svh,44rem)] flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-[rgba(255,255,255,0.94)] shadow-[0_25px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl lg:max-h-[min(84svh,46rem)]">
            {complaint.mediaUrl ? (
              complaint.mediaMimeType?.startsWith("video/") ? (
                <div className="flex max-h-[min(52svh,34rem)] min-h-[12rem] w-full items-center justify-center bg-slate-950 px-2 py-2 sm:px-3 sm:py-3">
                  <video
                    className="max-h-[min(48svh,30rem)] w-full rounded-[1.2rem] bg-slate-950 object-contain"
                    controls
                    controlsList="nodownload noplaybackrate"
                    playsInline
                    preload="metadata"
                    src={complaint.mediaUrl}
                  />
                </div>
              ) : (
                <div className="flex max-h-[min(52svh,34rem)] min-h-[12rem] w-full items-center justify-center bg-slate-100 px-2 py-2 sm:px-3 sm:py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Mídia do relato"
                    className="max-h-[min(48svh,30rem)] w-auto max-w-full rounded-[1.2rem] object-contain"
                    src={complaint.mediaUrl}
                  />
                </div>
              )
            ) : (
              <div className="flex h-32 items-end bg-[linear-gradient(160deg,rgba(15,118,110,0.14),rgba(255,255,255,0.96))] px-5 py-4">
                <p className="max-w-[14rem] text-sm leading-6 text-slate-600">
                  Este relato foi publicado sem mídia anexada.
                </p>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 pb-24 lg:pb-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Relato público
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[0.78rem] font-medium text-slate-500">
                    <span className="shrink-0">Código:</span>
                    <span className="font-mono text-slate-700">
                      {shortCodeFromId(complaint.id)}
                    </span>

                    <button
                      aria-label="Copiar ID do relato"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[0.72rem] font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(complaint.id);
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 1600);
                        } catch {
                          setCopied(false);
                        }
                      }}
                      type="button"
                    >
                      <Copy className="size-3.5" />
                      <span className="sr-only">Copiar</span>
                      <span aria-live="polite">{copied ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                  <p className="mt-2 text-base leading-7 text-slate-900">
                    {complaint.description}
                  </p>
                </div>
                <button
                  className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  onClick={onClose}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 text-slate-500" />
                  <span>
                    {campusById[complaint.campusId].nome}
                    <span className="text-slate-400">
                      {" "}
                      · {complaint.approximateLocationLabel}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <UserRound className="size-4 text-slate-500" />
                  <span>{complaint.displayName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="size-4 text-slate-500" />
                  <span>{formatPublicDate(complaint.publishedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
