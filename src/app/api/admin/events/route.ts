// Admin: create a club event (lecture/meetup). New events become the active one by default.
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { eventInputSchema } from "@/lib/feedback-schema";
import { fieldErrors } from "@/lib/member-schema";
import { isSameOrigin, readJson } from "@/lib/request";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = eventInputSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  const event = await prisma.$transaction(async (tx) => {
    if (parsed.data.isActive) {
      await tx.clubEvent.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }
    return tx.clubEvent.create({ data: parsed.data });
  });
  return NextResponse.json({ id: event.id });
}
