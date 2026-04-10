import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { pool } from "@/db";

type CountRow = RowDataPacket & {
  total: number | string;
};

export async function consumeSubmissionRateLimit(args: {
  keyHash: string;
  createdAt: string;
  expiresAt: string;
  maxAttempts: number;
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute<ResultSetHeader>(
      `
        DELETE FROM submission_rate_limits
        WHERE expires_at < ?
      `,
      [args.createdAt],
    );

    const [countRows] = await connection.query<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM submission_rate_limits
        WHERE key_hash = ? AND expires_at > ?
      `,
      [args.keyHash, args.createdAt],
    );

    if (Number(countRows[0]?.total ?? 0) >= args.maxAttempts) {
      await connection.rollback();
      return false;
    }

    await connection.execute<ResultSetHeader>(
      `
        INSERT INTO submission_rate_limits (
          key_hash,
          created_at,
          expires_at
        ) VALUES (?, ?, ?)
      `,
      [args.keyHash, args.createdAt, args.expiresAt],
    );

    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
