import { useState, useMemo } from "react";
import { occasions, temperatureBadges, type Outfit } from "@/data/darkautumn";
import OutfitPickerSheet from "./OutfitPickerSheet";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatRange(dates: Date[]): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(dates[0])} – ${fmt(dates[6])}`;
}

const WeeklyPlanner = () => {
  const allOutfits = occasions.flatMap((o) => o.outfits);
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheetDay, setSheetDay] = useState<{ key: string; label: string } | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const assignOutfit = (dayKey: string, outfitId: string) => {
    setPlan((prev) => ({ ...prev, [dayKey]: outfitId }));
    setSheetDay(null);
  };

  const clearDay = (dayKey: string) => {
    setPlan((prev) => {
      const next = { ...prev };
      delete next[dayKey];
      return next;
    });
  };

  const getOutfit = (id: string): Outfit | undefined => allOutfits.find((o) => o.id === id);

  return (
    <div className="px-4 pb-6 space-y-4">
      <div className="pt-2 animate-reveal-up">
        <h2 className="text-3xl font-semibold text-foreground text-balance">Weekly Planner</h2>
        <p className="text-secondary text-sm mt-1">Tap a day to assign an outfit</p>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between bg-card rounded-xl border border-border px-2 py-2.5 animate-reveal-up" style={{ animationDelay: "30ms" }}>
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-2 text-muted-foreground hover:text-foreground active:scale-[0.92] transition-all rounded-lg hover:bg-muted"
          aria-label="Previous week"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={() => setWeekOffset(0)}
          className={`text-sm font-medium tracking-wide transition-colors active:scale-[0.97] px-3 py-1 rounded-lg ${
            weekOffset === 0 ? "text-gold" : "text-foreground hover:text-gold"
          }`}
        >
          {formatRange(weekDates)}
        </button>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-2 text-muted-foreground hover:text-foreground active:scale-[0.92] transition-all rounded-lg hover:bg-muted"
          aria-label="Next week"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {weekDates.map((date, i) => {
        const dayKey = date.toISOString().slice(0, 10);
        const outfit = plan[dayKey] ? getOutfit(plan[dayKey]) : undefined;
        const tempBadge = outfit ? temperatureBadges[outfit.temp] : undefined;
        const dayNum = date.getDate();
        const dayLabel = `${DAY_LABELS[i].slice(0, 3)} ${dayNum}`;

        return (
          <div
            key={dayKey}
            className="bg-card rounded-xl border border-border animate-reveal-up overflow-hidden"
            style={{ animationDelay: `${(i + 1) * 50 + 30}ms` }}
          >
            <button
              onClick={() => setSheetDay({ key: dayKey, label: dayLabel })}
              className="w-full flex items-stretch gap-0 text-left active:scale-[0.99] transition-transform"
            >
              {/* Date block */}
              <div className="w-12 flex-shrink-0 bg-muted/60 flex flex-col items-center justify-center py-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gold leading-none">
                  {DAY_LABELS[i].slice(0, 3)}
                </span>
                <span className="text-xl text-foreground leading-tight mt-0.5" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {dayNum}
                </span>
              </div>

              {outfit ? (
                <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-center">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-foreground font-medium text-sm truncate" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{outfit.name}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {tempBadge && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border whitespace-nowrap"
                          style={{ backgroundColor: tempBadge.bg, borderColor: tempBadge.border, color: tempBadge.text }}
                        >
                          {outfit.temp}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); clearDay(dayKey); }}
                        className="text-muted-foreground hover:text-foreground text-xs p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {outfit.pieces.map((p, pi) => (
                      <span key={pi} className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5">
                        <span className="w-2.5 h-2.5 rounded-full border border-border/50 flex-shrink-0" style={{ backgroundColor: p.hex }} />
                        <span className="text-[10px] text-foreground">{p.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0 px-3 py-4 flex items-center">
                  <p className="text-muted-foreground text-sm">No outfit planned</p>
                </div>
              )}
            </button>
          </div>
        );
      })}

      {/* Bottom sheet picker */}
      <OutfitPickerSheet
        open={!!sheetDay}
        dayLabel={sheetDay?.label ?? ""}
        currentOutfitId={sheetDay ? plan[sheetDay.key] : undefined}
        allOutfits={allOutfits}
        onSelect={(id) => sheetDay && assignOutfit(sheetDay.key, id)}
        onClose={() => setSheetDay(null)}
      />
    </div>
  );
};

export default WeeklyPlanner;
