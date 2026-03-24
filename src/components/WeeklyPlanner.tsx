import { useState, useMemo, useEffect, useCallback } from "react";
import { temperatureBadges } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import { useOutfits, type DbOutfit } from "@/hooks/use-outfits";
import { useWeatherForecast } from "@/hooks/use-weather-forecast";
import OutfitPickerSheet from "./OutfitPickerSheet";
import AppBadge from "./AppBadge";

function conditionEmoji(condition: string): string {
  switch (condition) {
    case "Sunny":   return "☀️";
    case "Cloudy":  return "⛅";
    case "Foggy":   return "🌫️";
    case "Drizzle": return "🌦️";
    case "Rainy":   return "🌧️";
    case "Snowy":
    case "Snow":    return "❄️";
    case "Showers": return "🌦️";
    case "Stormy":  return "⛈️";
    default:        return "";
  }
}

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT  = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function getWeekDates(offset: number): Date[] {
  const now  = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function formatRange(dates: Date[]): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(dates[0])} – ${fmt(dates[6])}`;
}

const WeeklyPlanner = () => {
  const { outfits } = useOutfits();
  const { forecast } = useWeatherForecast();
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheetDay, setSheetDay] = useState<{ key: string; label: string } | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const todayKey  = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const loadAssignments = useCallback(async () => {
    const { data } = await supabase.from("planner_assignments").select("day_key, outfit_id");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: any) => { map[row.day_key] = row.outfit_id; });
      setPlan(map);
    }
  }, []);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const assignOutfit = async (dayKey: string, outfitId: string) => {
    setPlan((prev) => ({ ...prev, [dayKey]: outfitId }));
    setSheetDay(null);
    await supabase
      .from("planner_assignments")
      .upsert({ day_key: dayKey, outfit_id: outfitId }, { onConflict: "day_key" });
  };

  const clearDay = async (dayKey: string) => {
    setPlan((prev) => { const next = { ...prev }; delete next[dayKey]; return next; });
    await supabase.from("planner_assignments").delete().eq("day_key", dayKey);
  };

  const getOutfit = (id: string) => outfits.find((o) => o.id === id);

  const allOutfitsForPicker = useMemo(() =>
    outfits.map((o) => ({
      id: o.id, name: o.name, temp: o.temp,
      pieces: o.pieces, notes: o.notes, occasion_id: o.occasion_id,
    })),
  [outfits]);

  return (
    <div className="px-4 pb-6 pt-5">
      {/* Title */}
      <h2 className="text-[34px] font-bold text-foreground tracking-tight leading-none mb-4 animate-reveal-up">
        Planner
      </h2>

      {/* Week navigation */}
      <div
        className="flex items-center justify-between bg-card rounded-2xl border border-border/50 px-2 py-2 mb-4 animate-reveal-up shadow-sm dark:shadow-none"
        style={{ animationDelay: "30ms" }}
      >
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-2 text-muted-foreground active:text-foreground active:scale-[0.9] transition-all rounded-xl active:bg-muted/50"
          aria-label="Previous week"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={() => setWeekOffset(0)}
          className={`text-[13px] font-semibold uppercase transition-colors active:scale-[0.97] px-3 py-1 rounded-lg ${
            weekOffset === 0 ? "text-gold" : "text-foreground active:text-gold"
          }`}
          style={{ letterSpacing: "0.1em" }}
        >
          {formatRange(weekDates)}
        </button>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-2 text-muted-foreground active:text-foreground active:scale-[0.9] transition-all rounded-xl active:bg-muted/50"
          aria-label="Next week"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Day rows — 8px gap between each day group */}
      {weekDates.map((date, i) => {
        const dayKey    = date.toISOString().slice(0, 10);
        const outfit    = plan[dayKey] ? getOutfit(plan[dayKey]) : undefined;
        const tempBadge = outfit ? temperatureBadges[outfit.temp] : undefined;
        const dayNum    = date.getDate();
        const isToday   = dayKey === todayKey;
        const weather   = forecast[dayKey];

        return (
          <div
            key={dayKey}
            className="animate-reveal-up"
            style={{ animationDelay: `${(i + 1) * 45 + 30}ms`, marginBottom: "8px" }}
          >
            {/* Day + weather header — outside the card, pure system font */}
            <div className="flex items-center justify-between px-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[12px] font-bold uppercase"
                  style={{
                    letterSpacing: "0.12em",
                    color: isToday ? "hsl(var(--gold))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {DAY_SHORT[i]}
                </span>
                <span
                  className="text-[12px] font-bold"
                  style={{ color: isToday ? "hsl(var(--gold))" : "hsl(var(--foreground))" }}
                >
                  {dayNum}
                </span>
              </div>
              {weather && (
                <span className="text-[12px] text-muted-foreground">
                  {conditionEmoji(weather.condition)} H:{weather.high}° L:{weather.low}°
                </span>
              )}
            </div>

            {/* Outfit card */}
            <button
              onClick={() => setSheetDay({ key: dayKey, label: `${DAY_LABELS[i].slice(0, 3)} ${dayNum}` })}
              className={`w-full text-left rounded-2xl border transition-all active:scale-[0.99] bg-card shadow-sm dark:shadow-none ${
                outfit
                  ? isToday ? "border-gold/30" : "border-border/50"
                  : "border-dashed border-border/50"
              }`}
            >
              {outfit ? (
                <div>
                  {/* Full-width color palette strip — clip rounded top independently */}
                  <div className="flex h-2 rounded-t-2xl overflow-hidden">
                    {outfit.pieces.map((p, pi) => (
                      <div key={pi} style={{ backgroundColor: p.hex, flex: 1 }} />
                    ))}
                  </div>
                  <div className="flex items-center px-3.5 py-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-semibold text-[15px] truncate leading-snug">{outfit.name}</p>
                      <p className="text-muted-foreground text-[12px] mt-0.5 truncate">
                        {outfit.pieces.map((p) => p.name).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {tempBadge && (
                        <AppBadge size="sm" bg={tempBadge.bg} borderColor={tempBadge.border} color={tempBadge.text}>
                          {outfit.temp}
                        </AppBadge>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); clearDay(dayKey); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground active:bg-muted/60 transition-colors text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-4 flex items-center justify-between">
                  <span className="text-muted-foreground/50 text-[15px]">No outfit planned</span>
                  <span className="text-muted-foreground/40 text-xl leading-none">+</span>
                </div>
              )}
            </button>
          </div>
        );
      })}

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
