import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const complaints = sqliteTable(
  "complaints",
  {
    id: text("id").primaryKey(),
    description: text("description").notNull(),
    campusId: text("campus_id").notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    mediaPath: text("media_path"),
    mediaKind: text("media_kind"),
    mediaMimeType: text("media_mime_type"),
    mediaSizeBytes: integer("media_size_bytes"),
    publicName: text("public_name"),
    submitterEmail: text("submitter_email"),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull(),
    moderatedAt: text("moderated_at"),
    approvedAt: text("approved_at"),
  },
  (table) => [
    index("complaints_status_idx").on(table.status),
    index("complaints_campus_status_idx").on(table.campusId, table.status),
    index("complaints_created_at_idx").on(table.createdAt),
    index("complaints_campus_created_at_idx").on(table.campusId, table.createdAt),
  ],
);

export const submissionRateLimits = sqliteTable(
  "submission_rate_limits",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    keyHash: text("key_hash").notNull(),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [
    index("submission_rate_limits_key_hash_expires_at_idx").on(
      table.keyHash,
      table.expiresAt,
    ),
    index("submission_rate_limits_expires_at_idx").on(table.expiresAt),
  ],
);
