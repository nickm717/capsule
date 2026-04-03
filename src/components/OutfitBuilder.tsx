import { useState, useMemo, useCallback, useEffect } from "react";
import { Check, Sparkles, X, Loader2 } from "lucide-react";
import { categoryDefs, temperatureBadges, occasionDefs, type WardrobeItem, type OutfitPiece } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { useWardrobeItems } from "@/hooks/use-wardrobe-items";
import { useOutfits } from "@/hooks/use-outfits";
import { usePaletteContext } from "@/contexts/PaletteContext";

const TEMP_OPTIONS = ["Cold", "Cool", "Mild", "Warm"] as const;
const TEMP_LEGEND: Record<string, string> = {
  Cold: "Below 40 °F",
  Cool: "40–60 °F",
  Mild: "60–70 °F",
  Warm: "70 °F+",
};

function suggestTemp(selectedItems: WardrobeItem[], categories: { id: string; items: WardrobeItem[] }[]): string {
  const hasOuterwear = selectedItems.some((item) => {
    const cat = categories.find((c) => c.items.some((i) => i.id === item.id));
    return cat?.id === "outerwear";
  });
  const hasHeavyLayers = selectedItems.some((item) => {
    const name = item.name.toLowerCase();
    return name.includes("coat") || name.includes("wool") || name.includes("cashmere crewneck");
  });
  if (hasOuterwear && hasHeavyLayers) return "Cold";
  if (hasOuterwear) return "Cool";
  const hasLightOnly = selectedItems.every((item) => {
    const name = item.name.toLowerCase();
    return name.includes("tank") || name.includes("cami") || name.includes("linen") || name.includes("sandal") || name.includes("huarache");
  });
  if (hasLightOnly && selectedItems.length > 0) return "Warm";
  return "Mild";
}

interface Props {
  onBack: () => void;
  onSaved: () => void;
  editOutfit?: { id: string; name: string; notes: string; temp: string; occasion_id: string; pieces: any[] } | null;
  preset?: { selectedIds: string[]; name: string; notes: string; temp: string; occasionId: string } | null;
}

const OutfitBuilder = ({ onBack, onSaved, editOutfit, preset }: Props) => {
  const { user } = useAuth();
  const isEdit = !!editOutfit;

  const { categories } = useWardrobeItems();
  const allItems = useMemo(() => categories.flatMap((c) => c.items), [categories]);
  const { outfits } = useOutfits();
  const { palette } = usePaletteContext();

  // Derive initial selected IDs from editOutfit pieces
  const initialIds = useMemo(() => {
    if (!editOutfit) return new Set<string>();
    const ids = new Set<string>();
    for (const p of editOutfit.pieces) {
      if (p.item_id && allItems.some((i) => i.id === p.item_id)) {
        ids.add(p.item_id);
      }
    }
    return ids;
  }, [editOutfit, allItems]);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState(editOutfit?.name ?? preset?.name ?? "");
  const [notes, setNotes] = useState(editOutfit?.notes ?? preset?.notes ?? "");
  const [tempOverride, setTempOverride] = useState<string | null>(editOutfit?.temp ?? preset?.temp ?? null);
  const [occasionId, setOccasionId] = useState(editOutfit?.occasion_id ?? preset?.occasionId ?? "casual");

  useSwipeBack(useCallback(() => {
    if (step === 2) setStep(1);
    else onBack();
  }, [step, onBack]));
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [presetApplied, setPresetApplied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");

  // Once allItems are loaded and we have an editOutfit, seed selectedIds
  useEffect(() => {
    if (editOutfit && allItems.length > 0 && !initialized) {
      setSelectedIds(initialIds);
      setInitialized(true);
    }
  }, [editOutfit, allItems, initialIds, initialized]);

  // Apply preset from AI generation and jump straight to step 2
  useEffect(() => {
    if (preset && allItems.length > 0 && !presetApplied) {
      const validIds = preset.selectedIds.filter((id) => allItems.some((i) => i.id === id));
      setSelectedIds(new Set(validIds));
      setPresetApplied(true);
      setStep(2);
    }
  }, [preset, allItems, presetApplied]);

  const selectedItems = useMemo(() => allItems.filter((i) => selectedIds.has(i.id)), [allItems, selectedIds]);
  const suggestedTemp = useMemo(() => suggestTemp(selectedItems, categories), [selectedItems, categories]);
  const activeTemp = tempOverride ?? suggestedTemp;

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredDisplayItems = useMemo(() => {
    let items =
      activeCategoryFilter === "all"
        ? allItems
        : allItems.filter((item) => {
            const cat = categories.find((c) => c.items.some((i) => i.id === item.id));
            return cat?.id === activeCategoryFilter;
          });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.color.toLowerCase().includes(q) ||
          (item.brand && item.brand.toLowerCase().includes(q))
      );
    }
    return items;
  }, [allItems, categories, activeCategoryFilter, searchQuery]);

  const generateAI = async () => {
    if (selectedItems.length === 0) {
      toast.error("Select pieces first");
      return;
    }
    setAiLoading(true);
    try {
      const pieces = selectedItems.map((i) => ({ name: i.name, color: i.color }));
      const { data, error } = await supabase.functions.invoke("generate-styling-note", {
        body: { pieces },
      });
      if (error) throw error;
      if (data?.name) setName(data.name);
      if (data?.note) setNotes(data.note);
    } catch (e) {
      console.error(e);
      toast.error("Could not generate");
    } finally {
      setAiLoading(false);
    }
  };

  const generateSuggest = async () => {
    if (selectedItems.length === 0) {
      toast.error("Select at least one piece first");
      return;
    }
    setSuggestLoading(true);
    try {
      const wardrobeData = allItems.map((i) => ({
        id: i.id,
        name: i.name,
        brand: i.brand || "",
        color: i.color,
        hex: i.hex,
        category: categories.find((c) => c.items.some((ci) => ci.id === i.id))?.id || "",
        owned: i.owned,
      }));
      const occasionLabel = occasionDefs.find((o) => o.id === occasionId)?.label || occasionId;
      const { data, error } = await supabase.functions.invoke("generate-outfit", {
        body: {
          wardrobeItems: wardrobeData,
          existingOutfits: outfits.map((o) => ({ name: o.name, pieces: o.pieces })),
          userPalette: palette,
          criteria: {
            anchorPieceId: selectedItems[0].id,
            occasion: occasionLabel,
            temperature: activeTemp,
            mustIncludeCategory: null,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const pieceIds: string[] = data.piece_ids || [];
      const newIds = pieceIds.filter((id) => allItems.some((i) => i.id === id));
      if (newIds.length === 0) {
        toast.error("No suggestions found. Try selecting a different piece.");
        return;
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });
      toast.success("Pieces suggested!");
    } catch (e: any) {
      console.error("Suggest error:", e);
      const msg = e?.message || "Failed to generate suggestions";
      if (msg.includes("Rate limit") || msg.includes("429")) {
        toast.error("Rate limited — please try again shortly.");
      } else if (msg.includes("402") || msg.includes("Credits")) {
        toast.error("AI credits exhausted.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSuggestLoading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Give your outfit a name");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Select at least one piece");
      return;
    }
    setSaving(true);
    try {
      const pieces: OutfitPiece[] = selectedItems.map((i) => {
        const cat = categories.find((c) => c.items.some((it) => it.id === i.id));
        return {
          name: i.name,
          color: i.color,
          hex: i.hex,
          item_id: i.id,
          category: cat?.id,
          brand: i.brand,
          owned: i.owned,
        };
      });
      let error;
      if (isEdit && editOutfit) {
        ({ error } = await supabase.from("custom_outfits").update({
          name: name.trim(),
          pieces: pieces as any,
          temp: activeTemp,
          notes: notes.trim(),
          occasion_id: occasionId,
        }).eq("id", editOutfit.id));
      } else {
        ({ error } = await supabase.from("custom_outfits").insert({
          name: name.trim(),
          pieces: pieces as any,
          temp: activeTemp,
          notes: notes.trim(),
          occasion_id: occasionId,
          user_id: user!.id,
        }));
      }
      if (error) throw error;
      toast.success(isEdit ? "Outfit updated!" : "Outfit saved!");
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Shared: chip strip shown in both steps
  const chipStrip = (
    <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-border bg-background">
      <div
        className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ minHeight: 44 }}
      >
        {selectedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground self-center">No pieces selected yet</p>
        ) : (
          selectedItems.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 flex items-center gap-1.5 bg-card border border-border/60 rounded-full pl-2 pr-2.5 min-h-[44px]"
            >
              <span
                className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10 dark:border-white/10"
                style={{ backgroundColor: item.hex }}
              />
              <span className="text-[13px] text-foreground font-medium whitespace-nowrap max-w-[120px] truncate">
                {item.name}
              </span>
              <button
                onClick={() => toggleItem(item.id)}
                className="ml-0.5 w-5 h-5 flex items-center justify-center rounded-full text-muted-foreground active:text-foreground active:bg-muted transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      {/* Header */}
      <header className="flex-shrink-0 flex items-center h-14 px-4 border-b border-border relative">
        <button
          onClick={step === 1 ? onBack : () => setStep(1)}
          className="text-sm font-medium text-muted-foreground active:text-foreground transition-colors"
        >
          {step === 1 ? "Cancel" : "← Pieces"}
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-foreground">
          {isEdit ? "Edit Outfit" : "New Outfit"}
        </h1>
      </header>

      {/* Shared chip strip */}
      {chipStrip}

      {step === 1 ? (
        <>
          {/* Step 1: Wardrobe browser (scrollable) */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Sticky search + category filter */}
            <div className="sticky top-0 z-10 bg-background px-4 pt-3 pb-2 border-b border-border/40">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search wardrobe…"
                  className="w-full bg-muted border border-border rounded-xl py-2.5 pl-9 pr-9 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                  style={{ fontSize: 16 }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground active:text-foreground"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pt-2.5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <CategoryPill
                  label="All"
                  active={activeCategoryFilter === "all"}
                  onClick={() => setActiveCategoryFilter("all")}
                />
                {categoryDefs.map((cat) => (
                  <CategoryPill
                    key={cat.id}
                    label={`${cat.icon} ${cat.label}`}
                    active={activeCategoryFilter === cat.id}
                    onClick={() => setActiveCategoryFilter(cat.id)}
                  />
                ))}
              </div>
            </div>

            {/* Item list */}
            <div className="px-4">
              {filteredDisplayItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No items found</p>
              ) : (
                filteredDisplayItems.map((item, i) => {
                  const selected = selectedIds.has(item.id);
                  const cat = categories.find((c) => c.items.some((ci) => ci.id === item.id));
                  const isLast = i === filteredDisplayItems.length - 1;
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`flex items-center py-3 min-h-[56px] cursor-pointer transition-colors active:bg-muted/40 ${
                        !isLast ? "border-b border-border/40" : ""
                      } ${selected ? "bg-primary/5" : ""}`}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex-shrink-0 border border-black/10 dark:border-white/10"
                        style={{ backgroundColor: item.hex }}
                      />
                      <div className="flex-1 min-w-0 ml-3">
                        <p className="text-foreground text-[15px] font-medium leading-snug truncate">{item.name}</p>
                        <p className="text-muted-foreground text-[13px] mt-0.5">
                          {[item.brand, item.color, cat?.label].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      {selected && <Check size={16} className="text-primary flex-shrink-0 ml-2" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 1 bottom bar: Suggest + Next */}
          <div
            className="flex-shrink-0 px-4 py-3 bg-card/95 backdrop-blur-md border-t border-border flex gap-2"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <button
              onClick={generateSuggest}
              disabled={suggestLoading || selectedItems.length === 0}
              className="flex items-center justify-center gap-1.5 px-4 min-h-[48px] rounded-xl border font-medium text-sm transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
              style={{ borderColor: "#B08030", color: "#B08030" }}
            >
              {suggestLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span style={{ color: "#B08030" }}>✦</span>
              )}
              Suggest
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={selectedItems.length === 0}
              className="flex-1 min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Step 2: Details (scrollable) */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <section className="px-4 pt-5 pb-4">
              {/* Outfit name */}
              <input
                type="text"
                placeholder="Outfit name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 mb-5"
                style={{ fontSize: 16 }}
              />

              {/* Notes */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notes</h3>
                <button
                  onClick={generateAI}
                  disabled={aiLoading || selectedItems.length === 0}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all active:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none"
                  style={{ borderColor: "#B08030", color: "#B08030" }}
                >
                  <Sparkles size={11} className={aiLoading ? "animate-spin" : ""} />
                  {aiLoading ? "Generating…" : "AI Generate"}
                </button>
              </div>
              <textarea
                placeholder="Styling notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />

              {/* Occasion picker */}
              <div className="flex gap-2 overflow-x-auto mt-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {occasionDefs.map((occ) => (
                  <button
                    key={occ.id}
                    onClick={() => setOccasionId(occ.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-[0.96] ${
                      occasionId === occ.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="mr-1">{occ.icon}</span>{occ.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Temperature */}
            <section className="px-4 py-4 border-t border-border pb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Temperature</h3>
              <div className="flex gap-2">
                {TEMP_OPTIONS.map((t) => {
                  const badge = temperatureBadges[t];
                  const isActive = activeTemp === t;
                  const isSuggested = t === suggestedTemp;
                  return (
                    <button
                      key={t}
                      onClick={() => setTempOverride(t === suggestedTemp && !tempOverride ? null : t)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.96] ${
                        isActive ? "ring-2 ring-ring" : ""
                      }`}
                      style={{
                        backgroundColor: isActive ? badge.bg : "transparent",
                        borderColor: isActive ? badge.border : "hsl(var(--border))",
                        color: isActive ? badge.text : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {t}
                      {isSuggested && (
                        <span className="block text-[9px] opacity-50 mt-0.5">Suggested</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                {TEMP_OPTIONS.map((t) => {
                  const badge = temperatureBadges[t];
                  return (
                    <span key={t} className="text-[10px] font-medium" style={{ color: badge.text }}>
                      {t}: {TEMP_LEGEND[t]}
                    </span>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Step 2 bottom bar: Save */}
          <div
            className="flex-shrink-0 px-4 py-3 bg-card/95 backdrop-blur-md border-t border-border"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <button
              onClick={save}
              disabled={saving || !name.trim() || selectedItems.length === 0}
              className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {saving
                ? "Saving…"
                : isEdit
                ? `Save Changes (${selectedItems.length})`
                : `Save Outfit (${selectedItems.length})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3.5 py-1.5 min-h-[36px] rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.96] border ${
        active
          ? "bg-primary text-primary-foreground border-primary/80"
          : "text-muted-foreground border-border/60"
      }`}
      style={
        active
          ? {
              letterSpacing: "0.03em",
              boxShadow: "0 1px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
            }
          : {
              letterSpacing: "0.03em",
              backdropFilter: "blur(10px) saturate(140%)",
              WebkitBackdropFilter: "blur(10px) saturate(140%)",
              backgroundColor: "color-mix(in srgb, hsl(var(--card)) 45%, transparent)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            }
      }
    >
      {label}
    </button>
  );
}

export default OutfitBuilder;
