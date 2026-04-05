import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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

  return createPortal(
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
        className={`absolute bottom-0 left-0 right-0 liquid-glass-sheet rounded-t-2xl border-t border-border/40 flex flex-col ${
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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50"
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
                  className="flex-shrink-0 flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-[0.96] border"
                  style={{
                    backgroundColor: badge?.bg,
                    borderColor: badge?.border,
                    color: badge?.text,
                    boxShadow: active ? "0 1px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)" : undefined,
                    outline: active ? `2px solid ${badge?.border}` : undefined,
                    outlineOffset: active ? "2px" : undefined,
                  }}
                >
                  {temp}
                </button>
              );
            })}
          </div>

          {/* Occasion filter */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {occasionDefs.filter((oc) => oc.id !== "all").map((oc) => {
              const labels: Record<string, string> = { casual: "Casual", work: "Work", weekend: "Weekend", dinner: "Going Out" };
              const active = occasionFilter === oc.id;
              return (
                <button
                  key={oc.id}
                  onClick={() => setOccasionFilter(active ? null : oc.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-[0.96] border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary/70"
                      : "text-muted-foreground border-border/60"
                  }`}
                  style={active ? {
                    boxShadow: "0 1px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
                  } : {
                    backdropFilter: "blur(10px) saturate(140%)",
                    WebkitBackdropFilter: "blur(10px) saturate(140%)",
                    backgroundColor: "color-mix(in srgb, hsl(var(--card)) 45%, transparent)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                  }}
                >
                  {oc.icon && <span>{oc.icon}</span>}
                  {labels[oc.id] || oc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable outfit list — drag-to-dismiss also works here when at scroll top */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8"
          onTouchStart={onContentTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No outfits match "{search}"
            </p>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((o) => {
                const tempBadge = temperatureBadges[o.temp];
                const occasion  = occasionDefs.find((oc) => oc.id === o.occasion_id);
                const isSelected = currentOutfitId === o.id;

                return (
                  <button
                    key={o.id}
                    onClick={() => onSelect(o.id)}
                    className={`w-full text-left rounded-xl overflow-hidden border flex items-stretch transition-colors active:scale-[0.98] liquid-glass-surface ${
                      isSelected ? "border-gold/30 bg-gold/10" : "border-border/40"
                    }`}
                  >
                    {/* Vertical color bars */}
                    <div className="flex flex-shrink-0 gap-[2px]" style={{ width: 28 }}>
                      {o.pieces.map((p, pi) => (
                        <div key={pi} style={{ backgroundColor: p.hex, flex: 1 }} />
                      ))}
                    </div>

                    <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-3">
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
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OutfitPickerSheet;
