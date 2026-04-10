import type { ConnectionOptions } from "mysql2/promise";

import { env } from "@/lib/env";

function assertDatabaseUrl() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required to connect UFSC Relata to MySQL.");
  }

  return env.databaseUrl;
}

export function getMysqlConnectionOptions(): ConnectionOptions {
  const databaseUrl = new URL(assertDatabaseUrl());

  if (
    databaseUrl.protocol !== "mysql:" &&
    databaseUrl.protocol !== "mariadb:"
  ) {
    throw new Error("DATABASE_URL must use the mysql:// or mariadb:// protocol.");
  }

  const databaseName = decodeURIComponent(
    databaseUrl.pathname.replace(/^\//, ""),
  );

  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  return {
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseName,
    charset: "utf8mb4",
    timezone: "Z",
  };
}
