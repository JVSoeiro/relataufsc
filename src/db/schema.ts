import {
  double,
  index,
  int,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

export const complaints = mysqlTable(
  "complaints",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    description: text("description").notNull(),
    campusId: varchar("campus_id", { length: 64 }).notNull(),
    latitude: double("latitude").notNull(),
    longitude: double("longitude").notNull(),
    mediaPath: varchar("media_path", { length: 1024 }),
    mediaKind: varchar("media_kind", { length: 24 }),
    mediaMimeType: varchar("media_mime_type", { length: 191 }),
    mediaSizeBytes: int("media_size_bytes", { unsigned: true }),
    publicName: varchar("public_name", { length: 191 }),
    submitterEmail: varchar("submitter_email", { length: 191 }),
    status: varchar("status", { length: 24 }).notNull().default("pending"),
    createdAt: varchar("created_at", { length: 40 }).notNull(),
    moderatedAt: varchar("moderated_at", { length: 40 }),
    approvedAt: varchar("approved_at", { length: 40 }),
  },
  (table) => [
    index("complaints_status_idx").on(table.status),
    index("complaints_campus_status_idx").on(table.campusId, table.status),
    index("complaints_created_at_idx").on(table.createdAt),
    index("complaints_campus_created_at_idx").on(table.campusId, table.createdAt),
  ],
);

export const submissionRateLimits = mysqlTable(
  "submission_rate_limits",
  {
    id: int("id").autoincrement().primaryKey(),
    keyHash: varchar("key_hash", { length: 128 }).notNull(),
    createdAt: varchar("created_at", { length: 40 }).notNull(),
    expiresAt: varchar("expires_at", { length: 40 }).notNull(),
  },
  (table) => [
    index("submission_rate_limits_key_hash_expires_at_idx").on(
      table.keyHash,
      table.expiresAt,
    ),
    index("submission_rate_limits_expires_at_idx").on(table.expiresAt),
  ],
);
