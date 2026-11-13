import type { Metadata } from "next";
import { AdminHeader } from "@/components/AdminHeader";
import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { allergyList, buildCateringText, computeStats } from "@/lib/summary";
import { SummaryView } from "./SummaryView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Deep-Tech Admin — סיכום להזמנת אוכל",
  robots: { index: false, follow: false },
};

export default async function SummaryPage() {
  const session = await requireAdminPage();
  const members = await prisma.member.findMany({
    select: {
      fullName: true,
      vegetarian: true,
      vegan: true,
      kosher: true,
      celiac: true,
      hasAllergy: true,
      allergyDetails: true,
      allergySevere: true,
    },
  });
  const now = new Date();

  return (
    <>
      <AdminHeader email={session.email} current="summary" />
      <main className="dt-page">
        <SummaryView
          stats={computeStats(members)}
          allergies={allergyList(members).map((m) => ({
            fullName: m.fullName,
            allergyDetails: m.allergyDetails ?? "",
            allergySevere: m.allergySevere,
          }))}
          text={buildCateringText(members, now)}
          generatedAt={now.toISOString()}
        />
      </main>
    </>
  );
}
