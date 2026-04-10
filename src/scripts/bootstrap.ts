import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { bootstrapApp } = await import("../db/bootstrap");
  const { assertOperationalEnvironment } = await import("../lib/env");

  await bootstrapApp();
  assertOperationalEnvironment();
  console.log("UFSC Relata bootstrap completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
