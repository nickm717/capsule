// Dark Autumn Capsule Wardrobe — Types & Config

// ─── Types ───────────────────────────────────────────────

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface WardrobeItem {
  id: string;
  name: string;
  brand?: string;
  color: string;
  hex: string;
  owned: boolean;
  gap?: boolean;
  priority?: boolean;
  seasonal?: boolean;
  notes: string;
}

export interface WardrobeCategory {
  id: string;
  label: string;
  icon: string;
  items: WardrobeItem[];
}

export interface OutfitPiece {
  name: string;
  color: string;
  hex: string;
  item_id?: string;
  category?: string;
  brand?: string;
  owned?: boolean;
}

export interface Outfit {
  id: string;
  name: string;
  temp: string;
  pieces: OutfitPiece[];
  notes: string;
  occasion_id?: string;
}

export interface Occasion {
  id: string;
  label: string;
  icon: string;
  outfits: Outfit[];
}

export interface TemperatureBadge {
  bg: string;
  border: string;
  text: string;
  range: string;
}

// ─── Runtime Config (always available) ───────────────────

export const colorPalette: Record<string, string> = {
  olive: "#6B7A3A",
  deepOlive: "#4A5228",
  espresso: "#3B1F14",
  chocolate: "#5C3317",
  chocolateBark: "#4A2410",
  teal: "#2E6E68",
  deepTeal: "#1A4C47",
  salmon: "#C4745A",
  rust: "#9B4A2A",
  terracotta: "#B85C38",
  cream: "#E8D5B0",
  caramel: "#A0682A",
  camel: "#C19A5B",
  oatmeal: "#D4C4A0",
  gold: "#B08030",
  denim: "#3A4A5C",
  white: "#E8E4DC",
  brown: "#5C3317",
};

export const swatches: ColorSwatch[] = [
  { name: "Olive", hex: "#6B7A3A" },
  { name: "Deep Olive", hex: "#4A5228" },
  { name: "Chocolate", hex: "#5C3317" },
  { name: "Rust", hex: "#9B4A2A" },
  { name: "Teal", hex: "#2E6E68" },
  { name: "Cream", hex: "#E8D5B0" },
  { name: "Caramel", hex: "#A0682A" },
  { name: "Camel", hex: "#C19A5B" },
  { name: "Gold", hex: "#B08030" },
];

export const temperatureBadges: Record<string, TemperatureBadge> = {
  Cold: { bg: "rgba(46,110,104,0.15)", border: "rgba(46,110,104,0.35)", text: "#5AADA6", range: "below 40°F" },
  Cool: { bg: "rgba(74,82,40,0.2)", border: "rgba(107,122,58,0.4)", text: "#8FA054", range: "40–60°F" },
  Mild: { bg: "rgba(160,104,42,0.15)", border: "rgba(160,104,42,0.35)", text: "#C49040", range: "60–70°F" },
  Warm: { bg: "rgba(184,92,56,0.15)", border: "rgba(184,92,56,0.35)", text: "#D4845A", range: "70°F+" },
};

/** Category definitions (id, label, icon) — used for tabs & grouping */
export const categoryDefs: { id: string; label: string; icon: string }[] = [
  { id: "tops", label: "Tops", icon: "👕" },
  { id: "bottoms", label: "Bottoms", icon: "👖" },
  { id: "outerwear", label: "Outerwear", icon: "🧥" },
  { id: "dresses", label: "Dresses", icon: "👗" },
  { id: "shoes", label: "Shoes", icon: "👟" },
  { id: "accessories", label: "Accessories", icon: "💍" },
];

/** Occasion definitions (id, label, icon) — used for tabs & filtering */
export const occasionDefs: { id: string; label: string; icon: string }[] = [
  { id: "casual", label: "Casual Everyday", icon: "☀" },
  { id: "work", label: "Work / Office", icon: "◈" },
  { id: "weekend", label: "Weekend Errands", icon: "◎" },
  { id: "dinner", label: "Going Out / Dinner", icon: "✦" },
];
