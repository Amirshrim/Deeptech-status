/** Material Symbols Outlined icon. Decorative by default (hidden from screen readers). */
export function Icon({
  name,
  fill = false,
  className = "",
}: {
  name: string;
  fill?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${fill ? "dt-icon-fill" : ""} ${className}`}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
