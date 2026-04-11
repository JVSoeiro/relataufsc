import { flags } from "@/lib/env";
import { runMigrations } from "@/db/migrations";
import { clearDemoComplaints } from "@/db/seed";
import { ensureStorageDirectories } from "@/services/storage";

let hasBootstrapped = false;

export async function bootstrapApp() {
  if (hasBootstrapped) {
    return;
  }

  ensureStorageDirectories();

  if (flags.mockMode) {
    hasBootstrapped = true;
    return;
  }

  if (!flags.databaseConfigured) {
    throw new Error(
      "POSTGRES_URL is required to bootstrap RelataUFSC.",
    );
  }

  await runMigrations();
  await clearDemoComplaints();

  hasBootstrapped = true;
}
