import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { env } from "@/lib/env";
import { resolveRuntimePath } from "@/lib/runtime-paths";
import * as schema from "@/db/schema";

type SqliteDatabase = InstanceType<typeof Database>;

function createDrizzleDatabase(sqlite: SqliteDatabase) {
  return drizzle(sqlite, { schema });
}

type AppDatabase = ReturnType<typeof createDrizzleDatabase>;

let sqliteInstance: SqliteDatabase | null = null;
let dbInstance: AppDatabase | null = null;

function ensureSqliteInstance() {
  if (sqliteInstance) {
    return sqliteInstance;
  }

  const databasePath = resolveRuntimePath(env.sqliteDbPath);

  mkdirSync(dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqliteInstance = sqlite;

  return sqliteInstance;
}

function ensureDbInstance() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = createDrizzleDatabase(ensureSqliteInstance());

  return dbInstance;
}

export const db = new Proxy({} as AppDatabase, {
  get(_target, property, receiver) {
    return Reflect.get(ensureDbInstance(), property, receiver);
  },
});

export const sqlite = new Proxy({} as SqliteDatabase, {
  get(_target, property, receiver) {
    return Reflect.get(ensureSqliteInstance(), property, receiver);
  },
});
