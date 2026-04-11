"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  CircleOff,
  LoaderCircle,
  MapPin,
  Paperclip,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { campuses, campusById, type CampusId } from "@/config/campuses";
import { siteConfig } from "@/config/site";
import {
  acceptedUploadMimeTypes,
  honeypotFieldName,
} from "@/lib/constants";
import { formatApproximateCoordinates } from "@/lib/format";
import type { DraftLocation } from "@/lib/types";

type ReportSheetProps = {
  open: boolean;
  activeCampusId: CampusId;
  draftLocation: DraftLocation | null;
  onCampusChange: (campusId: CampusId) => void;
  onClose: () => void;
  onLocationClear: () => void;
  onSubmitted: () => void;
};

type SubmissionState = "idle" | "submitting" | "success" | "error";

export function ReportSheet({
  open,
  activeCampusId,
  draftLocation,
  onCampusChange,
  onClose,
  onLocationClear,
  onSubmitted,
}: ReportSheetProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSubmissionState("idle");
      setSelectedFile(null);
      setPreviewUrl(null);
      setErrorMessage(null);
      formRef.current?.reset();
      return;
    }

    descriptionRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftLocation) {
      setSubmissionState("error");
      setErrorMessage("Marque o local exato do problema no mapa antes de enviar.");
      return;
    }

    setSubmissionState("submitting");
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    formData.set("campusId", activeCampusId);
    formData.set("latitude", String(draftLocation.latitude));
    formData.set("longitude", String(draftLocation.longitude));
    formData.set(honeypotFieldName, "");

    if (selectedFile) {
      formData.set("media", selectedFile);
    } else {
      formData.delete("media");
    }

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível enviar o relato.");
      }

      setSubmissionState("success");
      setSelectedFile(null);
      setPreviewUrl(null);
      onLocationClear();
      onSubmitted();
    } catch (error) {
      setSubmissionState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar seu relato agora.",
      );
    }
  }

  const activeCampus = campusById[activeCampusId];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute inset-x-3 bottom-3 top-[4.9rem] z-[730] lg:inset-x-auto lg:right-4 lg:top-4 lg:w-[min(31rem,calc(100%-2rem))]"
          exit={{ opacity: 0, y: 18 }}
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="pointer-events-auto flex h-full min-h-0 flex-col overflow-hidden rounded-[clamp(1.55rem,3vw,1.95rem)] border border-white/80 bg-[rgba(255,255,255,0.97)] p-[clamp(1rem,1.6vw,1.35rem)] shadow-[0_35px_90px_rgba(15,23,42,0.18)] backdrop-blur-xl">
            <div className="shrink-0 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Relatar problema
                </p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-[clamp(1.35rem,3vw,1.85rem)] font-semibold tracking-tight text-slate-950">
                  Marque e descreva.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Escolha um campus, clique no mapa para marcar o ponto exato e
                  envie um relato curto e claro.
                </p>
              </div>

              <button
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                onClick={onClose}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            {submissionState === "success" ? (
              <div className="mt-5 flex min-h-0 flex-1 items-center overflow-y-auto pr-1">
                <div className="w-full rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-950">
                        Seu relato foi recebido.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-emerald-900/80">
                        Ele passará por uma revisão rápida antes de aparecer no
                        mapa público. Se você informou e-mail, ele fica salvo
                        apenas durante a moderação.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="rounded-full bg-emerald-950 px-4 py-2 text-sm font-semibold text-white"
                      onClick={onClose}
                      type="button"
                    >
                      Fechar
                    </button>
                    <button
                      className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-900"
                      onClick={() => {
                        setSubmissionState("idle");
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setErrorMessage(null);
                        formRef.current?.reset();
                      }}
                      type="button"
                    >
                      Enviar outro
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form
                className="mt-5 grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-1"
                onSubmit={handleSubmit}
                ref={formRef}
              >
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    Campus
                  </span>
                  <select
                    className="min-h-12 rounded-[1.1rem] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-rose-500"
                    name="campusId"
                    onChange={(event) =>
                      onCampusChange(event.currentTarget.value as CampusId)
                    }
                    value={activeCampusId}
                  >
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <div
                  className="rounded-[1.35rem] border border-dashed p-4"
                  style={{
                    borderColor: draftLocation ? `${activeCampus.accent}65` : "rgba(148,163,184,0.5)",
                    backgroundColor: draftLocation ? `${activeCampus.accent}10` : "rgba(248,250,252,0.92)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-5 text-slate-700" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">
                        Clique no mapa para marcar o local do problema.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        O campus é ajustado automaticamente conforme o ponto
                        marcado. Você pode mover a seleção
                        antes de enviar.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700">
                          {activeCampus.nome}
                        </span>
                        {draftLocation ? (
                          <>
                            <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700">
                              {formatApproximateCoordinates(
                                draftLocation.latitude,
                                draftLocation.longitude,
                              )}
                            </span>
                            <button
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                              onClick={onLocationClear}
                              type="button"
                            >
                              Limpar seleção
                            </button>
                          </>
                        ) : (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
                            Aguardando clique no mapa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    Descrição
                  </span>
                  <textarea
                    className="min-h-[clamp(6.75rem,15vh,7.75rem)] rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-rose-500"
                    maxLength={800}
                    name="description"
                    placeholder="Descreva o que está visivelmente errado e por que isso importa."
                    ref={descriptionRef}
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    Foto e/ou vídeo
                  </span>
                  <span className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-4 text-sm text-slate-600 transition hover:border-slate-400">
                    <Paperclip className="size-4" />
                    <span className="min-w-0 flex-1 truncate">
                      {selectedFile
                        ? selectedFile.name
                        : "Adicione uma imagem ou um vídeo curto"}
                    </span>
                    <input
                      accept={acceptedUploadMimeTypes.join(",")}
                      className="hidden"
                      name="media"
                      onChange={(event) =>
                        setSelectedFile(event.currentTarget.files?.[0] ?? null)
                      }
                      type="file"
                    />
                  </span>
                </label>

                {previewUrl ? (
                  selectedFile?.type.startsWith("video/") ? (
                    <video
                      className="h-[clamp(5.2rem,12vh,7rem)] w-full rounded-[1.2rem] border border-slate-200 bg-slate-950 object-cover"
                      controls
                      muted
                      playsInline
                      src={previewUrl}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="h-[clamp(5.2rem,12vh,7rem)] w-full rounded-[1.2rem] border border-slate-200 bg-slate-100 object-cover"
                      src={previewUrl}
                    />
                  )
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      Nome
                    </span>
                    <input
                      className="min-h-12 rounded-[1.1rem] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-rose-500"
                      maxLength={80}
                      name="publicName"
                      placeholder="Opcional"
                      type="text"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      E-mail
                    </span>
                    <input
                      className="min-h-12 rounded-[1.1rem] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-rose-500"
                      name="email"
                      placeholder="Opcional"
                      type="email"
                    />
                  </label>
                </div>

                <input
                  autoComplete="off"
                  className="sr-only"
                  name={honeypotFieldName}
                  tabIndex={-1}
                  type="text"
                />

                <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {siteConfig.reportPrivacyNote}
                </div>

                {submissionState === "error" && errorMessage ? (
                  <div className="flex items-start gap-3 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                ) : null}

                <button
                  className="sticky bottom-0 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[1.15rem] bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
                  disabled={submissionState === "submitting"}
                  type="submit"
                >
                  {submissionState === "submitting" ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Enviando relato
                    </>
                  ) : draftLocation ? (
                    "Enviar relato"
                  ) : (
                    <>
                      <CircleOff className="size-4" />
                      Marque primeiro o local no mapa
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
