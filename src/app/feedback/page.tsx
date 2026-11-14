import type { Metadata } from "next";
import { BackLink, BrandHero, Footer } from "@/components/Brand";
import { FeedbackForm } from "@/components/FeedbackForm";
import { Icon } from "@/components/Icon";
import { getActiveEvent } from "@/lib/events";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Deep-Tech Reichman — משוב על המפגש" };

export default async function FeedbackPage() {
  const event = await getActiveEvent();

  return (
    <main className="dt-entry dt-on-navy">
      <div className="dt-container flex flex-col pt-2 pb-2">
        <BackLink />
        <BrandHero size="sm" />
        <header className="mt-4 mb-6 flex flex-col items-center gap-2 text-center">
          <p className="dt-eyebrow m-0">מועדון הדיפ-טק של אוניברסיטת רייכמן</p>
          <h1 className="dt-h1">
            משוב <span className="dt-accent">שימור / שיפור</span>
          </h1>
          <p className="dt-lead m-0">חצי דקה שעוזרת לנו לבחור את המרצים הבאים ולשפר את האוכל.</p>
        </header>

        {event ? (
          <FeedbackForm event={event} />
        ) : (
          <section className="dt-card dt-card-brand flex flex-col items-center gap-3 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-paper text-ink-soft text-3xl">
              <Icon name="event_busy" />
            </span>
            <h2 className="text-xl text-ink">אין כרגע מפגש פתוח למשוב</h2>
            <p className="m-0 text-ink-soft">הטופס ייפתח במפגש הבא של המועדון.</p>
          </section>
        )}
      </div>
      <Footer />
    </main>
  );
}
