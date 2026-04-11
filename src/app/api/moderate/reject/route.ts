import { bootstrapApp } from "@/db/bootstrap";
import { createModerationHtmlResponse } from "@/lib/moderation-page";
import { moderateComplaintFromToken } from "@/services/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await bootstrapApp();

  const formData = await request.formData();
  const tokenValue = formData.get("token");
  const token = typeof tokenValue === "string" ? tokenValue : null;

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
    title: "Relato rejeitado",
    message:
      "O relato foi rejeitado e seguiu fora da área pública. Se havia e-mail informado, a notificação de status foi tentada e o endereço armazenado foi removido imediatamente.",
    accent: "#b91c1c",
  });
}
