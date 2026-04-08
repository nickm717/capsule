import type React from "react";

function parseHex(hex: string): [number, number, number] | null {
  const clean = (hex ?? "").replace("#", "").trim();
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function toHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map(c =>
        Math.round(Math.max(0, Math.min(255, c)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Returns a hex color adjusted for visibility on the current background.
 *
 * Dark background (isDark=true):  if luminance < 40,  blend toward white until luminance ≈ 120.
 * Light background (isDark=false): if luminance > 210, blend toward black until luminance ≈ 130.
 * Otherwise returns the color unchanged.
 * Falls back to #888888 on malformed input.
 */
export function getVisibleColor(hex: string, isDark: boolean): string {
  const channels = parseHex(hex);
  if (!channels) return "#888888";

  let [r, g, b] = channels;
  const lum = luminance(r, g, b);

  if (isDark) {
    if (lum < 40) {
      // t = (targetLum - lum) / (255 - lum)  — single-step blend toward white
      const t = (120 - lum) / (255 - lum);
      r = r + (255 - r) * t;
      g = g + (255 - g) * t;
      b = b + (255 - b) * t;
    }
  } else {
    if (lum > 210) {
      // t = 1 - targetLum / lum  — single-step blend toward black
      const t = 1 - 130 / lum;
      r = r * (1 - t);
      g = g * (1 - t);
      b = b * (1 - t);
    }
  }

  return toHex(r, g, b);
}

/**
 * Returns a style object for a color swatch element.
 * Keeps the original hex unchanged; adds an inset outline ring for definition.
 */
export function getSwatch(hex: string, isDark: boolean): React.CSSProperties {
  return {
    backgroundColor: hex,
    outline: isDark
      ? "1.5px solid rgba(255,255,255,0.15)"
      : "1.5px solid rgba(0,0,0,0.10)",
    outlineOffset: "-1.5px",
  };
}
