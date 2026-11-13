// Server-only admin auth helpers (bcrypt + session lookup).
import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { isAllowedAdmin } from "./admin-config";
import { SESSION_COOKIE, verifySessionToken, type AdminSession } from "./session";

function passwordHash(): string | null {
  const raw = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!raw) return null;
  // Tolerate a hash pasted with \$ escaping (as required in local .env files).
  return raw.replace(/\\\$/g, "$").replace(/^['"]|['"]$/g, "");
}

/** True only if the email is allowlisted AND the password matches. */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const hash = passwordHash();
  if (!hash) {
    console.error("ADMIN_PASSWORD_HASH is not set — admin login is disabled");
    return false;
  }
  // Always run bcrypt (even for unknown emails) so timing doesn't reveal the allowlist.
  const passwordOk = await bcrypt.compare(password, hash);
  return passwordOk && isAllowedAdmin(email);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** For server components: redirect to login when not authenticated. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** For admin route handlers: returns a 401 response when not authenticated. */
export async function requireAdminApi(): Promise<AdminSession | NextResponse> {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return session;
}
