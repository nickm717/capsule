import { useState, useMemo } from "react";
import { Wand2, Layers, Search, Loader2, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { occasionDefs, categoryDefs } from "@/data/darkautumn";
import type { WardrobeItem } from "@/data/darkautumn";

const TEMP_OPTIONS = ["Cold", "Cool", "Mild", "Warm"] as const;

interface AddOutfitSheetProps {
  open: boolean;
  onClose: () => void;
  onBuildManually: () => void;
  onAiGenerate: (criteria: AiCriteria) => void;
  wardrobeItems: WardrobeItem[];
  generating: boolean;
}

export interface AiCriteria {
  anchorPieceId: string | null;
  occasion: string;
  temperature: string;
  mustIncludeCategory: string | null;
}

const AddOutfitSheet = ({
  open,
  onClose,
  onBuildManually,
  onAiGenerate,
  wardrobeItems,
  generating,
}: AddOutfitSheetProps) => {
  const [step, setStep] = useState<"choose" | "ai">("choose");
  const [anchorPieceId, setAnchorPieceId] = useState<string | null>(null);
  const [occasion, setOccasion] = useState("casual");
  const [temperature, setTemperature] = useState("Mild");
  const [mustIncludeCategory, setMustIncludeCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const resetAndClose = () => {
    setStep("choose");
    setAnchorPieceId(null);
    setOccasion("casual");
    setTemperature("Mild");
    setMustIncludeCategory(null);
    setSearchQuery("");
    onClose();
  };

  const handleManual = () => {
    resetAndClose();
    onBuildManually();
  };

  const handleGenerate = () => {
    onAiGenerate({ anchorPieceId, occasion, temperature, mustIncludeCategory });
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return wardrobeItems.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return wardrobeItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.color.toLowerCase().includes(q) ||
        (i.brand && i.brand.toLowerCase().includes(q))
    );
  }, [wardrobeItems, searchQuery]);

  const anchorItem = anchorPieceId ? wardrobeItems.find((i) => i.id === anchorPieceId) : null;

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        if (!v) resetAndClose();
      }}
    >
      <DrawerContent className="px-5 pb-8 pt-0">
        {step === "choose" ? (
          <>
            <DrawerHeader className="text-left px-0 pt-4 pb-2">
              <DrawerTitle className="text-lg font-semibold text-foreground">New Outfit</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-2.5 mt-2">
              <button
                onClick={handleManual}
                className="w-full flex items-center gap-3.5 p-4 rounded-xl liquid-glass-surface border border-border/50 text-left transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Layers size={18} className="text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Build manually</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pick pieces and create your outfit step by step</p>
                </div>
              </button>
              <button
                onClick={() => setStep("ai")}
                className="w-full flex items-center gap-3.5 p-4 rounded-xl liquid-glass-surface border border-border/50 text-left transition-all active:scale-[0.98]"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(176,128,48,0.15)" }}
                >
                  <Wand2 size={18} style={{ color: "#B08030" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">AI Generate</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Let AI suggest pieces based on your wardrobe</p>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <DrawerHeader className="text-left px-0 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Wand2 size={16} style={{ color: "#B08030" }} />
                  AI Generate
                </DrawerTitle>
                <button
                  onClick={resetAndClose}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-[0.92]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </DrawerHeader>

            <div className="space-y-5 mt-1 max-h-[60vh] overflow-y-auto overscroll-contain">
              {/* Anchor piece */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Anchor piece <span className="font-normal normal-case">(optional)</span>
                </label>
                {anchorItem ? (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-card border border-primary/30">
                    <span className="w-5 h-5 rounded-full flex-shrink-0 border border-border/40" style={{ backgroundColor: anchorItem.hex }} />
                    <span className="text-sm text-foreground flex-1 truncate">{anchorItem.name}</span>
                    <button
                      onClick={() => setAnchorPieceId(null)}
                      className="text-muted-foreground hover:text-foreground active:scale-[0.92]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" />
                      <input
                        type="text"
                        placeholder="Search wardrobe…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg overscroll-contain">
                      {filteredItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setAnchorPieceId(item.id);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-muted transition-colors active:scale-[0.98]"
                        >
                          <span className="w-4 h-4 rounded-full flex-shrink-0 border border-border/40" style={{ backgroundColor: item.hex }} />
                          <span className="text-sm text-foreground truncate">{item.name}</span>
                          <span className="text-[11px] text-muted-foreground ml-auto flex-shrink-0">{item.color}</span>
                        </button>
                      ))}
                      {filteredItems.length === 0 && (
                        <p className="text-xs text-muted-foreground py-3 text-center">No items found</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Occasion */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Occasion</label>
                <div className="flex gap-2 flex-wrap">
                  {occasionDefs.map((occ) => (
                    <button
                      key={occ.id}
                      onClick={() => setOccasion(occ.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-[0.96] ${
                        occasion === occ.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="mr-1">{occ.icon}</span>
                      {occ.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperature */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Temperature</label>
                <div className="flex gap-2">
                  {TEMP_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTemperature(t)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.96] ${
                        temperature === t
                          ? "bg-primary/15 border-primary/40 text-foreground"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Must-include category */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Must include <span className="font-normal normal-case">(optional)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {categoryDefs.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setMustIncludeCategory(mustIncludeCategory === cat.id ? null : cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-[0.96] ${
                        mustIncludeCategory === cat.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="mr-1">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full mt-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 size={14} />
                  Generate Outfit
                </>
              )}
            </button>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default AddOutfitSheet;
