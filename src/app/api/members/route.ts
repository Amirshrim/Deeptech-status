// Public endpoint: create or update (upsert by email). Never returns other members' data.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fieldErrors, memberInputSchema } from "@/lib/member-schema";
import { toSavedSummary } from "@/lib/member-dto";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, readJson } from "@/lib/request";

export const dynamic = "force-dynamic";

// Generous per-IP limit: at events many members share one campus/Wi-Fi IP.
// A tighter per-email limit stops someone hammering a single record.
const IP_LIMIT = 600; // submissions per IP…
const IP_WINDOW_MS = 10 * 60 * 1000; // …per 10 minutes
const EMAIL_LIMIT = 10; // updates of the same email…
const EMAIL_WINDOW_MS = 10 * 60 * 1000; // …per 10 minutes

const TOO_MANY = "יותר מדי שליחות. נסו שוב בעוד כמה דקות.";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

export async function POST(req: Request) {
  const limit = await rateLimit(`submit:${getClientIp(req)}`, IP_LIMIT, IP_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: TOO_MANY },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const body = await readJson(req);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  // Honeypot: real users never see the "website" field. Pretend success for bots.
  const honeypot = (body as Record<string, unknown>).website;
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return NextResponse.json({ status: "created", member: null });
  }

  const parsed = memberInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  const { consent: _consent, ...data } = parsed.data;

  const emailLimit = await rateLimit(`submit-email:${data.email}`, EMAIL_LIMIT, EMAIL_WINDOW_MS);
  if (!emailLimit.ok) {
    return NextResponse.json(
      { error: TOO_MANY },
      { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSec) } },
    );
  }

  const now = new Date();
  const existing = await prisma.member.findUnique({
    where: { email: data.email },
    select: { id: true },
  });

  const upsert = () =>
    prisma.member.upsert({
      where: { email: data.email },
      create: { ...data, consentAt: now },
      update: { ...data, consentAt: now },
    });

  let member: Awaited<ReturnType<typeof upsert>>;
  try {
    member = await upsert();
  } catch (err) {
    // Two simultaneous first submissions with the same email can both try to
    // create; the loser gets a unique violation — retrying turns it into an update.
    if (!isUniqueViolation(err)) throw err;
    member = await upsert();
  }

  return NextResponse.json({
    status: existing ? "updated" : "created",
    member: toSavedSummary(member),
  });
}
