import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toDTO } from "@/lib/member-dto";
import { adminMemberSchema, fieldErrors } from "@/lib/member-schema";
import { isSameOrigin, readJson } from "@/lib/request";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function prismaCode(err: unknown): string | undefined {
  return err instanceof Prisma.PrismaClientKnownRequestError ? err.code : undefined;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = adminMemberSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  try {
    const member = await prisma.member.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ member: toDTO(member) });
  } catch (err) {
    const code = prismaCode(err);
    if (code === "P2002") {
      return NextResponse.json({ errors: { email: "המייל הזה כבר קיים אצל חבר/ה אחר/ת" } }, { status: 409 });
    }
    if (code === "P2025") return NextResponse.json({ error: "not found" }, { status: 404 });
    throw err;
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.member.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (prismaCode(err) === "P2025") return NextResponse.json({ error: "not found" }, { status: 404 });
    throw err;
  }
}
