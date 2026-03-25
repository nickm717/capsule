import { useState, useCallback, useEffect } from "react";
import WardrobeGuide from "@/components/WardrobeGuide";
import OutfitCombinations from "@/components/OutfitCombinations";
import WeeklyPlanner from "@/components/WeeklyPlanner";
import { AppDataProvider } from "@/contexts/AppDataContext";

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

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("wardrobe");
  const [hideNav, setHideNav] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);

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

  const tabGradients: Record<Tab, string> = {
    wardrobe: "linear-gradient(90deg, #9B4A2A, #B85C38)",
    outfits:  "linear-gradient(90deg, #6B7A3A, #A0682A)",
    planner:  "linear-gradient(90deg, #2E6E68, #3A4A5C)",
  };

  return (
    <AppDataProvider>
    <div
      className="min-h-screen flex flex-col max-w-lg mx-auto"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24 pt-4" style={{ position: "relative" }}>
        {/* Scrolling header gradient — fades out after one full page scroll */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: "50vh",
            background: tabGradients[activeTab],
            WebkitMask: "linear-gradient(180deg, black 0%, transparent 100%)",
            mask: "linear-gradient(180deg, black 0%, transparent 100%)",
            opacity: isDark ? 0.55 : 0.22,
            zIndex: 0,
            transition: "background 0.4s ease, opacity 0.4s ease",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          {activeTab === "wardrobe" && (
            <WardrobeGuide
              onFormOpen={handleWardrobeFormOpen}
              openItemId={editItemId}
              onOpenItemConsumed={handleEditItemConsumed}
            />
          )}
          {activeTab === "outfits" && (
            <OutfitCombinations onBuilderOpen={setHideNav} onPieceTap={handlePieceTap} />
          )}
          {activeTab === "planner" && <WeeklyPlanner />}
        </div>
      </main>

      {/* Bottom Tab Bar */}
      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            backgroundColor: "color-mix(in srgb, hsl(var(--card)) 92%, transparent)",
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
    </AppDataProvider>
  );
};

export default Index;
