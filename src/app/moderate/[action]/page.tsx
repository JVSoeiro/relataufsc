import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { bootstrapApp } from "@/db/bootstrap";
import { getPendingComplaintForModeration } from "@/db/repositories/complaints-repository";
import { readModerationToken } from "@/services/tokens";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function UnavailableState() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#edf4f2_0%,#f8fafc_100%)] px-4 py-12 text-slate-950">
      <div className="mx-auto max-w-lg rounded-[32px] border border-white/80 bg-white/92 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Fluxo seguro de moderação
        </p>
        <h1 className="mt-3 font-[family:var(--font-display)] text-3xl font-semibold tracking-tight">
          Link indisponível
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Este link de moderação é inválido, expirou ou já foi utilizado.
        </p>
      </div>
    </main>
  );
}

export default async function ModerationPage({
  params,
  searchParams,
}: {
  params: Promise<{ action: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  await bootstrapApp();

  const { action } = await params;
  const { token } = await searchParams;

  if (
    (action !== "approve" && action !== "reject") ||
    typeof token !== "string" ||
    token.length === 0
  ) {
    return <UnavailableState />;
  }

  const tokenResult = readModerationToken(token, {
    expectedPurpose: action,
  });

  if (!tokenResult.ok) {
    return <UnavailableState />;
  }

  const complaint = getPendingComplaintForModeration(tokenResult.payload.complaintId);

  if (!complaint) {
    return <UnavailableState />;
  }

  const isApproval = action === "approve";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#edf4f2_0%,#f8fafc_100%)] px-4 py-12 text-slate-950">
      <div className="mx-auto max-w-lg rounded-[32px] border border-white/80 bg-white/94 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Fluxo seguro de moderação
        </p>
        <h1 className="mt-3 font-[family:var(--font-display)] text-3xl font-semibold tracking-tight">
          {isApproval ? "Aprovar este relato?" : "Rejeitar este relato?"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Esta ação só funciona enquanto o relato ainda estiver pendente. O
          token é assinado, expira e é validado no servidor antes de qualquer
          mudança de estado.
        </p>

        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Relato pendente
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-900">
            {complaint.description}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Referência: <span className="font-medium">{complaint.id}</span>
          </p>
        </div>

        <form
          action={`/api/moderate/${action}`}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          method="post"
        >
          <input name="token" type="hidden" value={token} />
          <button
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white"
            style={{
              backgroundColor: isApproval ? "#0f766e" : "#b91c1c",
            }}
            type="submit"
          >
            <ShieldCheck className="size-4" />
            {isApproval ? "Aprovar relato" : "Rejeitar relato"}
          </button>
          <Link
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700"
            href="/"
          >
            Cancelar
          </Link>
        </form>
      </div>
    </main>
  );
}
