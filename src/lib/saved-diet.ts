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
