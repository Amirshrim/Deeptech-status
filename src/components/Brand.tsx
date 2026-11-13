/** Logo + club line, for navy backgrounds. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="dt-brand">
      {/* Plain <img> so the SVG can be swapped without image config. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" width={44} height={44} />
      <div>
        <bdi dir="ltr">Deep-Tech Reichman</bdi>
        {!compact && <span className="dt-brand-sub">מועדון הדיפ-טק של אוניברסיטת רייכמן</span>}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="dt-container py-8 text-sm text-white/80 flex flex-wrap items-center justify-between gap-2">
      <span>
        <bdi dir="ltr">Deep-Tech Reichman</bdi> · מועדון הדיפ-טק של אוניברסיטת רייכמן
      </span>
      <span className="font-display font-semibold">
        בשיתוף <bdi dir="ltr">RUEC</bdi>
      </span>
    </footer>
  );
}
