import { bootstrapApp } from "@/db/bootstrap";
import { createModerationHtmlResponse } from "@/lib/moderation-page";
import { moderateComplaintFromToken } from "@/services/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleApprove(token: string | null) {
  await bootstrapApp();

  if (!token) {
    return createModerationHtmlResponse(
      {
        title: "Link indisponível",
        message:
          "Este link de moderação é inválido, expirou ou já foi utilizado.",
        accent: "#475569",
      },
      400,
    );
  }

  const result = await moderateComplaintFromToken(token, "approve");

  if (!result.success) {
    return createModerationHtmlResponse(
      {
        title: "Link indisponível",
        message:
          "Este link de moderação é inválido, expirou ou já foi utilizado.",
        accent: "#475569",
      },
      400,
    );
  }

  return createModerationHtmlResponse({
    title: "Relato aprovado",
    message:
      "Tudo certo. O relato foi publicado e, se havia e-mail informado, a notificação de aprovação já foi processada. Pode fechar esta janela.",
    accent: "#0f766e",
  });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  return handleApprove(token);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const tokenValue = formData.get("token");
  const token = typeof tokenValue === "string" ? tokenValue : null;
  return handleApprove(token);
}
