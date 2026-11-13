// CSV export — UTF-8 with BOM + CRLF so Excel opens Hebrew correctly.
import { formatDateTime } from "./format";
import type { MemberDTO } from "./member-dto";

const BOM = "﻿";

/** Quote a cell and neutralise spreadsheet formula injection. */
export function csvCell(value: string | number | boolean | null | undefined): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Phone numbers are wrapped as ="…" so Excel keeps the leading 0 / "+" instead of
 * turning them into numbers. Safe because the schema only allows [0-9+-() ].
 */
function phoneCell(phone: string | null): string {
  if (!phone) return '""';
  const safe = phone.replace(/[^0-9+\-\s()]/g, "");
  return `"=""${safe}"""`;
}

const yesNo = (b: boolean) => (b ? "כן" : "");

export const CSV_HEADERS = [
  "שם מלא",
  "מייל",
  "טלפון",
  "צמחוני",
  "טבעוני",
  "כשר",
  "צליאק",
  "אלרגיה",
  "פירוט אלרגיות",
  "מסכן חיים",
  "הערות",
  "נוצר",
  "עודכן",
];

export function buildMembersCsv(members: MemberDTO[]): string {
  const rows = [CSV_HEADERS.map(csvCell).join(",")];
  for (const m of members) {
    rows.push(
      [
        csvCell(m.fullName),
        csvCell(m.email),
        phoneCell(m.phone),
        csvCell(yesNo(m.vegetarian || m.vegan)),
        csvCell(yesNo(m.vegan)),
        csvCell(yesNo(m.kosher)),
        csvCell(yesNo(m.celiac)),
        csvCell(yesNo(m.hasAllergy)),
        csvCell(m.allergyDetails),
        csvCell(yesNo(m.allergySevere)),
        csvCell(m.notes),
        csvCell(formatDateTime(m.createdAt)),
        csvCell(formatDateTime(m.updatedAt)),
      ].join(","),
    );
  }
  return BOM + rows.join("\r\n") + "\r\n";
}
