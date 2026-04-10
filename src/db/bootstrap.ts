import { env, flags } from "@/lib/env";
import { runMigrations } from "@/db/migrations";
import { seedDemoComplaints } from "@/db/seed";
import { ensureStorageDirectories } from "@/services/storage";

let hasBootstrapped = false;

export async function bootstrapApp() {
  if (hasBootstrapped) {
    return;
  }

  if (!flags.databaseConfigured) {
    throw new Error("DATABASE_URL is required to bootstrap UFSC Relata.");
  }

  ensureStorageDirectories();
  await runMigrations();

  if (env.seedDemoData) {
    await seedDemoComplaints();
  }

  hasBootstrapped = true;
}
