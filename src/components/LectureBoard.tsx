"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { claimSchema, hebrewDay, shortDay, type PublicSlot } from "@/lib/lectures";
import { fieldErrors } from "@/lib/member-schema";
import { readLectureTokens, readSavedDiet, saveLectureToken } from "@/lib/saved-diet";
import { Icon } from "./Icon";

const REFRESH_MS = 30_000;

export function LectureBoard({ slots: initial }: { slots: PublicSlot[] }) {
  const router = useRouter();
  const [slots, setSlots] = useState(initial);
  const [mine, setMine] = useState<Record<string, string>>({});
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Fresh server data (after refresh) replaces local state.
  useEffect(() => setSlots(initial), [initial]);
  useEffect(() => setMine(readLectureTokens()), []);

  // Keep the board live for everyone: refetch every 30s while visible.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const free = slots.filter((s) => s.status === "free").length;

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-center text-sm text-white/85" aria-live="polite">
        <span className="dt-num">{free}</span> תאריכים פנויים מתוך <span className="dt-num">{slots.length}</span> · הלוח
        מתעדכן לכולם
      </p>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {slots.map((s) => (
          <SlotCard
            key={s.date}
            slot={s}
            token={mine[s.date] ?? null}
            open={openDate === s.date}
            onOpen={() => setOpenDate(s.date)}
            onClose={() => setOpenDate(null)}
            onClaimed={(name, topic, token) => {
              saveLectureToken(s.date, token);
              setMine(readLectureTokens());
              setSlots((list) => list.map((x) => (x.date === s.date ? { ...x, status: "taken", name, topic } : x)));
              setOpenDate(null);
              setToast(`התאריך ${shortDay(s.date)} שלך! ✓`);
              router.refresh();
            }}
            onTaken={(msg) => {
              setOpenDate(null);
              setToast(msg);
              router.refresh();
            }}
            onCancelled={() => {
              saveLectureToken(s.date, null);
              setMine(readLectureTokens());
              setSlots((list) => list.map((x) => (x.date === s.date ? { ...x, status: "free", name: null, topic: null } : x)));
              setToast("ההרשמה בוטלה והתאריך פנוי שוב");
              router.refresh();
            }}
          />
        ))}
      </ul>
      <div role="status" aria-live="polite">
        {toast && <div className="dt-toast">{toast}</div>}
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  token,
  open,
  onOpen,
  onClose,
  onClaimed,
  onTaken,
  onCancelled,
}: {
  slot: PublicSlot;
  token: string | null;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onClaimed: (name: string, topic: string | null, token: string) => void;
  onTaken: (msg: string) => void;
  onCancelled: () => void;
}) {
  const isMine = slot.status === "taken" && token !== null;
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/lectures/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: slot.date, token }),
    }).catch(() => null);
    setBusy(false);
    setConfirming(false);
    if (res?.ok) onCancelled();
    else setError("לא הצלחנו לבטל. פנו להנהלת המועדון.");
  }

  return (
    <li className="dt-slot" data-status={slot.status} data-mine={isMine}>
      <div className="dt-slot-date" aria-hidden="true">
        <span className="dt-num dt-slot-day">{shortDay(slot.date)}</span>
        <span className="dt-slot-dow">יום ג׳</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h2 className="dt-sr-only">יום שלישי, {hebrewDay(slot.date)}</h2>

        {slot.status === "free" && !open && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="dt-badge dt-badge-good">פנוי</span>
            <button type="button" className="dt-btn dt-btn-primary dt-btn-sm" onClick={onOpen}>
              <Icon name="co_present" />
              אני רוצה להרצות
            </button>
          </div>
        )}

        {slot.status === "free" && open && (
          <ClaimForm date={slot.date} onCancel={onClose} onClaimed={onClaimed} onTaken={onTaken} />
        )}

        {slot.status === "taken" && (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-lg font-extrabold text-ink">{slot.name}</span>
              {isMine ? (
                <span className="dt-badge dt-badge-blue">ההרצאה שלך ✓</span>
              ) : (
                <span className="dt-badge dt-badge-muted">תפוס</span>
              )}
            </div>
            {slot.topic && <p className="m-0 text-sm text-ink-soft">{slot.topic}</p>}
            {isMine && !confirming && (
              <button type="button" className="dt-btn dt-btn-ghost dt-btn-sm self-start text-bad" onClick={() => setConfirming(true)}>
                ביטול ההרשמה
              </button>
            )}
            {isMine && confirming && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink">לבטל ולשחרר את התאריך?</span>
                <button type="button" className="dt-btn dt-btn-danger dt-btn-sm" disabled={busy} onClick={cancel}>
                  {busy ? "מבטל…" : "כן, לבטל"}
                </button>
                <button type="button" className="dt-btn dt-btn-secondary dt-btn-sm" onClick={() => setConfirming(false)}>
                  לא
                </button>
              </div>
            )}
            {error && (
              <p role="alert" className="dt-error m-0">
                {error}
              </p>
            )}
          </div>
        )}

        {slot.status === "blocked" && <p className="m-0 text-sm text-ink-soft">אין מפגש בתאריך הזה</p>}
      </div>
    </li>
  );
}

function ClaimForm({
  date,
  onCancel,
  onClaimed,
  onTaken,
}: {
  date: string;
  onCancel: () => void;
  onClaimed: (name: string, topic: string | null, token: string) => void;
  onTaken: (msg: string) => void;
}) {
  const uid = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // Prefill from the diet form, if this device filled it.
  useEffect(() => {
    const saved = readSavedDiet();
    if (saved) {
      setName(saved.fullName);
      setEmail(saved.email);
    }
    document.getElementById(`${uid}-name`)?.focus();
  }, [uid]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = { date, name, email, topic, website };
    const parsed = claimSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      document.getElementById(`${uid}-${errs.name ? "name" : "email"}`)?.focus();
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch("/api/lectures/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) onClaimed(parsed.data.name, parsed.data.topic, data.token);
      else if (res.status === 409 && /תפס/.test(data.error ?? "")) onTaken(data.error);
      else if (data.errors) setErrors(data.errors);
      else setErrors({ form: data.error ?? "משהו השתבש. נסו שוב." });
    } catch {
      setErrors({ form: "אין חיבור לשרת. נסו שוב." });
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) =>
    errors[k] ? (
      <p id={`${uid}-${k}-err`} className="dt-error m-0">
        <Icon name="error" />
        {errors[k]}
      </p>
    ) : null;

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate aria-label={`הרשמה להרצאה ב-${hebrewDay(date)}`}>
      <div className="dt-field">
        <label htmlFor={`${uid}-name`} className="dt-label">
          שם מלא<span className="dt-req" aria-hidden="true">*</span>
        </label>
        <input
          id={`${uid}-name`}
          className="dt-input"
          autoComplete="name"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${uid}-name-err` : undefined}
        />
        {err("name")}
      </div>
      <div className="dt-field">
        <label htmlFor={`${uid}-email`} className="dt-label">
          מייל<span className="dt-req" aria-hidden="true">*</span>
        </label>
        <input
          id={`${uid}-email`}
          className="dt-input"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          maxLength={200}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={`${uid}-email-hint${errors.email ? ` ${uid}-email-err` : ""}`}
        />
        <p id={`${uid}-email-hint`} className="dt-hint m-0">
          לא יוצג לאחרים. רק הנהלת המועדון תראה אותו, כדי לתאם איתך.
        </p>
        {err("email")}
      </div>
      <div className="dt-field">
        <label htmlFor={`${uid}-topic`} className="dt-label">
          נושא ההרצאה<span className="dt-optional">(לא חובה, אפשר גם אחר כך)</span>
        </label>
        <input
          id={`${uid}-topic`}
          className="dt-input"
          maxLength={150}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        {err("topic")}
      </div>
      <div className="dt-sr-only" aria-hidden="true">
        <label htmlFor={`${uid}-website`}>Website</label>
        <input id={`${uid}-website`} tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <p className="dt-hint m-0">השם והנושא יוצגו לכל מי שנכנס לאתר.</p>
      {errors.form && (
        <p role="alert" className="dt-error m-0">
          <Icon name="error" />
          {errors.form}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="dt-btn dt-btn-primary dt-btn-sm" disabled={busy}>
          {busy ? "שומר…" : `שריון ${shortDay(date)}`}
        </button>
        <button type="button" className="dt-btn dt-btn-secondary dt-btn-sm" onClick={onCancel}>
          ביטול
        </button>
      </div>
    </form>
  );
}
