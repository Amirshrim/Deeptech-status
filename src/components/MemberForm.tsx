"use client";

import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { DIET_OPTIONS, type DietKey } from "@/lib/diet";
import type { SavedSummary } from "@/lib/member-dto";
import { ALLERGY_MAX, NOTES_MAX, fieldErrors, memberInputSchema } from "@/lib/member-schema";
import { Icon } from "./Icon";
import { AllergyInfo, DietBadges } from "./MemberBits";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  vegetarian: boolean;
  vegan: boolean;
  kosher: boolean;
  celiac: boolean;
  hasAllergy: boolean;
  allergyDetails: string;
  allergySevere: boolean;
  notes: string;
  consent: boolean;
  website: string; // honeypot — must stay empty
};

const EMPTY: FormState = {
  fullName: "",
  email: "",
  phone: "",
  vegetarian: false,
  vegan: false,
  kosher: false,
  celiac: false,
  hasAllergy: false,
  allergyDetails: "",
  allergySevere: false,
  notes: "",
  consent: false,
  website: "",
};

type Errors = Partial<Record<keyof FormState | "form", string>>;
type Result = { status: "created" | "updated"; member: SavedSummary };

/** Field order used to move focus to the first invalid field. */
const FOCUS_ORDER = ["fullName", "email", "phone", "allergyDetails", "notes", "consent"] as const;

function describedBy(...ids: (string | false | undefined)[]) {
  const v = ids.filter(Boolean).join(" ");
  return v || undefined;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="dt-error m-0">
      <Icon name="error" />
      {message}
    </p>
  );
}

export function MemberForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      successHeading.current?.focus();
    }
  }, [result]);

  /** Re-checks only the fields currently showing an error, so typing clears them. */
  function apply(next: FormState) {
    setForm(next);
    const shown = Object.keys(errors).filter((k) => k !== "form");
    if (shown.length === 0) return;
    const r = memberInputSchema.safeParse(next);
    const fresh = r.success ? {} : fieldErrors(r.error);
    const kept: Errors = {};
    for (const k of shown) if (fresh[k]) kept[k as keyof FormState] = fresh[k];
    setErrors(kept);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    apply({ ...form, [key]: value });
  }

  function toggleDiet(key: DietKey, checked: boolean) {
    // Vegetarian is locked on while vegan is selected.
    if (key === "vegetarian" && !checked && form.vegan) return;
    const next = { ...form, [key]: checked };
    if (key === "vegan" && checked) next.vegetarian = true;
    apply(next);
  }

  function focusFirstError(errs: Errors) {
    const first = FOCUS_ORDER.find((k) => errs[k]);
    if (first) document.getElementById(`f-${first}`)?.focus();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = memberInputSchema.safeParse(form);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      focusFirstError(errs);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const { consent: _c, ...saved } = parsed.data;
        setResult({ status: data.status === "updated" ? "updated" : "created", member: data.member ?? saved });
      } else if (res.status === 400 && data.errors) {
        setErrors(data.errors);
        focusFirstError(data.errors);
      } else {
        setErrors({ form: data.error ?? "משהו השתבש. נסו שוב בעוד רגע." });
      }
    } catch {
      setErrors({ form: "אין חיבור לשרת. בדקו את החיבור ונסו שוב." });
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <SuccessView
        result={result}
        headingRef={successHeading}
        onEdit={() => {
          setResult(null);
          setForm((f) => ({ ...f, consent: false }));
        }}
      />
    );
  }

  return (
    <form className="dt-card flex flex-col gap-5" onSubmit={onSubmit} noValidate aria-label="טופס העדפות תזונה">
      <p className="dt-hint m-0">
        שדות המסומנים ב-<span className="dt-req">*</span> הם חובה.
      </p>

      {/* Full name */}
      <div className="dt-field">
        <label htmlFor="f-fullName" className="dt-label">
          שם מלא<span className="dt-req" aria-hidden="true">*</span>
        </label>
        <input
          id="f-fullName"
          className="dt-input"
          type="text"
          autoComplete="name"
          required
          maxLength={100}
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={describedBy(errors.fullName && "e-fullName")}
        />
        <FieldError id="e-fullName" message={errors.fullName} />
      </div>

      {/* Email */}
      <div className="dt-field">
        <label htmlFor="f-email" className="dt-label">
          מייל<span className="dt-req" aria-hidden="true">*</span>
        </label>
        <input
          id="f-email"
          className="dt-input"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={200}
          placeholder="name@post.runi.ac.il"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy("h-email", errors.email && "e-email")}
        />
        <p id="h-email" className="dt-hint m-0">
          עדיף המייל האוניברסיטאי. מילאתם כבר? שליחה עם אותו מייל תעדכן את הפרטים.
        </p>
        <FieldError id="e-email" message={errors.email} />
      </div>

      {/* Phone */}
      <div className="dt-field">
        <label htmlFor="f-phone" className="dt-label">
          טלפון<span className="dt-optional">(לא חובה)</span>
        </label>
        <input
          id="f-phone"
          className="dt-input dt-num"
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          maxLength={30}
          placeholder="050-0000000"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={describedBy(errors.phone && "e-phone")}
        />
        <FieldError id="e-phone" message={errors.phone} />
      </div>

      {/* Diet chips */}
      <fieldset className="m-0 min-w-0 border-0 p-0 flex flex-col gap-2">
        <legend className="dt-label mb-2 p-0">
          העדפות תזונה<span className="dt-optional">(אפשר לבחור כמה, או אף אחת)</span>
        </legend>
        <div className="dt-chip-grid">
          {DIET_OPTIONS.map((o) => {
            const checked = form[o.key];
            const locked = o.key === "vegetarian" && form.vegan;
            return (
              <label key={o.key} className="dt-chip" data-checked={checked} data-locked={locked}>
                <input
                  type="checkbox"
                  className="dt-sr-only"
                  name={o.key}
                  checked={checked}
                  disabled={locked}
                  onChange={(e) => toggleDiet(o.key, e.target.checked)}
                  aria-describedby={locked ? "vegan-hint" : undefined}
                />
                <span className="dt-chip-icon">
                  <Icon name={o.icon} />
                </span>
                <span className="dt-chip-text">
                  <span className="dt-chip-label">{o.label}</span>
                  {o.sub && <span className="dt-chip-sub">{o.sub}</span>}
                </span>
                <span className="dt-chip-check">{checked && <Icon name={locked ? "lock" : "check"} />}</span>
              </label>
            );
          })}
        </div>
        <div aria-live="polite">
          {form.vegan && (
            <p id="vegan-hint" className="dt-note m-0">
              <Icon name="info" />
              <span>טבעוני כולל גם צמחוני, אז סימנו בשבילך גם צמחוני.</span>
            </p>
          )}
        </div>
      </fieldset>

      {/* Allergies */}
      <div className="flex flex-col gap-3">
        <label className="dt-switch-row" htmlFor="f-hasAllergy">
          <span className="flex items-center gap-2">
            <Icon name="medical_information" className="text-navy" />
            <span className="dt-label">יש לי אלרגיה</span>
          </span>
          <input
            id="f-hasAllergy"
            type="checkbox"
            role="switch"
            className="dt-sr-only"
            checked={form.hasAllergy}
            onChange={(e) => set("hasAllergy", e.target.checked)}
            aria-controls="allergy-box"
          />
          <span className="dt-switch" data-on={form.hasAllergy} aria-hidden="true" />
        </label>

        {form.hasAllergy && (
          <div id="allergy-box" className="dt-allergy-box">
            <div className="dt-field">
              <label htmlFor="f-allergyDetails" className="dt-label">
                פירוט האלרגיות<span className="dt-req" aria-hidden="true">*</span>
              </label>
              <textarea
                id="f-allergyDetails"
                className="dt-textarea"
                required
                maxLength={ALLERGY_MAX}
                placeholder="פרט/י את האלרגיות, למשל: בוטנים, שומשום, חלב…"
                value={form.allergyDetails}
                onChange={(e) => set("allergyDetails", e.target.value)}
                aria-invalid={errors.allergyDetails ? true : undefined}
                aria-describedby={describedBy("c-allergyDetails", errors.allergyDetails && "e-allergyDetails")}
              />
              <div className="flex items-start justify-between gap-2">
                <FieldError id="e-allergyDetails" message={errors.allergyDetails} />
                <span id="c-allergyDetails" className="dt-hint dt-num ms-auto">
                  {form.allergyDetails.length}/{ALLERGY_MAX}
                </span>
              </div>
            </div>
            <label className="dt-checkrow">
              <input
                type="checkbox"
                checked={form.allergySevere}
                onChange={(e) => set("allergySevere", e.target.checked)}
              />
              <span>
                <strong>אלרגיה מסכנת חיים / נושא/ת אפיפן</strong>
                <span className="dt-hint block">נסמן את זה בבירור לצוות ולספק האוכל.</span>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="dt-field">
        <label htmlFor="f-notes" className="dt-label">
          הערות נוספות<span className="dt-optional">(לא חובה)</span>
        </label>
        <textarea
          id="f-notes"
          className="dt-textarea"
          maxLength={NOTES_MAX}
          placeholder="משהו נוסף שכדאי שנדע?"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby={describedBy(errors.notes && "e-notes")}
        />
        <FieldError id="e-notes" message={errors.notes} />
      </div>

      {/* Honeypot (hidden from people and assistive tech; bots tend to fill it) */}
      <div className="dt-sr-only" aria-hidden="true">
        <label htmlFor="f-website">Website</label>
        <input
          id="f-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
      </div>

      {/* Consent */}
      <div className="flex flex-col gap-1">
        <label className="dt-checkrow" htmlFor="f-consent">
          <input
            id="f-consent"
            type="checkbox"
            required
            checked={form.consent}
            onChange={(e) => set("consent", e.target.checked)}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={describedBy(errors.consent && "e-consent")}
          />
          <span>
            אני מאשר/ת שהמידע ישמש את הנהלת המועדון לצורך הזמנת אוכל לאירועים בלבד
            <span className="dt-req" aria-hidden="true">*</span>
          </span>
        </label>
        <FieldError id="e-consent" message={errors.consent} />
      </div>

      {errors.form && (
        <div role="alert" className="dt-error rounded-md bg-bad-bg p-3">
          <Icon name="error" />
          {errors.form}
        </div>
      )}

      <button type="submit" className="dt-btn dt-btn-primary dt-btn-block" disabled={submitting}>
        {submitting ? "שומר…" : "שליחה"}
      </button>
    </form>
  );
}

function SuccessView({
  result,
  headingRef,
  onEdit,
}: {
  result: Result;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onEdit: () => void;
}) {
  const m = result.member;
  const firstName = m.fullName.split(/\s+/)[0];
  const updated = result.status === "updated";

  return (
    <section className="dt-card flex flex-col gap-5" aria-labelledby="success-title">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-good-bg text-good text-3xl">
          <Icon name="check_circle" fill />
        </span>
        <h2 id="success-title" ref={headingRef} tabIndex={-1} className="text-2xl text-ink outline-none">
          {updated ? "הפרטים עודכנו" : "הפרטים נשמרו"}
        </h2>
        <p className="m-0 text-ink-soft">
          תודה, {firstName}! {updated ? "עדכנו את הפרטים הקיימים שלך." : "קיבלנו את הפרטים."} זה מה ששמרנו:
        </p>
      </div>

      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 rounded-md bg-paper p-4 text-sm">
        <dt className="font-display font-bold text-ink-soft">שם</dt>
        <dd className="m-0">{m.fullName}</dd>

        <dt className="font-display font-bold text-ink-soft">מייל</dt>
        <dd className="m-0 break-all">
          <bdi dir="ltr">{m.email}</bdi>
        </dd>

        <dt className="font-display font-bold text-ink-soft">טלפון</dt>
        <dd className="m-0 dt-num">{m.phone ? <bdi dir="ltr">{m.phone}</bdi> : "—"}</dd>

        <dt className="font-display font-bold text-ink-soft">תזונה</dt>
        <dd className="m-0">
          <DietBadges m={m} />
        </dd>

        <dt className="font-display font-bold text-ink-soft">אלרגיות</dt>
        <dd className="m-0">
          <AllergyInfo m={m} />
        </dd>

        {m.notes && (
          <>
            <dt className="font-display font-bold text-ink-soft">הערות</dt>
            <dd className="m-0 whitespace-pre-line">{m.notes}</dd>
          </>
        )}
      </dl>

      <p className="dt-hint m-0 text-center">משהו השתנה? אפשר למלא שוב עם אותו מייל, והפרטים יתעדכנו.</p>
      <button type="button" className="dt-btn dt-btn-secondary dt-btn-block" onClick={onEdit}>
        <Icon name="edit" />
        עריכת הפרטים
      </button>
    </section>
  );
}
