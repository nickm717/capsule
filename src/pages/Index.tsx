import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Plus } from "lucide-react";
import WardrobeGuide from "@/components/WardrobeGuide";
import OutfitCombinations from "@/components/OutfitCombinations";
import WeeklyPlanner from "@/components/WeeklyPlanner";
import { useAppData } from "@/contexts/AppDataContext";
import { usePaletteContext } from "@/contexts/PaletteContext";
import type { ColorSwatch } from "@/data/darkautumn";

// ── Gradient pairing algorithm ────────────────────────────────
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function scorePair(hsl1: [number, number, number], hsl2: [number, number, number]): number {
  let hueDiff = Math.abs(hsl1[0] - hsl2[0]);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;
  // Prefer hue differences in 20–100° range (analogous / split-complementary)
  const hueScore = hueDiff >= 20 && hueDiff <= 100 ? 1 - Math.abs(hueDiff - 60) / 60 : 0;
  // Reward some lightness difference for gradient depth
  const lightnessDiff = Math.abs(hsl1[2] - hsl2[2]);
  const lightnessScore = Math.min(lightnessDiff / 0.3, 1);
  return hueScore * 0.7 + lightnessScore * 0.3;
}

const FALLBACK_GRADIENTS: Record<string, string> = {
  wardrobe: "linear-gradient(135deg, #9B4A2A, #B85C38)",
  outfits:  "linear-gradient(135deg, #6B7A3A, #A0682A)",
  planner:  "linear-gradient(135deg, #2E6E68, #3A4A5C)",
};

function pickGradientPairs(palette: ColorSwatch[]): Record<string, string> {
  if (palette.length < 2) return FALLBACK_GRADIENTS;

  const tabs = ["wardrobe", "outfits", "planner"] as const;
  const hsls = palette.map((c) => hexToHsl(c.hex));

  // Score all pairs
  type Pair = { i: number; j: number; score: number };
  const pairs: Pair[] = [];
  for (let i = 0; i < palette.length; i++) {
    for (let j = i + 1; j < palette.length; j++) {
      pairs.push({ i, j, score: scorePair(hsls[i], hsls[j]) });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  // Greedily pick 3 non-overlapping pairs (no color reused across tabs)
  const used = new Set<number>();
  const chosen: Pair[] = [];
  for (const pair of pairs) {
    if (chosen.length === 3) break;
    if (!used.has(pair.i) && !used.has(pair.j)) {
      chosen.push(pair);
      used.add(pair.i);
      used.add(pair.j);
    }
  }

  // Fill remaining tabs with fallback if not enough good pairs
  const result: Record<string, string> = { ...FALLBACK_GRADIENTS };
  tabs.forEach((tab, idx) => {
    const pair = chosen[idx];
    if (pair) {
      result[tab] = `linear-gradient(135deg, ${palette[pair.i].hex}, ${palette[pair.j].hex})`;
    }
  });
  return result;
}

type Tab = "wardrobe" | "outfits" | "planner";

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: "wardrobe",
    label: "Wardrobe",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="7" y1="8" x2="7" y2="8.01" />
        <line x1="17" y1="8" x2="17" y2="8.01" />
      </svg>
    ),
  },
  {
    key: "outfits",
    label: "Outfits",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46 16 2 12 5.5 8 2 3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23Z" />
      </svg>
    ),
  },
  {
    key: "planner",
    label: "Planner",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
];

const PULL_THRESHOLD = 64; // px to trigger refresh
const PULL_RESISTANCE = 0.45; // how much drag vs finger movement

const IndexInner = () => {
  const { refreshWardrobe, refreshOutfits } = useAppData();
  const { palette, loading } = usePaletteContext();

  const [activeTab, setActiveTab] = useState<Tab>("wardrobe");
  const [hideNav, setHideNav] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [addOutfitSheetOpen, setAddOutfitSheetOpen] = useState(false);

  const handleWardrobeFormOpen = (open: boolean) => setHideNav(open);

  const handlePieceTap = useCallback((itemId: string) => {
    setEditItemId(itemId);
    setActiveTab("wardrobe");
  }, []);

  const handleEditItemConsumed = useCallback(() => {
    setEditItemId(null);
  }, []);

  const [isDark, setIsDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const [scrollY, setScrollY] = useState(0);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
    setScrollY(0);
  }, [activeTab]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef(0);
  const isPullingRef = useRef(false);
  const activeTabRef = useRef(activeTab);
  const hideNavRef = useRef(hideNav);
  const plannerRefreshRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { hideNavRef.current = hideNav; }, [hideNav]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (hideNavRef.current) return;
      if (el.scrollTop === 0) {
        touchStartYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current) return;
      const dy = e.touches[0].clientY - touchStartYRef.current;
      if (dy <= 0) {
        isPullingRef.current = false;
        setPullDistance(0);
        return;
      }
      // Prevent native scroll bounce while pulling
      if (el.scrollTop === 0 && dy > 0) {
        e.preventDefault();
      }
      setPullDistance(dy * PULL_RESISTANCE);
    };

    const onTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(0);
        try {
          const tab = activeTabRef.current;
          if (tab === "wardrobe") {
            await refreshWardrobe();
          } else if (tab === "outfits") {
            await refreshOutfits();
          } else if (tab === "planner") {
            await Promise.all([
              refreshOutfits(),
              plannerRefreshRef.current?.(),
            ]);
          }
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullDistance, refreshWardrobe, refreshOutfits]);

  const baseOpacity = isDark ? 0.55 : 0.22;
  const gradientOpacity = baseOpacity * Math.max(0, 1 - scrollY / (mainRef.current?.clientHeight ?? window.innerHeight));

  const tabGradients = useMemo(() => pickGradientPairs(palette), [palette]);

  // Pull indicator: how far along the threshold (0–1)
  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const showIndicator = pullDistance > 4 || isRefreshing;

  return (
    <div
      className="h-screen overflow-hidden flex flex-col max-w-lg mx-auto"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Fixed header gradient — stays at top, fades as user scrolls */}
      <div
        className="fixed top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "50vh",
          background: tabGradients[activeTab],
          WebkitMask: "linear-gradient(180deg, black 0%, transparent 100%)",
          mask: "linear-gradient(180deg, black 0%, transparent 100%)",
          opacity: loading ? 0 : gradientOpacity,
          zIndex: 0,
          transition: loading ? "none" : "background 0.4s ease, opacity 0.3s ease",
        }}
      />

      {/* Pull-to-refresh indicator */}
      {showIndicator && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
          style={{
            paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isRefreshing ? 16 : Math.max(0, pullDistance - 8)}px)`,
            transition: isRefreshing ? "padding-top 0.2s ease" : "none",
          }}
        >
          <div
            className="flex items-center justify-center rounded-full shadow-md"
            style={{
              width: 32,
              height: 32,
              backgroundColor: isDark ? "rgba(40,32,26,0.92)" : "rgba(255,252,248,0.92)",
              border: "1px solid hsl(var(--border))",
              transform: `scale(${0.6 + pullProgress * 0.4})`,
              transition: isRefreshing ? "transform 0.2s ease" : "none",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isRefreshing ? "none" : `rotate(${pullProgress * 270}deg)`,
                animation: isRefreshing ? "spin 0.7s linear infinite" : "none",
              }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        </div>
      )}

      {/* Content */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto pb-24 pt-4"
        style={{
          position: "relative",
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: isPullingRef.current ? "none" : "transform 0.25s ease",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          {activeTab === "wardrobe" && (
            <WardrobeGuide
              onFormOpen={handleWardrobeFormOpen}
              openItemId={editItemId}
              onOpenItemConsumed={handleEditItemConsumed}
            />
          )}
          {activeTab === "outfits" && (
            <OutfitCombinations
              onBuilderOpen={setHideNav}
              onPieceTap={handlePieceTap}
              addSheetOpen={addOutfitSheetOpen}
              onAddSheetOpenChange={setAddOutfitSheetOpen}
            />
          )}
          {activeTab === "planner" && <WeeklyPlanner refreshRef={plannerRefreshRef} />}
        </div>
      </main>

      {/* Add-outfit FAB — intentionally outside <main> so its touch events
          don't bubble to the pull-to-refresh scroll listener */}
      {activeTab === "outfits" && !hideNav && (
        <button
          onClick={() => setAddOutfitSheetOpen(true)}
          className="fixed right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-[0.92] active:opacity-90"
          style={{
            bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
            backgroundColor: "hsl(var(--primary))",
            boxShadow: "0 2px 12px rgba(0,0,0,0.22)",
          }}
          aria-label="Add outfit"
        >
          <Plus size={22} color="white" strokeWidth={2.5} />
        </button>
      )}

      {/* Bottom Tab Bar */}
      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 liquid-glass-nav"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div className="max-w-lg mx-auto flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 pt-3 transition-all duration-200 active:scale-[0.92] ${
                  activeTab === tab.key
                    ? "text-gold"
                    : "text-muted-foreground"
                }`}
              >
                <div className={`transition-transform duration-200 ${activeTab === tab.key ? "scale-110" : ""}`}>
                  {tab.icon}
                </div>
                <span
                  className="text-[10px] font-medium uppercase"
                  style={{ letterSpacing: "0.07em" }}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

const Index = () => <IndexInner />;

export default Index;
