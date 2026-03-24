import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { occasionDefs, temperatureBadges } from "@/data/darkautumn";
import type { OutfitPiece } from "@/data/darkautumn";
import AppBadge from "./AppBadge";

interface PickerOutfit {
  id: string;
  name: string;
  temp: string;
  pieces: OutfitPiece[];
  notes: string;
  occasion_id?: string;
}

interface OutfitPickerSheetProps {
  open: boolean;
  dayLabel: string;
  currentOutfitId?: string;
  allOutfits: PickerOutfit[];
  onSelect: (outfitId: string) => void;
  onClose: () => void;
}

const OutfitPickerSheet = ({
  open,
  dayLabel,
  currentOutfitId,
  allOutfits,
  onSelect,
  onClose,
}: OutfitPickerSheetProps) => {
  const [search, setSearch] = useState("");
  const [tempFilter, setTempFilter] = useState<string | null>(null);
  const [occasionFilter, setOccasionFilter] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const sheetRef   = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragRef    = useRef({ startY: 0, dragging: false, fromContent: false });

  useEffect(() => {
    if (open) {
      setSearch("");
      setTempFilter(null);
      setOccasionFilter(null);
      setClosing(false);
    }
  }, [open]);

  const dismiss = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 280);
  }, [onClose]);

  // ── Handle drag events ───────────────────────────────────────────
  // Drag from the header handle always works.
  // Drag from the content list works only when scrollTop === 0
  // (mirroring native iOS sheet behavior).

  const onHeaderTouchStart = (e: React.TouchEvent) => {
    dragRef.current = { startY: e.touches[0].clientY, dragging: true, fromContent: false };
  };

  const onContentTouchStart = (e: React.TouchEvent) => {
    const atTop = !contentRef.current || contentRef.current.scrollTop === 0;
    dragRef.current = { startY: e.touches[0].clientY, dragging: atTop, fromContent: true };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current.dragging || !sheetRef.current) return;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    if (dy > 0) {
      if (dragRef.current.fromContent) {
        // prevent list from scrolling upward while we're dragging the sheet
        e.preventDefault();
      }
      sheetRef.current.style.transform = `translateY(${dy}px)`;
      sheetRef.current.style.transition = "none";
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!dragRef.current.dragging || !sheetRef.current) return;
    const dy = e.changedTouches[0].clientY - dragRef.current.startY;
    dragRef.current.dragging = false;
    sheetRef.current.style.transform = "";
    sheetRef.current.style.transition = "";
    if (dy > 90) dismiss();
  };

  // ── Filters ──────────────────────────────────────────────────────
  const allTemps = useMemo(() => Array.from(new Set(allOutfits.map((o) => o.temp))), [allOutfits]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allOutfits.filter((o) => {
      const matchesSearch =
        !q ||
        o.name.toLowerCase().includes(q) ||
        o.pieces.some((p) => p.name.toLowerCase().includes(q) || p.color.toLowerCase().includes(q));
      const matchesTemp     = !tempFilter     || o.temp       === tempFilter;
      const matchesOccasion = !occasionFilter || o.occasion_id === occasionFilter;
      return matchesSearch && matchesTemp && matchesOccasion;
    });
  }, [allOutfits, search, tempFilter, occasionFilter]);

  if (!open && !closing) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-280 ${closing ? "opacity-0" : "opacity-100"}`}
        style={{ animation: closing ? undefined : "fade-overlay 0.28s ease-out" }}
        onClick={dismiss}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border flex flex-col ${
          closing ? "animate-sheet-down" : "animate-sheet-up"
        }`}
        style={{ height: "85vh", willChange: "transform" }}
      >
        {/* Header — drag handle + title + search + filters */}
        <div
          className="flex-shrink-0 px-4 pt-3 pb-3 touch-none"
          onTouchStart={onHeaderTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Drag pill */}
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

          <h3 className="text-[17px] font-semibold text-foreground mb-3">
            Pick an outfit — <span className="text-gold">{dayLabel}</span>
          </h3>

          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search outfits…"
              autoFocus={false}
              tabIndex={-1}
              className="w-full bg-muted border border-border rounded-xl py-2.5 pl-9 pr-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>

          {/* Temp filter badges */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {allTemps.map((temp) => {
              const badge  = temperatureBadges[temp];
              const active = tempFilter === temp;
              return (
                <button
                  key={temp}
                  onClick={() => setTempFilter(active ? null : temp)}
                  className={`transition-all active:scale-[0.95] rounded-md ${active ? "ring-1 ring-offset-1 ring-offset-card ring-current" : "opacity-70"}`}
                >
                  <AppBadge size="sm" bg={badge?.bg} borderColor={badge?.border} color={badge?.text}>
                    {temp}
                  </AppBadge>
                </button>
              );
            })}
          </div>

          {/* Occasion filter */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {occasionDefs.map((oc) => {
              const labels: Record<string, string> = { casual: "Casual", work: "Work", weekend: "Weekend", dinner: "Going Out" };
              const active = occasionFilter === oc.id;
              return (
                <button
                  key={oc.id}
                  onClick={() => setOccasionFilter(active ? null : oc.id)}
                  className={`flex-shrink-0 transition-all active:scale-[0.95] rounded-full ${active ? "ring-1 ring-gold/30 ring-offset-1 ring-offset-card" : ""}`}
                >
                  <AppBadge
                    size="sm"
                    variant={active ? "gold" : "muted"}
                    className={!active ? "opacity-70" : ""}
                  >
                    {oc.icon} {labels[oc.id] || oc.label}
                  </AppBadge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable outfit list — drag-to-dismiss also works here when at scroll top */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 space-y-1.5"
          onTouchStart={onContentTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No outfits match "{search}"
            </p>
          ) : (
            filtered.map((o) => {
              const tempBadge = temperatureBadges[o.temp];
              const occasion  = occasionDefs.find((oc) => oc.id === o.occasion_id);
              const isSelected = currentOutfitId === o.id;

              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-colors active:scale-[0.98] ${
                    isSelected
                      ? "bg-gold/10 border border-gold/20"
                      : "active:bg-muted border border-transparent"
                  }`}
                >
                  {/* Color dots */}
                  <div className="flex gap-1 flex-shrink-0 w-[72px]">
                    {o.pieces.slice(0, 4).map((p, pi) => (
                      <span
                        key={pi}
                        className="w-3.5 h-3.5 rounded-full border border-border/50"
                        style={{ backgroundColor: p.hex }}
                      />
                    ))}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[15px] text-foreground font-medium truncate block">{o.name}</span>
                    <span className="text-[12px] text-muted-foreground block mt-0.5">
                      {o.pieces.map((p) => p.name).join(" · ")}
                    </span>
                  </div>

                  {tempBadge && (
                    <AppBadge size="sm" bg={tempBadge.bg} borderColor={tempBadge.border} color={tempBadge.text}>
                      {o.temp}
                    </AppBadge>
                  )}

                  {occasion && (
                    <span className="text-[13px] flex-shrink-0">{occasion.icon}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default OutfitPickerSheet;
