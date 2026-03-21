// PASTE YOUR WARDROBE AND OUTFIT DATA HERE

export interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  color: string;
  colorHex?: string;
  season?: string;
  image?: string;
}

export interface OutfitCombination {
  id: string;
  name: string;
  occasion: string;
  items: string[]; // references WardrobeItem ids
  description?: string;
}

export interface DayPlan {
  day: string;
  outfitId: string;
  notes?: string;
}

// Placeholder data — replace with your own
export const wardrobeItems: WardrobeItem[] = [];

export const outfitCombinations: OutfitCombination[] = [];

export const weeklyPlan: DayPlan[] = [];
