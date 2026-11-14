import type { Metadata } from "next";
import { BackLink, BrandHero, Footer } from "@/components/Brand";
import { MemberForm } from "@/components/MemberForm";

// Read CLUB_CONTACT_EMAIL at request time (not baked in at build).
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Deep-Tech Reichman — תזונה ואלרגיות" };

export default function DietPage() {
  const contactEmail = process.env.CLUB_CONTACT_EMAIL || "";

  return (
    <main className="dt-entry dt-on-navy">
      <div className="dt-container flex flex-col pt-2 pb-2">
        <BackLink />
        <BrandHero size="sm" />
        <header className="mt-4 mb-6 flex flex-col items-center gap-2 text-center">
          <p className="dt-eyebrow m-0">מועדון הדיפ-טק של אוניברסיטת רייכמן</p>
          <h1 className="dt-h1">
            תזונה <span className="dt-accent">ואלרגיות</span>
          </h1>
          <p className="dt-lead m-0">
            ממלאים פעם אחת, ואנחנו דואגים שיהיה לכם מה לאכול באירועי המועדון. לוקח פחות מדקה.
          </p>
        </header>

        <MemberForm />

        <section aria-labelledby="privacy-title" className="mt-5 text-sm text-white/85 leading-relaxed">
          <h2 id="privacy-title" className="text-base text-white mb-1">
            פרטיות
          </h2>
          <p className="m-0">
            המידע נשמר באופן מאובטח וגלוי רק להנהלת המועדון, ומשמש אך ורק להזמנת אוכל לאירועים. לספק האוכל
            מועברות רק כמויות לפי קטגוריה ופירוט אלרגיות. אין בטופס כלי מעקב או אנליטיקה.
            {contactEmail ? (
              <>
                {" "}
                לעדכון או מחיקת הפרטים כתבו לנו:{" "}
                <a href={`mailto:${contactEmail}`}>
                  <bdi dir="ltr">{contactEmail}</bdi>
                </a>
                .
              </>
            ) : (
              <> לעדכון או מחיקת הפרטים פנו להנהלת המועדון.</>
            )}
          </p>
        </section>
      </div>
      <Footer />
    </main>
  );
}
