import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronRight, Shirt, TrendingUp, Calendar, BarChart2, Layers, Clock, Star } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
  Tooltip,
} from "recharts";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { useInsightsData } from "@/hooks/useInsightsData";

const PIE_COLORS = ["#9B4A2A", "#6B7A3A", "#2E6E68", "#5C4A7A", "#A07030", "#4A6A8A", "#8A3A4A", "#3A6A70"];

// ── Shared primitives ─────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase mb-3" style={{ letterSpacing: "0.07em" }}>
      {children}
    </p>
  );
}

function Card({ children, className = "", onClick }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`liquid-glass-surface border border-border/60 rounded-xl p-4 ${onClick ? "cursor-pointer active:opacity-75 transition-opacity" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon, label, tappable = false }: {
  icon: React.ReactNode;
  label: string;
  tappable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-medium text-muted-foreground uppercase" style={{ letterSpacing: "0.07em" }}>
          {label}
        </span>
      </div>
      {tappable && <ChevronRight size={14} className="text-muted-foreground/60" />}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-xs text-muted-foreground">{message}</p>;
}

// ── Drawer close button ───────────────────────────────────────

function DrawerCloseButton() {
  return (
    <DrawerClose asChild>
      <button className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
        <X size={16} />
      </button>
    </DrawerClose>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function InsightsPage() {
  const navigate = useNavigate();
  const { data, loading } = useInsightsData();
  const [freqDrawerOpen, setFreqDrawerOpen] = useState(false);
  const [topItemsDrawerOpen, setTopItemsDrawerOpen] = useState(false);
  const [topItemsCategory, setTopItemsCategory] = useState("All");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const d = data ?? {
    totalItems: 0, totalOutfits: 0, outfitsThisMonth: 0, wornRate: 0,
    topItems: [], ghostItems: [], categoryBreakdown: [], outfitFrequency: [],
    plannerCoverage: [], mostRepeatedOutfits: [], cpwItems: [],
  };

  const totalFrequencyCount = d.outfitFrequency.reduce((s, w) => s + w.count, 0);
  const freqAllZero = d.outfitFrequency.every(w => w.count === 0);

  // Categories that have at least one item with count > 0
  const wornItemCategories = [...new Set(
    d.topItems.filter(i => i.count > 0).map(i => i.category)
  )].sort();
  const topItemsCategories = wornItemCategories.length > 1 ? ["All", ...wornItemCategories] : [];

  const filteredTopItems = (topItemsCategory === "All"
    ? d.topItems
    : d.topItems.filter(i => i.category === topItemsCategory)
  ).filter(i => i.count > 0).slice(0, 5);

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="max-w-lg mx-auto px-4 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between py-5">
          <h1 className="text-lg font-semibold">Insights</h1>
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Close insights"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">

          {/* ── 1. Summary row ─────────────────────────────────── */}
          <section>
            <SectionLabel>Overview</SectionLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card>
                <CardHeader icon={<Shirt size={13} />} label="Total Items" />
                <p className="text-3xl font-bold leading-none">{d.totalItems}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">in your wardrobe</p>
              </Card>
              <Card>
                <CardHeader icon={<Layers size={13} />} label="Outfits" />
                <p className="text-3xl font-bold leading-none">{d.totalOutfits}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">saved looks</p>
              </Card>
              <Card>
                <CardHeader icon={<Calendar size={13} />} label="This Month" />
                <p className="text-3xl font-bold leading-none">{d.outfitsThisMonth}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">outfits logged</p>
              </Card>
              <Card>
                <CardHeader icon={<TrendingUp size={13} />} label="Worn Rate" />
                <p className="text-3xl font-bold leading-none">
                  {d.wornRate}<span className="text-lg font-semibold ml-0.5">%</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">items styled</p>
              </Card>
            </div>
          </section>

          {/* ── 2. Most & Least Worn ───────────────────────────── */}
          <section>
            <SectionLabel>Most &amp; Least Worn</SectionLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              {/* Most Worn — tappable */}
              <Card onClick={filteredTopItems.length > 0 ? () => setTopItemsDrawerOpen(true) : undefined}>
                <CardHeader icon={<BarChart2 size={13} />} label="Most Worn" tappable={filteredTopItems.length > 0} />
                {topItemsCategories.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-3" onClick={e => e.stopPropagation()}>
                    {topItemsCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={e => { e.stopPropagation(); setTopItemsCategory(cat); }}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                          topItemsCategory === cat
                            ? "bg-primary/15 text-primary"
                            : "bg-muted/60 text-muted-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
                {filteredTopItems.length === 0 ? (
                  <EmptyState message="Log outfits in the planner to see your most-worn items." />
                ) : (
                  <>
                    <p className="text-[11px] text-muted-foreground">#1 item</p>
                    <p className="text-xl font-bold leading-tight mt-0.5 truncate">{filteredTopItems[0].name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {filteredTopItems[0].count} {filteredTopItems[0].count === 1 ? "wear" : "wears"}
                    </p>
                    <div className="mt-3">
                      <ResponsiveContainer width="100%" height={44}>
                        <BarChart
                          data={filteredTopItems}
                          layout="vertical"
                          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                        >
                          <YAxis type="category" dataKey="name" hide />
                          <XAxis type="number" hide />
                          <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={7}>
                            {filteredTopItems.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </Card>

              {/* Unworn Items */}
              <Card>
                <CardHeader icon={<Shirt size={13} />} label="Unworn Items" />
                {d.ghostItems.length === 0 ? (
                  <EmptyState message="Every item in your wardrobe has been styled — nice work." />
                ) : (
                  <div className="space-y-2.5">
                    {d.ghostItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div
                          className="w-5 h-5 rounded-full flex-shrink-0 border border-border/40"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm flex-1 truncate">{item.name}</span>
                        <span className="text-xs text-muted-foreground">0 wears</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </section>

          {/* ── 3. Wardrobe Makeup ─────────────────────────────── */}
          <section>
            <SectionLabel>Wardrobe Makeup</SectionLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card>
                <CardHeader icon={<Layers size={13} />} label="By Category" />
                {d.categoryBreakdown.length === 0 ? (
                  <EmptyState message="Add items to your wardrobe to see the breakdown." />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={d.categoryBreakdown}
                          dataKey="count"
                          nameKey="category"
                          innerRadius="45%"
                          outerRadius="75%"
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {d.categoryBreakdown.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [value, name]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem",
                            fontSize: 12,
                          }}
                          itemStyle={{ color: "hsl(var(--foreground))" }}
                          cursor={false}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
                      {d.categoryBreakdown.map((entry, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-[11px] text-muted-foreground">{entry.category}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              <Card>
                <CardHeader icon={<Clock size={13} />} label="Cost Per Wear" />
                {d.cpwItems.length === 0 ? (
                  <EmptyState message="Add prices to your items to track cost-per-wear." />
                ) : (
                  <div className="space-y-3">
                    {d.cpwItems.map((item, i) => (
                      <div key={i} className="space-y-0.5">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {item.wearCount} {item.wearCount === 1 ? "wear" : "wears"}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            ${item.price.toLocaleString()} paid
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs font-medium">${item.cpw}/wear</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </section>

          {/* ── 4. Outfit Frequency — summary card with drill-through ── */}
          <section>
            <SectionLabel>Outfit Frequency</SectionLabel>
            <Card onClick={!freqAllZero ? () => setFreqDrawerOpen(true) : undefined}>
              <CardHeader icon={<BarChart2 size={13} />} label="Outfit Frequency" tappable={!freqAllZero} />
              {freqAllZero ? (
                <EmptyState message="Log outfits in the planner to track your weekly activity." />
              ) : (
                <>
                  <p className="text-[11px] text-muted-foreground">Past 8 weeks</p>
                  <p className="text-3xl font-bold leading-none mt-0.5">{totalFrequencyCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">outfits logged</p>
                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={48}>
                      <BarChart data={d.outfitFrequency} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <XAxis dataKey="week" hide />
                        <YAxis hide />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{d.outfitFrequency[0]?.week}</span>
                      <span className="text-[10px] text-muted-foreground">{d.outfitFrequency[d.outfitFrequency.length - 1]?.week}</span>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </section>

          {/* ── 5. Planning Coverage ───────────────────────────── */}
          <section>
            <SectionLabel>Planning Coverage</SectionLabel>
            <Card>
              <CardHeader icon={<Calendar size={13} />} label="Past 8 Weeks" />
              {d.plannerCoverage.length === 0 ? (
                <EmptyState message="Log outfits in the planner to see your coverage." />
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `auto repeat(${d.plannerCoverage.length}, 1fr)`,
                      gap: 3,
                    }}
                  >
                    {/* Header row */}
                    <div />
                    {d.plannerCoverage.map((w, wi) => (
                      <div key={wi} className="text-[10px] text-muted-foreground text-center leading-tight pb-1 truncate">
                        {w.weekLabel}
                      </div>
                    ))}

                    {/* Day rows */}
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, di) => (
                      <React.Fragment key={di}>
                        <div
                          className="text-[10px] text-muted-foreground flex items-center justify-end pr-1.5"
                          style={{ minWidth: "1.25rem" }}
                        >
                          {day}
                        </div>
                        {d.plannerCoverage.map((week, wi) => (
                          <div key={`${wi}-${di}`} className="flex justify-center items-center">
                            <div
                              className="w-4 h-4 rounded-[3px]"
                              style={{
                                backgroundColor: week.days[di]
                                  ? "hsl(var(--primary) / 0.85)"
                                  : "hsl(var(--muted) / 0.5)",
                              }}
                            />
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }} />
                      <span className="text-[10px] text-muted-foreground">No outfit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: "hsl(var(--primary) / 0.85)" }} />
                      <span className="text-[10px] text-muted-foreground">Outfit planned</span>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </section>

          {/* ── 6. Most Re-Worn ────────────────────────────────── */}
          <section>
            <SectionLabel>Most Re-Worn</SectionLabel>
            <Card>
              <CardHeader icon={<Star size={13} />} label="Top Outfits" />
              {d.mostRepeatedOutfits.length === 0 ? (
                <EmptyState message="Log outfits in the planner to see your most-worn looks." />
              ) : (
                <div className="space-y-3">
                  {d.mostRepeatedOutfits.map((outfit, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <span className="text-sm truncate">{outfit.name}</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: "hsl(var(--primary) / 0.12)",
                          color: "hsl(var(--primary))",
                        }}
                      >
                        {outfit.count}×
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

        </div>
      </div>

      {/* ── Most Worn Items Drawer ──────────────────────────────── */}
      <Drawer open={topItemsDrawerOpen} onOpenChange={setTopItemsDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-0">
            <div className="flex items-center justify-between">
              <DrawerTitle>Most Worn Items</DrawerTitle>
              <DrawerCloseButton />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Items most frequently included in outfits</p>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">
            {topItemsCategories.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-4">
                {topItemsCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setTopItemsCategory(cat)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      topItemsCategory === cat
                        ? "bg-primary/15 text-primary"
                        : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
            {filteredTopItems.length > 0 && (
              <>
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={filteredTopItems.length * 36 + 8}>
                    <BarChart
                      data={filteredTopItems}
                      layout="vertical"
                      margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={90}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {filteredTopItems.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 divide-y divide-border/40">
                  {filteredTopItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <span className="text-xs text-muted-foreground w-4 text-right shrink-0">#{i + 1}</span>
                      <div
                        className="w-4 h-4 rounded-full shrink-0 border border-border/30"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm flex-1 truncate">{item.name}</span>
                      <span className="text-sm font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Outfit Frequency Drawer ─────────────────────────────── */}
      <Drawer open={freqDrawerOpen} onOpenChange={setFreqDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-0">
            <div className="flex items-center justify-between">
              <DrawerTitle>Outfit Frequency</DrawerTitle>
              <DrawerCloseButton />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Outfits logged per week, past 8 weeks</p>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">
            <div className="flex items-baseline gap-2 mt-4 mb-5">
              <span className="text-4xl font-bold">{totalFrequencyCount}</span>
              <span className="text-muted-foreground text-sm">total outfits</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.outfitFrequency} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 divide-y divide-border/40">
              {[...d.outfitFrequency].reverse().map((week, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <span className="text-sm">{week.week}</span>
                  <span className="text-sm font-semibold">
                    {week.count} {week.count === 1 ? "outfit" : "outfits"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

    </div>
  );
}
