import { env } from "@/lib/env";

function assertDatabaseUrl() {
  if (!env.databaseUrl) {
    throw new Error(
      "POSTGRES_URL is required to connect RelataUFSC to Postgres/Supabase.",
    );
  }

  return env.databaseUrl;
}

export function getPostgresConnectionString() {
  return assertDatabaseUrl();
}

export function getPostgresClientOptions() {
  const databaseUrl = new URL(assertDatabaseUrl());

  if (
    databaseUrl.protocol !== "postgres:" &&
    databaseUrl.protocol !== "postgresql:"
  ) {
    throw new Error(
      "POSTGRES_URL must use the postgres:// or postgresql:// protocol.",
    );
  }

  const usePgbouncer = databaseUrl.searchParams.get("pgbouncer") === "true";
  const sslMode = databaseUrl.searchParams.get("sslmode")?.toLowerCase();

  return {
    connect_timeout: 30,
    idle_timeout: 20,
    max: 10,
    prepare: !usePgbouncer,
    ssl: sslMode === "require" ? ("require" as const) : undefined,
  };
}
