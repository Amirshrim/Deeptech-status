import type { Metadata } from "next";
import { AdminHeader } from "@/components/AdminHeader";
import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toDTO } from "@/lib/member-dto";
import { Dashboard } from "./Dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Deep-Tech Admin — חברים",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await requireAdminPage();
  const members = await prisma.member.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <>
      <AdminHeader email={session.email} current="dashboard" />
      <main className="dt-page">
        <Dashboard initialMembers={members.map(toDTO)} />
      </main>
    </>
  );
}
