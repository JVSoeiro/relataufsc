import { z } from "zod";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return value;
};

const normalizeBooleanLikeString = (value: unknown) => {
  if (typeof value !== "string") return value;
  const s = value.trim().toLowerCase();
  if (["true", "verdadeiro", "1", "yes", "y"].includes(s)) return "true";
  if (["false", "falso", "0", "no", "n"].includes(s)) return "false";
  return value;
};

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_URL: z.string().url().default("http://localhost:5000"),
    APP_NAME: z.string().default("RelataUFSC"),
    DATA_DIR: z.string().min(1).default("./data"),
    UPLOAD_PENDING_DIR: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).optional(),
    ),
    UPLOAD_PUBLIC_DIR: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).optional(),
    ),
    DATABASE_URL: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).optional(),
    ),
    MOCK_MODE: z.preprocess(
      emptyStringToUndefined,
      z.enum(["true", "false"]).default("false"),
    ),
    UPLOAD_DIR: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).optional(),
    ),
    MAX_UPLOAD_SIZE_MB: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().positive().max(200).default(25),
    ),
    TELEGRAM_BOT_TOKEN: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).optional(),
    ),
    TELEGRAM_CHAT_ID: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).optional(),
    ),
    MODERATION_SECRET: z
      .string()
      .min(32)
      .default("development-only-secret-change-me-123"),
    MODERATION_TOKEN_TTL_MINUTES: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().positive().default(720),
    ),
    BREVO_SMTP_HOST: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).optional(),
    ),
    BREVO_SMTP_PORT: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().positive().optional(),
    ),
    BREVO_SMTP_LOGIN: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).optional(),
    ),
    BREVO_SMTP_PASSWORD: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).optional(),
    ),
    BREVO_SMTP_SECURE: z.preprocess(
      emptyStringToUndefined,
      z.enum(["true", "false"]).optional(),
    ),
    BREVO_SENDER_EMAIL: z.preprocess(
      emptyStringToUndefined,
      z.string().email().optional(),
    ),
    BREVO_SENDER_NAME: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).optional(),
    ),
    SEED_DEMO_DATA: z.preprocess(
      normalizeBooleanLikeString,
      z
        .enum(["true", "false"]) 
        .default("false")
        .transform((value) => value === "true"),
    ),
    SUBMISSION_RATE_LIMIT_WINDOW_SECONDS: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().positive().default(300),
    ),
    SUBMISSION_RATE_LIMIT_MAX_ATTEMPTS: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().positive().default(4),
    ),
    PORT: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().positive().optional(),
    ),
  })
  .superRefine((value, ctx) => {
    const smtpCredentialProvided = Boolean(
      value.BREVO_SMTP_PASSWORD || value.BREVO_SMTP_LOGIN,
    );

    if (
      smtpCredentialProvided &&
      (!value.BREVO_SENDER_EMAIL || !value.BREVO_SENDER_NAME)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "BREVO_SENDER_EMAIL and BREVO_SENDER_NAME are required when SMTP is configured.",
        path: ["BREVO_SENDER_EMAIL"],
      });
    }

    if (
      smtpCredentialProvided &&
      !value.BREVO_SMTP_LOGIN &&
      !value.BREVO_SENDER_EMAIL
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "BREVO_SMTP_LOGIN or BREVO_SENDER_EMAIL is required when SMTP is configured.",
        path: ["BREVO_SMTP_LOGIN"],
      });
    }
  });

const parsedEnv = envSchema.parse(process.env);

function isInvalidPublicAppUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "0.0.0.0" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".local")
    ) {
      return true;
    }

    if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) {
      return true;
    }

    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

const derivedUploadPendingDir =
  parsedEnv.UPLOAD_PENDING_DIR ??
  (parsedEnv.UPLOAD_DIR ? `${parsedEnv.UPLOAD_DIR}/pending` : undefined) ??
  `${parsedEnv.DATA_DIR}/uploads/pending`;

const derivedUploadPublicDir =
  parsedEnv.UPLOAD_PUBLIC_DIR ??
  (parsedEnv.UPLOAD_DIR ? `${parsedEnv.UPLOAD_DIR}/public` : undefined) ??
  `${parsedEnv.DATA_DIR}/uploads/public`;

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  appUrl: parsedEnv.APP_URL.replace(/\/$/, ""),
  appName: parsedEnv.APP_NAME,
  dataDir: parsedEnv.DATA_DIR,
  databaseUrl: parsedEnv.DATABASE_URL ?? null,
  mockMode: parsedEnv.MOCK_MODE === "true",
  uploadPendingDir: derivedUploadPendingDir,
  uploadPublicDir: derivedUploadPublicDir,
  maxUploadSizeMb: parsedEnv.MAX_UPLOAD_SIZE_MB,
  maxUploadSizeBytes: parsedEnv.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  telegramBotToken: parsedEnv.TELEGRAM_BOT_TOKEN ?? null,
  telegramChatId: parsedEnv.TELEGRAM_CHAT_ID ?? null,
  moderationSecret: parsedEnv.MODERATION_SECRET,
  moderationTokenTtlMinutes: parsedEnv.MODERATION_TOKEN_TTL_MINUTES,
  brevoSmtpHost: parsedEnv.BREVO_SMTP_HOST ?? "smtp-relay.brevo.com",
  brevoSmtpPort: parsedEnv.BREVO_SMTP_PORT ?? 587,
  brevoSmtpLogin:
    parsedEnv.BREVO_SMTP_LOGIN ?? parsedEnv.BREVO_SENDER_EMAIL ?? null,
  brevoSmtpPassword: parsedEnv.BREVO_SMTP_PASSWORD ?? null,
  brevoSmtpSecure: parsedEnv.BREVO_SMTP_SECURE === "true",
  brevoSenderEmail: parsedEnv.BREVO_SENDER_EMAIL ?? null,
  brevoSenderName: parsedEnv.BREVO_SENDER_NAME ?? null,
  seedDemoData: parsedEnv.SEED_DEMO_DATA,
  submissionRateLimitWindowSeconds:
    parsedEnv.SUBMISSION_RATE_LIMIT_WINDOW_SECONDS,
  submissionRateLimitMaxAttempts:
    parsedEnv.SUBMISSION_RATE_LIMIT_MAX_ATTEMPTS,
  port: parsedEnv.PORT ?? 5000,
} as const;

export const flags = {
  mockMode: env.mockMode,
  databaseConfigured: Boolean(env.databaseUrl),
  telegramConfigured: Boolean(env.telegramBotToken && env.telegramChatId),
  brevoConfigured: Boolean(
    env.brevoSmtpLogin &&
      env.brevoSmtpPassword &&
      env.brevoSenderEmail &&
      env.brevoSenderName,
  ),
} as const;

export function assertOperationalEnvironment() {
  if (env.nodeEnv === "production" && env.mockMode) {
    throw new Error("MOCK_MODE must be disabled in production.");
  }

  if (env.nodeEnv === "production" && !flags.databaseConfigured) {
    throw new Error("DATABASE_URL is required in production.");
  }

  if (env.nodeEnv === "production" && !flags.telegramConfigured) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required in production.",
    );
  }

  if (
    env.nodeEnv === "production" &&
    env.moderationSecret === "development-only-secret-change-me-123"
  ) {
    throw new Error(
      "MODERATION_SECRET must be replaced with a production secret.",
    );
  }

  if (env.nodeEnv === "production" && isInvalidPublicAppUrl(env.appUrl)) {
    throw new Error(
      "APP_URL must be a public HTTP(S) URL in production. Telegram moderation buttons do not accept localhost, 127.0.0.1, 0.0.0.0, .local, or private-network hosts.",
    );
  }
}
