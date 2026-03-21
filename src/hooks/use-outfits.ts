import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SEED_OUTFITS, type OutfitPiece } from "@/data/darkautumn";

export interface DbOutfit {
  id: string;
  name: string;
  temp: string;
  pieces: OutfitPiece[];
  notes: string;
  occasion_id: string;
  created_at: string;
}

let seedingStarted = false;

export function useOutfits() {
  const [outfits, setOutfits] = useState<DbOutfit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOutfits = useCallback(async () => {
    const { data } = await supabase
      .from("custom_outfits")
      .select("*")
      .order("created_at", { ascending: true });

    if (data) {
      if (data.length === 0 && !seedingStarted) {
        seedingStarted = true;
        const rows = SEED_OUTFITS.map((o) => ({
          name: o.name,
          occasion_id: o.occasion_id,
          temp: o.temp,
          pieces: o.pieces as any,
          notes: o.notes,
        }));
        const { error } = await supabase.from("custom_outfits").insert(rows);
        if (!error) {
          const { data: seeded } = await supabase
            .from("custom_outfits")
            .select("*")
            .order("created_at", { ascending: true });
          if (seeded) setOutfits(seeded as unknown as DbOutfit[]);
        }
      } else {
        setOutfits(data as unknown as DbOutfit[]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOutfits();
  }, [fetchOutfits]);

  return { outfits, loading, refetch: fetchOutfits };
}
