// Lecture sign-up board: which Tuesdays exist, and the claim schema. Pure — no DB.
import { z } from "zod";

/** First Tuesday on the board. */
export const BOARD_START = "2026-11-24";
/** How many upcoming Tuesdays to show. */
export const BOARD_WEEKS = 16;
/** One person (email) can hold at most this many upcoming dates. */
export const MAX_CLAIMS_PER_EMAIL = 2;

/** Today's date in Israel, as YYYY-MM-DD. */
export function todayInIsrael(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(now);
}

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Upcoming Tuesdays (YYYY-MM-DD), from BOARD_START or today (whichever is later). A day stays listed through its own date. */
export function upcomingTuesdays(now: Date = new Date(), weeks = BOARD_WEEKS): string[] {
  const today = todayInIsrael(now);
  let first = today > BOARD_START ? today : BOARD_START;
  const dow = new Date(`${first}T12:00:00Z`).getUTCDay(); // 2 = Tuesday
  first = addDays(first, (2 - dow + 7) % 7);
  return Array.from({ length: weeks }, (_, i) => addDays(first, i * 7));
}

export const isBoardDate = (iso: string, now: Date = new Date()) => upcomingTuesdays(now).includes(iso);

export const dateKeyToDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
export const dateToKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

const HEB_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
/** "25 בנובמבר" */
export function hebrewDay(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ב${HEB_MONTHS[m - 1]}`;
}
/** "25.11" */
export const shortDay = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

export const claimSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין"),
  name: z.string({ required_error: "נא למלא שם" }).trim().min(2, "נא למלא שם").max(80, "השם ארוך מדי"),
  email: z
    .string({ required_error: "נא למלא מייל" })
    .trim()
    .toLowerCase()
    .min(1, "נא למלא מייל")
    .max(200)
    .email("כתובת המייל לא תקינה"),
  topic: z
    .string()
    .trim()
    .max(150, "עד 150 תווים")
    .nullish()
    .transform((v) => (v ? v : null)),
});

export const cancelSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  token: z.string().min(20).max(200),
});

export const adminSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  action: z.enum(["release", "block", "unblock"]),
});

/** What the public board shows for one Tuesday (never includes email or token). */
export type PublicSlot = {
  date: string;
  status: "free" | "taken" | "blocked";
  name: string | null;
  topic: string | null;
};

export type AdminSlot = PublicSlot & { email: string | null; claimedAt: string | null };
