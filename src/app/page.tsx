import { Brand, Footer } from "@/components/Brand";
import { MemberForm } from "@/components/MemberForm";

// Read CLUB_CONTACT_EMAIL at request time (not baked in at build).
export const dynamic = "force-dynamic";

export default function HomePage() {
  const contactEmail = process.env.CLUB_CONTACT_EMAIL || "";

  return (
    <main className="dt-entry dt-on-navy">
      <div className="dt-container pt-6 pb-2">
        <Brand />
        <header className="mt-8 mb-5 flex flex-col gap-2">
          <h1 className="dt-h1">העדפות תזונה</h1>
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
