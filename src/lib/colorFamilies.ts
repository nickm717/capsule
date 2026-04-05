export interface ColorFamily {
  id: string;
  label: string;
  hex: string; // representative display color
}

export const COLOR_FAMILIES: ColorFamily[] = [
  { id: "white",    label: "White",    hex: "#F0EDE8" },
  { id: "beige",    label: "Beige",    hex: "#CDB99A" },
  { id: "brown",    label: "Brown",    hex: "#7A4F3A" },
  { id: "olive",    label: "Olive",    hex: "#7A7A38" },
  { id: "green",    label: "Green",    hex: "#3D6B4F" },
  { id: "blue",     label: "Blue",     hex: "#6A9EC0" },
  { id: "navy",     label: "Navy",     hex: "#2A3A5C" },
  { id: "gray",     label: "Gray",     hex: "#8A8A8A" },
  { id: "black",    label: "Black",    hex: "#252525" },
  { id: "pink",     label: "Pink",     hex: "#E8A0A0" },
  { id: "burgundy", label: "Burgundy", hex: "#6E1A28" },
];

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

/** Maps any hex color to one of the COLOR_FAMILIES ids. */
export function hexToFamily(hex: string): string {
  if (!hex || hex.length < 7) return "gray";
  const [h, s, l] = hexToHsl(hex);

  // Achromatic / near-achromatic (classify by lightness)
  if (l > 0.84 && s < 0.20) return "white";
  if (l < 0.20) return "black";
  if (s < 0.15) return "gray"; // charcoal, gravel, faded black, etc.

  // Hue-based (meaningful saturation guaranteed now)

  // Pink / Rose — warm reds, light
  if ((h >= 340 || h < 20) && l >= 0.58) return "pink";

  // Burgundy / Red — warm reds, darker
  if (h >= 330 || h < 20) return "burgundy";

  // Beige / Tan — warm yellows, light
  if (h >= 20 && h < 55 && l >= 0.52) return "beige";

  // Brown — warm yellows/oranges, darker
  if (h >= 20 && h < 55) return "brown";

  // Olive — yellow-green
  if (h >= 55 && h < 105) return "olive";

  // Green
  if (h >= 105 && h < 175) return "green";

  // Teal — fold into blue (light) or green (dark)
  if (h >= 175 && h < 195) return l > 0.50 ? "blue" : "green";

  // Blue — lighter blues
  if (h >= 195 && h < 240 && l >= 0.48) return "blue";

  // Navy — dark blues + indigos
  if (h >= 195 && h < 300) return "navy";

  // Purple / violet fallback
  if (h >= 300 && h < 330) return "burgundy";

  return "gray";
}
