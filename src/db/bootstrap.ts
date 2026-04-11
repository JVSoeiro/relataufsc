import { flags } from "@/lib/env";
import { runMigrations } from "@/db/migrations";
import { clearDemoComplaints } from "@/db/seed";
import { ensureStorageDirectories } from "@/services/storage";

let hasBootstrapped = false;
let hasPreparedDatabase = false;

type BootstrapOptions = {
  withMigrations?: boolean;
  clearDemoData?: boolean;
};

export async function bootstrapApp(options: BootstrapOptions = {}) {
  const { withMigrations = false, clearDemoData = false } = options;

  if (hasBootstrapped && (!withMigrations || hasPreparedDatabase)) {
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

  if (withMigrations && !hasPreparedDatabase) {
    await runMigrations();

    if (clearDemoData) {
      await clearDemoComplaints();
    }

    hasPreparedDatabase = true;
  }

  hasBootstrapped = true;
}
