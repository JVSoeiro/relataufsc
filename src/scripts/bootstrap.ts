import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { bootstrapApp } = await import("../db/bootstrap");
  const { assertOperationalEnvironment } = await import("../lib/env");
  const { closeDatabasePool } = await import("../db/index");

  try {
    await bootstrapApp({
      withMigrations: true,
      clearDemoData: true,
    });
    assertOperationalEnvironment();
    console.log("RelataUFSC bootstrap completed.");
  } finally {
    await closeDatabasePool();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
