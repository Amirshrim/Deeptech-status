// Public endpoint: create or update (upsert by email). Never returns other members' data.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fieldErrors, memberInputSchema } from "@/lib/member-schema";
import { toSavedSummary } from "@/lib/member-dto";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, readJson } from "@/lib/request";

export const dynamic = "force-dynamic";

const SUBMIT_LIMIT = 10; // submissions…
const SUBMIT_WINDOW_MS = 10 * 60 * 1000; // …per 10 minutes per IP

export async function POST(req: Request) {
  const limit = await rateLimit(`submit:${getClientIp(req)}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS);
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
  const now = new Date();

  const existing = await prisma.member.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  const member = await prisma.member.upsert({
    where: { email: data.email },
    create: { ...data, consentAt: now },
    update: { ...data, consentAt: now },
  });

  return NextResponse.json({
    status: existing ? "updated" : "created",
    member: toSavedSummary(member),
  });
}
