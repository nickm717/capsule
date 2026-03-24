import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DbOutfit } from "@/hooks/use-outfits";

interface AppDataContextValue {
  // Wardrobe
  wardrobeItems: any[];
  wardrobeLoading: boolean;
  wardrobeError: string | null;
  refreshWardrobe: () => Promise<void>;

  // Outfits
  outfits: DbOutfit[];
  outfitsLoading: boolean;
  outfitsError: string | null;
  refreshOutfits: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [wardrobeItems, setWardrobeItems] = useState<any[]>([]);
  const [wardrobeLoading, setWardrobeLoading] = useState(true);
  const [wardrobeError, setWardrobeError] = useState<string | null>(null);

  const [outfits, setOutfits] = useState<DbOutfit[]>([]);
  const [outfitsLoading, setOutfitsLoading] = useState(true);
  const [outfitsError, setOutfitsError] = useState<string | null>(null);

  const refreshWardrobe = useCallback(async () => {
    setWardrobeLoading(true);
    setWardrobeError(null);
    const { data, error } = await supabase
      .from("custom_items")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      setWardrobeError(error.message);
    } else {
      setWardrobeItems(data ?? []);
    }
    setWardrobeLoading(false);
  }, []);

  const refreshOutfits = useCallback(async () => {
    setOutfitsLoading(true);
    setOutfitsError(null);
    const { data, error } = await supabase
      .from("custom_outfits")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      setOutfitsError(error.message);
    } else {
      setOutfits((data ?? []) as unknown as DbOutfit[]);
    }
    setOutfitsLoading(false);
  }, []);

  // Fetch once on mount — never refetches on tab switch since this provider
  // lives above the tab renderer and never unmounts.
  useEffect(() => {
    refreshWardrobe();
    refreshOutfits();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppDataContext.Provider
      value={{
        wardrobeItems, wardrobeLoading, wardrobeError, refreshWardrobe,
        outfits, outfitsLoading, outfitsError, refreshOutfits,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}
