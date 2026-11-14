import Link from "next/link";
import { BrandHero, Footer } from "@/components/Brand";
import { DietSavedBadge } from "@/components/DietSavedBadge";
import { FeedbackSentBadge } from "@/components/FeedbackSentBadge";
import { Icon } from "@/components/Icon";
import { getActiveEvent } from "@/lib/events";

// Shows the current active event; read at request time.
export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const event = await getActiveEvent().catch(() => null);

  return (
    <main className="dt-entry dt-on-navy flex flex-col">
      <div className="dt-container flex flex-col pt-6 pb-2">
        <BrandHero />
        <header className="mt-4 mb-6 flex flex-col items-center gap-2 text-center">
          <p className="dt-eyebrow m-0">מועדון הדיפ-טק של אוניברסיטת רייכמן</p>
          <h1 className="dt-h1">
            מה <span className="dt-accent">תרצו</span> לעשות?
          </h1>
        </header>

        <nav aria-label="אפשרויות" className="flex flex-col gap-3">
          <Link href="/diet" className="dt-menu-card">
            <span className="dt-menu-icon">
              <Icon name="eco" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="dt-menu-title">תזונה ואלרגיות</span>
              <span className="dt-menu-sub">פעם אחת, כדי שיהיה לכם מה לאכול בכל אירוע</span>
              <DietSavedBadge />
            </span>
            <Icon name="chevron_left" className="dt-menu-go" />
          </Link>

          <Link href="/feedback" className="dt-menu-card">
            <span className="dt-menu-icon">
              <Icon name="forum" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="dt-menu-title">משוב על המפגש</span>
              <span className="dt-menu-sub">איך היה המרצה? איך היה האוכל? חצי דקה</span>
              {event && (
                <span className="dt-badge dt-badge-blue mt-1.5 self-start whitespace-normal">{event.title}</span>
              )}
              {event && <FeedbackSentBadge eventId={event.id} />}
            </span>
            <Icon name="chevron_left" className="dt-menu-go" />
          </Link>
        </nav>

        <p className="mt-6 mb-0 text-center text-sm text-white/80">המידע גלוי רק להנהלת המועדון.</p>
      </div>
      <Footer />
    </main>
  );
}
