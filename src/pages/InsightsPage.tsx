import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
} from "recharts";
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

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`liquid-glass-surface border border-border/60 rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium mb-3">{children}</p>;
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-xs text-muted-foreground">{message}</p>;
}

// ── Page ──────────────────────────────────────────────────────

export default function InsightsPage() {
  const navigate = useNavigate();
  const { data, loading } = useInsightsData();

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
              {[
                { label: "Total Items", value: d.totalItems },
                { label: "Outfits Saved", value: d.totalOutfits },
                { label: "Logged This Month", value: d.outfitsThisMonth },
                { label: "Worn Rate", value: `${d.wornRate}%` },
              ].map(({ label, value }) => (
                <Card key={label}>
                  <p className="text-2xl font-bold leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{label}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* ── 2. Most & Least Worn ───────────────────────────── */}
          <section>
            <SectionLabel>Most &amp; Least Worn</SectionLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card>
                <CardTitle>Top Items</CardTitle>
                {d.topItems.length === 0 ? (
                  <EmptyState message="Log outfits in the planner to see your most-worn items." />
                ) : (
                  <ResponsiveContainer width="100%" height={d.topItems.length * 32 + 8}>
                    <BarChart
                      data={d.topItems}
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
                        width={80}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {d.topItems.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card>
                <CardTitle>Unworn Items</CardTitle>
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
                <CardTitle>By Category</CardTitle>
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
                <CardTitle>Cost Per Wear</CardTitle>
                {d.cpwItems.length === 0 ? (
                  <EmptyState message="Add prices to your items to track cost-per-wear." />
                ) : (
                  <div className="space-y-3">
                    {d.cpwItems.map((item, i) => (
                      <div key={i} className="space-y-0.5">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {item.wearCount} wear{item.wearCount !== 1 ? "s" : ""}
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

          {/* ── 4. Outfit Frequency ────────────────────────────── */}
          <section>
            <SectionLabel>Outfit Frequency</SectionLabel>
            <Card>
              <CardTitle>Outfits Logged per Week</CardTitle>
              {d.outfitFrequency.every(w => w.count === 0) ? (
                <EmptyState message="Log outfits in the planner to track your weekly activity." />
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={d.outfitFrequency} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </section>

          {/* ── 5. Planning Coverage ───────────────────────────── */}
          <section>
            <SectionLabel>Planning Coverage</SectionLabel>
            <Card>
              <CardTitle>Past 8 Weeks</CardTitle>
              {d.plannerCoverage.length === 0 ? (
                <EmptyState message="Log outfits in the planner to see your coverage." />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `1rem repeat(${d.plannerCoverage.length}, 1fr)`,
                    gap: 3,
                  }}
                >
                  {/* Header row: empty corner + week labels */}
                  <div />
                  {d.plannerCoverage.map((w, wi) => (
                    <div key={wi} className="text-[9px] text-muted-foreground text-center leading-tight pb-0.5 truncate">
                      {w.weekLabel}
                    </div>
                  ))}

                  {/* Day rows */}
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, di) => (
                    <>
                      <div
                        key={`label-${di}`}
                        className="text-[10px] text-muted-foreground flex items-center justify-end pr-1"
                      >
                        {day}
                      </div>
                      {d.plannerCoverage.map((week, wi) => (
                        <div key={`${wi}-${di}`} className="flex justify-center items-center">
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 3,
                              backgroundColor: week.days[di]
                                ? "hsl(var(--primary))"
                                : "hsl(var(--muted))",
                            }}
                          />
                        </div>
                      ))}
                    </>
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* ── 6. Most Re-Worn Outfits ────────────────────────── */}
          <section>
            <SectionLabel>Most Re-Worn</SectionLabel>
            <Card>
              <CardTitle>Top Outfits</CardTitle>
              {d.mostRepeatedOutfits.length === 0 ? (
                <EmptyState message="Log outfits in the planner to see your most-worn looks." />
              ) : (
                <div className="space-y-3">
                  {d.mostRepeatedOutfits.map((outfit, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <span className="text-sm truncate">{outfit.name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
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
    </div>
  );
}
