import type { Pool } from "mysql2/promise";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

import { getMysqlConnectionOptions } from "@/db/mysql-connection";
import * as schema from "@/db/schema";

function createPoolInstance() {
  return mysql.createPool({
    ...getMysqlConnectionOptions(),
    connectionLimit: 10,
    enableKeepAlive: true,
    idleTimeout: 60_000,
    maxIdle: 10,
    queueLimit: 0,
    waitForConnections: true,
  });
}

function createDrizzleDatabase(pool: Pool) {
  return drizzle(pool, { schema, mode: "default" });
}

type AppDatabase = ReturnType<typeof createDrizzleDatabase>;

let poolInstance: Pool | null = null;
let dbInstance: AppDatabase | null = null;

function ensurePoolInstance() {
  if (poolInstance) {
    return poolInstance;
  }

  poolInstance = createPoolInstance();

  return poolInstance;
}

function ensureDbInstance() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = createDrizzleDatabase(ensurePoolInstance());

  return dbInstance;
}

export const pool = new Proxy({} as Pool, {
  get(_target, property, receiver) {
    return Reflect.get(ensurePoolInstance(), property, receiver);
  },
});

export const db = new Proxy({} as AppDatabase, {
  get(_target, property, receiver) {
    return Reflect.get(ensureDbInstance(), property, receiver);
  },
});
