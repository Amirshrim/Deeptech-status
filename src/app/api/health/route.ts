// Health check + config sanity (booleans/counts only — never reveals secret values).
import { NextResponse } from "next/server";
import { adminEmails } from "@/lib/admin-config";
import { passwordHash } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function checkDatabase(): Promise<string> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
    ]);
    return "ok";
  } catch (err) {
    console.error("health: database check failed", err);
    return "error";
  }
}

export async function GET() {
  const hash = passwordHash();
  const started = Date.now();
  const database = await checkDatabase();
  const dbHost = (process.env.DATABASE_URL ?? "").match(/@([^/:?]+)/)?.[1] ?? "";

  const config = {
    adminEmailsCount: adminEmails().length,
    passwordHash: !hash ? "missing" : /^scrypt:\d+:\d+:\d+:[\w-]+:[\w-]+$/.test(hash) ? "ok" : "invalid-format",
    sessionSecret: (process.env.SESSION_SECRET?.trim().length ?? 0) >= 32 ? "ok" : "missing-or-short",
    database,
  };
  const ok = Object.values(config).every((v) => v === "ok" || typeof v === "number") && config.adminEmailsCount > 0;

  return NextResponse.json(
    {
      ok,
      config,
      dbLatencyMs: Date.now() - started,
      functionRegion: process.env.VERCEL_REGION ?? null,
      dbRegion: dbHost.match(/\.([a-z]{2}-[a-z]+-\d)\./)?.[1] ?? null,
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
