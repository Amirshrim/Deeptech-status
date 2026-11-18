"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { formatDateTime } from "@/lib/format";
import { hebrewDay, shortDay, type AdminSlot } from "@/lib/lectures";

export function LectureAdmin({ slots }: { slots: AdminSlot[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function act(date: string, action: "release" | "block" | "unblock", done: string) {
    setBusy(date);
    const res = await fetch("/api/admin/lectures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, action }),
    }).catch(() => null);
    setBusy(null);
    setConfirm(null);
    const data = await res?.json().catch(() => ({}));
    setToast(res?.ok ? done : data?.error ?? "הפעולה נכשלה");
    router.refresh();
  }

  async function openFeedback(s: AdminSlot) {
    setBusy(s.date);
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: s.topic || `ההרצאה של ${s.name}`, speaker: s.name, date: s.date, isActive: true }),
    }).catch(() => null);
    setBusy(null);
    setToast(res?.ok ? `טופס המשוב פתוח עכשיו למפגש של ${shortDay(s.date)}` : "הפעולה נכשלה");
  }

  const taken = slots.filter((s) => s.status === "taken").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl text-ink">לוח מרצים</h1>
          <p className="m-0 text-sm text-ink-soft">
            <span className="dt-num">{taken}</span> מתוך <span className="dt-num">{slots.length}</span> ימי שלישי תפוסים.
            חברים נרשמים בעמוד{" "}
            <a href="/lectures" target="_blank" rel="noreferrer">
              /lectures
            </a>
            .
          </p>
        </div>
      </div>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {slots.map((s) => (
          <li key={s.date} className="dt-slot" data-status={s.status}>
            <div className="dt-slot-date" aria-hidden="true">
              <span className="dt-num dt-slot-day">{shortDay(s.date)}</span>
              <span className="dt-slot-dow">יום ג׳</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="dt-sr-only">{hebrewDay(s.date)}</h2>
                {s.status === "free" && <span className="dt-badge dt-badge-good self-start">פנוי</span>}
                {s.status === "blocked" && <span className="text-sm text-ink-soft">חסום: אין מפגש</span>}
                {s.status === "taken" && (
                  <>
                    <span className="font-display text-lg font-extrabold">{s.name}</span>
                    {s.topic && <span className="text-sm text-ink-soft">{s.topic}</span>}
                    <span className="text-sm">
                      {s.email && (
                        <a href={`mailto:${s.email}`}>
                          <bdi dir="ltr">{s.email}</bdi>
                        </a>
                      )}
                      {s.claimedAt && <span className="dt-num text-ink-soft"> · נרשם {formatDateTime(s.claimedAt)}</span>}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {s.status === "taken" && (
                  <>
                    <button type="button" className="dt-btn dt-btn-ghost dt-btn-sm" disabled={busy === s.date} onClick={() => openFeedback(s)}>
                      <Icon name="forum" />
                      פתיחת משוב למפגש הזה
                    </button>
                    {confirm === s.date ? (
                      <>
                        <button
                          type="button"
                          className="dt-btn dt-btn-danger dt-btn-sm"
                          disabled={busy === s.date}
                          onClick={() => act(s.date, "release", `${shortDay(s.date)} שוחרר והוא פנוי שוב`)}
                        >
                          כן, לשחרר
                        </button>
                        <button type="button" className="dt-btn dt-btn-secondary dt-btn-sm" onClick={() => setConfirm(null)}>
                          לא
                        </button>
                      </>
                    ) : (
                      <button type="button" className="dt-btn dt-btn-ghost dt-btn-sm text-bad" onClick={() => setConfirm(s.date)}>
                        <Icon name="event_busy" />
                        שחרור התאריך
                      </button>
                    )}
                  </>
                )}
                {s.status === "free" && (
                  <button
                    type="button"
                    className="dt-btn dt-btn-ghost dt-btn-sm"
                    disabled={busy === s.date}
                    onClick={() => act(s.date, "block", `${shortDay(s.date)} סומן כ"אין מפגש"`)}
                  >
                    <Icon name="block" />
                    אין מפגש בתאריך הזה
                  </button>
                )}
                {s.status === "blocked" && (
                  <button
                    type="button"
                    className="dt-btn dt-btn-ghost dt-btn-sm"
                    disabled={busy === s.date}
                    onClick={() => act(s.date, "unblock", `${shortDay(s.date)} פתוח להרשמה`)}
                  >
                    <Icon name="lock_open" />
                    לפתוח להרשמה
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div role="status" aria-live="polite">
        {toast && <div className="dt-toast">{toast}</div>}
      </div>
    </div>
  );
}
