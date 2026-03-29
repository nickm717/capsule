import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import ProfileButton from "@/components/ProfileButton";
import { temperatureBadges } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

interface WeeklyPlannerProps {
  refreshRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
}

const WeeklyPlanner = ({ refreshRef }: WeeklyPlannerProps) => {
  const { user } = useAuth();
  const { outfits } = useOutfits();
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheetDay, setSheetDay] = useState<{ key: string; label: string } | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const todayKey  = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Read stored zip code into state so the weather hook re-fetches when it's first saved.
  const zipKey = user ? `capsule-zip-${user.id}` : null;
  const [zipCode, setZipCode] = useState(() =>
    zipKey ? (localStorage.getItem(zipKey) ?? "") : ""
  );

  const { forecast } = useWeatherForecast(zipCode || undefined);

  // Auto-populate zip code from geolocation on first planner visit.
  // Once stored, the weather hook uses the zip directly — no further geolocation needed.
  useEffect(() => {
    if (!user || !zipKey) return;
    if (localStorage.getItem(zipKey)) return; // already stored
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          if (!res.ok) return;
          const data = await res.json();
          const zip = data?.address?.postcode;
          if (zip) {
            localStorage.setItem(zipKey, zip);
            setZipCode(zip); // trigger weather re-fetch via the hook
          }
        } catch {
          // silently ignore — zip code is non-critical
        }
      },
      () => {}, // permission denied — no-op
      { timeout: 8000 }
    );
  }, [user, zipKey]);

  const loadAssignments = useCallback(async () => {
    const { data } = await supabase.from("planner_assignments").select("day_key, outfit_id").eq("user_id", user!.id);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: any) => { map[row.day_key] = row.outfit_id; });
      setPlan(map);
    }
  }, []);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  useEffect(() => {
    if (refreshRef) refreshRef.current = loadAssignments;
  }, [refreshRef, loadAssignments]);

  const assignOutfit = async (dayKey: string, outfitId: string) => {
    setPlan((prev) => ({ ...prev, [dayKey]: outfitId }));
    setSheetDay(null);
    await supabase
      .from("planner_assignments")
      .upsert({ day_key: dayKey, outfit_id: outfitId, user_id: user!.id }, { onConflict: "day_key,user_id" });
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
      {/* Title + profile */}
      <div className="flex items-center justify-between mb-4 animate-reveal-up">
        <h2 className="text-[34px] font-bold text-foreground tracking-tight leading-none">
          Planner
        </h2>
        <ProfileButton />
      </div>

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
            style={{ animationDelay: `${(i + 1) * 45 + 30}ms`, marginBottom: "16px" }}
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
              className={`w-full text-left rounded-2xl border overflow-hidden transition-all active:scale-[0.99] bg-card shadow-sm dark:shadow-none ${
                outfit
                  ? isToday ? "border-gold/30" : "border-border/50"
                  : "border-dashed border-border/50"
              }`}
            >
              {outfit ? (
                <div className="flex">
                  {/* Vertical color bars — left edge */}
                  <div className="flex flex-shrink-0 gap-[2px]" style={{ width: 36 }}>
                    {outfit.pieces.map((p, pi) => (
                      <div key={pi} style={{ backgroundColor: p.hex, flex: 1 }} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0 px-4 pt-4 pb-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-semibold text-[15px] leading-none truncate">{outfit.name}</p>
                        {tempBadge && (
                          <div className="mt-1">
                            <AppBadge size="sm" bg={tempBadge.bg} borderColor={tempBadge.border} color={tempBadge.text}>
                              {outfit.temp} · {tempBadge.range}
                            </AppBadge>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); clearDay(dayKey); }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground active:bg-muted/60 transition-colors active:scale-[0.92] flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-muted-foreground text-[13px] mt-1.5 leading-normal">
                      {outfit.pieces.map((p) => p.name).join(" · ")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-4 flex items-center justify-between">
                  <span className="text-muted-foreground text-[15px]">No outfit planned</span>
                  <span className="text-muted-foreground text-xl leading-none">+</span>
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
