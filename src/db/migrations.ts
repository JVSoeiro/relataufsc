import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import Database from "better-sqlite3";

import { env } from "@/lib/env";
import { resolveRuntimePath } from "@/lib/runtime-paths";

function openMigrationDatabase() {
  const databasePath = resolveRuntimePath(env.sqliteDbPath);
  mkdirSync(dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      name TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return sqlite;
}

export function runMigrations() {
  const sqlite = openMigrationDatabase();
  const migrationsDirectory = resolve(process.cwd(), "drizzle");
  const migrationFiles = readdirSync(migrationsDirectory)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const migrationFile of migrationFiles) {
    const alreadyApplied = sqlite
      .prepare("SELECT name FROM app_migrations WHERE name = ?")
      .get(migrationFile);

    if (alreadyApplied) {
      continue;
    }

    const sql = readFileSync(join(migrationsDirectory, migrationFile), "utf8");
    const transaction = sqlite.transaction(() => {
      sqlite.exec(sql);
      sqlite
        .prepare("INSERT INTO app_migrations (name) VALUES (?)")
        .run(migrationFile);
    });

    transaction();
  }

  sqlite.close();
}
