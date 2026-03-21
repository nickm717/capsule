import { useState, useMemo } from "react";
import { occasions, temperatureBadges, type Outfit } from "@/data/darkautumn";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatRange(dates: Date[]): string {
  const mon = dates[0];
  const sun = dates[6];
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

const WeeklyPlanner = () => {
  const allOutfits = occasions.flatMap((o) => o.outfits);
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const assignOutfit = (dayKey: string, outfitId: string) => {
    setPlan((prev) => ({ ...prev, [dayKey]: outfitId }));
    setExpandedDay(null);
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
        const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
        const outfit = plan[dayKey] ? getOutfit(plan[dayKey]) : undefined;
        const isExpanded = expandedDay === dayKey;
        const tempBadge = outfit ? temperatureBadges[outfit.temp] : undefined;
        const dayNum = date.getDate();

        return (
          <div
            key={dayKey}
            className="bg-card rounded-xl border border-border animate-reveal-up overflow-hidden"
            style={{ animationDelay: `${(i + 1) * 50 + 30}ms` }}
          >
            {/* Day header */}
            <button
              onClick={() => setExpandedDay(isExpanded ? null : dayKey)}
              className="w-full flex items-center gap-3 p-4 text-left active:scale-[0.99] transition-transform"
            >
              <span className="text-gold font-semibold text-sm uppercase tracking-wider w-14 flex-shrink-0">
                {DAY_LABELS[i].slice(0, 3)}{" "}
                <span className="text-foreground">{dayNum}</span>
              </span>
              <div className="flex-1 min-w-0">
                {outfit ? (
                  <div>
                    <p className="text-foreground font-medium text-sm truncate">{outfit.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {outfit.pieces.slice(0, 4).map((p, pi) => (
                        <span
                          key={pi}
                          className="w-3.5 h-3.5 rounded-full border border-border/50"
                          style={{ backgroundColor: p.hex }}
                        />
                      ))}
                      {outfit.pieces.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">+{outfit.pieces.length - 4}</span>
                      )}
                      {tempBadge && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border ml-1"
                          style={{ backgroundColor: tempBadge.bg, borderColor: tempBadge.border, color: tempBadge.text }}
                        >
                          {outfit.temp}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No outfit planned</p>
                )}
              </div>
              {outfit && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearDay(dayKey); }}
                  className="text-muted-foreground hover:text-foreground text-xs p-1"
                >
                  ✕
                </button>
              )}
            </button>

            {/* Expanded outfit picker */}
            {isExpanded && (
              <div className="border-t border-border px-4 py-3 max-h-64 overflow-y-auto space-y-1.5">
                {allOutfits.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => assignOutfit(dayKey, o.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors active:scale-[0.98] ${
                      plan[dayKey] === o.id ? "bg-primary/10 text-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex gap-1">
                      {o.pieces.slice(0, 3).map((p, pi) => (
                        <span key={pi} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.hex }} />
                      ))}
                    </div>
                    <span className="text-sm truncate">{o.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                      {occasions.find((oc) => oc.outfits.some((oo) => oo.id === o.id))?.icon}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyPlanner;
