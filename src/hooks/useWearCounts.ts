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
      // Fetch all outfits with pieces and filter in JS — avoids broken JSONB
      // containment queries (.contains with nested objects returns empty).
      const [outfitsRes, assignmentsRes] = await Promise.all([
        supabase.from("custom_outfits").select("id, pieces").eq("user_id", user!.id),
        supabase.from("planner_assignments").select("outfit_id").eq("user_id", user!.id),
      ]);

      if (cancelled) return;

      const matchingIds = new Set(
        (outfitsRes.data ?? [])
          .filter(o => (o.pieces as { item_id?: string }[]).some(p => p.item_id === itemId))
          .map(o => String(o.id))
      );

      const c = (assignmentsRes.data ?? []).filter(a => matchingIds.has(a.outfit_id)).length;

      if (!cancelled) {
        setCount(c);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [itemId, user]);

  return { count, loading };
}
