import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChevronLeft, X } from "lucide-react";
import type { WardrobeItem } from "@/data/darkautumn";
import type { DbOutfit } from "@/hooks/use-outfits";

type Step = "choose-action" | "swap-picker";

type DeleteAction = "swap" | "archive" | "delete-outfits";

interface Props {
  open: boolean;
  item: { id: string; name: string } | null;
  affectedOutfits: DbOutfit[];
  allCategories: { id: string; label: string; icon: string; items: WardrobeItem[] }[];
  onAction: (action: DeleteAction, swapItemId?: string) => Promise<void>;
  onSimpleDelete: () => Promise<void>;
  onCancel: () => void;
}

const DeleteWardrobeItemSheet = ({
  open,
  item,
  affectedOutfits,
  allCategories,
  onAction,
  onSimpleDelete,
  onCancel,
}: Props) => {
  const [step, setStep] = useState<Step>("choose-action");
  const [swapItemId, setSwapItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const outfitCount = affectedOutfits.length;
  const outfitLabel = outfitCount === 1 ? "1 outfit" : `${outfitCount} outfits`;

  const swappableItems = useMemo(
    () =>
      allCategories.flatMap((cat) =>
        cat.items
          .filter((i) => i.id !== item?.id)
          .map((i) => ({ ...i, categoryId: cat.id, categoryLabel: cat.label, categoryIcon: cat.icon }))
      ),
    [allCategories, item?.id]
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return swappableItems;
    const q = searchQuery.toLowerCase();
    return swappableItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.color.toLowerCase().includes(q) ||
        (i.brand && i.brand.toLowerCase().includes(q))
    );
  }, [swappableItems, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, { label: string; icon: string; items: typeof filteredItems }> = {};
    for (const i of filteredItems) {
      if (!groups[i.categoryId]) {
        groups[i.categoryId] = { label: i.categoryLabel, icon: i.categoryIcon, items: [] };
      }
      groups[i.categoryId].items.push(i);
    }
    return groups;
  }, [filteredItems]);

  const handleAction = async (action: DeleteAction, sid?: string) => {
    setLoading(true);
    await onAction(action, sid);
    setLoading(false);
    setStep("choose-action");
    setSwapItemId(null);
    setSearchQuery("");
  };

  const handleSimpleDelete = async () => {
    setLoading(true);
    await onSimpleDelete();
    setLoading(false);
  };

  const handleClose = (open: boolean) => {
    if (!open && !loading) {
      setStep("choose-action");
      setSwapItemId(null);
      setSearchQuery("");
      onCancel();
    }
  };

  const hasAffectedOutfits = outfitCount > 0;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-5 max-h-[85dvh] flex flex-col">
        {/* ── Simple delete (no outfits affected) ─────────────────── */}
        {!hasAffectedOutfits && (
          <>
            <SheetHeader className="text-left mb-4">
              <SheetTitle className="text-base font-semibold text-foreground">Delete item</SheetTitle>
            </SheetHeader>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{item?.name}</span>? This can't be undone.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSimpleDelete}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm transition-all active:scale-[0.97] disabled:opacity-50"
              >
                {loading ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={onCancel}
                disabled={loading}
                className="w-full py-3 rounded-xl liquid-glass-surface border border-border/50 text-foreground font-medium text-sm transition-all active:scale-[0.97]"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* ── Choose action (outfits affected) ────────────────────── */}
        {hasAffectedOutfits && step === "choose-action" && (
          <>
            <SheetHeader className="text-left mb-1">
              <SheetTitle className="text-base font-semibold text-foreground">Delete {item?.name}</SheetTitle>
            </SheetHeader>
            <p className="text-sm text-muted-foreground mb-5">
              It's used in <span className="font-medium text-foreground">{outfitLabel}</span>. What should happen to {outfitCount === 1 ? "it" : "them"}?
            </p>

            <div className="flex flex-col gap-2 mb-4">
              {/* Swap */}
              <button
                onClick={() => setStep("swap-picker")}
                disabled={loading}
                className="w-full text-left px-4 py-3.5 rounded-xl liquid-glass-card border border-border/50 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <p className="text-sm font-semibold text-foreground">Swap with another item</p>
                <p className="text-xs text-muted-foreground mt-0.5">Replace it across all {outfitCount === 1 ? "the outfit" : "affected outfits"}</p>
              </button>

              {/* Archive */}
              <button
                onClick={() => handleAction("archive")}
                disabled={loading}
                className="w-full text-left px-4 py-3.5 rounded-xl liquid-glass-card border border-border/50 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <p className="text-sm font-semibold text-foreground">Archive {outfitCount === 1 ? "outfit" : "outfits"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Retire {outfitCount === 1 ? "it" : "them"} but keep in planner history for insights</p>
              </button>

              {/* Delete outfits */}
              <button
                onClick={() => handleAction("delete-outfits")}
                disabled={loading}
                className="w-full text-left px-4 py-3.5 rounded-xl liquid-glass-card border border-border/50 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <p className="text-sm font-semibold text-destructive">Delete {outfitCount === 1 ? "outfit" : "outfits"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Remove {outfitCount === 1 ? "it" : "them"} and any planner assignments</p>
              </button>
            </div>

            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full py-3 rounded-xl liquid-glass-surface border border-border/50 text-foreground font-medium text-sm transition-all active:scale-[0.97]"
            >
              Cancel
            </button>
          </>
        )}

        {/* ── Swap picker ─────────────────────────────────────────── */}
        {hasAffectedOutfits && step === "swap-picker" && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => { setStep("choose-action"); setSwapItemId(null); setSearchQuery(""); }}
                className="flex items-center justify-center w-8 h-8 rounded-full liquid-glass-surface border border-border/50 active:scale-[0.92] transition-transform"
              >
                <ChevronLeft size={16} />
              </button>
              <SheetTitle className="text-base font-semibold text-foreground">Choose replacement</SheetTitle>
            </div>

            {/* Search */}
            <div className="relative liquid-glass-input rounded-xl focus-within:ring-1 focus-within:ring-gold/50 mb-4 flex-shrink-0">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 pointer-events-none"
                width="15" height="15" viewBox="0 0 24 24" fill="none"
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
                className="w-full bg-transparent border-0 rounded-xl py-2.5 pl-9 pr-9 text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
                style={{ fontSize: 16 }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground active:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Item list */}
            <div className="overflow-y-auto flex-1 -mx-4 px-4 space-y-4">
              {Object.entries(groupedItems).map(([catId, group]) => (
                <section key={catId}>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1.5 px-1" style={{ letterSpacing: "0.1em" }}>
                    {group.icon}  {group.label}
                  </p>
                  <div className="liquid-glass-card rounded-2xl">
                    {group.items.map((i, idx) => {
                      const selected = swapItemId === i.id;
                      return (
                        <button
                          key={i.id}
                          onClick={() => setSwapItemId(selected ? null : i.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all active:scale-[0.98] ${idx !== group.items.length - 1 ? "border-b border-border/30" : ""} ${selected ? "bg-primary/10" : ""}`}
                        >
                          <span
                            className="w-5 h-5 rounded-full flex-shrink-0 border border-border/40"
                            style={{ backgroundColor: i.hex }}
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-foreground truncate">{i.name}</span>
                            {i.brand && <span className="block text-xs text-muted-foreground truncate">{i.brand}</span>}
                          </span>
                          {selected && (
                            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No items found</p>
              )}
              <div className="h-2" />
            </div>

            {/* Confirm swap */}
            <div className="pt-3 flex-shrink-0">
              <button
                onClick={() => swapItemId && handleAction("swap", swapItemId)}
                disabled={!swapItemId || loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all active:scale-[0.97] disabled:opacity-40"
              >
                {loading ? "Swapping…" : `Swap in ${outfitLabel}`}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DeleteWardrobeItemSheet;
