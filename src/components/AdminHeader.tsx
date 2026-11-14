import Link from "next/link";
import { Brand } from "./Brand";
import { Icon } from "./Icon";

type Section = "dashboard" | "summary";

export function AdminHeader({ email, current }: { email: string; current: Section }) {
  return (
    <header className="dt-topbar dt-on-navy dt-no-print">
      <div className="dt-topbar-inner">
        <Brand />
        <span className="font-display font-extrabold tracking-[0.01em] text-white/90">
          <bdi dir="ltr">Admin</bdi>
        </span>

        <nav aria-label="ניווט ניהול" className="flex flex-wrap items-center gap-1 ms-auto">
          <Link href="/admin" className="dt-nav-link" aria-current={current === "dashboard" ? "page" : undefined}>
            <Icon name="group" />
            חברים
          </Link>
          <Link
            href="/admin/summary"
            className="dt-nav-link"
            aria-current={current === "summary" ? "page" : undefined}
          >
            <Icon name="restaurant" />
            סיכום להזמנת אוכל
          </Link>
          <a href="/api/admin/export" className="dt-nav-link" download>
            <Icon name="download" />
            ייצוא CSV
          </a>
          <form method="post" action="/api/admin/logout" className="m-0">
            <button type="submit" className="dt-nav-link" title={email}>
              <Icon name="logout" className="dt-flip-rtl" />
              יציאה
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
