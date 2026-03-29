import type { ColorSwatch } from "./darkautumn";

export type { ColorSwatch };

export interface SeasonalPalette {
  id: string;
  name: string;
  descriptor: string;
  colors: ColorSwatch[];
}

// ── Color naming utility ──────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
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

export function hexToColorName(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  const depth =
    l < 0.18 ? "Ebony " :
    l < 0.32 ? "Deep " :
    l < 0.45 ? "Dark " :
    l > 0.78 ? "Light " :
    l > 0.65 ? "Pale " : "";
  if (s < 0.08) {
    if (l < 0.15) return "Charcoal";
    if (l < 0.35) return "Dark Gray";
    if (l > 0.85) return "Off White";
    return "Warm Gray";
  }
  if (h < 12 || h >= 350) return depth + "Red";
  if (h < 22) return depth + "Rust";
  if (h < 35) return depth + "Terracotta";
  if (h < 50) return depth + "Amber";
  if (h < 65) return depth + "Gold";
  if (h < 80) return depth + "Olive";
  if (h < 140) return depth + "Green";
  if (h < 165) return depth + "Sage";
  if (h < 190) return depth + "Teal";
  if (h < 220) return depth + "Cyan";
  if (h < 255) return depth + "Blue";
  if (h < 280) return depth + "Indigo";
  if (h < 310) return depth + "Purple";
  if (h < 330) return depth + "Aubergine";
  return depth + "Rose";
}

function palette(hexValues: string[]): ColorSwatch[] {
  return hexValues.map((hex) => ({ hex, name: hexToColorName(hex) }));
}

// ── 12 Seasonal Palettes ──────────────────────────────────────────────────────

export const SEASONAL_PALETTES: SeasonalPalette[] = [
  {
    id: "bright-spring",
    name: "Bright Spring",
    descriptor: "Warm · Clear · Vibrant",
    colors: palette(["#F7D44C","#F5A623","#F5733A","#E8604A","#F08080","#D4A0C8","#4DC9A0","#3AADDE","#78C878","#FFFFFF"]),
  },
  {
    id: "true-spring",
    name: "True Spring",
    descriptor: "Warm · Clear · Golden",
    colors: palette(["#F0C890","#E8A830","#C8D850","#E8784A","#E87860","#E8A0B0","#48C8A0","#60B8D8","#A8D870","#F8E8D0"]),
  },
  {
    id: "light-spring",
    name: "Light Spring",
    descriptor: "Warm · Light · Delicate",
    colors: palette(["#F8F0E0","#F8D898","#F8C8A8","#E8A888","#F0B0B0","#E8C0D8","#D8E8A8","#B8E8D0","#A8D8F0","#D0C8B0"]),
  },
  {
    id: "light-summer",
    name: "Light Summer",
    descriptor: "Cool · Light · Ethereal",
    colors: palette(["#E8E0F0","#D0E8F0","#E0D8F0","#F0D8E8","#E8D8D8","#C8E0D8","#D8D0E8","#A8C8D8","#E0C8D8","#C8C0D0"]),
  },
  {
    id: "true-summer",
    name: "True Summer",
    descriptor: "Cool · Muted · Refined",
    colors: palette(["#E8E4E8","#C0B8D0","#D8D8E0","#B8CED8","#8C4A5C","#607A70","#5A4A78","#3D6B7A","#2D5C50","#2A5070"]),
  },
  {
    id: "soft-summer",
    name: "Soft Summer",
    descriptor: "Cool · Muted · Smoky",
    colors: palette(["#D0C8C0","#C0B0B8","#B8B0C0","#B0A8A8","#A09898","#909888","#8A9AAA","#7A9090","#6A7878","#505860"]),
  },
  {
    id: "soft-autumn",
    name: "Soft Autumn",
    descriptor: "Warm · Muted · Gentle",
    colors: palette(["#C8C0A8","#C8B8A0","#C8A888","#C0A898","#B09878","#A89080","#A09070","#989870","#888068","#707860"]),
  },
  {
    id: "true-autumn",
    name: "True Autumn",
    descriptor: "Warm · Rich · Earthy",
    colors: palette(["#E8D0A0","#C89040","#C05020","#A07020","#8A3020","#805030","#6A8030","#6B2A20","#3A5838","#5A4020"]),
  },
  {
    id: "dark-autumn",
    name: "Dark Autumn",
    descriptor: "Warm · Deep · Dramatic",
    colors: [
      { hex: "#3B1F14", name: "Espresso" },
      { hex: "#8B3A2A", name: "Burnt Sienna" },
      { hex: "#C2622D", name: "Terracotta" },
      { hex: "#A0522D", name: "Warm Rust" },
      { hex: "#5C4A1E", name: "Olive Brown" },
      { hex: "#4A5240", name: "Forest Moss" },
      { hex: "#2C4A52", name: "Deep Teal" },
      { hex: "#4B2E3E", name: "Aubergine" },
      { hex: "#8C7B6B", name: "Warm Taupe" },
      { hex: "#E8DCC8", name: "Cream" },
    ],
  },
  {
    id: "dark-winter",
    name: "Dark Winter",
    descriptor: "Cool · Deep · Mysterious",
    colors: palette(["#505050","#601830","#481830","#3A1A30","#382048","#2A3848","#1A3A50","#1A3028","#702028","#1A1A2E"]),
  },
  {
    id: "true-winter",
    name: "True Winter",
    descriptor: "Cool · Clear · High Contrast",
    colors: palette(["#F8F8FF","#E0D0F8","#C8E0F8","#C0001A","#C000A0","#8000C0","#007050","#006888","#001880","#000000"]),
  },
  {
    id: "bright-winter",
    name: "Bright Winter",
    descriptor: "Cool · Clear · Electric",
    colors: palette(["#F8F8FF","#F0E0F8","#C8F0F8","#E00040","#E000A0","#8020D0","#007840","#00A0C0","#0040C0","#101010"]),
  },
];
