// Admin: feedback for one event as CSV (UTF-8 with BOM for Excel).
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listFeedback } from "@/lib/events";
import { buildFeedbackCsv } from "@/lib/feedback-stats";
import { isoDay } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const id = new URL(req.url).searchParams.get("event") ?? "";
  const event = await prisma.clubEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });

  const csv = buildFeedbackCsv(
    { title: event.title, speaker: event.speaker, date: event.date.toISOString() },
    await listFeedback(id),
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="deeptech-feedback-${isoDay(event.date)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
