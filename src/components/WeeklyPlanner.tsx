import { useState, useMemo, useEffect, useCallback } from "react";
import { temperatureBadges } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import { useOutfits, type DbOutfit } from "@/hooks/use-outfits";
import { useWeatherForecast } from "@/hooks/use-weather-forecast";
import OutfitPickerSheet from "./OutfitPickerSheet";

function conditionEmoji(condition: string): string {
  switch (condition) {
    case "Sunny": return "☀️";
    case "Cloudy": return "⛅";
    case "Foggy": return "🌫️";
    case "Drizzle": return "🌦️";
    case "Rainy": return "🌧️";
    case "Snowy":
    case "Snow": return "❄️";
    case "Showers": return "🌦️";
    case "Stormy": return "⛈️";
    default: return "";
  }
}

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

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
  const { forecast } = useWeatherForecast();
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

  // Determine today's date key
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="px-4 pb-6 pt-5 space-y-4">
      {/* Header */}
      <div className="animate-reveal-up">
        <h2 className="text-4xl font-medium text-foreground" style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic" }}>
          Planner
        </h2>
      </div>

      {/* Week navigation */}
      <div
        className="flex items-center justify-between bg-card rounded-2xl border border-border/60 px-2 py-2 animate-reveal-up"
        style={{ animationDelay: "30ms" }}
      >
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-2 text-muted-foreground hover:text-foreground active:scale-[0.9] transition-all rounded-xl hover:bg-muted/60"
          aria-label="Previous week"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={() => setWeekOffset(0)}
          className={`text-xs font-medium tracking-widest transition-colors active:scale-[0.97] px-3 py-1 rounded-lg uppercase ${
            weekOffset === 0 ? "text-gold" : "text-foreground hover:text-gold"
          }`}
          style={{ letterSpacing: "0.1em" }}
        >
          {formatRange(weekDates)}
        </button>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-2 text-muted-foreground hover:text-foreground active:scale-[0.9] transition-all rounded-xl hover:bg-muted/60"
          aria-label="Next week"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Day rows */}
      <div className="space-y-2">
        {weekDates.map((date, i) => {
          const dayKey = date.toISOString().slice(0, 10);
          const outfit = plan[dayKey] ? getOutfit(plan[dayKey]) : undefined;
          const tempBadge = outfit ? temperatureBadges[outfit.temp] : undefined;
          const dayNum = date.getDate();
          const isToday = dayKey === todayKey;
          const weather = forecast[dayKey];

          return (
            <div
              key={dayKey}
              className="animate-reveal-up"
              style={{ animationDelay: `${(i + 1) * 45 + 30}ms` }}
            >
              <button
                onClick={() => setSheetDay({ key: dayKey, label: `${DAY_LABELS[i].slice(0, 3)} ${dayNum}` })}
                className={`w-full text-left bg-card rounded-2xl border overflow-hidden transition-all active:scale-[0.99] ${
                  isToday ? "border-gold/30" : "border-border/60"
                }`}
              >
                <div className="flex items-stretch min-h-[60px]">
                  {/* Day label column */}
                  <div className={`flex flex-col items-center justify-center px-3.5 py-3 min-w-[52px] border-r ${
                    isToday ? "border-gold/20 bg-gold/8" : "border-border/40"
                  }`}>
                    <span className={`text-[9px] font-bold uppercase tracking-widest leading-none ${
                      isToday ? "text-gold" : "text-muted-foreground"
                    }`} style={{ letterSpacing: "0.12em" }}>
                      {DAY_SHORT[i]}
                    </span>
                    <span className={`text-lg font-medium leading-none mt-1 ${
                      isToday ? "text-gold" : "text-foreground"
                    }`} style={{ fontFamily: "'EB Garamond', serif" }}>
                      {dayNum}
                    </span>
                  </div>

                  {/* Outfit content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {outfit ? (
                      <>
                        {/* Color palette strip */}
                        <div className="flex h-1.5 mx-3 mt-3 rounded-full overflow-hidden">
                          {outfit.pieces.map((p, pi) => (
                            <div
                              key={pi}
                              style={{ backgroundColor: p.hex, flex: 1 }}
                            />
                          ))}
                        </div>
                        <div className="px-3 py-2 flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground font-medium text-sm truncate leading-snug">{outfit.name}</p>
                            <p className="text-muted-foreground text-[10px] mt-0.5 leading-relaxed truncate">
                              {outfit.pieces.map((p) => p.name).join(" · ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {weather && (
                              <span className="text-[10px] text-muted-foreground/70">
                                {conditionEmoji(weather.condition)} {weather.high}°
                              </span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); clearDay(dayKey); }}
                              className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="px-3 py-3 flex items-center justify-between">
                        <span className="text-muted-foreground/50 text-xs" style={{ letterSpacing: "0.04em" }}>
                          No outfit planned
                        </span>
                        <div className="flex items-center gap-2">
                          {weather && (
                            <span className="text-[10px] text-muted-foreground/60">
                              {conditionEmoji(weather.condition)} {weather.high}°
                            </span>
                          )}
                          <span className="text-muted-foreground/40 text-base leading-none">+</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

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
