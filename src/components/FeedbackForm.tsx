"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { FEEDBACK_TEXT_MAX, RATING_LABELS, feedbackInputSchema } from "@/lib/feedback-schema";
import { formatDate } from "@/lib/format";
import { fieldErrors } from "@/lib/member-schema";
import { hasSentFeedback, markFeedbackSent } from "@/lib/saved-diet";
import { Icon } from "./Icon";

type Event = { id: string; title: string; speaker: string | null; date: string };

type State = {
  lectureRating: number;
  lectureKeep: string;
  lectureImprove: string;
  foodRating: number;
  foodKeep: string;
  foodImprove: string;
  notes: string;
  name: string;
  website: string; // honeypot
};

const EMPTY: State = {
  lectureRating: 0,
  lectureKeep: "",
  lectureImprove: "",
  foodRating: 0,
  foodKeep: "",
  foodImprove: "",
  notes: "",
  name: "",
  website: "",
};

/** 1–5 stars as a real radio group (arrow keys work, screen readers announce "x of 5"). */
function StarRating({
  name,
  value,
  onChange,
  labelledBy,
  invalid,
  describedBy,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
  labelledBy: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div
        className="dt-stars"
        role="radiogroup"
        aria-labelledby={labelledBy}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="dt-star" data-on={value >= n}>
            <input
              type="radio"
              className="dt-sr-only"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              aria-label={`${n} מתוך 5`}
            />
            <Icon name="star" fill={value >= n} />
          </label>
        ))}
      </div>
      <span className="font-display font-bold text-ink-soft" aria-hidden="true">
        {RATING_LABELS[value] ?? ""}
      </span>
    </div>
  );
}

function TextField({
  id,
  tag,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  tag?: "keep" | "fix";
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="dt-field">
      <label htmlFor={id} className="dt-label">
        {tag === "keep" && <span className="dt-tag-keep">שימור</span>}
        {tag === "fix" && <span className="dt-tag-fix">שיפור</span>}
        {label}
      </label>
      <textarea
        id={id}
        className="dt-textarea"
        maxLength={FEEDBACK_TEXT_MAX}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function FeedbackForm({ event }: { event: Event }) {
  const uid = useId();
  const [form, setForm] = useState<State>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  // Already sent feedback for this event from this device?
  const [alreadySent, setAlreadySent] = useState(false);

  useEffect(() => {
    if (hasSentFeedback(event.id)) setAlreadySent(true);
  }, [event.id]);
  const doneHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (done) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      doneHeading.current?.focus();
    }
  }, [done]);

  const set = <K extends keyof State>(k: K, v: State[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: "" }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = { ...form, eventId: event.id };
    const parsed = feedbackInputSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      if (errs.lectureRating) document.querySelector<HTMLInputElement>(`input[name="${uid}-lecture"]`)?.focus();
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        markFeedbackSent(event.id);
        setDone(true);
      }
      else if (res.status === 400 && data.errors) setErrors(data.errors);
      else setErrors({ form: data.error ?? "משהו השתבש. נסו שוב בעוד רגע." });
    } catch {
      setErrors({ form: "אין חיבור לשרת. בדקו את החיבור ונסו שוב." });
    } finally {
      setBusy(false);
    }
  }

  if (alreadySent && !done) {
    return (
      <section className="dt-card dt-card-brand flex flex-col items-center gap-3 text-center" aria-labelledby="fb-already">
        <span className="grid size-14 place-items-center rounded-full bg-good-bg text-good text-3xl">
          <Icon name="check_circle" fill />
        </span>
        <h2 id="fb-already" className="text-2xl text-ink">
          כבר שלחת משוב ✓
        </h2>
        <p className="m-0 text-ink-soft">
          על <strong>{event.title}</strong>. תודה! אם נזכרת במשהו נוסף, אפשר לשלוח עוד משוב.
        </p>
        <button
          type="button"
          className="dt-btn dt-btn-secondary dt-btn-block mt-2"
          onClick={() => {
            setForm(EMPTY);
            setAlreadySent(false);
          }}
        >
          <Icon name="add_comment" />
          לשלוח משוב נוסף
        </button>
        <Link href="/">חזרה לתפריט</Link>
      </section>
    );
  }

  if (done) {
    return (
      <section className="dt-card dt-card-brand flex flex-col items-center gap-3 text-center" aria-labelledby="fb-done">
        <span className="grid size-14 place-items-center rounded-full bg-good-bg text-good text-3xl">
          <Icon name="check_circle" fill />
        </span>
        <h2 id="fb-done" ref={doneHeading} tabIndex={-1} className="text-2xl text-ink outline-none">
          תודה! המשוב נשלח
        </h2>
        <p className="m-0 text-ink-soft">זה עוזר לנו לבחור את המרצים הבאים ולשפר את האוכל. נתראה במפגש הבא.</p>
        <Link href="/diet" className="dt-btn dt-btn-primary dt-btn-block mt-2">
          עוד לא מילאתם פרטי תזונה?
        </Link>
        <Link href="/">חזרה לתפריט</Link>
      </section>
    );
  }

  return (
    <form className="dt-card dt-card-brand flex flex-col gap-5" onSubmit={onSubmit} noValidate aria-label="משוב על המפגש">
      <div className="flex flex-col gap-1">
        <p className="m-0 font-display text-sm font-bold text-navy">המשוב על המפגש</p>
        <h2 className="m-0 text-2xl text-ink">{event.title}</h2>
        <p className="m-0 text-sm text-ink-soft">
          {event.speaker ? `${event.speaker} · ` : ""}
          <span className="dt-num">{formatDate(event.date)}</span>
        </p>
      </div>

      <fieldset className="dt-q">
        <legend id={`${uid}-lec`} className="dt-q-title float-start w-full">
          <Icon name="mic" className="text-navy" />
          איך היה המרצה?<span className="dt-req" aria-hidden="true">*</span>
        </legend>
        <StarRating
          name={`${uid}-lecture`}
          value={form.lectureRating}
          onChange={(v) => set("lectureRating", v)}
          labelledBy={`${uid}-lec`}
          invalid={!!errors.lectureRating}
          describedBy={errors.lectureRating ? `${uid}-lec-err` : undefined}
        />
        {errors.lectureRating && (
          <p id={`${uid}-lec-err`} className="dt-error m-0">
            <Icon name="error" />
            {errors.lectureRating}
          </p>
        )}
        <TextField
          id={`${uid}-lk`}
          tag="keep"
          label="מה היה טוב?"
          placeholder="מה כדאי לשמור להרצאות הבאות"
          value={form.lectureKeep}
          onChange={(v) => set("lectureKeep", v)}
        />
        <TextField
          id={`${uid}-li`}
          tag="fix"
          label="מה אפשר לשפר?"
          placeholder="מה היה חסר, מה היה ארוך מדי…"
          value={form.lectureImprove}
          onChange={(v) => set("lectureImprove", v)}
        />
      </fieldset>

      <fieldset className="dt-q">
        <legend id={`${uid}-food`} className="dt-q-title float-start w-full">
          <Icon name="restaurant" className="text-navy" />
          איך היה האוכל?
          <span className="dt-optional">(אם אכלתם)</span>
        </legend>
        <StarRating
          name={`${uid}-food`}
          value={form.foodRating}
          onChange={(v) => set("foodRating", v)}
          labelledBy={`${uid}-food`}
        />
        <TextField
          id={`${uid}-fk`}
          tag="keep"
          label="מה היה טוב?"
          placeholder="מנה שאהבתם, כמות, הגשה…"
          value={form.foodKeep}
          onChange={(v) => set("foodKeep", v)}
        />
        <TextField
          id={`${uid}-fi`}
          tag="fix"
          label="מה אפשר לשפר?"
          placeholder="מה היה חסר, מה לא התאים…"
          value={form.foodImprove}
          onChange={(v) => set("foodImprove", v)}
        />
      </fieldset>

      <TextField
        id={`${uid}-notes`}
        label="עוד הערות?"
        placeholder="רעיון למרצה הבא, משהו על המקום, כל דבר"
        value={form.notes}
        onChange={(v) => set("notes", v)}
      />

      <div className="dt-field">
        <label htmlFor={`${uid}-name`} className="dt-label">
          שם<span className="dt-optional">(לא חובה. השאירו ריק למשוב בעילום שם)</span>
        </label>
        <input
          id={`${uid}-name`}
          className="dt-input"
          type="text"
          autoComplete="name"
          maxLength={100}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      {/* Honeypot */}
      <div className="dt-sr-only" aria-hidden="true">
        <label htmlFor={`${uid}-website`}>Website</label>
        <input
          id={`${uid}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
      </div>

      {errors.form && (
        <div role="alert" className="dt-error rounded-md bg-bad-bg p-3">
          <Icon name="error" />
          {errors.form}
        </div>
      )}

      <button type="submit" className="dt-btn dt-btn-primary dt-btn-block" disabled={busy}>
        {busy ? "שולח…" : "שליחת המשוב"}
      </button>
    </form>
  );
}
