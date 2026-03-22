import { useState, useMemo, useEffect, useCallback } from "react";
import { temperatureBadges } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import { useOutfits, type DbOutfit } from "@/hooks/use-outfits";
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
  const { outfits } = useOutfits();
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheetDay, setSheetDay] = useState<{ key: string; label: string } | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const loadAssignments = useCallback(async () => {
    const { data } = await supabase
      .from("planner_assignments")
      .select("day_key, outfit_id");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: any) => { map[row.day_key] = row.outfit_id; });
      setPlan(map);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const assignOutfit = async (dayKey: string, outfitId: string) => {
    setPlan((prev) => ({ ...prev, [dayKey]: outfitId }));
    setSheetDay(null);
    await supabase
      .from("planner_assignments")
      .upsert({ day_key: dayKey, outfit_id: outfitId }, { onConflict: "day_key" });
  };

  const clearDay = async (dayKey: string) => {
    setPlan((prev) => {
      const next = { ...prev };
      delete next[dayKey];
      return next;
    });
    await supabase
      .from("planner_assignments")
      .delete()
      .eq("day_key", dayKey);
  };

  const getOutfit = (id: string): DbOutfit | undefined => outfits.find((o) => o.id === id);

  // Convert DbOutfit[] to the Outfit shape expected by OutfitPickerSheet
  const allOutfitsForPicker = useMemo(() =>
    outfits.map((o) => ({
      id: o.id,
      name: o.name,
      temp: o.temp,
      pieces: o.pieces,
      notes: o.notes,
      occasion_id: o.occasion_id,
    })),
  [outfits]);

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
                <div className="flex flex-1 min-w-0">
                  {/* Vertical color strips */}
                  <div className="flex flex-shrink-0 py-2.5 pl-2 gap-0.5">
                    {outfit.pieces.map((p, pi) => (
                      <div
                        key={pi}
                        className="w-1.5 rounded-sm"
                        style={{ backgroundColor: p.hex, minHeight: "24px" }}
                      />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0 px-2.5 py-2.5 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-foreground font-medium text-sm truncate">{outfit.name}</p>
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
                    <p className="text-muted-foreground text-[10px] mt-0.5 truncate">
                      {outfit.pieces.map((p) => p.name).join(" · ")}
                    </p>
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
        allOutfits={allOutfitsForPicker}
        onSelect={(id) => sheetDay && assignOutfit(sheetDay.key, id)}
        onClose={() => setSheetDay(null)}
      />
    </div>
  );
};

export default WeeklyPlanner;
