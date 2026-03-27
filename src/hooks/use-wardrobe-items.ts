import { useMemo } from "react";
import { categoryDefs, type WardrobeItem, type WardrobeCategory } from "@/data/darkautumn";
import { useAppData } from "@/contexts/AppDataContext";

export function useWardrobeItems() {
  const { wardrobeItems, wardrobeLoading, wardrobeError, refreshWardrobe } = useAppData();

  const categories: (WardrobeCategory & { rows: any[] })[] = useMemo(
    () =>
      categoryDefs.map((cat) => {
        const catItems = wardrobeItems.filter((row) => row.category === cat.id);
        const mapped: WardrobeItem[] = catItems.map((row) => ({
          id: row.id,
          name: row.name,
          brand: row.brand || undefined,
          color: row.color,
          hex: row.hex,
          owned: row.owned,
          gap: !row.owned,
          notes: row.notes || "",
        }));
        return { ...cat, items: mapped, rows: catItems };
      }),
    [wardrobeItems]
  );

  return {
    items: wardrobeItems,
    categories,
    loading: wardrobeLoading,
    error: wardrobeError,
    refetch: refreshWardrobe,
  };
}
