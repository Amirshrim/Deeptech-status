import { NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/auth";
import { loginSchema } from "@/lib/member-schema";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, isSameOrigin, readJson } from "@/lib/request";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

const GENERIC_ERROR = "פרטי ההתחברות שגויים";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limit = await rateLimit(`login:${getClientIp(req)}`, 5, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "יותר מדי ניסיונות התחברות. נסו שוב בעוד דקה." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const parsed = loginSchema.safeParse(await readJson(req, 2_000));
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const { email, password } = parsed.data;
  if (!(await verifyAdminCredentials(email, password))) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  let token: string;
  try {
    token = await createSessionToken(email);
  } catch (err) {
    console.error("admin login: cannot create session —", err);
    return NextResponse.json(
      { error: "שגיאת הגדרות בשרת (SESSION_SECRET חסר). פנו למי שמתחזק את האתר." },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
