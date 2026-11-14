// Remembers on this device that the member already filled the diet form, so we
// don't ask again. Stores only name + email (no health data). Some in-app
// browsers block storage, so every access is guarded.

const KEY = "dt_diet_saved_v1";

export type SavedDiet = { fullName: string; email: string; savedAt: string };

export function readSavedDiet(): SavedDiet | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<SavedDiet>;
    return typeof v.email === "string" && typeof v.fullName === "string"
      ? { fullName: v.fullName, email: v.email, savedAt: String(v.savedAt ?? "") }
      : null;
  } catch {
    return null;
  }
}

export function writeSavedDiet(v: { fullName: string; email: string }): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...v, savedAt: new Date().toISOString() }));
  } catch {
    /* storage unavailable — nothing to remember */
  }
}

// ── Feedback already sent (per event) ──────────────────────────
const FEEDBACK_KEY = "dt_feedback_sent_v1";

export function hasSentFeedback(eventId: string): boolean {
  try {
    const ids = JSON.parse(window.localStorage.getItem(FEEDBACK_KEY) ?? "[]");
    return Array.isArray(ids) && ids.includes(eventId);
  } catch {
    return false;
  }
}

export function markFeedbackSent(eventId: string): void {
  try {
    const ids = JSON.parse(window.localStorage.getItem(FEEDBACK_KEY) ?? "[]");
    const list: string[] = Array.isArray(ids) ? ids.filter((x) => typeof x === "string") : [];
    if (!list.includes(eventId)) list.push(eventId);
    window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list.slice(-50)));
  } catch {
    /* storage unavailable */
  }
}
