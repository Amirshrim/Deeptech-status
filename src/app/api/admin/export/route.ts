import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { buildMembersCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { isoDay } from "@/lib/format";
import { toDTO } from "@/lib/member-dto";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const members = await prisma.member.findMany({ orderBy: { fullName: "asc" } });
  const csv = buildMembersCsv(members.map(toDTO));
  const filename = `deeptech-diet-${isoDay(new Date())}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
