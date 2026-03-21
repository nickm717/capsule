import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { occasions, temperatureBadges } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import OutfitBuilder from "./OutfitBuilder";

interface CustomOutfit {
  id: string;
  name: string;
  pieces: { name: string; color: string; hex: string }[];
  temp: string;
  notes: string;
  occasion_id: string;
}

const OutfitCombinations = () => {
  const [activeOccasion, setActiveOccasion] = useState(occasions[0].id);
  const [showBuilder, setShowBuilder] = useState(false);
  const [customOutfits, setCustomOutfits] = useState<CustomOutfit[]>([]);

  const fetchCustom = useCallback(async () => {
    const { data } = await supabase
      .from("custom_outfits")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCustomOutfits(data as unknown as CustomOutfit[]);
  }, []);

  useEffect(() => {
    fetchCustom();
  }, [fetchCustom]);

  if (showBuilder) {
    return (
      <OutfitBuilder
        onBack={() => setShowBuilder(false)}
        onSaved={() => {
          setShowBuilder(false);
          fetchCustom();
        }}
      />
    );
  }

  const current = occasions.find((o) => o.id === activeOccasion)!;
  const customForOccasion = customOutfits.filter((o) => o.occasion_id === activeOccasion);
  const totalCustom = customOutfits.length;

  return (
    <div className="px-4 pb-6 space-y-5">
      <div className="pt-2 animate-reveal-up flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground text-balance">Outfit Combinations</h2>
          <p className="text-secondary text-sm mt-1">
            {occasions.reduce((s, o) => s + o.outfits.length, 0) + totalCustom} curated looks across {occasions.length} occasions
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="mt-1 p-2 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 active:scale-[0.95] transition-all"
          aria-label="Add outfit"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Occasion tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 animate-reveal-up" style={{ animationDelay: "60ms" }}>
        {occasions.map((occ) => (
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

      {/* Custom outfits */}
      {customForOccasion.map((outfit, i) => {
        const tempBadge = temperatureBadges[outfit.temp];
        return (
          <div
            key={outfit.id}
            className="bg-card rounded-xl p-4 border border-border animate-reveal-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-2.5">
              <div>
                <h3 className="text-foreground font-medium text-base">{outfit.name}</h3>
                <span className="text-[10px] font-medium uppercase tracking-wider text-primary">Custom</span>
              </div>
              {tempBadge && (
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
                  style={{ backgroundColor: tempBadge.bg, borderColor: tempBadge.border, color: tempBadge.text }}
                >
                  {outfit.temp} · {tempBadge.range}
                </span>
              )}
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

      {/* Static outfits */}
      {current.outfits.map((outfit, i) => {
        const tempBadge = temperatureBadges[outfit.temp];
        return (
          <div
            key={outfit.id}
            className={`bg-card rounded-xl p-4 border animate-reveal-up ${
              outfit.isGap ? "border-dashed border-gold/40" : "border-border"
            }`}
            style={{ animationDelay: `${(i + customForOccasion.length) * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-2.5">
              <div>
                <h3 className="text-foreground font-medium text-base">{outfit.name}</h3>
                {outfit.isGap && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-gold">Gap Outfit</span>
                )}
              </div>
              {tempBadge && (
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
                  style={{ backgroundColor: tempBadge.bg, borderColor: tempBadge.border, color: tempBadge.text }}
                >
                  {outfit.temp} · {tempBadge.range}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm mb-3">{outfit.notes}</p>
            {outfit.upgrade && <p className="text-gold text-xs mb-3 italic">{outfit.upgrade}</p>}
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
    </div>
  );
};

export default OutfitCombinations;
