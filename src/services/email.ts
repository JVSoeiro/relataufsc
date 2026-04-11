import nodemailer from "nodemailer";

import { env, flags } from "@/lib/env";

type ModerationEmailStatus = "approved" | "rejected";

function getModerationEmailCopy(status: ModerationEmailStatus) {
  if (status === "approved") {
    return {
      subject: "Status do Relato",
      text: "Parabéns! Seu relato já foi aprovado. Agradecemos muito sua participação.",
      html: `
        <div style="font-family: Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.6;">
          <p style="margin: 0 0 12px;">Parabéns! Seu relato já foi aprovado.</p>
          <p style="margin: 0;">Agradecemos muito sua participação.</p>
        </div>
      `,
    };
  }

  return {
    subject: "Status do Relato",
    text: "Infelizmente seu relato não foi aprovado por ser considerado ofensivo, spam ou por fazer apologia a algo ilegal.",
    html: `
      <div style="font-family: Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.6;">
        <p style="margin: 0 0 12px;">Infelizmente seu relato não foi aprovado.</p>
        <p style="margin: 0;">Isso pode acontecer quando o conteúdo é considerado ofensivo, spam ou faz apologia a algo ilegal.</p>
      </div>
    `,
  };
}

export async function sendModerationStatusEmail(
  recipientEmail: string,
  status: ModerationEmailStatus,
) {
  if (!flags.brevoConfigured) {
    console.warn(
      "Brevo SMTP is not configured. Moderation email was skipped for:",
      recipientEmail,
    );
    return;
  }

  const copy = getModerationEmailCopy(status);

  const transporter = nodemailer.createTransport({
    host: env.brevoSmtpHost,
    port: env.brevoSmtpPort,
    secure: env.brevoSmtpSecure,
    auth: {
      user: env.brevoSmtpLogin!,
      pass: env.brevoSmtpPassword!,
    },
  });

  await transporter.sendMail({
    from: {
      address: env.brevoSenderEmail!,
      name: env.brevoSenderName!,
    },
    to: recipientEmail,
    subject: copy.subject,
    text: copy.text,
    html: copy.html,
  });
}
