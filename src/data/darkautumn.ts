// Dark Autumn Capsule Wardrobe — Types, Config & Seed Data

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
}

export interface Outfit {
  id: string;
  name: string;
  temp: string;
  pieces: OutfitPiece[];
  notes: string;
  occasion_id?: string;
  isGap?: boolean;
  upgrade?: string;
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

// ─── Seed Data (used once to populate Supabase) ──────────

/** @internal Used only for first-load seeding */
export const SEED_WARDROBE_ITEMS: Array<{
  name: string;
  brand: string;
  category: string;
  color: string;
  hex: string;
  notes: string;
  owned: boolean;
}> = [
  // Tops
  { name: "Cashmere Tee", brand: "Quince", category: "tops", color: "Brown", hex: "#5C3317", owned: true, notes: "A true workhorse. Tuck into skirts and wide-legs, or layer under jackets. The cashmere drape elevates everything." },
  { name: "Wedge Tee", brand: "LOFT", category: "tops", color: "Chocolate Bark", hex: "#4A2410", owned: true, notes: "Excellent tuck-in top for jeans and skirts. The asymmetric hem adds interest." },
  { name: "Girlfriend Cardigan", brand: "LOFT", category: "tops", color: "Brown", hex: "#5C3317", owned: true, notes: "Versatile layering piece. Wear open over tanks or buttoned as a top." },
  { name: "Cashmere Crewneck", brand: "Quince", category: "tops", color: "Oatmeal", hex: "#D4C4A0", owned: true, notes: "Polished and warm. Works for office or casual. Style with wide-leg trousers or denim." },
  { name: "Cream Cami", brand: "", category: "tops", color: "Warm Cream", hex: "#E8D5B0", owned: true, notes: "The most versatile layering piece in your wardrobe. Tuck into everything." },
  { name: "Caramel Ribbed Tank", brand: "", category: "tops", color: "Caramel", hex: "#A0682A", owned: true, notes: "One of your most-reached-for pieces. Great under jackets or tucked into skirts." },
  { name: "Olive Sweater Tank", brand: "", category: "tops", color: "Olive", hex: "#6B7A3A", owned: true, notes: "Layer under cardigans or wear alone. Anchors olive-forward looks." },
  { name: "Cream Long Sleeve Top", brand: "", category: "tops", color: "Warm Cream", hex: "#E8D5B0", owned: true, notes: "Great for layering — wear under jackets, over camis, or alone tucked into skirts." },
  { name: "Olive Long Sleeve Top", brand: "", category: "tops", color: "Olive", hex: "#6B7A3A", owned: true, notes: "One of your strongest neutrals. Pairs with denim, brown, and camel beautifully." },
  { name: "Dark Denim Button-Up Shirt", brand: "", category: "tops", color: "Dark Denim", hex: "#3A4A5C", owned: true, notes: "Great casual layer. Wear open over tanks or half-tucked into trousers." },
  { name: "White Linen Shirt", brand: "", category: "tops", color: "White / Warm White", hex: "#E8D5B0", owned: true, notes: "Crisp and versatile. Tuck into skirts or wear open as a layer." },
  { name: "Linen High-Neck Tank", brand: "Everlane", category: "tops", color: "Henna Red (Rust)", hex: "#9B4A2A", owned: true, notes: "A strong statement piece. Pairs well with olive and brown. Tuck into wide-leg trousers for office." },
  { name: "Chloé Shirt", brand: "Sézane", category: "tops", color: "Ecru", hex: "#D4C4A0", owned: true, notes: "Elevated and feminine. Your go-to for polished office looks. Tuck into silk skirts or wide-legs." },
  // Bottoms
  { name: "Utility Straight-Leg Pant", brand: "Everlane", category: "bottoms", color: "Olive Night", hex: "#4A5228", owned: true, notes: "Your best work trouser. Pairs with almost every top in your wardrobe." },
  { name: "Brown Wide-Leg Cropped Pants", brand: "", category: "bottoms", color: "Brown", hex: "#5C3317", owned: true, notes: "Elevated casual or office. Style with tucked-in tops and ankle boots." },
  { name: "Straight Jeans", brand: "", category: "bottoms", color: "Dark Denim", hex: "#3A4A5C", owned: true, notes: "Your most versatile denim. Dress up or down. Tuck in tops for a polished look." },
  { name: "Cropped Straight Jeans", brand: "", category: "bottoms", color: "Dark Denim", hex: "#3A4A5C", owned: true, notes: "Show off ankle boots beautifully. Great casual-to-smart option." },
  { name: "Barrel Leg Jeans", brand: "", category: "bottoms", color: "Dark Denim", hex: "#3A4A5C", owned: true, notes: "Relaxed and on-trend. Style with fitted tops to balance the volume." },
  { name: "Wide Leg Trouser Jeans", brand: "", category: "bottoms", color: "Dark Denim", hex: "#3A4A5C", owned: true, notes: "Elevated denim. Tuck in tops and wear with boots or flats." },
  { name: "Cream / Off-White Jeans", brand: "", category: "bottoms", color: "Warm Cream", hex: "#E8D5B0", owned: true, notes: "Brighten and balance dark or olive tops. A surprising workhorse." },
  { name: "Washable Silk Midi Skirt", brand: "Quince", category: "bottoms", color: "Hot Fudge (Chocolate)", hex: "#5C3317", owned: true, notes: "Incredibly versatile. Goes from casual (tanks) to office (Sézane shirt) to evening (cami + heels)." },
  { name: "Leopard Print Midi Skirt", brand: "", category: "bottoms", color: "Leopard / Tan & Brown", hex: "#C19A5B", owned: true, notes: "A neutral in disguise. Pairs with olive, cream, and caramel tops beautifully." },
  { name: "Camel Suede Mini Skirt", brand: "", category: "bottoms", color: "Camel", hex: "#C19A5B", owned: true, notes: "Suede texture is very Dark Autumn. Style with olive, rust, or cream tops and tall boots." },
  // Outerwear
  { name: "Will Jacket", brand: "Sézane", category: "outerwear", color: "Camel Suede", hex: "#C19A5B", owned: true, notes: "Your most elevated outerwear. Transforms any outfit. Treat it as a neutral — it goes with everything." },
  { name: "Wool Coat", brand: "", category: "outerwear", color: "Camel / Light Brown", hex: "#C19A5B", owned: true, notes: "For colder days. Layer over everything." },
  { name: "Denim Jacket", brand: "", category: "outerwear", color: "Medium Wash", hex: "#3A4A5C", owned: true, notes: "Casual layer. Best with skirts and olive or cream tops." },
  { name: "Rust Blazer", brand: "", category: "outerwear", color: "Rust / Terracotta", hex: "#9B4A2A", owned: false, notes: "Your most needed gap piece. Would instantly elevate your work wardrobe and add the rust energy you love without committing to head-to-toe rust." },
  { name: "Olive Bomber Jacket", brand: "", category: "outerwear", color: "Olive Green", hex: "#6B7A3A", owned: true, notes: "A casual-cool layer. Great with skirts and silk for that dressed-down-dressed-up contrast." },
  // Dresses
  { name: "Dark Olive A-Line Mini Dress", brand: "", category: "dresses", color: "Dark Olive", hex: "#4A5228", owned: true, notes: "A strong standalone look. Layer with Will jacket or cardigan for office." },
  { name: "Rust or Terracotta Midi Dress", brand: "", category: "dresses", color: "Rust / Terracotta", hex: "#B85C38", owned: false, notes: "Would add warmth and versatility. Great for evening or dressed-down with sneakers." },
  { name: "Lightweight Shirt Dress", brand: "", category: "dresses", color: "Olive or Teal", hex: "#6B7A3A", owned: false, notes: "A summer-into-fall transition piece. Olive would be most versatile for your palette." },
  { name: "Striped T-Shirt Midi Dress", brand: "Talbots", category: "dresses", color: "Garnet & White", hex: "#9B4A2A", owned: true, notes: "A fun pattern in your palette. Dress up with ankle boots or keep casual with Stan Smiths." },
  // Shoes
  { name: "White Stan Smiths", brand: "Adidas", category: "shoes", color: "White", hex: "#E8E4DC", owned: true, notes: "Your everyday casual shoe. Grounds looks and adds lightness." },
  { name: "Dark Brown Ballet Flats", brand: "", category: "shoes", color: "Dark Brown", hex: "#5C3317", owned: true, notes: "Elegant and versatile. Work well with almost every bottom." },
  { name: "Caramel Huaraches", brand: "", category: "shoes", color: "Caramel", hex: "#A0682A", owned: true, notes: "A brilliant warm-weather sandal. Adds warmth and texture." },
  { name: "Pointed Ballet Flats", brand: "Rothy's", category: "shoes", color: "Leopard Print", hex: "#C19A5B", owned: true, notes: "A neutral shoe that adds subtle pattern interest. Great with solid looks." },
  { name: "Heels", brand: "", category: "shoes", color: "Neutral", hex: "#5C3317", owned: true, notes: "Reserve for work presentations or special evenings." },
  { name: "Mona Ankle Boot", brand: "Vagabond", category: "shoes", color: "Dark Brown Suede", hex: "#5C3317", owned: true, notes: "Your fall/winter workhorse boot. Goes with everything." },
  { name: "Gia Tall Boot", brand: "Loeffler Randall", category: "shoes", color: "Cognac Leather", hex: "#A0682A", owned: true, notes: "A statement boot. Best with mini skirts or over straight/cropped jeans." },
  // Accessories
  { name: "Gold Jewelry Collection", brand: "", category: "accessories", color: "Antique Gold", hex: "#B08030", owned: true, notes: "Antique or matte gold suits Dark Autumn better than bright yellow gold. Layer necklaces and mix ring sizes." },
  { name: "Brown Leather Belt", brand: "", category: "accessories", color: "Chocolate Brown", hex: "#5C3317", owned: true, notes: "Use to define the waist on looser tops or with tucked-in shirts. A small but powerful detail." },
  { name: "Brown Leather Crossbody", brand: "", category: "accessories", color: "Chocolate Brown", hex: "#5C3317", owned: true, notes: "Practical and cohesive. Grounds the look with a rich brown anchor." },
  { name: "Lightweight Woven Scarf", brand: "", category: "accessories", color: "Rust + Olive Multi", hex: "#9B4A2A", owned: true, notes: "Adds pattern and warmth. Tie in hair, drape over shoulders, or wrap loosely." },
];

/** @internal Used only for first-load seeding */
export const SEED_OUTFITS: Array<{
  name: string;
  occasion_id: string;
  temp: string;
  pieces: OutfitPiece[];
  notes: string;
}> = [
  // Casual Everyday
  { name: "Tonal Brown", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Cashmere Tee", color: "Brown", hex: "#5C3317" }, { name: "Brown Wide-Leg Pants", color: "Brown", hex: "#5C3317" }, { name: "Mona Ankle Boot", color: "Dark Brown", hex: "#5C3317" }], notes: "Monochromatic brown — very rich and intentional for Dark Autumn." },
  { name: "Olive & Cream", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Olive Long Sleeve Top", color: "Olive", hex: "#6B7A3A" }, { name: "Cream Jeans", color: "Cream", hex: "#E8D5B0" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "A bright-feeling combo that stays grounded. Great for daytime." },
  { name: "Denim on Denim", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Cream Cami", color: "Cream", hex: "#E8D5B0" }, { name: "Dark Denim Button-Up (open, layered)", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Straight Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "Break the denim-on-denim with a cream cami underneath. Add a belt for definition." },
  { name: "Warm Layers", occasion_id: "casual", temp: "Cold", pieces: [{ name: "Wedge Tee", color: "Chocolate", hex: "#4A2410" }, { name: "Girlfriend Cardigan", color: "Brown", hex: "#5C3317" }, { name: "Straight Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Mona Ankle Boot", color: "Dark Brown", hex: "#5C3317" }], notes: "A cozy, layered look in your warmest browns. Very Dark Autumn." },
  { name: "Olive Mini Dress", occasion_id: "casual", temp: "Mild", pieces: [{ name: "Dark Olive A-Line Mini Dress", color: "Dark Olive", hex: "#4A5228" }, { name: "White Stan Smiths", color: "White", hex: "#E8E4DC" }], notes: "Simple and strong. The dark olive is a great standalone look." },
  { name: "Silk Skirt Casual", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Caramel Ribbed Tank", color: "Caramel", hex: "#A0682A" }, { name: "Washable Silk Midi Skirt", color: "Chocolate", hex: "#5C3317" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "Casual but elevated. The silk skirt makes any top feel more intentional." },
  { name: "Leopard Midi", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Cashmere Tee (tucked)", color: "Brown", hex: "#5C3317" }, { name: "Leopard Print Midi Skirt", color: "Leopard", hex: "#C19A5B" }, { name: "Mona Ankle Boot", color: "Dark Brown", hex: "#5C3317" }], notes: "Leopard is a neutral here. Tuck the tee for a polished silhouette." },
  { name: "Camel Mini", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Olive Long Sleeve Top (tucked)", color: "Olive", hex: "#6B7A3A" }, { name: "Camel Suede Mini Skirt", color: "Camel", hex: "#C19A5B" }, { name: "Gia Tall Boot", color: "Cognac", hex: "#A0682A" }], notes: "Rich autumn pairing. The tall boot with mini skirt is a great proportion play." },
  { name: "Rust & Denim", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Linen High-Neck Tank", color: "Rust", hex: "#9B4A2A" }, { name: "Straight Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Mona Ankle Boot", color: "Dark Brown", hex: "#5C3317" }], notes: "Rust and dark denim is a classic Dark Autumn combination." },
  { name: "Cream & Will Jacket", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Cream Long Sleeve Top", color: "Cream", hex: "#E8D5B0" }, { name: "Straight Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Will Jacket", color: "Camel", hex: "#C19A5B" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "The Will jacket transforms a simple cream + denim into something special." },
  { name: "Barrel & Will Jacket", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Caramel Ribbed Tank (tucked)", color: "Caramel", hex: "#A0682A" }, { name: "Barrel Leg Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Will Jacket", color: "Camel", hex: "#C19A5B" }, { name: "White Stan Smiths", color: "White", hex: "#E8E4DC" }], notes: "Relaxed silhouette elevated by the Will jacket. Sneakers keep it casual." },
  { name: "Leopard & Cardigan", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Cream Long Sleeve Top (tucked)", color: "Cream", hex: "#E8D5B0" }, { name: "Leopard Print Midi Skirt", color: "Leopard", hex: "#C19A5B" }, { name: "Girlfriend Cardigan (open)", color: "Brown", hex: "#5C3317" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "The cardigan adds a cozy layer that ties the brown tones together." },
  { name: "Wedge Tee & Trousers", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Wedge Tee", color: "Chocolate", hex: "#4A2410" }, { name: "Brown Wide-Leg Pants", color: "Brown", hex: "#5C3317" }, { name: "Mona Ankle Boot", color: "Dark Brown", hex: "#5C3317" }], notes: "Tonal and polished. The wedge hem tucked into trousers looks intentional." },
  { name: "Olive Utility & Denim", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Cream Cami", color: "Cream", hex: "#E8D5B0" }, { name: "Utility Straight-Leg Pant", color: "Deep Olive", hex: "#4A5228" }, { name: "Olive Bomber Jacket", color: "Olive", hex: "#6B7A3A" }, { name: "White Stan Smiths", color: "White", hex: "#E8E4DC" }], notes: "Tonal olive with a cream anchor. Casual and cohesive." },
  { name: "Bomber & Silk Skirt", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Cream Cami (tucked)", color: "Cream", hex: "#E8D5B0" }, { name: "Washable Silk Midi Skirt", color: "Chocolate", hex: "#5C3317" }, { name: "Olive Bomber Jacket", color: "Olive", hex: "#6B7A3A" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "High-low contrast — the bomber over the silk skirt is a great casual-chic move." },
  { name: "Bomber & Camel Mini", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Caramel Ribbed Tank (tucked)", color: "Caramel", hex: "#A0682A" }, { name: "Camel Suede Mini Skirt", color: "Camel", hex: "#C19A5B" }, { name: "Olive Bomber Jacket", color: "Olive", hex: "#6B7A3A" }, { name: "Gia Tall Boot", color: "Cognac", hex: "#A0682A" }], notes: "Olive + camel is peak Dark Autumn. The tall boot finishes the look." },
  { name: "Garnet Stripe Dress", occasion_id: "casual", temp: "Mild", pieces: [{ name: "Striped T-Shirt Midi Dress", color: "Garnet & White", hex: "#9B4A2A" }, { name: "Mona Ankle Boot", color: "Dark Brown", hex: "#5C3317" }], notes: "A standalone look. The stripe dress is fun and pattern-forward." },
  { name: "Garnet Stripe & Stan Smiths", occasion_id: "casual", temp: "Mild", pieces: [{ name: "Striped T-Shirt Midi Dress", color: "Garnet & White", hex: "#9B4A2A" }, { name: "White Stan Smiths", color: "White", hex: "#E8E4DC" }], notes: "More casual version with sneakers. Great for weekend." },
  { name: "Cream & Olive Layers", occasion_id: "casual", temp: "Cool", pieces: [{ name: "Cream Long Sleeve Top", color: "Cream", hex: "#E8D5B0" }, { name: "Olive Sweater Tank (over)", color: "Olive", hex: "#6B7A3A" }, { name: "Straight Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "Layer the sweater tank over the long sleeve for a textured, dimensional look." },
  // Work / Office
  { name: "Professional Cool", occasion_id: "work", temp: "Cool", pieces: [{ name: "Sézane Chloé Shirt", color: "Ecru", hex: "#D4C4A0" }, { name: "Utility Straight-Leg Pant", color: "Deep Olive", hex: "#4A5228" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "Your most polished casual-work look. The Sézane shirt elevates the olive trousers instantly." },
  { name: "Silk Skirt Work", occasion_id: "work", temp: "Cool", pieces: [{ name: "Sézane Chloé Shirt (tucked)", color: "Ecru", hex: "#D4C4A0" }, { name: "Washable Silk Midi Skirt", color: "Chocolate", hex: "#5C3317" }, { name: "Heels", color: "Neutral", hex: "#5C3317" }], notes: "Elevated and feminine. The Sézane shirt + silk skirt is a near-perfect office look." },
  { name: "Camel Mini Work", occasion_id: "work", temp: "Cool", pieces: [{ name: "Cream Long Sleeve Top (tucked)", color: "Cream", hex: "#E8D5B0" }, { name: "Camel Suede Mini Skirt", color: "Camel", hex: "#C19A5B" }, { name: "Gia Tall Boot", color: "Cognac", hex: "#A0682A" }], notes: "The tall boot brings mini skirts into office-appropriate territory." },
  { name: "Olive Dress + Layer", occasion_id: "work", temp: "Cool", pieces: [{ name: "Dark Olive A-Line Mini Dress", color: "Dark Olive", hex: "#4A5228" }, { name: "Girlfriend Cardigan (open)", color: "Brown", hex: "#5C3317" }, { name: "Heels", color: "Neutral", hex: "#5C3317" }], notes: "The cardigan adds polish and warmth to the dress for an office setting." },
  { name: "Rust Blazer Hero", occasion_id: "work", temp: "Cool", pieces: [{ name: "Cream Cami (✦ with rust blazer)", color: "Cream", hex: "#E8D5B0" }, { name: "Utility Straight-Leg Pant", color: "Deep Olive", hex: "#4A5228" }, { name: "Rust Blazer (GAP)", color: "Rust", hex: "#9B4A2A" }, { name: "Heels", color: "Neutral", hex: "#5C3317" }], notes: "Your highest-impact gap outfit. The rust blazer over cream and olive is a standout work look." },
  { name: "Rust Tank & Trousers", occasion_id: "work", temp: "Mild", pieces: [{ name: "Linen High-Neck Tank", color: "Rust", hex: "#9B4A2A" }, { name: "Brown Wide-Leg Pants", color: "Brown", hex: "#5C3317" }, { name: "Heels", color: "Neutral", hex: "#5C3317" }], notes: "Rust and brown is a rich, sophisticated combination for warmer office days." },
  { name: "Crewneck & Olive Pants", occasion_id: "work", temp: "Cool", pieces: [{ name: "Cashmere Crewneck", color: "Oatmeal", hex: "#D4C4A0" }, { name: "Utility Straight-Leg Pant", color: "Deep Olive", hex: "#4A5228" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "A classic elevated casual-office look. The oatmeal crewneck and olive trousers are very cohesive." },
  { name: "Leopard Skirt Work", occasion_id: "work", temp: "Cool", pieces: [{ name: "Cream Long Sleeve Top (tucked)", color: "Cream", hex: "#E8D5B0" }, { name: "Leopard Print Midi Skirt", color: "Leopard", hex: "#C19A5B" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "The midi length and ballet flats keep leopard office-appropriate. Confident and polished." },
  { name: "Rust Tank & Wide Legs", occasion_id: "work", temp: "Mild", pieces: [{ name: "Linen High-Neck Tank", color: "Rust", hex: "#9B4A2A" }, { name: "Wide Leg Trouser Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Mona Ankle Boot", color: "Dark Brown", hex: "#5C3317" }], notes: "Smart-casual. Rust and dark denim with a structured boot looks pulled-together." },
  { name: "Denim Shirt & Olive", occasion_id: "work", temp: "Cool", pieces: [{ name: "Dark Denim Button-Up Shirt (tucked)", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Utility Straight-Leg Pant", color: "Deep Olive", hex: "#4A5228" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "Denim + olive is a subtle, interesting combination. A more relaxed work look." },
  // Weekend Errands
  { name: "Effortless Olive", occasion_id: "weekend", temp: "Cool", pieces: [{ name: "Olive Sweater Tank", color: "Olive", hex: "#6B7A3A" }, { name: "Straight Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "White Stan Smiths", color: "White", hex: "#E8E4DC" }], notes: "An easy grab-and-go. Olive + dark denim + white sneakers is endlessly wearable." },
  { name: "Weekend Uniform", occasion_id: "weekend", temp: "Mild", pieces: [{ name: "Cashmere Tee", color: "Brown", hex: "#5C3317" }, { name: "Barrel Leg Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "White Stan Smiths", color: "White", hex: "#E8E4DC" }], notes: "Your true weekend uniform. Effortless and put-together." },
  { name: "Leopard Weekend", occasion_id: "weekend", temp: "Mild", pieces: [{ name: "Olive Sweater Tank", color: "Olive", hex: "#6B7A3A" }, { name: "Leopard Print Midi Skirt", color: "Leopard", hex: "#C19A5B" }, { name: "White Stan Smiths", color: "White", hex: "#E8E4DC" }], notes: "Olive + leopard is unexpectedly great. Sneakers keep it casual." },
  { name: "Dark & Easy", occasion_id: "weekend", temp: "Cool", pieces: [{ name: "Wedge Tee", color: "Chocolate", hex: "#4A2410" }, { name: "Straight Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Mona Ankle Boot", color: "Dark Brown", hex: "#5C3317" }], notes: "An easy tonal dark look. Very low effort, high result." },
  { name: "Rust Errand Day", occasion_id: "weekend", temp: "Cool", pieces: [{ name: "Linen High-Neck Tank", color: "Rust", hex: "#9B4A2A" }, { name: "Barrel Leg Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "White Stan Smiths", color: "White", hex: "#E8E4DC" }], notes: "Rust makes even a simple jeans + sneaker outfit feel intentional." },
  { name: "Linen Saturday", occasion_id: "weekend", temp: "Mild", pieces: [{ name: "White Linen Shirt (half-tucked)", color: "Cream", hex: "#E8D5B0" }, { name: "Cropped Straight Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Caramel Huaraches", color: "Caramel", hex: "#A0682A" }], notes: "A breezy, effortless weekend look. The huaraches add warmth and texture." },
  { name: "Crewneck & Barrel", occasion_id: "weekend", temp: "Cool", pieces: [{ name: "Cashmere Crewneck", color: "Oatmeal", hex: "#D4C4A0" }, { name: "Barrel Leg Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Mona Ankle Boot", color: "Dark Brown", hex: "#5C3317" }], notes: "A relaxed but put-together weekend look. The oatmeal and dark denim is a strong pairing." },
  { name: "Wedge Tee & Cream Jeans", occasion_id: "weekend", temp: "Cool", pieces: [{ name: "Wedge Tee", color: "Chocolate", hex: "#4A2410" }, { name: "Cream / Off-White Jeans", color: "Cream", hex: "#E8D5B0" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "Chocolate + cream is a clean, warm contrast. Very wearable for errands." },
  { name: "Denim Jacket & Silk Skirt", occasion_id: "weekend", temp: "Cool", pieces: [{ name: "Olive Long Sleeve Top", color: "Olive", hex: "#6B7A3A" }, { name: "Washable Silk Midi Skirt", color: "Chocolate", hex: "#5C3317" }, { name: "Denim Jacket", color: "Denim", hex: "#3A4A5C" }, { name: "White Stan Smiths", color: "White", hex: "#E8E4DC" }], notes: "High-low — the silk skirt with a denim jacket and sneakers is a great weekend look." },
  { name: "Bomber & Jeans", occasion_id: "weekend", temp: "Cool", pieces: [{ name: "Rust Linen Tank (tucked)", color: "Rust", hex: "#9B4A2A" }, { name: "Straight Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Olive Bomber Jacket", color: "Olive", hex: "#6B7A3A" }, { name: "White Stan Smiths", color: "White", hex: "#E8E4DC" }], notes: "Rust and olive together are a peak Dark Autumn combination." },
  { name: "Garnet Stripe Errands", occasion_id: "weekend", temp: "Mild", pieces: [{ name: "Striped T-Shirt Midi Dress", color: "Garnet & White", hex: "#9B4A2A" }, { name: "White Stan Smiths", color: "White", hex: "#E8E4DC" }], notes: "An effortless one-and-done weekend look. Grab and go." },
  { name: "Rust Tank & Cream Jeans", occasion_id: "weekend", temp: "Mild", pieces: [{ name: "Linen High-Neck Tank", color: "Rust", hex: "#9B4A2A" }, { name: "Cream / Off-White Jeans", color: "Cream", hex: "#E8D5B0" }, { name: "Caramel Huaraches", color: "Caramel", hex: "#A0682A" }], notes: "Warm and fresh. A great mild-day look with the sandals." },
  // Going Out / Dinner
  { name: "Silk Skirt Evening", occasion_id: "dinner", temp: "Mild", pieces: [{ name: "Cream Cami (tucked, ✦ hero piece)", color: "Cream", hex: "#E8D5B0" }, { name: "Washable Silk Midi Skirt", color: "Chocolate", hex: "#5C3317" }, { name: "Heels", color: "Neutral", hex: "#5C3317" }], notes: "Your most elegant casual-evening look. The silk skirt transforms the cami into something special." },
  { name: "Dark & Moody", occasion_id: "dinner", temp: "Cool", pieces: [{ name: "Cashmere Tee", color: "Brown", hex: "#5C3317" }, { name: "Brown Wide-Leg Pants", color: "Brown", hex: "#5C3317" }, { name: "Mona Ankle Boot", color: "Dark Brown", hex: "#5C3317" }, { name: "Woven Scarf", color: "Rust + Olive", hex: "#9B4A2A" }], notes: "Tonal dark brown with a scarf for interest. Very intentional and moody." },
  { name: "Linen Evening", occasion_id: "dinner", temp: "Mild", pieces: [{ name: "White Linen Shirt (open, ✦)", color: "Cream", hex: "#E8D5B0" }, { name: "Washable Silk Midi Skirt", color: "Chocolate", hex: "#5C3317" }, { name: "Heels", color: "Neutral", hex: "#5C3317" }], notes: "The linen shirt open over the silk skirt is elegant and relaxed simultaneously." },
  { name: "Rust & Brown Evening", occasion_id: "dinner", temp: "Mild", pieces: [{ name: "Linen High-Neck Tank", color: "Rust", hex: "#9B4A2A" }, { name: "Brown Wide-Leg Pants", color: "Brown", hex: "#5C3317" }, { name: "Heels", color: "Neutral", hex: "#5C3317" }], notes: "A strong, confident evening look. Rust over brown is very Dark Autumn." },
  { name: "Leopard Evening", occasion_id: "dinner", temp: "Cool", pieces: [{ name: "Cashmere Tee (tucked)", color: "Brown", hex: "#5C3317" }, { name: "Leopard Print Midi Skirt", color: "Leopard", hex: "#C19A5B" }, { name: "Gia Tall Boot", color: "Cognac", hex: "#A0682A" }], notes: "Leopard + cognac boot is a sophisticated evening combination." },
  { name: "Chloé & Camel Mini", occasion_id: "dinner", temp: "Cool", pieces: [{ name: "Sézane Chloé Shirt (open, ✦)", color: "Ecru", hex: "#D4C4A0" }, { name: "Camel Suede Mini Skirt", color: "Camel", hex: "#C19A5B" }, { name: "Gia Tall Boot", color: "Cognac", hex: "#A0682A" }], notes: "The Sézane shirt open over the camel mini with tall boots is a confident evening look." },
  { name: "Olive Dress Evening", occasion_id: "dinner", temp: "Cool", pieces: [{ name: "Dark Olive A-Line Mini Dress", color: "Dark Olive", hex: "#4A5228" }, { name: "Will Jacket (open)", color: "Camel", hex: "#C19A5B" }, { name: "Gia Tall Boot", color: "Cognac", hex: "#A0682A" }], notes: "The Will jacket elevates the dress for evening. A very polished look." },
  { name: "Crewneck & Silk Skirt", occasion_id: "dinner", temp: "Cool", pieces: [{ name: "Cashmere Crewneck", color: "Oatmeal", hex: "#D4C4A0" }, { name: "Washable Silk Midi Skirt", color: "Chocolate", hex: "#5C3317" }, { name: "Pointed Ballet Flats", color: "Leopard", hex: "#C19A5B" }], notes: "A relaxed but elevated evening look. The silk skirt with leopard flats adds unexpected interest." },
  { name: "Wedge Tee & Wide Legs", occasion_id: "dinner", temp: "Cool", pieces: [{ name: "Wedge Tee", color: "Chocolate", hex: "#4A2410" }, { name: "Wide Leg Trouser Jeans", color: "Dark Denim", hex: "#3A4A5C" }, { name: "Gia Tall Boot", color: "Cognac", hex: "#A0682A" }], notes: "Dark and polished. The wide-leg jeans with tall boots is a strong evening silhouette." },
  { name: "Bomber & Leopard Skirt", occasion_id: "dinner", temp: "Cool", pieces: [{ name: "Cashmere Tee (tucked)", color: "Brown", hex: "#5C3317" }, { name: "Leopard Print Midi Skirt", color: "Leopard", hex: "#C19A5B" }, { name: "Olive Bomber Jacket", color: "Olive", hex: "#6B7A3A" }, { name: "Dark Brown Ballet Flats", color: "Dark Brown", hex: "#5C3317" }], notes: "The bomber over a leopard skirt is unexpected and great for a casual dinner." },
];

// ─── Legacy re-exports for backward compat during migration ──

/** @deprecated Use categoryDefs + DB data instead */
export const wardrobeCategories: WardrobeCategory[] = categoryDefs.map((def) => ({
  ...def,
  items: [],
}));

/** @deprecated Use occasionDefs + DB data instead */
export const occasions: Occasion[] = occasionDefs.map((def) => ({
  ...def,
  outfits: [],
}));
