// Server-only admin auth helpers (password check + session lookup).
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { isAllowedAdmin, stripInvisible } from "./admin-config";
import { verifyPassword } from "./password";
import { SESSION_COOKIE, verifySessionToken, type AdminSession } from "./session";

export function passwordHash(): string | null {
  const raw = stripInvisible(process.env.ADMIN_PASSWORD_HASH ?? "").trim();
  return raw ? raw.replace(/^['"]|['"]$/g, "").trim() : null;
}

/** True only if the email is allowlisted AND the password matches. */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const hash = passwordHash();
  if (!hash) {
    console.error("ADMIN_PASSWORD_HASH is not set — admin login is disabled");
    return false;
  }
  // Always run the hash check (even for unknown emails) so timing doesn't reveal the allowlist.
  const passwordOk = await verifyPassword(stripInvisible(password).trim(), hash);
  const emailOk = isAllowedAdmin(email);
  if (!passwordOk || !emailOk) {
    // Server-side only (Vercel → Logs); the client always gets the same generic error.
    console.warn(`admin login failed: ${!emailOk ? "email not in ADMIN_EMAILS" : "wrong password"}`);
  }
  return passwordOk && emailOk;
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
