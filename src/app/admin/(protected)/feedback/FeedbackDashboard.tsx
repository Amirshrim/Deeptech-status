"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { eventInputSchema } from "@/lib/feedback-schema";
import {
  commentsOf,
  computeFeedbackStats,
  type Comment,
  type EventDTO,
  type FeedbackDTO,
} from "@/lib/feedback-stats";
import { formatDate, isoDay } from "@/lib/format";
import { fieldErrors } from "@/lib/member-schema";

function Comments({ title, tag, items }: { title?: string; tag?: "keep" | "fix"; items: Comment[] }) {
  return (
    <div className="flex flex-col gap-2">
      {tag && <span className={tag === "keep" ? "dt-tag-keep self-start" : "dt-tag-fix self-start"}>{title}</span>}
      {items.length === 0 ? (
        <p className="m-0 text-sm text-ink-soft">אין עדיין תגובות.</p>
      ) : (
        items.map((c) => (
          <div key={c.id + (tag ?? "n")} className="dt-comment">
            <span>{c.text}</span>
            <span className="dt-comment-who">
              {c.who}
              {c.rating ? ` · ★${c.rating}` : ""}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

function Tile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="dt-tile" style={accent ? { borderBlockStartColor: "var(--navy)" } : undefined}>
      <span className="dt-tile-label">{label}</span>
      <span className="dt-tile-value">{value}</span>
      {sub && <span className="text-sm text-ink-soft">{sub}</span>}
    </div>
  );
}

export function FeedbackDashboard({
  events,
  selectedId,
  items,
}: {
  events: EventDTO[];
  selectedId: string | null;
  items: FeedbackDTO[];
}) {
  const router = useRouter();
  const selected = events.find((e) => e.id === selectedId) ?? null;
  const stats = computeFeedbackStats(items);
  const [creating, setCreating] = useState(events.length === 0);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<EventDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

  async function activate(id: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setMessage("המפגש מוצג עכשיו בטופס המשוב");
      router.refresh();
    } else setMessage("הפעולה נכשלה. נסו שוב.");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl text-ink">משוב על מפגשים</h1>
          <p className="m-0 text-sm text-ink-soft">
            {events.find((e) => e.isActive) ? (
              <>
                פתוח למשוב עכשיו: <strong>{events.find((e) => e.isActive)!.title}</strong>
              </>
            ) : (
              "אין מפגש פתוח למשוב. צרו מפגש חדש כדי לפתוח את הטופס."
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected && (
            <a className="dt-btn dt-btn-secondary dt-btn-sm" href={`/api/admin/feedback/export?event=${selected.id}`} download>
              <Icon name="download" />
              ייצוא משוב ל-CSV
            </a>
          )}
          <button type="button" className="dt-btn dt-btn-primary dt-btn-sm" onClick={() => setCreating((v) => !v)}>
            <Icon name="add" />
            מפגש חדש
          </button>
        </div>
      </div>

      {creating && (
        <EventForm
          onDone={() => {
            setCreating(false);
            setMessage("המפגש נוצר ונפתח למשוב");
            router.push("/admin/feedback");
            router.refresh();
          }}
          onCancel={events.length ? () => setCreating(false) : undefined}
        />
      )}

      {events.length > 0 && (
        <div role="group" aria-label="בחירת מפגש" className="flex flex-wrap gap-2">
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/admin/feedback?event=${e.id}`}
              className="dt-filter no-underline"
              aria-current={e.id === selectedId ? "page" : undefined}
              style={e.id === selectedId ? { background: "var(--navy)", borderColor: "var(--navy)", color: "#fff" } : undefined}
            >
              {e.isActive && <Icon name="radio_button_checked" />}
              {e.title} · <span className="dt-num">{formatDate(e.date)}</span>
              <span className="dt-num opacity-80">({e.feedbackCount})</span>
            </Link>
          ))}
        </div>
      )}

      {selected && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span>
              {selected.speaker ? `${selected.speaker} · ` : ""}
              {formatDate(selected.date)}
            </span>
            {selected.isActive ? (
              <span className="dt-badge dt-badge-good">פתוח למשוב</span>
            ) : (
              <button type="button" className="dt-btn dt-btn-ghost dt-btn-sm" disabled={busy} onClick={() => activate(selected.id)}>
                <Icon name="radio_button_checked" />
                לפתוח את המפגש הזה למשוב
              </button>
            )}
            <button type="button" className="dt-btn dt-btn-ghost dt-btn-sm" onClick={() => setEditing((v) => !v)}>
              <Icon name="edit" />
              עריכת פרטי המפגש
            </button>
            <button type="button" className="dt-btn dt-btn-ghost dt-btn-sm text-bad" onClick={() => setDeleting(selected)}>
              <Icon name="delete" />
              מחיקת המפגש
            </button>
          </div>

          {editing && (
            <EventForm
              key={selected.id}
              initial={{ id: selected.id, title: selected.title, speaker: selected.speaker ?? "", date: isoDay(selected.date) }}
              onDone={() => {
                setEditing(false);
                setMessage("פרטי המפגש עודכנו");
                router.refresh();
              }}
              onCancel={() => setEditing(false)}
            />
          )}

          <section aria-label="סיכום" className="dt-tiles" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <Tile accent label="דירוג המרצה" value={stats.lectureAvg?.toFixed(1) ?? "–"} sub="מתוך 5" />
            <Tile accent label="דירוג האוכל" value={stats.foodAvg?.toFixed(1) ?? "–"} sub={`מתוך 5 · ${stats.foodCount} דירגו`} />
            <Tile label="משיבים" value={String(stats.count)} />
            <Tile label="בעילום שם" value={String(stats.anonymous)} />
          </section>

          <div className="dt-two">
            <section className="dt-card flex flex-col gap-3" aria-labelledby="fb-lec">
              <h2 id="fb-lec" className="flex items-center gap-2 text-xl">
                <Icon name="mic" className="text-navy" />
                המרצה
              </h2>
              <Comments tag="keep" title="שימור" items={commentsOf(items, "lectureKeep")} />
              <Comments tag="fix" title="שיפור" items={commentsOf(items, "lectureImprove")} />
            </section>
            <section className="dt-card flex flex-col gap-3" aria-labelledby="fb-food">
              <h2 id="fb-food" className="flex items-center gap-2 text-xl">
                <Icon name="restaurant" className="text-navy" />
                האוכל
              </h2>
              <Comments tag="keep" title="שימור" items={commentsOf(items, "foodKeep")} />
              <Comments tag="fix" title="שיפור" items={commentsOf(items, "foodImprove")} />
            </section>
          </div>

          <section className="dt-card flex flex-col gap-3" aria-labelledby="fb-notes">
            <h2 id="fb-notes" className="text-xl">
              עוד הערות
            </h2>
            <Comments items={commentsOf(items, "notes")} />
          </section>
        </>
      )}

      {deleting && (
        <DeleteEventDialog
          event={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            setMessage("המפגש נמחק");
            router.push("/admin/feedback");
            router.refresh();
          }}
        />
      )}

      <div role="status" aria-live="polite">
        {message && (
          <div className="dt-toast">{message}</div>
        )}
      </div>
    </div>
  );
}

function EventForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: { id: string; title: string; speaker: string; date: string };
  onDone: () => void;
  onCancel?: () => void;
}) {
  const editing = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [speaker, setSpeaker] = useState(initial?.speaker ?? "");
  const [date, setDate] = useState(() => initial?.date ?? isoDay(new Date()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = editing ? { title, speaker, date } : { title, speaker, date, isActive: true };
    const parsed = eventInputSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setBusy(true);
    setErrors({});
    const res = await fetch(editing ? `/api/admin/events/${initial!.id}` : "/api/admin/events", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) onDone();
    else {
      const data = await res?.json().catch(() => ({}));
      setErrors(data?.errors ?? { form: "השמירה נכשלה. נסו שוב." });
    }
  }

  const err = (k: string) =>
    errors[k] ? (
      <p id={`ev-${k}-err`} className="dt-error m-0">
        <Icon name="error" />
        {errors[k]}
      </p>
    ) : null;

  return (
    <form className="dt-card flex flex-col gap-4" onSubmit={onSubmit} noValidate aria-labelledby="ev-new">
      <h2 id="ev-new" className="text-lg">
        {editing ? "עריכת פרטי המפגש" : "מפגש חדש"}
      </h2>
      {!editing && <p className="m-0 text-sm text-ink-soft">המפגש החדש ייפתח למשוב מיד, במקום המפגש הקודם.</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="dt-field sm:col-span-2">
          <label htmlFor="ev-title" className="dt-label">
            שם ההרצאה<span className="dt-req" aria-hidden="true">*</span>
          </label>
          <input
            id="ev-title"
            className="dt-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? "ev-title-err" : undefined}
          />
          {err("title")}
        </div>
        <div className="dt-field">
          <label htmlFor="ev-date" className="dt-label">
            תאריך<span className="dt-req" aria-hidden="true">*</span>
          </label>
          <input
            id="ev-date"
            className="dt-input dt-num"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={errors.date ? "ev-date-err" : undefined}
          />
          {err("date")}
        </div>
      </div>
      <div className="dt-field">
        <label htmlFor="ev-speaker" className="dt-label">
          שם המרצה<span className="dt-optional">(לא חובה)</span>
        </label>
        <input id="ev-speaker" className="dt-input" value={speaker} onChange={(e) => setSpeaker(e.target.value)} />
      </div>
      {errors.form && (
        <p role="alert" className="dt-error m-0">
          {errors.form}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <button type="button" className="dt-btn dt-btn-secondary" onClick={onCancel}>
            ביטול
          </button>
        )}
        <button type="submit" className="dt-btn dt-btn-primary" disabled={busy}>
          {busy ? "שומר…" : editing ? "שמירה" : "יצירה ופתיחה למשוב"}
        </button>
      </div>
    </form>
  );
}

function DeleteEventDialog({
  event,
  onClose,
  onDeleted,
}: {
  event: EventDTO;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    const handle = () => onClose();
    d.addEventListener("close", handle);
    return () => d.removeEventListener("close", handle);
  }, [onClose]);

  async function confirm() {
    setBusy(true);
    const res = await fetch(`/api/admin/events/${event.id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (res && (res.ok || res.status === 404)) onDeleted();
    else setError("המחיקה נכשלה. נסו שוב.");
  }

  return (
    <dialog ref={ref} className="dt-dialog" aria-labelledby="ev-del-title" aria-describedby="ev-del-desc">
      <div className="dt-dialog-body">
        <h2 id="ev-del-title" className="text-xl">
          מחיקת מפגש
        </h2>
        <p id="ev-del-desc" className="m-0">
          למחוק את <strong>{event.title}</strong> ואת כל <span className="dt-num">{event.feedbackCount}</span> המשובים
          שלו? הפעולה לא ניתנת לביטול.
        </p>
        {error && (
          <p role="alert" className="dt-error m-0">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="dt-btn dt-btn-secondary" onClick={() => ref.current?.close()} autoFocus>
            ביטול
          </button>
          <button type="button" className="dt-btn dt-btn-danger" onClick={confirm} disabled={busy}>
            <Icon name="delete" />
            {busy ? "מוחק…" : "מחיקה"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
