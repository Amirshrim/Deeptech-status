// Admin allowlist from env. No Node-only imports: this runs in middleware too.

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdmin(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}
