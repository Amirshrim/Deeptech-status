import type { Metadata } from "next";
import { BackLink, BrandHero, Footer } from "@/components/Brand";
import { LectureBoard } from "@/components/LectureBoard";
import { getPublicBoard } from "@/lib/lecture-board";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Deep-Tech Reichman — רוצים להרצות?" };

export default async function LecturesPage() {
  const slots = await getPublicBoard();

  return (
    <main className="dt-entry dt-on-navy">
      <div className="dt-container flex flex-col pt-2 pb-2">
        <BackLink />
        <BrandHero size="sm" />
        <header className="mt-4 mb-5 flex flex-col items-center gap-2 text-center">
          <p className="dt-eyebrow m-0">מועדון הדיפ-טק של אוניברסיטת רייכמן</p>
          <h1 className="dt-h1">
            רוצים <span className="dt-accent">להרצות?</span>
          </h1>
          <p className="dt-lead m-0">
            בחרו יום שלישי פנוי וכתבו את השם שלכם. התאריך נשמר לכם, וכולם רואים מי מרצה מתי.
          </p>
        </header>
        <LectureBoard slots={slots} />
      </div>
      <Footer />
    </main>
  );
}
