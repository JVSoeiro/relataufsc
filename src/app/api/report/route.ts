import { NextResponse } from "next/server";

import { detectarCampusPorCoordenada, type CampusId } from "@/config/campuses";
import { bootstrapApp } from "@/db/bootstrap";
import { env, flags } from "@/lib/env";
import { createPendingComplaint } from "@/services/complaints";
import { assertSubmissionRateLimit } from "@/services/rate-limit";
import { sendComplaintToTelegram } from "@/services/telegram";
import { isAcceptedUploadMimeType, reportSubmissionSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await bootstrapApp();

  if (env.nodeEnv === "production" && !flags.telegramConfigured) {
    return NextResponse.json(
      {
        error: "A moderação está temporariamente indisponível.",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const rateLimit = assertSubmissionRateLimit(request);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Muitos relatos foram enviados em pouco tempo. Tente novamente em instantes.",
        },
        {
          status: 429,
          headers: {
            "cache-control": "no-store",
            "retry-after": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const formData = await request.formData();
    const mediaValue = formData.get("media");
    const media =
      mediaValue instanceof File && mediaValue.size > 0 ? mediaValue : null;

    if (media) {
      if (!isAcceptedUploadMimeType(media.type)) {
        return NextResponse.json(
          {
            error: "Só são aceitos arquivos JPEG, PNG, WebP, MP4, WebM e MOV.",
          },
          { status: 400, headers: { "cache-control": "no-store" } },
        );
      }

      if (media.size > env.maxUploadSizeBytes) {
        return NextResponse.json(
          {
            error: `Os arquivos devem ter ${env.maxUploadSizeMb} MB ou menos.`,
          },
          { status: 400, headers: { "cache-control": "no-store" } },
        );
      }
    }

    const parsedBody = reportSubmissionSchema.safeParse({
      description: formData.get("description"),
      campusId: formData.get("campusId"),
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
      publicName: formData.get("publicName"),
      email: formData.get("email"),
      website: formData.get("website"),
    });

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error:
            parsedBody.error.issues[0]?.message ??
            "Os dados do relato são inválidos.",
        },
        { status: 400, headers: { "cache-control": "no-store" } },
      );
    }

    const detectedCampus = detectarCampusPorCoordenada(
      parsedBody.data.latitude,
      parsedBody.data.longitude,
    );

    if (!detectedCampus) {
      return NextResponse.json(
        {
          error: "Clique em um ponto dentro de uma das áreas dos campi suportados pela UFSC.",
        },
        { status: 400, headers: { "cache-control": "no-store" } },
      );
    }

    const pendingComplaint = await createPendingComplaint({
      description: parsedBody.data.description,
      campusId: detectedCampus.id as CampusId,
      latitude: parsedBody.data.latitude,
      longitude: parsedBody.data.longitude,
      publicName: parsedBody.data.publicName,
      submitterEmail: parsedBody.data.email,
      media,
    });

    void sendComplaintToTelegram(pendingComplaint).catch((error) => {
      console.error(
        "Falha ao enviar a notificação de moderação para o Telegram:",
        error,
      );
    });

    return NextResponse.json(
      {
        ok: true,
      },
      {
        status: 201,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Falha ao enviar relato:", error);

    return NextResponse.json(
      {
        error: "Não foi possível processar seu relato agora.",
      },
      {
        status: 500,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }
}
