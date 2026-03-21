import { useState, useMemo } from "react";
import { Check, Sparkles, ChevronLeft } from "lucide-react";
import { wardrobeCategories, temperatureBadges, occasions, type WardrobeItem, type OutfitPiece } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TEMP_OPTIONS = ["Cold", "Cool", "Mild", "Warm"] as const;

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
  };

  const generateNote = async () => {
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
      if (data?.note) setNotes(data.note);
    } catch (e) {
      console.error(e);
      toast({ title: "Could not generate note", variant: "destructive" });
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
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/95 backdrop-blur-md">
        <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground active:scale-[0.95] transition-all">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-semibold text-foreground font-serif">New Outfit</h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-24">
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

          {wardrobeCategories.map((cat) => (
            <div key={cat.id} className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>{cat.icon}</span> {cat.label}
              </p>
              <div className="space-y-1">
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
            </div>
          ))}
        </section>

        {/* Section 2: Description */}
        <section className="px-4 py-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Description</h3>
          <input
            type="text"
            placeholder="Outfit name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3"
          />
          <div className="relative">
            <textarea
              placeholder="Styling notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none pr-24"
            />
            <button
              onClick={generateNote}
              disabled={aiLoading || selectedItems.length === 0}
              className="absolute right-2 top-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 active:scale-[0.96] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Sparkles size={13} className={aiLoading ? "animate-spin" : ""} />
              {aiLoading ? "Writing…" : "AI Generate"}
            </button>
          </div>

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
        <section className="px-4 py-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Temperature</h3>
          <div className="flex gap-2">
            {TEMP_OPTIONS.map((t) => {
              const badge = temperatureBadges[t];
              const isActive = activeTemp === t;
              const isSuggested = !tempOverride && t === suggestedTemp;
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
                  {isSuggested && <span className="block text-[9px] opacity-70 mt-0.5">suggested</span>}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Fixed save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-md border-t border-border">
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
