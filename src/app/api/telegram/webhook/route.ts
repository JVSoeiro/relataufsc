import { NextResponse } from "next/server";

import { env, flags } from "@/lib/env";
import { removeComplaintByTelegramId } from "@/services/complaints";
import { sendTelegramAdminMessage } from "@/services/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: {
    message_id: number;
    text?: string;
    chat?: { id: number | string };
  };
};

type PendingAdminState = {
  mode: "awaiting_remove_id";
  expiresAt: number;
};

const pendingByChat = new Map<string, PendingAdminState>();

function normalizeText(text: string) {
  return text.trim().replaceAll(/\s+/g, " ");
}

function isAuthorizedChat(chatId: string) {
  if (!env.telegramChatId) return false;
  return String(chatId) === String(env.telegramChatId);
}

function isWebhookSecretValid(request: Request) {
  if (!env.telegramWebhookSecret) return true;
  const header = request.headers.get("x-telegram-bot-api-secret-token");
  return header === env.telegramWebhookSecret;
}

async function handleRemoveFlow(chatId: string, text: string) {
  const normalized = normalizeText(text);
  const lower = normalized.toLowerCase();

  if (lower === "cancelar" || lower === "cancela") {
    pendingByChat.delete(chatId);
    await sendTelegramAdminMessage("Ok. Ação cancelada.");
    return;
  }

  const removeDirect = /^remove\s+(.+)$/i.exec(normalized);
  if (lower === "remove" || lower === "remover") {
    pendingByChat.set(chatId, {
      mode: "awaiting_remove_id",
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    await sendTelegramAdminMessage(
      "Certo. Envie o Código do relato (8 caracteres) ou o ID completo (cmp_...). Para cancelar, envie: Cancelar",
    );
    return;
  }

  const state = pendingByChat.get(chatId);
  const shouldTreatAsId =
    Boolean(removeDirect) ||
    (state?.mode === "awaiting_remove_id" && state.expiresAt > Date.now());

  if (!shouldTreatAsId) {
    return;
  }

  const rawId = removeDirect ? removeDirect[1] : normalized;
  pendingByChat.delete(chatId);

  const result = await removeComplaintByTelegramId(rawId);

  if (result.ok) {
    await sendTelegramAdminMessage(`Relato removido: ${result.id}`);
    return;
  }

  if (result.reason === "ambiguous") {
    await sendTelegramAdminMessage(
      `Encontrei mais de um relato com esse código. Envie o ID completo:\n${result.candidates
        .slice(0, 5)
        .map((id) => `- ${id}`)
        .join("\n")}`,
    );
    return;
  }

  await sendTelegramAdminMessage(
    "Não encontrei nenhum relato com esse ID. Verifique e tente novamente.",
  );
}

export async function POST(request: Request) {
  // Webhook should never hard-fail: always respond 200 to avoid retries & noise.
  if (!flags.telegramConfigured) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (!isWebhookSecretValid(request)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  let payload: TelegramUpdate | null = null;
  try {
    payload = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const message = payload?.message;
  const chatId = message?.chat?.id;
  const text = message?.text;

  if (!chatId || typeof text !== "string") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (!isAuthorizedChat(String(chatId))) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    await handleRemoveFlow(String(chatId), text);
  } catch (error) {
    console.error("Falha ao processar comando do Telegram:", error);
    // best-effort notification
    try {
      await sendTelegramAdminMessage(
        "Falha ao processar o comando. Tente novamente em instantes.",
      );
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
