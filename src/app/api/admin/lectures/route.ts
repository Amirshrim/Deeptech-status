// Admin: release a claimed date, or block/unblock a date (no meetup that day).
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adminSlotSchema, dateKeyToDate } from "@/lib/lectures";
import { isSameOrigin, readJson } from "@/lib/request";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = adminSlotSchema.safeParse(await readJson(req, 1_000));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const date = dateKeyToDate(parsed.data.date);

  switch (parsed.data.action) {
    case "release":
      await prisma.lectureSlot.deleteMany({ where: { date, blocked: false } });
      break;
    case "unblock":
      await prisma.lectureSlot.deleteMany({ where: { date, blocked: true } });
      break;
    case "block": {
      const existing = await prisma.lectureSlot.findUnique({ where: { date } });
      if (existing && !existing.blocked) {
        return NextResponse.json({ error: "התאריך תפוס. קודם שחררו אותו." }, { status: 409 });
      }
      if (!existing) {
        try {
          await prisma.lectureSlot.create({ data: { date, blocked: true } });
        } catch {
          return NextResponse.json({ error: "התאריך נתפס הרגע. רעננו את הדף." }, { status: 409 });
        }
      }
      break;
    }
  }
  return NextResponse.json({ ok: true });
}
