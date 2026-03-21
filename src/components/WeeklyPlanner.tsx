import { useState } from "react";
import { occasions, temperatureBadges, type Outfit } from "@/data/darkautumn";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const WeeklyPlanner = () => {
  const allOutfits = occasions.flatMap((o) => o.outfits);
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const assignOutfit = (day: string, outfitId: string) => {
    setPlan((prev) => ({ ...prev, [day]: outfitId }));
    setExpandedDay(null);
  };

  const clearDay = (day: string) => {
    setPlan((prev) => {
      const next = { ...prev };
      delete next[day];
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

      {DAYS.map((day, i) => {
        const outfit = plan[day] ? getOutfit(plan[day]) : undefined;
        const isExpanded = expandedDay === day;
        const tempBadge = outfit ? temperatureBadges[outfit.temp] : undefined;

        return (
          <div
            key={day}
            className="bg-card rounded-xl border border-border animate-reveal-up overflow-hidden"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Day header */}
            <button
              onClick={() => setExpandedDay(isExpanded ? null : day)}
              className="w-full flex items-center gap-3 p-4 text-left active:scale-[0.99] transition-transform"
            >
              <span className="text-gold font-semibold text-sm uppercase tracking-wider w-10">
                {day.slice(0, 3)}
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
                  onClick={(e) => { e.stopPropagation(); clearDay(day); }}
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
                    onClick={() => assignOutfit(day, o.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors active:scale-[0.98] ${
                      plan[day] === o.id ? "bg-primary/10 text-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
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
