import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OutfitPiece } from "@/data/darkautumn";

export interface DbOutfit {
  id: string;
  name: string;
  temp: string;
  pieces: OutfitPiece[];
  notes: string;
  occasion_id: string;
  created_at: string;
}

export function useOutfits() {
  const [outfits, setOutfits] = useState<DbOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOutfits = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("custom_outfits")
      .select("*")
      .order("created_at", { ascending: true });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setOutfits((data ?? []) as unknown as DbOutfit[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOutfits();
  }, [fetchOutfits]);

  return { outfits, loading, error, refetch: fetchOutfits };
}
