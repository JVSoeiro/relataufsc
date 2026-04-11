import nodemailer from "nodemailer";

import { env, flags } from "@/lib/env";

const approvalEmailHtml = `
  <div style="font-family: Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.6;">
    <p style="margin: 0 0 12px;">Your report has been reviewed and approved.</p>
    <p style="margin: 0;">It is now visible on UFSC Relata!</p>
  </div>
`;

export async function sendApprovalEmail(recipientEmail: string) {
  if (!flags.brevoConfigured) {
    console.warn(
      "Brevo SMTP is not configured. Approval email was skipped for:",
      recipientEmail,
    );
    return;
  }

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
    subject: "Your report was approved",
    text: "Your report has been reviewed and approved. It is now visible on UFSC Relata!",
    html: approvalEmailHtml,
  });
}
