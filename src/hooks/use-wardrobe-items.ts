import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SEED_WARDROBE_ITEMS, categoryDefs, type WardrobeItem, type WardrobeCategory } from "@/data/darkautumn";

let seedingStarted = false;

export function useWardrobeItems() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("custom_items")
      .select("*")
      .order("created_at", { ascending: true });

    if (data) {
      if (data.length === 0 && !seedingStarted) {
        seedingStarted = true;
        const { error } = await supabase.from("custom_items").insert(SEED_WARDROBE_ITEMS);
        if (!error) {
          const { data: seeded } = await supabase
            .from("custom_items")
            .select("*")
            .order("created_at", { ascending: true });
          if (seeded) setItems(seeded);
        }
      } else {
        setItems(data);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  /** Items grouped by category with WardrobeCategory shape */
  const categories: (WardrobeCategory & { rows: any[] })[] = categoryDefs.map((cat) => {
    const catItems = items.filter((row) => row.category === cat.id);
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
  });

  return { items, categories, loading, refetch: fetchItems };
}
