import { pool } from "@/db";

type CountRow = {
  total: number;
};

export async function consumeSubmissionRateLimit(args: {
  keyHash: string;
  createdAt: string;
  expiresAt: string;
  maxAttempts: number;
}) {
  return pool.begin(async (transaction) => {
    await transaction`
      DELETE FROM submission_rate_limits
      WHERE expires_at < ${args.createdAt}
    `;

    const countRows = await transaction<CountRow[]>`
      SELECT COUNT(*)::int AS total
      FROM submission_rate_limits
      WHERE key_hash = ${args.keyHash} AND expires_at > ${args.createdAt}
    `;

    if (Number(countRows[0]?.total ?? 0) >= args.maxAttempts) {
      return false;
    }

    await transaction`
      INSERT INTO submission_rate_limits (
        key_hash,
        created_at,
        expires_at
      ) VALUES (
        ${args.keyHash},
        ${args.createdAt},
        ${args.expiresAt}
      )
    `;

    return true;
  });
}
