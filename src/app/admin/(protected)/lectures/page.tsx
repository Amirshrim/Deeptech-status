import type { Metadata } from "next";
import { AdminHeader } from "@/components/AdminHeader";
import { requireAdminPage } from "@/lib/auth";
import { getAdminBoard } from "@/lib/lecture-board";
import { LectureAdmin } from "./LectureAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Deep-Tech Admin — מרצים",
  robots: { index: false, follow: false },
};

export default async function AdminLecturesPage() {
  const session = await requireAdminPage();
  const slots = await getAdminBoard();
  return (
    <>
      <AdminHeader email={session.email} current="lectures" />
      <main className="dt-page">
        <LectureAdmin slots={slots} />
      </main>
    </>
  );
}
