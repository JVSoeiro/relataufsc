import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { runMigrations } = await import("../db/migrations");
  const { seedDemoComplaints } = await import("../db/seed");

  await runMigrations();
  await seedDemoComplaints();
  console.log("Demo complaints seeded.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
