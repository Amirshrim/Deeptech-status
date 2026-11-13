import { DIET_LABEL, DIET_OPTIONS, dietBadges, type DietKey } from "@/lib/diet";
import { Icon } from "./Icon";

type DietFlags = Record<DietKey, boolean>;
type AllergyFlags = { hasAllergy: boolean; allergyDetails: string | null; allergySevere: boolean };

const META = Object.fromEntries(DIET_OPTIONS.map((o) => [o.key, o]));

export function DietBadges({ m }: { m: DietFlags }) {
  const keys = dietBadges(m);
  if (keys.length === 0) return <span className="dt-badge dt-badge-muted self-start">ללא העדפות</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {keys.map((k) => (
        <span key={k} className={`dt-badge dt-badge-${META[k].tone}`}>
          <Icon name={META[k].icon} />
          {DIET_LABEL[k]}
        </span>
      ))}
    </span>
  );
}

export function SevereBadge() {
  return (
    <span className="dt-badge dt-badge-severe">
      <Icon name="emergency" fill />
      מסכן חיים
    </span>
  );
}

export function AllergyInfo({ m }: { m: AllergyFlags }) {
  if (!m.hasAllergy) return <span className="text-ink-soft">—</span>;
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="flex flex-wrap gap-1">
        <span className="dt-badge dt-badge-allergy">
          <Icon name="warning" />
          אלרגיה
        </span>
        {m.allergySevere && <SevereBadge />}
      </span>
      <span className={m.allergySevere ? "dt-severe-text" : ""}>{m.allergyDetails}</span>
    </div>
  );
}
