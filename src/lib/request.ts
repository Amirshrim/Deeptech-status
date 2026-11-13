// Small request helpers shared by route handlers.

/** Best-effort client IP (Vercel sets x-forwarded-for / x-real-ip). */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * CSRF guard for state-changing requests: the Origin (or Referer) header must
 * match the request host. Browsers always send Origin on cross-site POSTs.
 */
export function isSameOrigin(req: Request): boolean {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return false;
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

/** Reads a JSON body with a size cap. Returns undefined on bad/oversized input. */
export async function readJson(req: Request, maxBytes = 16_000): Promise<unknown> {
  const text = await req.text();
  if (text.length > maxBytes) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
