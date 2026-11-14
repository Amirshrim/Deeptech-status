/* eslint-disable @next/next/no-img-element -- static brand images, no optimisation needed */

/** Full Deep-Tech Reichman logo (atom + wordmark) over the galaxy glow, for entry screens. */
export function BrandHero({ size = "lg" }: { size?: "lg" | "sm" }) {
  return (
    <div className="dt-hero">
      <div className="dt-hero-galaxy" aria-hidden="true" />
      <img
        src="/brand/deeptech-logo.jpg"
        alt="Deep-Tech Reichman — Science Based Innovation"
        width={560}
        height={565}
        className="dt-hero-logo"
        style={size === "sm" ? { inlineSize: "min(170px, 50vw)" } : undefined}
        fetchPriority="high"
      />
    </div>
  );
}

/** Compact atom mark + spaced wordmark, for headers on dark backgrounds. */
export function Brand() {
  return (
    <span className="dt-wordmark">
      <img src="/brand/atom.png" alt="" width={36} height={36} />
      <span className="dt-wordmark-text" dir="ltr">
        Deep-Tech
        <br />
        Reichman
      </span>
    </span>
  );
}

export function Footer() {
  return (
    <footer className="dt-container flex flex-col items-center gap-3 py-8 text-center text-sm text-white/80">
      <div className="dt-partners" aria-label="שותפים">
        <span className="dt-partner" dir="ltr">
          Reichman
          <br />
          University
        </span>
        <span className="dt-partner" dir="ltr">
          Entrepreneurship
          <br />
          Club
        </span>
        <span className="dt-partner" dir="ltr">
          Deep Tech
          <br />
          Week TLV
        </span>
      </div>
      <span>
        <bdi dir="ltr">Deep-Tech Reichman</bdi> · מועדון הדיפ-טק של אוניברסיטת רייכמן
      </span>
    </footer>
  );
}
