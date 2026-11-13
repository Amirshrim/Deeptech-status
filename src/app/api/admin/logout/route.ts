import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/request";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

// Called by a plain <form method="post">, so respond with a redirect.
export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const res = NextResponse.redirect(new URL("/admin/login", req.url), 303);
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
