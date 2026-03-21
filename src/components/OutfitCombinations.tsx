import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, MoreHorizontal, CalendarPlus } from "lucide-react";
import { occasionDefs, temperatureBadges } from "@/data/darkautumn";
import OutfitBuilder from "./OutfitBuilder";
import AddToDaySheet from "./AddToDaySheet";
import { useOutfits, type DbOutfit } from "@/hooks/use-outfits";

const OutfitCombinations = ({ onBuilderOpen }: { onBuilderOpen?: (open: boolean) => void }) => {
  const [activeOccasion, setActiveOccasion] = useState(occasionDefs[0].id);
  const [showBuilder, setShowBuilder] = useState(false);
  const [menuOutfitId, setMenuOutfitId] = useState<string | null>(null);
  const [addToDayOutfit, setAddToDayOutfit] = useState<{ id: string; name: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { outfits, refetch } = useOutfits();

  const openBuilder = () => {
    setShowBuilder(true);
    onBuilderOpen?.(true);
  };

  const closeBuilder = () => {
    setShowBuilder(false);
    onBuilderOpen?.(false);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menuOutfitId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOutfitId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOutfitId]);

  if (showBuilder) {
    return (
      <OutfitBuilder
        onBack={closeBuilder}
        onSaved={() => {
          closeBuilder();
          refetch();
        }}
      />
    );
  }

  const outfitsForOccasion = outfits.filter((o) => o.occasion_id === activeOccasion);

  return (
    <div className="px-4 pb-6 space-y-5">
      <div className="pt-2 animate-reveal-up flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground text-balance">Outfits</h2>
          <p className="text-secondary text-sm mt-1">
            {outfits.length} curated looks across {occasionDefs.length} occasions
          </p>
        </div>
        <button
          onClick={openBuilder}
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center active:scale-[0.95] transition-all shadow-md"
          style={{ backgroundColor: "#B08030" }}
          aria-label="Add outfit"
        >
          <Plus size={22} color="#141008" strokeWidth={2.5} />
        </button>
      </div>

      {/* Occasion tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 animate-reveal-up" style={{ animationDelay: "60ms" }}>
        {occasionDefs.map((occ) => (
          <button
            key={occ.id}
            onClick={() => setActiveOccasion(occ.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.96] ${
              activeOccasion === occ.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="mr-1.5">{occ.icon}</span>
            {occ.label}
          </button>
        ))}
      </div>

      {/* Outfit cards */}
      {outfitsForOccasion.map((outfit, i) => {
        const tempBadge = temperatureBadges[outfit.temp];
        return (
          <div
            key={outfit.id}
            className="bg-card rounded-xl p-4 border border-border animate-reveal-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex-1 min-w-0">
                <h3 className="text-foreground font-medium text-base">{outfit.name}</h3>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {tempBadge && (
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
                    style={{ backgroundColor: tempBadge.bg, borderColor: tempBadge.border, color: tempBadge.text }}
                  >
                    {outfit.temp} · {tempBadge.range}
                  </span>
                )}
                <div className="relative">
                  <button
                    onClick={() => setMenuOutfitId(menuOutfitId === outfit.id ? null : outfit.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-[0.92]"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {menuOutfitId === outfit.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-8 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[140px] animate-reveal-up"
                    >
                      <button
                        onClick={() => {
                          setMenuOutfitId(null);
                          setAddToDayOutfit({ id: outfit.id, name: outfit.name });
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors active:scale-[0.98]"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-muted-foreground" />
                        Add to day
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {outfit.notes && <p className="text-muted-foreground text-sm mb-3">{outfit.notes}</p>}
            <div className="flex flex-wrap gap-1.5">
              {outfit.pieces.map((piece, pi) => (
                <div key={pi} className="flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1">
                  <span className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: piece.hex }} />
                  <span className="text-xs text-foreground">{piece.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {outfitsForOccasion.length === 0 && (
        <div className="text-center py-16 animate-reveal-up">
          <p className="text-muted-foreground text-sm">No outfits for this occasion yet.</p>
        </div>
      )}

      <AddToDaySheet
        open={!!addToDayOutfit}
        outfit={addToDayOutfit}
        onClose={() => setAddToDayOutfit(null)}
      />
    </div>
  );
};

export default OutfitCombinations;
