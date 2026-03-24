import { type CSSProperties } from "react";

type BadgeSize = "sm" | "md" | "lg";
type BadgeVariant = "owned" | "rental" | "muted" | "gold";

interface AppBadgeProps {
  size?: BadgeSize;
  variant?: BadgeVariant;
  /** Override background (for dynamic temp/occasion badges) */
  bg?: string;
  borderColor?: string;
  color?: string;
  children: React.ReactNode;
  className?: string;
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-[9px] px-1.5 py-[3px] tracking-wide",
  md: "text-[11px] px-2 py-[3px] tracking-wide",
  lg: "text-[13px] px-2.5 py-1 tracking-normal",
};

const variantStyles: Record<BadgeVariant, string> = {
  owned:  "bg-teal/15 text-teal border-teal/30",
  rental: "bg-rust/15 text-rust border-rust/30",
  muted:  "bg-muted text-muted-foreground border-border/40",
  gold:   "bg-gold/15 text-gold border-gold/30",
};

/**
 * Standardized badge used across the app.
 *
 * - Use `variant` for semantic meaning (owned, rental, muted, gold)
 * - Use `bg` / `borderColor` / `color` for dynamic palette badges (temperature, etc.)
 * - Three sizes: sm (compact rows), md (default), lg (prominent contexts)
 */
const AppBadge = ({
  size = "md",
  variant,
  bg,
  borderColor,
  color,
  children,
  className = "",
}: AppBadgeProps) => {
  const hasCustomColors = bg || borderColor || color;

  const style: CSSProperties = hasCustomColors
    ? { backgroundColor: bg, borderColor, color }
    : {};

  return (
    <span
      className={[
        "inline-flex items-center font-semibold uppercase rounded-md border whitespace-nowrap leading-none",
        sizeStyles[size],
        !hasCustomColors && variant ? variantStyles[variant] : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {children}
    </span>
  );
};

export default AppBadge;
