// Admin allowlist from env. No Node-only imports: this runs in middleware too.

/** Removes invisible direction marks / zero-width chars that sneak in when copying from RTL text. */
export function stripInvisible(s: string): string {
  return s.replace(/[​-‏‪-‮⁦-⁩﻿]/g, "");
}

/** Normalises one email: invisible chars, whitespace, wrapping quotes, case. */
function cleanEmail(e: string): string {
  return stripInvisible(e).trim().replace(/^['"<]+|['">]+$/g, "").trim().toLowerCase();
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map(cleanEmail)
    .filter(Boolean);
}

export function isAllowedAdmin(email: string): boolean {
  return adminEmails().includes(cleanEmail(email));
}
