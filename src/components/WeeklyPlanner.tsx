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

const DAY_LABELS  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT   = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LETTER  = ["M", "T", "W", "T", "F", "S", "S"];

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

interface WeeklyPlannerProps {
  refreshRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
}

const WeeklyPlanner = ({ refreshRef }: WeeklyPlannerProps) => {
  const { user } = useAuth();
  const { outfits } = useOutfits();
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheetDay, setSheetDay] = useState<{ key: string; label: string } | null>(null);

  // Selected day index (0 = Monday … 6 = Sunday) within current week
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const dates = getWeekDates(0);
    const today = new Date().toISOString().slice(0, 10);
    const idx = dates.findIndex(d => d.toISOString().slice(0, 10) === today);
    return idx >= 0 ? idx : 0;
  });

  // Strip slide animation state
  const [stripTranslate, setStripTranslate] = useState(0);
  const [stripTransition, setStripTransition] = useState(true);
  const isAnimating = useRef(false);

  // Swipe / drag tracking
  const touchStartX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const isDragging  = useRef(false);

  // Refs for scroll-to-day behaviour
  const dayRefs = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null));


  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const todayKey  = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const monthLabel = useMemo(() => ({
    month: weekDates[0].toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    year:  weekDates[0].getFullYear(),
  }), [weekDates]);

  // Read stored zip code into state so the weather hook re-fetches when it's first saved.
  const zipKey = user ? `capsule-zip-${user.id}` : null;
  const [zipCode, setZipCode] = useState(() =>
    zipKey ? (localStorage.getItem(zipKey) ?? "") : ""
  );

  const { forecast } = useWeatherForecast(zipCode || undefined);

  // Auto-populate zip code from geolocation on first planner visit.
  useEffect(() => {
    if (!user || !zipKey) return;
    if (localStorage.getItem(zipKey)) return;
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
            setZipCode(zip);
          }
        } catch {
          // silently ignore — zip code is non-critical
        }
      },
      () => {},
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

  // ── Week navigation with slide animation ──────────────────────────────────
  const changeWeek = useCallback((dir: 1 | -1) => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    // 1. Slide current strip out
    setStripTransition(true);
    setStripTranslate(dir === 1 ? -110 : 110);

    setTimeout(() => {
      // 2. Swap week + snap strip to the incoming side (no transition)
      setWeekOffset(prev => {
        const newDates = getWeekDates(prev + dir);
        const today = new Date().toISOString().slice(0, 10);
        const idx = newDates.findIndex(d => d.toISOString().slice(0, 10) === today);
        setSelectedDayIdx(idx >= 0 ? idx : 0);
        return prev + dir;
      });
      setStripTransition(false);
      setStripTranslate(dir === 1 ? 110 : -110);

      // 3. Slide new strip in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setStripTransition(true);
          setStripTranslate(0);
          setTimeout(() => { isAnimating.current = false; }, 155);
        });
      });
    }, 150);
  }, []);

  // ── Swipe / drag handlers ─────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40) changeWeek(dx < 0 ? 1 : -1);
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    isDragging.current = true;
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current || mouseStartX.current === null) return;
    const dx = e.clientX - mouseStartX.current;
    mouseStartX.current = null;
    isDragging.current = false;
    if (Math.abs(dx) > 40) changeWeek(dx < 0 ? 1 : -1);
  };
  const handleMouseLeave = () => {
    isDragging.current = false;
    mouseStartX.current = null;
  };

  return (
    <div className="pb-6">
      {/* Title + profile */}
      <div className="flex items-center justify-between mb-4 animate-reveal-up px-4 pt-5">
        <h2 className="text-[34px] font-bold text-foreground tracking-tight leading-none">
          Planner
        </h2>
        <ProfileButton />
      </div>

      {/* ── Sticky week strip ───────────────────────────────────────────── */}
      {/* overflow-hidden on the same element as backdrop-filter is fine —
          it clips children (slide animation, rounded corners) without breaking blur */}
      <div
        className="sticky top-0 z-10 mx-4 animate-reveal-up liquid-glass-card rounded-2xl overflow-hidden"
        style={{ animationDelay: "30ms", userSelect: "none" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="px-4 pt-3 pb-2">
          {/* Month label row + week nav arrows */}
          <div className="flex items-center justify-between mb-2">
            <button
              className="text-[12px] font-bold uppercase active:opacity-60 transition-opacity"
              style={{ letterSpacing: "0.12em" }}
              onClick={() => {
                const dates = getWeekDates(0);
                const today = new Date().toISOString().slice(0, 10);
                const idx = dates.findIndex(d => d.toISOString().slice(0, 10) === today);
                setWeekOffset(0);
                setSelectedDayIdx(idx >= 0 ? idx : 0);
              }}
            >
              <span className="text-foreground">{monthLabel.month}</span>
              <span className="text-muted-foreground"> {monthLabel.year}</span>
            </button>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => changeWeek(-1)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground active:text-foreground active:bg-muted/40 transition-colors"
                aria-label="Previous week"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={() => changeWeek(1)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground active:text-foreground active:bg-muted/40 transition-colors"
                aria-label="Next week"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* overflow-hidden here is the immediate parent of the transform —
              closest-ancestor clipping is most reliable when the browser
              promotes the animated child to its own compositor layer */}
          <div className="overflow-hidden">
          <div
            className="flex"
            style={{
              transform: `translateX(${stripTranslate}%)`,
              transition: stripTransition ? "transform 150ms ease" : "none",
            }}
          >
            {weekDates.map((date, i) => {
              const dayKey    = date.toISOString().slice(0, 10);
              const isSelected = i === selectedDayIdx;
              const isToday   = dayKey === todayKey;
              const hasOutfit = !!plan[dayKey];

              return (
                <button
                  key={dayKey}
                  onClick={() => {
                    setSelectedDayIdx(i);
                    dayRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex-1 flex flex-col items-center gap-[3px] py-1"
                >
                  {/* Single-letter day */}
                  <span
                    className="text-[10px] font-medium text-muted-foreground"
                    style={{ letterSpacing: "0.06em" }}
                  >
                    {DAY_LETTER[i]}
                  </span>

                  {/* Date number — gold circle when selected */}
                  <div
                    className="w-[28px] h-[28px] flex items-center justify-center rounded-full"
                    style={{ backgroundColor: isSelected ? "#C8A45A" : "transparent" }}
                  >
                    <span
                      className="text-[14px] leading-none"
                      style={{
                        fontWeight: isSelected || isToday ? 700 : 500,
                        color: isSelected
                          ? "#1A1209"
                          : isToday
                          ? "#FFFFFF"
                          : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Assignment dot */}
                  <div
                    className="w-[4px] h-[4px] rounded-full"
                    style={{ backgroundColor: hasOutfit ? "#C8A45A" : "transparent" }}
                  />
                </button>
              );
            })}
          </div>
          </div>
        </div>

        {/* Thin divider */}
        <div className="bg-border/40" style={{ height: "0.5px" }} />
      </div>

      {/* ── Day rows ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
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
              ref={(el) => { dayRefs.current[i] = el; }}
              className="animate-reveal-up"
              style={{
                animationDelay: `${(i + 1) * 45 + 30}ms`,
                marginBottom: "16px",
                scrollMarginTop: "90px",
              }}
            >
              {/* Day + weather header */}
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
                className={`w-full text-left rounded-2xl border overflow-hidden transition-all active:scale-[0.99] ${
                  outfit
                    ? `liquid-glass-surface ${isToday ? "border-gold/30" : "border-border/40"}`
                    : "bg-card/20 border-dashed border-border"
                }`}
              >
                {outfit ? (
                  <div className="flex">
                    {/* Vertical color bars */}
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
      </div>

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
