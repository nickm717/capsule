import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { categoryDefs, type WardrobeItem, type WardrobeCategory } from "@/data/darkautumn";

export function useWardrobeItems() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("custom_items")
      .select("*")
      .order("created_at", { ascending: true });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setItems(data ?? []);
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

  return { items, categories, loading, error, refetch: fetchItems };
}
