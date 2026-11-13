// Deterministic date formatting in Israel time (same output on server and client,
// so it never causes a hydration mismatch).

const TZ = "Asia/Jerusalem";

function parts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const p: Record<string, string> = {};
  for (const { type, value } of fmt.formatToParts(date)) p[type] = value;
  // Some ICU versions render midnight as "24".
  if (p.hour === "24") p.hour = "00";
  return p;
}

/** 13.11.2026 */
export function formatDate(input: string | Date): string {
  const p = parts(new Date(input));
  return `${p.day}.${p.month}.${p.year}`;
}

/** 13.11.2026 22:05 */
export function formatDateTime(input: string | Date): string {
  const p = parts(new Date(input));
  return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}`;
}

/** 2026-11-13 (for file names) */
export function isoDay(input: string | Date): string {
  const p = parts(new Date(input));
  return `${p.year}-${p.month}-${p.day}`;
}
