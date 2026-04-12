import { basename } from "node:path";
import { lookup } from "node:dns/promises";

import { campusById, type CampusId } from "@/config/campuses";
import { env, flags } from "@/lib/env";
import {
  formatApproximateCoordinates,
  formatBytes,
  formatDateTime,
  truncateText,
} from "@/lib/format";
import { describeStoredMedia, readStoredMedia } from "@/services/storage";
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
  return `${env.appUrl}/api/moderate/${action}?token=${encodeURIComponent(
    token,
  )}`;
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

function maskToken(token: string | null) {
  if (!token) return "<missing>";
  if (token.length <= 12) return token.replace(/.(?=.{4})/g, "*");
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

function maskChatId(id: string | null) {
  if (!id) return "<missing>";
  // keep last 4 digits
  if (/^\d+$/.test(id)) return `****${id.slice(-4)}`;
  return id.replace(/.(?=.{4})/g, "*");
}

function hasNonPublicAppUrl(appUrl: string) {
  try {
    const url = new URL(appUrl);
    const hostname = url.hostname.toLowerCase();

    return (
      hostname === "localhost" ||
      hostname === "0.0.0.0" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".local") ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    );
  } catch {
    return true;
  }
}

async function logDetailedTelegramError(
  method: string,
  err: unknown,
  opts?: {
    complaint?: PendingComplaintForTelegram | null;
    responseText?: string | null;
    responseStatus?: number | null;
  },
) {
  try {
    const masked = {
      token: maskToken(env.telegramBotToken ?? null),
      chat: maskChatId(env.telegramChatId ?? null),
      nodeEnv: env.nodeEnv,
      telegramConfigured: flags.telegramConfigured,
    } as const;

    let dnsInfo = "dns-lookup-failed";
    try {
      const lookupRes = await lookup("api.telegram.org");
      dnsInfo = `${lookupRes.address} (family ${lookupRes.family})`;
    } catch (e) {
      dnsInfo = `lookup-error:${String(e)}`;
    }

    const fileInfo = opts?.complaint?.mediaPath
      ? describeStoredMedia(opts.complaint.mediaPath)
      : null;

    console.error("Telegram detailed diagnostic:", {
      when: new Date().toISOString(),
      method,
      masked,
      dnsInfo,
      responseStatus: opts?.responseStatus ?? null,
      responseText: opts?.responseText ?? null,
      complaintId: opts?.complaint?.id ?? null,
      media: fileInfo,
      error: err instanceof Error ? { message: err.message, name: err.name, stack: err.stack } : String(err),
    });
  } catch (loggingError) {
    console.error("Failed to produce Telegram diagnostic log:", loggingError);
  }
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
  try {
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
      const bodyText = await response.text().catch(() => "<unreadable body>");
      const error = new Error(
        `Telegram ${method} request failed: ${response.status} ${response.statusText} - ${bodyText}`,
      );
      await logDetailedTelegramError(method, error, {
        responseStatus: response.status,
        responseText: bodyText,
      });
      throw error;
    }
  } catch (err) {
    await logDetailedTelegramError(method, err as unknown, { responseText: null, responseStatus: null });
    throw new Error(`Telegram ${method} request failed: ${String(err)}`);
  }
}

export async function sendTelegramAdminMessage(text: string) {
  if (flags.mockMode) {
    console.info("Mock mode ativo. Mensagem administrativa ignorada:", text);
    return;
  }

  if (!flags.telegramConfigured) {
    console.warn("Telegram não está configurado. Mensagem ignorada:", text);
    return;
  }

  await sendTelegramJson("sendMessage", {
    chat_id: env.telegramChatId,
    text,
    disable_web_page_preview: true,
  });
}

async function sendTelegramMedia(
  method: "sendPhoto" | "sendVideo",
  fieldName: "photo" | "video",
  complaint: PendingComplaintForTelegram,
  caption: string,
  keyboard: ReturnType<typeof createInlineKeyboard>,
) {
  try {
    let fileBuffer: Buffer;
    try {
      fileBuffer = await readStoredMedia(complaint.mediaPath!);
    } catch (readErr) {
      await logDetailedTelegramError(method, readErr as unknown, { complaint });
      throw readErr;
    }

    const formData = new FormData();

    formData.set("chat_id", env.telegramChatId!);
    formData.set("caption", caption);
    formData.set("reply_markup", JSON.stringify(keyboard));
    formData.set(
      fieldName,
      new File([new Uint8Array(fileBuffer)], basename(complaint.mediaPath!), {
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
      const bodyText = await response.text().catch(() => "<unreadable body>");
      const error = new Error(
        `Telegram ${method} request failed: ${response.status} ${response.statusText} - ${bodyText}`,
      );
      await logDetailedTelegramError(method, error, {
        complaint,
        responseStatus: response.status,
        responseText: bodyText,
      });
      throw error;
    }
  } catch (err) {
    await logDetailedTelegramError(method, err as unknown, { complaint });
    throw err;
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

  if (hasNonPublicAppUrl(env.appUrl)) {
    console.error(
      "APP_URL inválido para moderação por Telegram. Use uma URL pública HTTP(S), não localhost ou host interno.",
      {
        appUrl: env.appUrl,
        complaintId: complaint.id,
      },
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
    await logDetailedTelegramError("sendMedia", error as unknown, { complaint });
    console.error("Falha ao enviar a mídia para o Telegram; usando mensagem de texto:", error);
  }

  try {
    await sendTelegramJson("sendMessage", {
      chat_id: env.telegramChatId,
      text,
      reply_markup: keyboard,
      disable_web_page_preview: false,
    });
  } catch (err) {
    await logDetailedTelegramError("sendMessage", err as unknown, { complaint });
    throw err;
  }
}
