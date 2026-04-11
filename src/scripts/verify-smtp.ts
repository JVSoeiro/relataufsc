import nodemailer from "nodemailer";

import { env, flags } from "@/lib/env";

async function main() {
  if (!flags.brevoConfigured) {
    throw new Error(
      "Brevo SMTP is not configured. Set BREVO_SMTP_LOGIN, BREVO_SMTP_PASSWORD, BREVO_SENDER_EMAIL, and BREVO_SENDER_NAME.",
    );
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

  await transporter.verify();

  console.log(
    `SMTP authentication succeeded for ${env.brevoSmtpLogin} at ${env.brevoSmtpHost}:${env.brevoSmtpPort}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
