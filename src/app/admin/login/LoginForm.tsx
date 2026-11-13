"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("נא למלא מייל וסיסמה");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.location.assign(next);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "פרטי ההתחברות שגויים");
      setPassword("");
    } catch {
      setError("אין חיבור לשרת. נסו שוב.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="dt-field">
        <label htmlFor="login-email" className="dt-label">
          מייל
        </label>
        <input
          id="login-email"
          className="dt-input"
          type="email"
          dir="ltr"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>
      <div className="dt-field">
        <label htmlFor="login-password" className="dt-label">
          סיסמה
        </label>
        <input
          id="login-password"
          className="dt-input"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>

      {error && (
        <p id="login-error" role="alert" className="dt-error m-0">
          <Icon name="error" />
          {error}
        </p>
      )}

      <button type="submit" className="dt-btn dt-btn-primary dt-btn-block" disabled={busy}>
        {busy ? "מתחבר…" : "כניסה"}
      </button>
    </form>
  );
}
