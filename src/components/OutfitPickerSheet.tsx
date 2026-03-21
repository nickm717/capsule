import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { occasions, temperatureBadges, type Outfit } from "@/data/darkautumn";

interface OutfitPickerSheetProps {
  open: boolean;
  dayLabel: string;
  currentOutfitId?: string;
  allOutfits: Outfit[];
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
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startY: 0, currentY: 0, dragging: false });

  // Reset search when opening
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
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 280);
  }, [onClose]);

  // Swipe-to-dismiss
  const onTouchStart = (e: React.TouchEvent) => {
    dragRef.current.startY = e.touches[0].clientY;
    dragRef.current.dragging = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current.dragging || !sheetRef.current) return;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    if (dy > 0) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!dragRef.current.dragging || !sheetRef.current) return;
    const dy = e.changedTouches[0].clientY - dragRef.current.startY;
    dragRef.current.dragging = false;
    if (dy > 100) {
      dismiss();
    }
    sheetRef.current.style.transform = "";
  };

  const allTemps = useMemo(() => {
    const temps = new Set(allOutfits.map((o) => o.temp));
    return Array.from(temps);
  }, [allOutfits]);

  const filtered = allOutfits.filter((o) => {
    const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase());
    const matchesTemp = !tempFilter || o.temp === tempFilter;
    const matchesOccasion = !occasionFilter || occasions.find((oc) => oc.id === occasionFilter)?.outfits.some((oo) => oo.id === o.id);
    return matchesSearch && matchesTemp && matchesOccasion;
  });

  if (!open && !closing) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-280 ${
          closing ? "opacity-0" : "opacity-100"
        }`}
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
        {/* Fixed header: drag handle + title + search */}
        <div
          className="flex-shrink-0 px-4 pt-3 pb-3"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Drag handle */}
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

          <h3 className="text-lg font-semibold text-foreground mb-3">
            Pick an outfit — <span className="text-gold">{dayLabel}</span>
          </h3>

          {/* Search input */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
              className="w-full bg-muted border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>

          {/* Temperature filter pills */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {allTemps.map((temp) => {
              const badge = temperatureBadges[temp];
              const active = tempFilter === temp;
              return (
                <button
                  key={temp}
                  onClick={() => setTempFilter(active ? null : temp)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all active:scale-[0.95] ${
                    active ? "ring-1 ring-offset-1 ring-offset-card" : "opacity-70"
                  }`}
                  style={{
                    backgroundColor: badge?.bg,
                    borderColor: badge?.border,
                    color: badge?.text,
                  }}
                >
                  {temp}
                </button>
              );
            })}
          </div>

          {/* Occasion filter pills */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
            {occasions.map((oc) => {
              const shortLabels: Record<string, string> = {
                casual: "Casual",
                work: "Work",
                weekend: "Weekend",
                dinner: "Going Out",
              };
              const active = occasionFilter === oc.id;
              return (
                <button
                  key={oc.id}
                  onClick={() => setOccasionFilter(active ? null : oc.id)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border border-border transition-all active:scale-[0.95] whitespace-nowrap flex-shrink-0 ${
                    active
                      ? "bg-gold/15 border-gold/30 text-foreground ring-1 ring-gold/20 ring-offset-1 ring-offset-card"
                      : "bg-muted/50 text-muted-foreground opacity-70"
                  }`}
                >
                  {oc.icon} {shortLabels[oc.id] || oc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable outfit list */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No outfits match "{search}"
            </p>
          ) : (
            filtered.map((o) => {
              const tempBadge = temperatureBadges[o.temp];
              const occasion = occasions.find((oc) =>
                oc.outfits.some((oo) => oo.id === o.id)
              );
              const isSelected = currentOutfitId === o.id;

              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-colors active:scale-[0.98] ${
                    isSelected
                      ? "bg-gold/10 border border-gold/20"
                      : "hover:bg-muted border border-transparent"
                  }`}
                >
                  {/* Color swatches — fixed width for alignment */}
                  <div className="flex gap-1 flex-shrink-0 w-[72px]">
                    {o.pieces.slice(0, 4).map((p, pi) => (
                      <span
                        key={pi}
                        className="w-3.5 h-3.5 rounded-full border border-border/50"
                        style={{ backgroundColor: p.hex }}
                      />
                    ))}
                  </div>

                  {/* Name + pieces */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground font-medium truncate block">
                      {o.name}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {o.pieces.map((p) => p.name).join(" · ")}
                    </span>
                  </div>

                  {/* Temp badge */}
                  {tempBadge && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border flex-shrink-0"
                      style={{
                        backgroundColor: tempBadge.bg,
                        borderColor: tempBadge.border,
                        color: tempBadge.text,
                      }}
                    >
                      {o.temp}
                    </span>
                  )}

                  {/* Occasion icon */}
                  {occasion && (
                    <span className="text-[12px] flex-shrink-0">
                      {occasion.icon}
                    </span>
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
