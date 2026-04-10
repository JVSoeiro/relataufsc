import { lt } from "drizzle-orm";

import { db, sqlite } from "@/db";
import { submissionRateLimits } from "@/db/schema";

export function consumeSubmissionRateLimit(args: {
  keyHash: string;
  createdAt: string;
  expiresAt: string;
  maxAttempts: number;
}) {
  const transaction = sqlite.transaction(() => {
    db.delete(submissionRateLimits)
      .where(lt(submissionRateLimits.expiresAt, args.createdAt))
      .run();

    const keyCount = sqlite
      .prepare(
        `
          SELECT COUNT(*) AS total
          FROM submission_rate_limits
          WHERE key_hash = ? AND expires_at > ?
        `,
      )
      .get(args.keyHash, args.createdAt) as { total: number };

    if (keyCount.total >= args.maxAttempts) {
      return false;
    }

    db.insert(submissionRateLimits)
      .values({
        keyHash: args.keyHash,
        createdAt: args.createdAt,
        expiresAt: args.expiresAt,
      })
      .run();

    return true;
  });

  return transaction();
}
