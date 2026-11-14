// Admin: make an event the active one (PATCH) or delete it with its feedback (DELETE).
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { eventPatchSchema } from "@/lib/feedback-schema";
import { isSameOrigin, readJson } from "@/lib/request";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const notFound = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025";

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!eventPatchSchema.safeParse(await readJson(req)).success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { id } = await params;
  try {
    await prisma.$transaction([
      prisma.clubEvent.updateMany({ where: { isActive: true, NOT: { id } }, data: { isActive: false } }),
      prisma.clubEvent.update({ where: { id }, data: { isActive: true } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (notFound(err)) return NextResponse.json({ error: "not found" }, { status: 404 });
    throw err;
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.clubEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (notFound(err)) return NextResponse.json({ error: "not found" }, { status: 404 });
    throw err;
  }
}
