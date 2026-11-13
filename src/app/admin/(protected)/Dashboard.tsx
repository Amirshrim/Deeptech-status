"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { AllergyInfo, DietBadges } from "@/components/MemberBits";
import { DIET_OPTIONS, type DietKey } from "@/lib/diet";
import { formatDateTime } from "@/lib/format";
import type { MemberDTO } from "@/lib/member-dto";
import { ALLERGY_MAX, NOTES_MAX, adminMemberSchema, fieldErrors } from "@/lib/member-schema";
import { computeStats } from "@/lib/summary";

type FilterKey = "all" | DietKey | "allergy" | "severe";
type SortKey = "fullName" | "email" | "diet" | "allergy" | "updatedAt";
type SortState = { key: SortKey; dir: "asc" | "desc" };

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "vegetarian", label: "צמחוני" },
  { key: "vegan", label: "טבעוני" },
  { key: "kosher", label: "כשר" },
  { key: "celiac", label: "צליאק" },
  { key: "allergy", label: "אלרגיות" },
  { key: "severe", label: "מסכן חיים" },
];

const collator = new Intl.Collator("he", { sensitivity: "base" });

function matchesFilter(m: MemberDTO, f: FilterKey): boolean {
  switch (f) {
    case "all":
      return true;
    case "vegetarian":
      return m.vegetarian || m.vegan;
    case "allergy":
      return m.hasAllergy;
    case "severe":
      return m.hasAllergy && m.allergySevere;
    default:
      return m[f];
  }
}

const allergyRank = (m: MemberDTO) => (m.allergySevere ? 2 : m.hasAllergy ? 1 : 0);
const dietCount = (m: MemberDTO) => DIET_OPTIONS.filter((o) => m[o.key]).length;

function compare(a: MemberDTO, b: MemberDTO, key: SortKey): number {
  switch (key) {
    case "fullName":
      return collator.compare(a.fullName, b.fullName);
    case "email":
      return a.email.localeCompare(b.email);
    case "diet":
      return dietCount(a) - dietCount(b);
    case "allergy":
      return allergyRank(a) - allergyRank(b);
    case "updatedAt":
      return a.updatedAt.localeCompare(b.updatedAt);
  }
}

export function Dashboard({ initialMembers }: { initialMembers: MemberDTO[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortState>({ key: "updatedAt", dir: "desc" });
  const [editing, setEditing] = useState<MemberDTO | null>(null);
  const [deleting, setDeleting] = useState<MemberDTO | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const stats = useMemo(() => computeStats(members), [members]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = members.filter(
      (m) =>
        matchesFilter(m, filter) &&
        (!q ||
          m.fullName.toLowerCase().includes(q) ||
          m.email.includes(q) ||
          (m.phone ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "") || "\u0000")),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => compare(a, b, sort.key) * dir || collator.compare(a.fullName, b.fullName));
  }, [members, query, filter, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "updatedAt" ? "desc" : "asc" },
    );
  }

  function onSaved(updated: MemberDTO) {
    setMembers((list) => list.map((m) => (m.id === updated.id ? updated : m)));
    setEditing(null);
    setToast(`הפרטים של ${updated.fullName} עודכנו`);
  }

  function onDeleted(id: string, name: string) {
    setMembers((list) => list.filter((m) => m.id !== id));
    setDeleting(null);
    setToast(`${name} נמחק/ה מהרשימה`);
  }

  const ariaSort = (key: SortKey): "ascending" | "descending" | "none" =>
    sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl text-ink">חברי המועדון</h1>
        <p className="m-0 text-sm text-ink-soft">
          <span className="dt-num">{members.length}</span> נרשמו
        </p>
      </div>

      {/* Stat tiles */}
      <section aria-label="סטטיסטיקה" className="dt-tiles">
        <StatTile icon="group" label="סה״כ חברים" value={stats.total} />
        <StatTile icon="eco" label="צמחוני" value={stats.vegetarian} hint="כולל טבעוני" />
        <StatTile icon="spa" label="טבעוני" value={stats.vegan} />
        <StatTile icon="verified" label="כשר" value={stats.kosher} />
        <StatTile icon="grain" label="צליאק" value={stats.celiac} />
        <div className="dt-tile" style={{ borderBlockStartColor: "var(--magenta)" }}>
          <span className="dt-tile-label">
            <Icon name="warning" className="text-magenta" />
            עם אלרגיות
          </span>
          <span className="dt-tile-value">{stats.allergy}</span>
          <span className={stats.allergySevere > 0 ? "dt-severe-text text-sm" : "text-sm text-ink-soft"}>
            {stats.allergySevere > 0 && <Icon name="emergency" fill />} מתוכם{" "}
            <span className="dt-num">{stats.allergySevere}</span> מסכני חיים
          </span>
        </div>
      </section>

      {/* Toolbar */}
      <section aria-label="חיפוש וסינון" className="flex flex-col gap-3">
        <div className="relative max-w-md">
          <label htmlFor="search" className="dt-sr-only">
            חיפוש לפי שם, מייל או טלפון
          </label>
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-ink-soft">
            <Icon name="search" />
          </span>
          <input
            id="search"
            type="search"
            className="dt-input ps-10"
            placeholder="חיפוש לפי שם, מייל או טלפון"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div role="group" aria-label="סינון לפי קטגוריה" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="dt-filter"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="m-0 text-sm text-ink-soft" aria-live="polite">
          מוצגים <span className="dt-num">{visible.length}</span> מתוך <span className="dt-num">{members.length}</span>
        </p>
      </section>

      {/* Desktop table */}
      <div className="dt-table-wrap">
        <table className="dt-table">
          <caption className="dt-sr-only">רשימת חברים והעדפות תזונה</caption>
          <thead>
            <tr>
              <th scope="col" aria-sort={ariaSort("fullName")}>
                <SortButton k="fullName" sort={sort} onSort={toggleSort}>שם</SortButton>
              </th>
              <th scope="col" aria-sort={ariaSort("email")}>
                <SortButton k="email" sort={sort} onSort={toggleSort}>מייל</SortButton>
              </th>
              <th scope="col">
                <span>טלפון</span>
              </th>
              <th scope="col" aria-sort={ariaSort("diet")}>
                <SortButton k="diet" sort={sort} onSort={toggleSort}>תזונה</SortButton>
              </th>
              <th scope="col" aria-sort={ariaSort("allergy")}>
                <SortButton k="allergy" sort={sort} onSort={toggleSort}>אלרגיות</SortButton>
              </th>
              <th scope="col">
                <span>הערות</span>
              </th>
              <th scope="col" aria-sort={ariaSort("updatedAt")}>
                <SortButton k="updatedAt" sort={sort} onSort={toggleSort}>עודכן</SortButton>
              </th>
              <th scope="col">
                <span className="dt-sr-only">פעולות</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => (
              <tr key={m.id} data-severe={m.hasAllergy && m.allergySevere}>
                <td className="whitespace-nowrap font-semibold">{m.fullName}</td>
                <td className="whitespace-nowrap">
                  <bdi dir="ltr">{m.email}</bdi>
                </td>
                <td className="dt-num whitespace-nowrap">{m.phone ? <bdi dir="ltr">{m.phone}</bdi> : "—"}</td>
                <td>
                  <DietBadges m={m} />
                </td>
                <td className="min-w-[180px] max-w-[280px]">
                  <AllergyInfo m={m} />
                </td>
                <td className="max-w-[240px] whitespace-pre-line text-ink-soft">{m.notes ?? "—"}</td>
                <td className="dt-num whitespace-nowrap text-ink-soft">{formatDateTime(m.updatedAt)}</td>
                <td className="whitespace-nowrap">
                  <RowActions m={m} onEdit={setEditing} onDelete={setDeleting} />
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-ink-soft">
                  לא נמצאו חברים
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="dt-member-cards m-0 list-none p-0" aria-label="רשימת חברים">
        {visible.map((m) => (
          <li key={m.id} className="dt-member-card" data-severe={m.hasAllergy && m.allergySevere}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-lg text-ink">{m.fullName}</h2>
                <bdi dir="ltr" className="block break-all text-sm text-ink-soft">
                  {m.email}
                </bdi>
                {m.phone && (
                  <bdi dir="ltr" className="dt-num block text-sm text-ink-soft">
                    {m.phone}
                  </bdi>
                )}
              </div>
              <RowActions m={m} onEdit={setEditing} onDelete={setDeleting} />
            </div>
            <DietBadges m={m} />
            {m.hasAllergy && <AllergyInfo m={m} />}
            {m.notes && <p className="m-0 whitespace-pre-line text-sm text-ink-soft">{m.notes}</p>}
            <p className="dt-num m-0 text-xs text-ink-soft">עודכן {formatDateTime(m.updatedAt)}</p>
          </li>
        ))}
        {visible.length === 0 && <li className="dt-member-card text-center text-ink-soft">לא נמצאו חברים</li>}
      </ul>

      {editing && <EditDialog key={editing.id} member={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
      {deleting && <DeleteDialog member={deleting} onClose={() => setDeleting(null)} onDeleted={onDeleted} />}

      <div role="status" aria-live="polite">
        {toast && <div className="dt-toast">{toast}</div>}
      </div>
    </div>
  );
}

function SortButton({
  k,
  sort,
  onSort,
  children,
}: {
  k: SortKey;
  sort: SortState;
  onSort: (k: SortKey) => void;
  children: ReactNode;
}) {
  const active = sort.key === k;
  return (
    <button type="button" className="dt-th-btn" onClick={() => onSort(k)}>
      {children}
      <Icon
        name={active ? (sort.dir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
        className={active ? "text-navy" : "text-ink-faint"}
      />
    </button>
  );
}

function StatTile({ icon, label, value, hint }: { icon: string; label: string; value: number; hint?: string }) {
  return (
    <div className="dt-tile">
      <span className="dt-tile-label">
        <Icon name={icon} className="text-navy" />
        {label}
      </span>
      <span className="dt-tile-value">{value}</span>
      {hint && <span className="text-sm text-ink-soft">{hint}</span>}
    </div>
  );
}

function RowActions({
  m,
  onEdit,
  onDelete,
}: {
  m: MemberDTO;
  onEdit: (m: MemberDTO) => void;
  onDelete: (m: MemberDTO) => void;
}) {
  return (
    <div className="flex gap-1">
      <button type="button" className="dt-btn dt-btn-ghost dt-btn-sm" onClick={() => onEdit(m)}>
        <Icon name="edit" />
        <span className="dt-sr-only">עריכת {m.fullName}</span>
      </button>
      <button type="button" className="dt-btn dt-btn-ghost dt-btn-sm text-bad" onClick={() => onDelete(m)}>
        <Icon name="delete" />
        <span className="dt-sr-only">מחיקת {m.fullName}</span>
      </button>
    </div>
  );
}

/** Native <dialog> opened modally: focus trap, Esc to close and backdrop for free. */
function useModal(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    const handle = () => onClose();
    d.addEventListener("close", handle);
    return () => d.removeEventListener("close", handle);
  }, [onClose]);
  return ref;
}

type EditState = {
  fullName: string;
  email: string;
  phone: string;
  vegetarian: boolean;
  vegan: boolean;
  kosher: boolean;
  celiac: boolean;
  hasAllergy: boolean;
  allergyDetails: string;
  allergySevere: boolean;
  notes: string;
};

function EditDialog({
  member,
  onClose,
  onSaved,
}: {
  member: MemberDTO;
  onClose: () => void;
  onSaved: (m: MemberDTO) => void;
}) {
  const ref = useModal(onClose);
  const [form, setForm] = useState<EditState>({
    fullName: member.fullName,
    email: member.email,
    phone: member.phone ?? "",
    vegetarian: member.vegetarian,
    vegan: member.vegan,
    kosher: member.kosher,
    celiac: member.celiac,
    hasAllergy: member.hasAllergy,
    allergyDetails: member.allergyDetails ?? "",
    allergySevere: member.allergySevere,
    notes: member.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function set<K extends keyof EditState>(key: K, value: EditState[K]) {
    const next = { ...form, [key]: value };
    if (key === "vegan" && value === true) next.vegetarian = true;
    if (key === "vegetarian" && value === false && form.vegan) return;
    setForm(next);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = adminMemberSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onSaved(data.member);
      else if (data.errors) setErrors(data.errors);
      else if (res.status === 401) window.location.assign("/admin/login");
      else setErrors({ form: "השמירה נכשלה. נסו שוב." });
    } catch {
      setErrors({ form: "אין חיבור לשרת." });
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) =>
    errors[k] ? (
      <p id={`ee-${k}`} className="dt-error m-0">
        <Icon name="error" />
        {errors[k]}
      </p>
    ) : null;

  return (
    <dialog ref={ref} className="dt-dialog" aria-labelledby="edit-title">
      <form onSubmit={onSubmit} noValidate className="dt-dialog-body">
        <div className="flex items-center justify-between gap-2">
          <h2 id="edit-title" className="text-xl">
            עריכת פרטים
          </h2>
          <button type="button" className="dt-btn dt-btn-ghost dt-btn-sm" onClick={() => ref.current?.close()}>
            <Icon name="close" />
            <span className="dt-sr-only">סגירה</span>
          </button>
        </div>

        <div className="dt-field">
          <label htmlFor="ed-fullName" className="dt-label">
            שם מלא<span className="dt-req" aria-hidden="true">*</span>
          </label>
          <input
            id="ed-fullName"
            className="dt-input"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={errors.fullName ? "ee-fullName" : undefined}
          />
          {err("fullName")}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="dt-field">
            <label htmlFor="ed-email" className="dt-label">
              מייל<span className="dt-req" aria-hidden="true">*</span>
            </label>
            <input
              id="ed-email"
              className="dt-input"
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "ee-email" : undefined}
            />
            {err("email")}
          </div>
          <div className="dt-field">
            <label htmlFor="ed-phone" className="dt-label">
              טלפון
            </label>
            <input
              id="ed-phone"
              className="dt-input dt-num"
              type="tel"
              dir="ltr"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={errors.phone ? "ee-phone" : undefined}
            />
            {err("phone")}
          </div>
        </div>

        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="dt-label mb-2 p-0">תזונה</legend>
          <div className="grid grid-cols-2 gap-2">
            {DIET_OPTIONS.map((o) => (
              <label key={o.key} className="dt-checkrow">
                <input
                  type="checkbox"
                  checked={form[o.key]}
                  disabled={o.key === "vegetarian" && form.vegan}
                  onChange={(e) => set(o.key, e.target.checked)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="dt-checkrow">
          <input type="checkbox" checked={form.hasAllergy} onChange={(e) => set("hasAllergy", e.target.checked)} />
          <strong>יש אלרגיה</strong>
        </label>
        {form.hasAllergy && (
          <div className="dt-allergy-box">
            <div className="dt-field">
              <label htmlFor="ed-allergy" className="dt-label">
                פירוט האלרגיות<span className="dt-req" aria-hidden="true">*</span>
              </label>
              <textarea
                id="ed-allergy"
                className="dt-textarea"
                maxLength={ALLERGY_MAX}
                value={form.allergyDetails}
                onChange={(e) => set("allergyDetails", e.target.value)}
                aria-invalid={errors.allergyDetails ? true : undefined}
                aria-describedby={errors.allergyDetails ? "ee-allergyDetails" : undefined}
              />
              {err("allergyDetails")}
            </div>
            <label className="dt-checkrow">
              <input
                type="checkbox"
                checked={form.allergySevere}
                onChange={(e) => set("allergySevere", e.target.checked)}
              />
              אלרגיה מסכנת חיים / נושא/ת אפיפן
            </label>
          </div>
        )}

        <div className="dt-field">
          <label htmlFor="ed-notes" className="dt-label">
            הערות
          </label>
          <textarea
            id="ed-notes"
            className="dt-textarea"
            maxLength={NOTES_MAX}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
          {err("notes")}
        </div>

        {errors.form && (
          <p role="alert" className="dt-error m-0">
            {errors.form}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="dt-btn dt-btn-secondary" onClick={() => ref.current?.close()}>
            ביטול
          </button>
          <button type="submit" className="dt-btn dt-btn-primary" disabled={busy}>
            {busy ? "שומר…" : "שמירה"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function DeleteDialog({
  member,
  onClose,
  onDeleted,
}: {
  member: MemberDTO;
  onClose: () => void;
  onDeleted: (id: string, name: string) => void;
}) {
  const ref = useModal(onClose);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, { method: "DELETE" });
      if (res.ok || res.status === 404) onDeleted(member.id, member.fullName);
      else if (res.status === 401) window.location.assign("/admin/login");
      else setError("המחיקה נכשלה. נסו שוב.");
    } catch {
      setError("אין חיבור לשרת.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={ref} className="dt-dialog" aria-labelledby="del-title" aria-describedby="del-desc">
      <div className="dt-dialog-body">
        <h2 id="del-title" className="text-xl">
          מחיקת חבר/ה
        </h2>
        <p id="del-desc" className="m-0">
          למחוק את <strong>{member.fullName}</strong> (<bdi dir="ltr">{member.email}</bdi>)? הפעולה לא ניתנת לביטול.
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
