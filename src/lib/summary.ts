// Stats and the catering summary text (WhatsApp-friendly).
import { formatDateTime } from "./format";

type SummaryMember = {
  fullName: string;
  vegetarian: boolean;
  vegan: boolean;
  kosher: boolean;
  celiac: boolean;
  hasAllergy: boolean;
  allergyDetails: string | null;
  allergySevere: boolean;
};

export type Stats = {
  total: number;
  vegetarian: number; // includes vegans
  vegan: number;
  kosher: number;
  celiac: number;
  allergy: number;
  allergySevere: number;
  noRestrictions: number;
};

export function computeStats(members: SummaryMember[]): Stats {
  const s: Stats = {
    total: members.length,
    vegetarian: 0,
    vegan: 0,
    kosher: 0,
    celiac: 0,
    allergy: 0,
    allergySevere: 0,
    noRestrictions: 0,
  };
  for (const m of members) {
    if (m.vegetarian || m.vegan) s.vegetarian++;
    if (m.vegan) s.vegan++;
    if (m.kosher) s.kosher++;
    if (m.celiac) s.celiac++;
    if (m.hasAllergy) s.allergy++;
    if (m.hasAllergy && m.allergySevere) s.allergySevere++;
    if (!m.vegetarian && !m.vegan && !m.kosher && !m.celiac && !m.hasAllergy) s.noRestrictions++;
  }
  return s;
}

const collator = new Intl.Collator("he");

/** Members with allergies — life-threatening first, then by name. */
export function allergyList<T extends SummaryMember>(members: T[]): T[] {
  return members
    .filter((m) => m.hasAllergy)
    .sort((a, b) => {
      if (a.allergySevere !== b.allergySevere) return a.allergySevere ? -1 : 1;
      return collator.compare(a.fullName, b.fullName);
    });
}

/** Plain-text summary for WhatsApp / email to a caterer. Uses WhatsApp *bold*. */
export function buildCateringText(members: SummaryMember[], now: Date = new Date()): string {
  const s = computeStats(members);
  const lines: string[] = [];
  lines.push("*Deep-Tech Reichman — סיכום להזמנת אוכל*");
  lines.push(`עודכן: ${formatDateTime(now)}`);
  lines.push("");
  lines.push(`סה״כ נרשמו: ${s.total}`);
  lines.push(`• צמחוני (כולל טבעוני): ${s.vegetarian}`);
  lines.push(`   ◦ מתוכם טבעוני: ${s.vegan}`);
  lines.push(`• כשר: ${s.kosher}`);
  lines.push(`• ללא גלוטן (צליאק): ${s.celiac}`);
  lines.push(
    `• אלרגיות: ${s.allergy}` +
      (s.allergySevere > 0 ? ` (מתוכן ${s.allergySevere} מסכנות חיים ⚠️)` : ""),
  );
  lines.push(`• ללא הגבלות: ${s.noRestrictions}`);

  const allergic = allergyList(members);
  if (allergic.length > 0) {
    lines.push("");
    lines.push("*פירוט אלרגיות:*");
    for (const m of allergic) {
      const details = (m.allergyDetails ?? "").replace(/\s+/g, " ").trim();
      lines.push(
        m.allergySevere
          ? `⚠️ *${m.fullName}* — ${details} (מסכן חיים / אפיפן)`
          : `• ${m.fullName} — ${details}`,
      );
    }
  }
  return lines.join("\n");
}
