import { useState, useMemo } from "react";
import { Check, Sparkles, ChevronLeft, ChevronDown } from "lucide-react";
import { wardrobeCategories, temperatureBadges, occasions, type WardrobeItem, type OutfitPiece } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TEMP_OPTIONS = ["Cold", "Cool", "Mild", "Warm"] as const;
const TEMP_LEGEND: Record<string, string> = {
  Cold: "Below 40 °F",
  Cool: "40–60 °F",
  Mild: "60–70 °F",
  Warm: "70 °F+",
};

function suggestTemp(selectedItems: WardrobeItem[]): string {
  const hasOuterwear = selectedItems.some((item) => {
    const cat = wardrobeCategories.find((c) => c.items.some((i) => i.id === item.id));
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
}

const OutfitBuilder = ({ onBack, onSaved }: Props) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [tempOverride, setTempOverride] = useState<string | null>(null);
  const [occasionId, setOccasionId] = useState("casual");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  const allItems = useMemo(() => wardrobeCategories.flatMap((c) => c.items), []);
  const selectedItems = useMemo(() => allItems.filter((i) => selectedIds.has(i.id)), [allItems, selectedIds]);
  const suggestedTemp = useMemo(() => suggestTemp(selectedItems), [selectedItems]);
  const activeTemp = tempOverride ?? suggestedTemp;

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Auto-collapse the category this item belongs to
    const cat = wardrobeCategories.find((c) => c.items.some((i) => i.id === id));
    if (cat && !selectedIds.has(id)) {
      // Item was just selected → collapse
      setCollapsedCats((prev) => new Set(prev).add(cat.id));
    }
  };

  const toggleCat = (catId: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const generateAI = async () => {
    if (selectedItems.length === 0) {
      toast({ title: "Select pieces first", variant: "destructive" });
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
      toast({ title: "Could not generate", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      toast({ title: "Give your outfit a name", variant: "destructive" });
      return;
    }
    if (selectedItems.length === 0) {
      toast({ title: "Select at least one piece", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const pieces: OutfitPiece[] = selectedItems.map((i) => ({
        name: i.name,
        color: i.color,
        hex: i.hex,
      }));
      const { error } = await supabase.from("custom_outfits").insert({
        name: name.trim(),
        pieces: pieces as any,
        temp: activeTemp,
        notes: notes.trim(),
        occasion_id: occasionId,
      });
      if (error) throw error;
      toast({ title: "Outfit saved!" });
      onSaved();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/95 backdrop-blur-md flex-shrink-0">
        <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground active:scale-[0.95] transition-all">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-semibold text-foreground font-serif flex-1">New Outfit</h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Section 1: Pick Pieces */}
        <section className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pick Pieces</h3>

          {/* Selected palette strip */}
          {selectedItems.length > 0 && (
            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex-shrink-0 w-8 h-5 rounded" style={{ backgroundColor: item.hex }} title={item.name} />
              ))}
            </div>
          )}

          {wardrobeCategories.map((cat) => {
            const isCollapsed = collapsedCats.has(cat.id);
            const selectedInCat = cat.items.filter((i) => selectedIds.has(i.id));

            return (
              <div key={cat.id} className="mb-3">
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="w-full flex items-center gap-2 py-2 text-left"
                >
                  <ChevronDown
                    size={14}
                    className={`text-muted-foreground transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                  />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span>{cat.icon}</span> {cat.label}
                  </span>
                  {/* Show selected swatches in collapsed header */}
                  {isCollapsed && selectedInCat.length > 0 && (
                    <span className="flex items-center gap-1.5 ml-auto">
                      {selectedInCat.map((item) => (
                        <span key={item.id} className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full border border-border/40" style={{ backgroundColor: item.hex }} />
                          <span className="text-[11px] text-foreground">{item.name}</span>
                        </span>
                      ))}
                    </span>
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-1 ml-1">
                    {cat.items.map((item) => {
                      const selected = selectedIds.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 active:scale-[0.98] ${
                            selected ? "bg-primary/10 border border-primary/30" : "bg-card border border-border hover:border-border/80"
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full flex-shrink-0 border border-border/40" style={{ backgroundColor: item.hex }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{item.name}</p>
                            {item.brand && <p className="text-[11px] text-muted-foreground">{item.brand}</p>}
                          </div>
                          {selected && <Check size={16} className="text-primary flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Section 2: Description */}
        <section className="px-4 py-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</h3>
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
          <input
            type="text"
            placeholder="Outfit name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3"
          />
          <textarea
            placeholder="Styling notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />

          {/* Occasion picker */}
          <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
            {occasions.map((occ) => (
              <button
                key={occ.id}
                onClick={() => setOccasionId(occ.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-[0.96] ${
                  occasionId === occ.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="mr-1">{occ.icon}</span>{occ.label}
              </button>
            ))}
          </div>
        </section>

        {/* Section 3: Temperature */}
        <section className="px-4 py-4 border-t border-border pb-28">
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

          {/* Temperature legend */}
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

      {/* Fixed save button */}
      <div className="flex-shrink-0 p-4 bg-card/95 backdrop-blur-md border-t border-border">
        <button
          onClick={save}
          disabled={saving || !name.trim() || selectedItems.length === 0}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          {saving ? "Saving…" : "Save Outfit"}
        </button>
      </div>
    </div>
  );
};

export default OutfitBuilder;
