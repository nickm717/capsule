import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useOutfitWearCount(outfitId: string): { count: number; loading: boolean } {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !outfitId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const { count: c } = await supabase
        .from("planner_assignments")
        .select("*", { count: "exact", head: true })
        .eq("outfit_id", outfitId)
        .eq("user_id", user!.id);

      if (!cancelled) {
        setCount(c ?? 0);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [outfitId, user]);

  return { count, loading };
}

export function useItemWearCount(itemId: string): { count: number; loading: boolean } {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !itemId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      // Step 1: find outfits whose pieces JSONB contains an object with this item_id
      const { data: outfits } = await supabase
        .from("custom_outfits")
        .select("id")
        .contains("pieces", [{ item_id: itemId }])
        .eq("user_id", user!.id);

      if (!outfits || outfits.length === 0) {
        if (!cancelled) { setCount(0); setLoading(false); }
        return;
      }

      // Step 2: count planner_assignments referencing those outfits.
      // planner_assignments.outfit_id is text; outfit ids are uuid strings — string comparison works.
      const outfitIds = outfits.map((o) => String(o.id));

      const { count: c } = await supabase
        .from("planner_assignments")
        .select("*", { count: "exact", head: true })
        .in("outfit_id", outfitIds)
        .eq("user_id", user!.id);

      if (!cancelled) {
        setCount(c ?? 0);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [itemId, user]);

  return { count, loading };
}
