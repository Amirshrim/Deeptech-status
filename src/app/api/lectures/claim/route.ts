// Public: claim a free Tuesday on the lecture board. Race-safe (date is the primary key).
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MAX_CLAIMS_PER_EMAIL, claimSchema, dateKeyToDate, isBoardDate, todayInIsrael } from "@/lib/lectures";
import { fieldErrors } from "@/lib/member-schema";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, readJson } from "@/lib/request";

export const dynamic = "force-dynamic";

const tooMany = (retry: number) =>
  NextResponse.json(
    { error: "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות." },
    { status: 429, headers: { "Retry-After": String(retry) } },
  );

export async function POST(req: Request) {
  const ipLimit = await rateLimit(`lecture:${getClientIp(req)}`, 120, 10 * 60 * 1000);
  if (!ipLimit.ok) return tooMany(ipLimit.retryAfterSec);

  const body = await readJson(req, 4_000);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  const honeypot = (body as Record<string, unknown>).website;
  if (typeof honeypot === "string" && honeypot.trim() !== "") return NextResponse.json({ ok: true, token: null });

  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  const { date, name, email, topic } = parsed.data;

  if (!isBoardDate(date)) {
    return NextResponse.json({ error: "התאריך הזה לא פתוח להרשמה." }, { status: 400 });
  }

  const emailLimit = await rateLimit(`lecture-email:${email}`, 10, 10 * 60 * 1000);
  if (!emailLimit.ok) return tooMany(emailLimit.retryAfterSec);

  const upcomingByEmail = await prisma.lectureSlot.count({
    where: { email, blocked: false, date: { gte: dateKeyToDate(todayInIsrael()) } },
  });
  if (upcomingByEmail >= MAX_CLAIMS_PER_EMAIL) {
    return NextResponse.json(
      { error: `אפשר להירשם לעד ${MAX_CLAIMS_PER_EMAIL} תאריכים קדימה. לשינוי פנו להנהלת המועדון.` },
      { status: 409 },
    );
  }

  const token = randomBytes(24).toString("base64url");
  try {
    await prisma.lectureSlot.create({
      data: { date: dateKeyToDate(date), name, email, topic, cancelToken: token },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "מישהו תפס את התאריך הזה ממש עכשיו. בחרו תאריך אחר." }, { status: 409 });
    }
    throw err;
  }
  return NextResponse.json({ ok: true, token });
}
