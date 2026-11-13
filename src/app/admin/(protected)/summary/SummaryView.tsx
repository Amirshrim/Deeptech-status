"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { SevereBadge } from "@/components/MemberBits";
import { formatDateTime } from "@/lib/format";
import type { Stats } from "@/lib/summary";

type AllergyRow = { fullName: string; allergyDetails: string; allergySevere: boolean };

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function SummaryView({
  stats,
  allergies,
  text,
  generatedAt,
}: {
  stats: Stats;
  allergies: AllergyRow[];
  text: string;
  generatedAt: string;
}) {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  async function onCopy() {
    setCopied((await copyText(text)) ? "ok" : "fail");
    setTimeout(() => setCopied("idle"), 2500);
  }

  const rows: { label: string; value: number; sub?: boolean; severe?: boolean }[] = [
    { label: "סה״כ נרשמו", value: stats.total },
    { label: "צמחוני (כולל טבעוני)", value: stats.vegetarian },
    { label: "מתוכם טבעוני", value: stats.vegan, sub: true },
    { label: "כשר", value: stats.kosher },
    { label: "ללא גלוטן (צליאק)", value: stats.celiac },
    { label: "עם אלרגיות", value: stats.allergy },
    { label: "מתוכם מסכני חיים", value: stats.allergySevere, sub: true, severe: stats.allergySevere > 0 },
    { label: "ללא הגבלות", value: stats.noRestrictions },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl text-ink">סיכום להזמנת אוכל</h1>
          <p className="dt-num m-0 text-sm text-ink-soft">נכון ל-{formatDateTime(generatedAt)}</p>
        </div>
        <div className="dt-no-print flex flex-wrap gap-2">
          <button type="button" className="dt-btn dt-btn-primary" onClick={onCopy}>
            <Icon name={copied === "ok" ? "check" : "content_copy"} />
            {copied === "ok" ? "הועתק!" : "העתקה כטקסט"}
          </button>
          <button type="button" className="dt-btn dt-btn-secondary" onClick={() => window.print()}>
            <Icon name="print" />
            הדפסה
          </button>
        </div>
      </div>
      <p className="m-0 text-sm text-ink-soft dt-no-print" role="status" aria-live="polite">
        {copied === "ok" && "הסיכום הועתק. אפשר להדביק בוואטסאפ או במייל לספק."}
        {copied === "fail" && "ההעתקה נכשלה. אפשר לסמן את הטקסט למטה ולהעתיק ידנית."}
      </p>

      <section className="dt-card" aria-labelledby="counts-title">
        <h2 id="counts-title" className="mb-3 text-lg">
          כמויות לפי קטגוריה
        </h2>
        <table className="w-full border-collapse text-base">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-paper-dim last:border-0">
                <th
                  scope="row"
                  className={`py-2 text-start font-display font-bold ${r.sub ? "ps-6 text-ink-soft" : ""} ${
                    r.severe ? "dt-severe-text" : ""
                  }`}
                >
                  {r.label}
                </th>
                <td className={`dt-num py-2 text-end text-xl ${r.severe ? "dt-severe-text" : ""}`}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="dt-card" aria-labelledby="allergy-title">
        <h2 id="allergy-title" className="mb-3 flex items-center gap-2 text-lg">
          <Icon name="warning" className="text-magenta" />
          פירוט אלרגיות
        </h2>
        {allergies.length === 0 ? (
          <p className="m-0 text-ink-soft">אין אלרגיות רשומות.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {allergies.map((a, i) => (
              <li
                key={`${a.fullName}-${i}`}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md p-3 ${
                  a.allergySevere ? "bg-bad-bg" : "bg-paper"
                }`}
              >
                <strong className="font-display">{a.fullName}</strong>
                <span className={a.allergySevere ? "dt-severe-text" : ""}>{a.allergyDetails}</span>
                {a.allergySevere && <SevereBadge />}
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="dt-card dt-no-print">
        <summary className="cursor-pointer font-display font-bold">הטקסט שיועתק (לוואטסאפ / מייל)</summary>
        <pre className="mt-3 whitespace-pre-wrap rounded-md bg-paper p-3 font-sans text-sm" dir="rtl">
          {text}
        </pre>
      </details>
    </div>
  );
}
