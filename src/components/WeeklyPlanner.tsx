import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import ProfileButton from "@/components/ProfileButton";
import { temperatureBadges } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOutfits } from "@/hooks/use-outfits";
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
const DAY_LETTER = ["M", "T", "W", "T", "F", "S", "S"];

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

interface DragState {
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  velocity: number; // px/ms, exponential smoothed
  active: boolean;
  containerWidth: number;
  // null = undecided, set after first 8px of movement
  directionLocked: "horizontal" | "vertical" | null;
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

  // Selected day index (0 = Monday … 6 = Sunday)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const dates = getWeekDates(0);
    const today = new Date().toISOString().slice(0, 10);
    const idx = dates.findIndex(d => d.toISOString().slice(0, 10) === today);
    return idx >= 0 ? idx : 0;
  });

  // Live-drag strip position: drives translateX(calc(-33.333% + Xpx))
  // -33.333% of the 300%-wide track = exactly -1 container width, centering panel 2
  const [stripOffsetPx, setStripOffsetPx] = useState(0);
  const [stripTransitionCSS, setStripTransitionCSS] = useState("none");

  // All gesture state in a single ref — no re-renders during drag
  const dragState = useRef<DragState | null>(null);
  const isAnimating = useRef(false);

  // DOM refs
  const stickyRef        = useRef<HTMLDivElement>(null); // for imperative touchmove
  const stripContainerRef = useRef<HTMLDivElement>(null); // for containerWidth reads
  const dayRefs          = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null));

  // Sync weekOffset into a ref so gesture handlers read it without stale closures
  const weekOffsetRef = useRef(weekOffset);
  useEffect(() => { weekOffsetRef.current = weekOffset; }, [weekOffset]);

  // Three panels: prev / current / next
  const prevWeekDates = useMemo(() => getWeekDates(weekOffset - 1), [weekOffset]);
  const weekDates     = useMemo(() => getWeekDates(weekOffset),     [weekOffset]);
  const nextWeekDates = useMemo(() => getWeekDates(weekOffset + 1), [weekOffset]);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const monthLabel = useMemo(() => ({
    month: weekDates[0].toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    year:  weekDates[0].getFullYear(),
  }), [weekDates]);

  // ── Weather / zip ──────────────────────────────────────────────────────────
  const zipKey = user ? `capsule-zip-${user.id}` : null;
  const [zipCode, setZipCode] = useState(() =>
    zipKey ? (localStorage.getItem(zipKey) ?? "") : ""
  );
  const { forecast } = useWeatherForecast(zipCode || undefined);

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
          if (zip) { localStorage.setItem(zipKey, zip); setZipCode(zip); }
        } catch { /* non-critical */ }
      },
      () => {},
      { timeout: 8000 }
    );
  }, [user, zipKey]);

  // ── Supabase ───────────────────────────────────────────────────────────────
  const loadAssignments = useCallback(async () => {
    const { data } = await supabase
      .from("planner_assignments").select("day_key, outfit_id").eq("user_id", user!.id);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: any) => { map[row.day_key] = row.outfit_id; });
      setPlan(map);
    }
  }, []);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);
  useEffect(() => { if (refreshRef) refreshRef.current = loadAssignments; }, [refreshRef, loadAssignments]);

  const assignOutfit = async (dayKey: string, outfitId: string) => {
    setPlan(prev => ({ ...prev, [dayKey]: outfitId }));
    setSheetDay(null);
    await supabase.from("planner_assignments")
      .upsert({ day_key: dayKey, outfit_id: outfitId, user_id: user!.id }, { onConflict: "day_key,user_id" });
  };

  const clearDay = async (dayKey: string) => {
    setPlan(prev => { const next = { ...prev }; delete next[dayKey]; return next; });
    await supabase.from("planner_assignments").delete().eq("day_key", dayKey);
  };

  const getOutfit = (id: string) => outfits.find(o => o.id === id);

  const allOutfitsForPicker = useMemo(() =>
    outfits.map(o => ({ id: o.id, name: o.name, temp: o.temp, pieces: o.pieces, notes: o.notes, occasion_id: o.occasion_id })),
  [outfits]);

  // ── Gesture helpers ────────────────────────────────────────────────────────

  const startDrag = useCallback((clientX: number, clientY: number) => {
    if (isAnimating.current) return;
    const container = stripContainerRef.current;
    if (!container) return;
    dragState.current = {
      startX: clientX, startY: clientY, lastX: clientX,
      lastTime: performance.now(), velocity: 0,
      active: true,
      containerWidth: container.getBoundingClientRect().width,
      directionLocked: null,
    };
    // Don't disable transition yet — wait until we know it's horizontal
  }, []);

  const moveDrag = useCallback((clientX: number) => {
    const ds = dragState.current;
    if (!ds?.active) return;
    const now = performance.now();
    const dt = now - ds.lastTime;
    if (dt > 0) {
      const instant = (clientX - ds.lastX) / dt;
      ds.velocity = ds.velocity * 0.7 + instant * 0.3;
    }
    ds.lastX = clientX;
    ds.lastTime = now;
    setStripOffsetPx(clientX - ds.startX);
  }, []);

  // Shared commit logic for both drag-release and arrow buttons
  const commitWeekChange = useCallback((dir: 1 | -1, fromContainerWidth?: number) => {
    if (isAnimating.current) return;
    const containerWidth = fromContainerWidth
      ?? stripContainerRef.current?.getBoundingClientRect().width
      ?? 0;
    if (!containerWidth) return;

    isAnimating.current = true;
    const targetPx = dir === 1 ? -containerWidth : containerWidth;
    setStripTransitionCSS("transform 200ms ease-out");
    setStripOffsetPx(targetPx);

    setTimeout(() => {
      setStripTransitionCSS("none");
      setWeekOffset(prev => {
        const newDates = getWeekDates(prev + dir);
        const today = new Date().toISOString().slice(0, 10);
        const idx = newDates.findIndex(d => d.toISOString().slice(0, 10) === today);
        setSelectedDayIdx(idx >= 0 ? idx : 0);
        return prev + dir;
      });
      setStripOffsetPx(0);
      requestAnimationFrame(() => requestAnimationFrame(() => { isAnimating.current = false; }));
    }, 200);
  }, []);

  const endDrag = useCallback(() => {
    const ds = dragState.current;
    if (!ds?.active) return;
    if (isAnimating.current) { dragState.current = null; return; }
    ds.active = false;

    const delta = ds.lastX - ds.startX;
    const shouldCommit =
      Math.abs(delta) >= ds.containerWidth * 0.4 ||
      Math.abs(ds.velocity) >= 0.3;
    const dir: 1 | -1 = delta < 0 ? 1 : -1;

    if (shouldCommit) {
      commitWeekChange(dir, ds.containerWidth);
    } else {
      // Bounce back
      setStripTransitionCSS("transform 200ms ease-out");
      setStripOffsetPx(0);
      setTimeout(() => setStripTransitionCSS("none"), 200);
    }
    dragState.current = null;
  }, [commitWeekChange]);

  const cancelDrag = useCallback(() => {
    const ds = dragState.current;
    if (!ds) return;
    ds.active = false;
    dragState.current = null;
    setStripTransitionCSS("transform 200ms ease-out");
    setStripOffsetPx(0);
    setTimeout(() => setStripTransitionCSS("none"), 200);
  }, []);

  // ── Imperative touch handlers (non-passive so we can call preventDefault) ──
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;

    const onMove = (e: TouchEvent) => {
      const ds = dragState.current;
      if (!ds?.active) return;

      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - ds.startX);
      const dy = Math.abs(touch.clientY - ds.startY);

      if (!ds.directionLocked) {
        if (dx < 3 && dy < 3) {
          // Too little movement to decide — hold off the browser's scroll
          // decision by preventing default on this frame.
          e.preventDefault();
          return;
        }
        if (dx >= dy) {
          // Horizontal — take over
          ds.directionLocked = "horizontal";
          setStripTransitionCSS("none");
        } else {
          // Vertical — abandon drag, let native scroll happen unobstructed
          ds.active = false;
          dragState.current = null;
          return;
        }
      }

      e.preventDefault();
      moveDrag(touch.clientX);
    };

    // After a horizontal drag, touchend triggers a click on whichever day
    // button the finger is over. Suppress that click so the page doesn't
    // jump to that day's card. This handler fires before React's synthetic
    // onTouchEnd because it's registered directly on the element.
    const onEnd = (e: TouchEvent) => {
      if (dragState.current?.directionLocked === "horizontal") {
        e.preventDefault();
      }
    };

    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: false });
    return () => {
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [moveDrag]);

  // ── React event handlers ───────────────────────────────────────────────────
  const handleTouchStart  = (e: React.TouchEvent) => startDrag(e.touches[0].clientX, e.touches[0].clientY);
  const handleTouchEnd    = () => endDrag();
  const handleTouchCancel = () => cancelDrag();
  const handleMouseDown   = (e: React.MouseEvent) => startDrag(e.clientX);
  const handleMouseMove   = (e: React.MouseEvent) => moveDrag(e.clientX);
  const handleMouseUp     = () => endDrag();
  const handleMouseLeave  = () => { if (dragState.current?.active) endDrag(); };

  // ── Scroll a day row into view below the sticky strip ────────────────────
  // Uses scroll-container-relative coordinates to avoid safe-area / viewport
  // offset differences between Safari and PWA (standalone) mode:
  //   - dayRect.top - containerRect.top  →  position inside scroll container
  //   - stickyEl.offsetHeight            →  DOM height, not viewport-relative
  //   - scrollTo (absolute)              →  no delta accumulation errors
  const scrollToDay = useCallback((i: number) => {
    const dayEl    = dayRefs.current[i];
    const stickyEl = stickyRef.current;
    if (!dayEl || !stickyEl) return;

    let scrollEl: HTMLElement | null = dayEl.parentElement;
    while (scrollEl) {
      const { overflowY } = getComputedStyle(scrollEl);
      if (overflowY === "auto" || overflowY === "scroll") break;
      scrollEl = scrollEl.parentElement;
    }
    if (!scrollEl) return;

    const containerRect = scrollEl.getBoundingClientRect();
    const dayRect       = dayEl.getBoundingClientRect();
    const stickyHeight  = stickyEl.offsetHeight;
    const gap = 8;

    // Day card's current distance from the scroll container's visible top edge.
    // Both rects are viewport-relative, so their difference is safe-area-neutral.
    const dayFromContainerTop = dayRect.top - containerRect.top;

    // In PWA (standalone) mode, iOS WKWebView resolves sticky top:0 relative
    // to the scroll container's content box (inside pt-4) rather than its
    // border box, adding ~8px to the effective strip height we need to clear.
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const pwaPx = isStandalone ? 8 : 0;

    scrollEl.scrollTo({
      top: scrollEl.scrollTop + dayFromContainerTop - stickyHeight - gap + pwaPx,
      behavior: "smooth",
    });
  }, []);

  // ── Day button renderer (shared across all three panels) ───────────────────
  const renderDayButton = (date: Date, i: number, interactive: boolean) => {
    const dayKey     = date.toISOString().slice(0, 10);
    const isSelected = interactive && i === selectedDayIdx;
    const isToday    = dayKey === todayKey;
    const hasOutfit  = !!plan[dayKey];

    return (
      <button
        key={dayKey}
        onClick={interactive ? () => {
          setSelectedDayIdx(i);
          scrollToDay(i);
        } : undefined}
        className="flex-1 flex flex-col items-center gap-[3px] py-1"
        style={{ pointerEvents: interactive ? "auto" : "none" }}
        tabIndex={interactive ? 0 : -1}
      >
        <span className="text-[10px] font-medium text-muted-foreground" style={{ letterSpacing: "0.06em" }}>
          {DAY_LETTER[i]}
        </span>
        <div
          className="w-[28px] h-[28px] flex items-center justify-center rounded-full"
          style={{ backgroundColor: isSelected ? "#C8A45A" : "transparent" }}
        >
          <span
            className="text-[14px] leading-none"
            style={{
              fontWeight: isSelected || isToday ? 700 : 500,
              color: isSelected ? "#1A1209" : isToday ? "#FFFFFF" : "hsl(var(--muted-foreground))",
            }}
          >
            {date.getDate()}
          </span>
        </div>
        <div
          className="w-[4px] h-[4px] rounded-full"
          style={{ backgroundColor: hasOutfit ? "#C8A45A" : "transparent" }}
        />
      </button>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
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
      <div
        ref={stickyRef}
        className="sticky top-0 z-10 mx-4 animate-reveal-up liquid-glass-card rounded-2xl overflow-hidden"
        style={{ animationDelay: "30ms", userSelect: "none" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="px-4 pt-3 pb-2">
          {/* Month label + nav arrows */}
          <div className="flex items-center justify-between mb-2">
            <button
              className="text-[12px] font-bold uppercase active:opacity-60 transition-opacity"
              style={{ letterSpacing: "0.12em" }}
              onClick={() => {
                if (isAnimating.current) return;
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
                onClick={() => commitWeekChange(-1)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground active:text-foreground active:bg-muted/40 transition-colors"
                aria-label="Previous week"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={() => commitWeekChange(1)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground active:text-foreground active:bg-muted/40 transition-colors"
                aria-label="Next week"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Three-panel track — 300% wide, centered on panel 2 at rest.
              During drag, stripOffsetPx shifts the track in real-time.
              overflow-hidden on the outer sticky card clips the panels. */}
          <div ref={stripContainerRef} className="overflow-hidden">
            <div
              style={{
                display: "flex",
                width: "300%",
                transform: `translateX(calc(-33.333% + ${stripOffsetPx}px))`,
                transition: stripTransitionCSS,
                willChange: "transform",
              }}
            >
              {/* Panel 1 — prev week */}
              <div style={{ width: "33.333%" }} className="flex">
                {prevWeekDates.map((date, i) => renderDayButton(date, i, false))}
              </div>
              {/* Panel 2 — current week (interactive) */}
              <div style={{ width: "33.333%" }} className="flex">
                {weekDates.map((date, i) => renderDayButton(date, i, true))}
              </div>
              {/* Panel 3 — next week */}
              <div style={{ width: "33.333%" }} className="flex">
                {nextWeekDates.map((date, i) => renderDayButton(date, i, false))}
              </div>
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
              ref={el => { dayRefs.current[i] = el; }}
              className="animate-reveal-up"
              style={{ animationDelay: `${(i + 1) * 45 + 30}ms`, marginBottom: "16px" }}
            >
              {/* Day + weather header */}
              <div className="flex items-center justify-between px-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[12px] font-bold uppercase"
                    style={{ letterSpacing: "0.12em", color: isToday ? "hsl(var(--gold))" : "hsl(var(--muted-foreground))" }}
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
                          onClick={e => { e.stopPropagation(); clearDay(dayKey); }}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground active:bg-muted/60 transition-colors active:scale-[0.92] flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-muted-foreground text-[13px] mt-1.5 leading-normal">
                        {outfit.pieces.map(p => p.name).join(" · ")}
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
        onSelect={id => sheetDay && assignOutfit(sheetDay.key, id)}
        onClose={() => setSheetDay(null)}
      />
    </div>
  );
};

export default WeeklyPlanner;
