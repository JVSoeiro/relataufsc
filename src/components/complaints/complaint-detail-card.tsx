"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, MapPin, UserRound, X } from "lucide-react";
import Image from "next/image";

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
          <div className="pointer-events-auto overflow-hidden rounded-[1.75rem] border border-white/80 bg-[rgba(255,255,255,0.94)] shadow-[0_25px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl">
            {complaint.mediaUrl ? (
              complaint.mediaMimeType?.startsWith("video/") ? (
                <video
                  className="h-48 w-full bg-slate-950 object-cover"
                  controls
                  playsInline
                  preload="metadata"
                  src={complaint.mediaUrl}
                />
              ) : (
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="(max-width: 1024px) 100vw, 384px"
                    src={complaint.mediaUrl}
                    unoptimized
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

            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Relato público
                  </p>
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
