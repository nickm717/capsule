import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ColorSwatch } from "@/data/darkautumn";
import { SEASONAL_PALETTES } from "@/data/seasonal-palettes";

export const DEFAULT_PALETTE: ColorSwatch[] = [
  { name: "Espresso",     hex: "#3B1F14" },
  { name: "Burnt Sienna", hex: "#8B3A2A" },
  { name: "Terracotta",   hex: "#C2622D" },
  { name: "Warm Rust",    hex: "#A0522D" },
  { name: "Olive Brown",  hex: "#5C4A1E" },
  { name: "Forest Moss",  hex: "#4A5240" },
  { name: "Deep Teal",    hex: "#2C4A52" },
  { name: "Aubergine",    hex: "#4B2E3E" },
  { name: "Warm Taupe",   hex: "#8C7B6B" },
  { name: "Cream",        hex: "#E8DCC8" },
];

export interface UsePaletteResult {
  palette: ColorSwatch[];
  loading: boolean;
  seasonalType: string | null;
  addColor: (hex: string, name: string) => Promise<void>;
  addColors: (entries: ColorSwatch[]) => Promise<void>;
  removeColor: (hex: string) => Promise<void>;
  updateColor: (oldHex: string, newHex: string, name: string) => Promise<void>;
  reorderColors: (newOrder: ColorSwatch[]) => Promise<void>;
  selectSeasonalType: (typeId: string) => Promise<void>;
}

async function upsertProfile(
  userId: string,
  palette: ColorSwatch[],
  seasonalType: string | null,
) {
  await supabase
    .from("user_profiles")
    .upsert(
      { id: userId, palette: palette as any, seasonal_type: seasonalType },
      { onConflict: "id" },
    );
}

export function usePalette(): UsePaletteResult {
  const { user } = useAuth();
  const [palette, setPalette] = useState<ColorSwatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonalType, setSeasonalType] = useState<string | null>(null);

  useEffect(() => {
    setPalette(DEFAULT_PALETTE);
    setSeasonalType(null);
    setLoading(true);

    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("palette, seasonal_type")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (data?.palette && Array.isArray(data.palette) && data.palette.length > 0) {
          setPalette(data.palette as ColorSwatch[]);
        } else {
          setPalette(DEFAULT_PALETTE);
        }
        setSeasonalType(data?.seasonal_type ?? null);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const addColor = useCallback(async (hex: string, name: string) => {
    if (!user) return;
    const entry: ColorSwatch = { hex, name: name.trim() || hex };
    const next = [...palette, entry];
    setPalette(next);
    await upsertProfile(user.id, next, seasonalType);
  }, [user, palette, seasonalType]);

  const addColors = useCallback(async (entries: ColorSwatch[]) => {
    if (!user || entries.length === 0) return;
    const next = [...palette, ...entries];
    setPalette(next);
    await upsertProfile(user.id, next, seasonalType);
  }, [user, palette, seasonalType]);

  const removeColor = useCallback(async (hex: string) => {
    if (!user) return;
    const next = palette.filter((c) => c.hex !== hex);
    setPalette(next);
    await upsertProfile(user.id, next, seasonalType);
  }, [user, palette, seasonalType]);

  const updateColor = useCallback(async (oldHex: string, newHex: string, name: string) => {
    if (!user) return;
    const next = palette.map((c) =>
      c.hex === oldHex ? { hex: newHex, name: name.trim() || newHex } : c
    );
    setPalette(next);
    await upsertProfile(user.id, next, seasonalType);
  }, [user, palette, seasonalType]);

  const reorderColors = useCallback(async (newOrder: ColorSwatch[]) => {
    if (!user) return;
    setPalette(newOrder);
    await upsertProfile(user.id, newOrder, seasonalType);
  }, [user, seasonalType]);

  const selectSeasonalType = useCallback(async (typeId: string) => {
    if (!user) return;
    const found = SEASONAL_PALETTES.find((p) => p.id === typeId);
    if (!found) return;
    setPalette(found.colors);
    setSeasonalType(typeId);
    await upsertProfile(user.id, found.colors, typeId);
  }, [user]);

  return { palette, loading, seasonalType, addColor, addColors, removeColor, updateColor, reorderColors, selectSeasonalType };
}
