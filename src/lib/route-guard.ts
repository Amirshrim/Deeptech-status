// Pure routing decision used by middleware (kept separate so it's unit-testable).

export type GuardDecision = "allow" | "redirect-login" | "unauthorized" | "redirect-admin";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/api/admin/login"]);

export function guardDecision(pathname: string, authed: boolean): GuardDecision {
  const path = pathname.replace(/\/+$/, "") || "/";
  const isAdminPage = path === "/admin" || path.startsWith("/admin/");
  const isAdminApi = path === "/api/admin" || path.startsWith("/api/admin/");
  if (!isAdminPage && !isAdminApi) return "allow";

  if (PUBLIC_ADMIN_PATHS.has(path)) {
    // Logged-in admins skip the login screen.
    return authed && path === "/admin/login" ? "redirect-admin" : "allow";
  }
  if (authed) return "allow";
  return isAdminApi ? "unauthorized" : "redirect-login";
}

/** Only allow redirecting back to admin pages (prevents open redirects). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.startsWith("/admin/login")) {
    return "/admin";
  }
  return next;
}
