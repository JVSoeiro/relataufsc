import { bootstrapApp } from "@/db/bootstrap";
import { createModerationHtmlResponse } from "@/lib/moderation-page";
import { moderateComplaintFromToken } from "@/services/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleReject(token: string | null) {
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

  const result = await moderateComplaintFromToken(token, "reject");

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
    title: "Relato recusado",
    message:
      "Tudo certo. O relato foi recusado e ficou fora da área pública. Se havia e-mail informado, a notificação correspondente já foi processada. Pode fechar esta janela.",
    accent: "#b91c1c",
  });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  return handleReject(token);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const tokenValue = formData.get("token");
  const token = typeof tokenValue === "string" ? tokenValue : null;
  return handleReject(token);
}
