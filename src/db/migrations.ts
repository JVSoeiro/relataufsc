import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import mysql, { type RowDataPacket } from "mysql2/promise";

import { getMysqlConnectionOptions } from "@/db/mysql-connection";

type AppliedMigrationRow = RowDataPacket & {
  name: string;
};

async function openMigrationConnection() {
  const connection = await mysql.createConnection({
    ...getMysqlConnectionOptions(),
    multipleStatements: true,
  });

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      name VARCHAR(255) PRIMARY KEY NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  return connection;
}

export async function runMigrations() {
  const connection = await openMigrationConnection();
  const migrationsDirectory = resolve(process.cwd(), "drizzle");
  const migrationFiles = readdirSync(migrationsDirectory)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  try {
    for (const migrationFile of migrationFiles) {
      const [alreadyAppliedRows] = await connection.execute<AppliedMigrationRow[]>(
        "SELECT name FROM app_migrations WHERE name = ? LIMIT 1",
        [migrationFile],
      );

      if (alreadyAppliedRows.length > 0) {
        continue;
      }

      const sql = readFileSync(join(migrationsDirectory, migrationFile), "utf8");

      await connection.beginTransaction();

      try {
        await connection.query(sql);
        await connection.execute(
          "INSERT INTO app_migrations (name) VALUES (?)",
          [migrationFile],
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  } finally {
    await connection.end();
  }
}
