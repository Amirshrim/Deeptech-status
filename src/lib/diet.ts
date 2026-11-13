// Dietary categories: labels, icons (Material Symbols) and badge tones.

export type DietKey = "vegetarian" | "vegan" | "kosher" | "celiac";
export type Tone = "good" | "blue" | "warn";

export const DIET_OPTIONS: ReadonlyArray<{
  key: DietKey;
  label: string;
  sub?: string;
  icon: string;
  tone: Tone;
}> = [
  { key: "vegetarian", label: "צמחוני", icon: "eco", tone: "good" },
  { key: "vegan", label: "טבעוני", icon: "spa", tone: "good" },
  { key: "kosher", label: "כשר", icon: "verified", tone: "blue" },
  { key: "celiac", label: "צליאק", sub: "ללא גלוטן", icon: "grain", tone: "warn" },
];

export const DIET_LABEL: Record<DietKey, string> = {
  vegetarian: "צמחוני",
  vegan: "טבעוני",
  kosher: "כשר",
  celiac: "צליאק",
};

type Flags = Record<DietKey, boolean>;

/** Diet badges to show for a member. Vegans show only "טבעוני" (it implies vegetarian). */
export function dietBadges(m: Flags): DietKey[] {
  return DIET_OPTIONS.map((o) => o.key).filter((k) => {
    if (k === "vegetarian" && m.vegan) return false;
    return m[k];
  });
}
