import { useAppData } from "@/contexts/AppDataContext";
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
  const { outfits, outfitsLoading, outfitsError, refreshOutfits } = useAppData();
  return {
    outfits,
    loading: outfitsLoading,
    error: outfitsError,
    refetch: refreshOutfits,
  };
}
