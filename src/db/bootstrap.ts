import { env } from "@/lib/env";
import { runMigrations } from "@/db/migrations";
import { seedDemoComplaints } from "@/db/seed";
import { ensureStorageDirectories } from "@/services/storage";

let hasBootstrapped = false;

export async function bootstrapApp() {
  if (hasBootstrapped) {
    return;
  }

  ensureStorageDirectories();
  runMigrations();

  if (env.seedDemoData) {
    seedDemoComplaints();
  }

  hasBootstrapped = true;
}
