// Fixed-window rate limiter backed by Postgres, so limits hold across
// serverless instances (Vercel). One atomic statement per check.
import { prisma } from "./db";

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSec: number };

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSec = Math.ceil(windowMs / 1000);
  try {
    // Timestamps are stored as UTC "timestamp without time zone" (Prisma's convention).
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, (NOW() AT TIME ZONE 'UTC') + ${windowSec}::int * INTERVAL '1 second')
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" <= (NOW() AT TIME ZONE 'UTC')
                         THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= (NOW() AT TIME ZONE 'UTC')
                         THEN (NOW() AT TIME ZONE 'UTC') + ${windowSec}::int * INTERVAL '1 second'
                         ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"`;
    const row = rows[0];
    const count = Number(row.count);
    const retryAfterSec = Math.max(1, Math.ceil((new Date(row.resetAt).getTime() - Date.now()) / 1000));

    // Opportunistic cleanup of expired windows (~1% of calls).
    if (Math.random() < 0.01) {
      prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" < (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 hour'`.catch(() => {});
    }

    return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfterSec };
  } catch (err) {
    // Fail open: a DB hiccup should not lock everyone out of the form.
    console.error("rateLimit failed", err);
    return { ok: true, remaining: limit, retryAfterSec: 0 };
  }
}
