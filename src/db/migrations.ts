import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import postgres from "postgres";

import {
  getPostgresClientOptions,
  getPostgresConnectionString,
} from "@/db/postgres-connection";

type AppliedMigrationRow = {
  name: string;
};

function createMigrationClient() {
  return postgres(
    getPostgresConnectionString(),
    getPostgresClientOptions(),
  );
}

export async function runMigrations() {
  const sql = createMigrationClient();
  const migrationsDirectory = resolve(process.cwd(), "drizzle");
  const migrationFiles = readdirSync(migrationsDirectory)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS app_migrations (
        name TEXT PRIMARY KEY NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    for (const migrationFile of migrationFiles) {
      const alreadyAppliedRows = await sql<AppliedMigrationRow[]>`
        SELECT name
        FROM app_migrations
        WHERE name = ${migrationFile}
        LIMIT 1
      `;

      if (alreadyAppliedRows.length > 0) {
        continue;
      }

      const migrationSql = readFileSync(
        join(migrationsDirectory, migrationFile),
        "utf8",
      );

      await sql.begin(async (transaction) => {
        await transaction.unsafe(migrationSql);
        await transaction`
          INSERT INTO app_migrations (name)
          VALUES (${migrationFile})
        `;
      });
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}
