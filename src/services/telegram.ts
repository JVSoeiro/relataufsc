import { basename } from "node:path";
import { readFile } from "node:fs/promises";

import { campusById, type CampusId } from "@/config/campuses";
import { env, flags } from "@/lib/env";
import {
  formatApproximateCoordinates,
  formatBytes,
  formatDateTime,
  truncateText,
} from "@/lib/format";
import { resolveStoredMediaPath } from "@/services/storage";
import { createModerationToken } from "@/services/tokens";

type PendingComplaintForTelegram = {
  id: string;
  description: string;
  campusId: CampusId;
  latitude: number;
  longitude: number;
  publicName: string | null;
  submitterEmail: string | null;
  mediaPath: string | null;
  mediaKind: "image" | "video" | null;
  mediaMimeType: string | null;
  mediaSizeBytes?: number | null;
  createdAt?: string | null;
};

function createModerationPageUrl(action: "approve" | "reject", token: string) {
  return `${env.appUrl}/moderate/${action}?token=${encodeURIComponent(token)}`;
}

function createPreviewUrl(complaintId: string, token: string) {
  return `${env.appUrl}/api/moderate/media/${encodeURIComponent(
    complaintId,
  )}?token=${encodeURIComponent(token)}`;
}

function buildModerationText(
  complaint: PendingComplaintForTelegram,
  previewUrl: string | null,
) {
  const campus = campusById[complaint.campusId];
  const fileName = complaint.mediaPath ? basename(complaint.mediaPath) : null;
  const descriptionLimit = complaint.mediaPath ? 260 : 520;

  return [
    "Novo relato aguardando moderação",
    `Protocolo: ${complaint.id}`,
    `Campus: ${campus.nome}`,
    `Nome informado: ${complaint.publicName ?? "Anônimo"}`,
    `E-mail para retorno: ${complaint.submitterEmail ?? "Não informado"}`,
    complaint.createdAt
      ? `Enviado em: ${formatDateTime(complaint.createdAt)}`
      : null,
    `Local: ${formatApproximateCoordinates(
      complaint.latitude,
      complaint.longitude,
    )}`,
    complaint.mediaKind
      ? `Arquivo: ${fileName ?? "mídia enviada"}${
          complaint.mediaMimeType ? ` • ${complaint.mediaMimeType}` : ""
        }${
          typeof complaint.mediaSizeBytes === "number"
            ? ` • ${formatBytes(complaint.mediaSizeBytes)}`
            : ""
        }`
      : "Arquivo: não enviado",
    `Descrição: ${truncateText(complaint.description, descriptionLimit)}`,
    previewUrl ? `Pré-visualização: ${previewUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function createInlineKeyboard(
  approveToken: string,
  rejectToken: string,
  previewUrl: string | null,
) {
  return {
    inline_keyboard: [
      [
        {
          text: "Aprovar relato",
          url: createModerationPageUrl("approve", approveToken),
        },
        {
          text: "Recusar relato",
          url: createModerationPageUrl("reject", rejectToken),
        },
      ],
      ...(previewUrl
        ? [
            [
              {
                text: "Ver mídia",
                url: previewUrl,
              },
            ],
          ]
        : []),
    ],
  };
}

async function sendTelegramJson(method: string, body: Record<string, unknown>) {
  const response = await fetch(
    `https://api.telegram.org/bot${env.telegramBotToken}/${method}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new Error(`Telegram ${method} request failed.`);
  }
}

async function sendTelegramMedia(
  method: "sendPhoto" | "sendVideo",
  fieldName: "photo" | "video",
  complaint: PendingComplaintForTelegram,
  caption: string,
  keyboard: ReturnType<typeof createInlineKeyboard>,
) {
  const absoluteMediaPath = resolveStoredMediaPath(complaint.mediaPath!);
  const fileBuffer = await readFile(absoluteMediaPath);
  const formData = new FormData();

  formData.set("chat_id", env.telegramChatId!);
  formData.set("caption", caption);
  formData.set("reply_markup", JSON.stringify(keyboard));
  formData.set(
    fieldName,
    new File([fileBuffer], basename(absoluteMediaPath), {
      type: complaint.mediaMimeType ?? undefined,
    }),
  );

  if (fieldName === "video") {
    formData.set("supports_streaming", "true");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.telegramBotToken}/${method}`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(`Telegram ${method} request failed.`);
  }
}

export async function sendComplaintToTelegram(
  complaint: PendingComplaintForTelegram,
) {
  if (flags.mockMode) {
    console.info(
      "Mock mode ativo. Notificação de Telegram ignorada para:",
      complaint.id,
    );
    return;
  }

  if (!flags.telegramConfigured) {
    console.warn(
      "Telegram não está configurado. Relato pendente salvo sem aviso:",
      complaint.id,
    );
    return;
  }

  const approveToken = createModerationToken({
    complaintId: complaint.id,
    purpose: "approve",
  });
  const rejectToken = createModerationToken({
    complaintId: complaint.id,
    purpose: "reject",
  });
  const previewToken = createModerationToken({
    complaintId: complaint.id,
    purpose: "preview",
  });
  const previewUrl = complaint.mediaPath
    ? createPreviewUrl(complaint.id, previewToken)
    : null;
  const keyboard = createInlineKeyboard(approveToken, rejectToken, previewUrl);
  const text = buildModerationText(complaint, previewUrl);

  try {
    if (
      complaint.mediaPath &&
      complaint.mediaMimeType &&
      complaint.mediaMimeType.startsWith("image/")
    ) {
      await sendTelegramMedia("sendPhoto", "photo", complaint, text, keyboard);
      return;
    }

    if (
      complaint.mediaPath &&
      complaint.mediaMimeType &&
      complaint.mediaMimeType.startsWith("video/")
    ) {
      await sendTelegramMedia("sendVideo", "video", complaint, text, keyboard);
      return;
    }
  } catch (error) {
    console.error(
      "Falha ao enviar a mídia para o Telegram; usando mensagem de texto:",
      error,
    );
  }

  await sendTelegramJson("sendMessage", {
    chat_id: env.telegramChatId,
    text,
    reply_markup: keyboard,
    disable_web_page_preview: false,
  });
}
