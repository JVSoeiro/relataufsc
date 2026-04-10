import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { runMigrations } = await import("../db/migrations");

  runMigrations();
  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
