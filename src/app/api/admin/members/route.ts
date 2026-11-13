import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toDTO } from "@/lib/member-dto";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const members = await prisma.member.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ members: members.map(toDTO) });
}
