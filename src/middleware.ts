// Protects /admin/* and /api/admin/* (except the login screen/endpoint).
// Every protected page and API route also re-checks the session server-side.
import { NextResponse, type NextRequest } from "next/server";
import { guardDecision } from "@/lib/route-guard";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const decision = guardDecision(pathname, Boolean(session));

  switch (decision) {
    case "allow":
      return NextResponse.next();
    case "unauthorized":
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    case "redirect-admin":
      return NextResponse.redirect(new URL("/admin", req.url));
    case "redirect-login": {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
