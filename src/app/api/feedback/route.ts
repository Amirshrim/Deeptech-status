// Public endpoint: submit feedback for the active event. Write-only.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { feedbackInputSchema } from "@/lib/feedback-schema";
import { fieldErrors } from "@/lib/member-schema";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, readJson } from "@/lib/request";

export const dynamic = "force-dynamic";

const IP_LIMIT = 600; // per 10 minutes — a whole lecture hall shares one campus Wi-Fi IP
const IP_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const limit = await rateLimit(`feedback:${getClientIp(req)}`, IP_LIMIT, IP_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "יותר מדי שליחות. נסו שוב בעוד כמה דקות." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const body = await readJson(req);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  // Honeypot
  const honeypot = (body as Record<string, unknown>).website;
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const parsed = feedbackInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  const event = await prisma.clubEvent.findUnique({
    where: { id: parsed.data.eventId },
    select: { isActive: true },
  });
  if (!event || !event.isActive) {
    return NextResponse.json(
      { error: "המפגש הזה כבר לא פתוח למשוב. רעננו את הדף." },
      { status: 409 },
    );
  }

  await prisma.feedback.create({ data: parsed.data });
  return NextResponse.json({ ok: true });
}
