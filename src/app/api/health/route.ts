// Health check + config sanity (booleans/counts only — never reveals secret values).
import { NextResponse } from "next/server";
import { adminEmails } from "@/lib/admin-config";
import { passwordHash } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET() {
  const hash = passwordHash();
  return NextResponse.json({
    ok: true,
    config: {
      adminEmailsCount: adminEmails().length,
      passwordHash: !hash ? "missing" : /^scrypt:\d+:\d+:\d+:[\w-]+:[\w-]+$/.test(hash) ? "ok" : "invalid-format",
      sessionSecret: (process.env.SESSION_SECRET?.length ?? 0) >= 32 ? "ok" : "missing-or-short",
      database: process.env.DATABASE_URL ? "set" : "missing",
    },
  });
}
