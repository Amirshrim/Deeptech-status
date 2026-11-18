// Public: the person who claimed a date cancels it, using the token their device received.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cancelSchema, dateKeyToDate } from "@/lib/lectures";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, readJson } from "@/lib/request";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = await rateLimit(`lecture-cancel:${getClientIp(req)}`, 60, 10 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ error: "יותר מדי ניסיונות." }, { status: 429 });

  const parsed = cancelSchema.safeParse(await readJson(req, 2_000));
  if (!parsed.success) return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });

  const { count } = await prisma.lectureSlot.deleteMany({
    where: { date: dateKeyToDate(parsed.data.date), cancelToken: parsed.data.token, blocked: false },
  });
  if (count === 0) {
    return NextResponse.json({ error: "לא הצלחנו לבטל. פנו להנהלת המועדון." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
