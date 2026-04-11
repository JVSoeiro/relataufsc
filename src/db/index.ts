import type { Sql } from "postgres";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import {
  getPostgresClientOptions,
  getPostgresConnectionString,
} from "@/db/postgres-connection";
import * as schema from "@/db/schema";

function createSqlClient() {
  return postgres(
    getPostgresConnectionString(),
    getPostgresClientOptions(),
  );
}

function createDrizzleDatabase(client: Sql) {
  return drizzle(client, { schema });
}

type AppDatabase = ReturnType<typeof createDrizzleDatabase>;

let sqlInstance: Sql | null = null;
let dbInstance: AppDatabase | null = null;

function ensureSqlInstance() {
  if (sqlInstance) {
    return sqlInstance;
  }

  sqlInstance = createSqlClient();

  return sqlInstance;
}

function ensureDbInstance() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = createDrizzleDatabase(ensureSqlInstance());

  return dbInstance;
}

const poolTarget = (() => ensureSqlInstance()) as unknown as Sql;

export const pool = new Proxy(poolTarget, {
  apply(_target, thisArg, argArray) {
    return Reflect.apply(
      ensureSqlInstance() as unknown as typeof poolTarget,
      thisArg,
      argArray,
    );
  },
  get(_target, property, receiver) {
    return Reflect.get(ensureSqlInstance(), property, receiver);
  },
});

export const db = new Proxy({} as AppDatabase, {
  get(_target, property, receiver) {
    return Reflect.get(ensureDbInstance(), property, receiver);
  },
});

export async function closeDatabasePool() {
  if (sqlInstance) {
    await sqlInstance.end({ timeout: 5 });
    sqlInstance = null;
    dbInstance = null;
  }
}
