import { createContext, useContext } from "react";
import { usePalette, DEFAULT_PALETTE, type UsePaletteResult } from "@/hooks/use-palette";

const PaletteContext = createContext<UsePaletteResult>({
  palette: DEFAULT_PALETTE,
  loading: true,
  seasonalType: null,
  addColor: async () => {},
  addColors: async () => {},
  removeColor: async () => {},
  updateColor: async () => {},
  reorderColors: async () => {},
  selectSeasonalType: async () => {},
});

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const value = usePalette();
  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>;
}

export function usePaletteContext(): UsePaletteResult {
  return useContext(PaletteContext);
}
