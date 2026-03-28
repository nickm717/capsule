import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();

  const [wardrobeItems, setWardrobeItems] = useState<any[]>([]);
  const [wardrobeLoading, setWardrobeLoading] = useState(true);
  const [wardrobeError, setWardrobeError] = useState<string | null>(null);

  const [outfits, setOutfits] = useState<DbOutfit[]>([]);
  const [outfitsLoading, setOutfitsLoading] = useState(true);
  const [outfitsError, setOutfitsError] = useState<string | null>(null);

  const refreshWardrobe = useCallback(async () => {
    if (!user) return;
    setWardrobeLoading(true);
    setWardrobeError(null);
    const { data, error } = await supabase
      .from("custom_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) {
      setWardrobeError(error.message);
    } else {
      setWardrobeItems(data ?? []);
    }
    setWardrobeLoading(false);
  }, [user]);

  const refreshOutfits = useCallback(async () => {
    if (!user) return;
    setOutfitsLoading(true);
    setOutfitsError(null);
    const { data, error } = await supabase
      .from("custom_outfits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) {
      setOutfitsError(error.message);
    } else {
      setOutfits((data ?? []) as unknown as DbOutfit[]);
    }
    setOutfitsLoading(false);
  }, [user]);

  // Fetch once on mount — never refetches on tab switch since this provider
  // lives above the tab renderer and never unmounts.
  useEffect(() => {
    refreshWardrobe();
    refreshOutfits();
  }, [refreshWardrobe, refreshOutfits]);

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
