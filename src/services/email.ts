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
      "Brevo is not configured. Approval email was skipped for:",
      recipientEmail,
    );
    return;
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.brevoApiKey!,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: env.brevoSenderEmail,
        name: env.brevoSenderName,
      },
      to: [{ email: recipientEmail }],
      subject: "Your report was approved",
      textContent:
        "Your report has been reviewed and approved. It is now visible on UFSC Relata!",
      htmlContent: approvalEmailHtml,
    }),
  });

  if (!response.ok) {
    throw new Error("Brevo approval email request failed.");
  }
}
