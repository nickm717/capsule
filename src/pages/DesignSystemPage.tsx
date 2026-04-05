import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import AppBadge from "@/components/AppBadge";

// ─────────────────────────────────────────────────────────
// HSL → hex conversion (reads computed CSS variables)
// ─────────────────────────────────────────────────────────
function hslPartsToHex(hslStr: string): string {
  const parts = hslStr.trim().split(/[\s,/%]+/).filter(Boolean);
  if (parts.length < 3) return "#888888";
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const hex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function resolveVarHex(varName: string): string {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName);
    return hslPartsToHex(raw);
  } catch {
    return "#888888";
  }
}

// ─────────────────────────────────────────────────────────
// Color token definitions
// ─────────────────────────────────────────────────────────
const CORE_TOKENS = [
  { name: "Background",       var: "--background" },
  { name: "Foreground",       var: "--foreground" },
  { name: "Card",             var: "--card" },
  { name: "Primary",          var: "--primary" },
  { name: "Secondary",        var: "--secondary" },
  { name: "Muted",            var: "--muted" },
  { name: "Muted Foreground", var: "--muted-foreground" },
  { name: "Accent",           var: "--accent" },
  { name: "Destructive",      var: "--destructive" },
  { name: "Border",           var: "--border" },
];

const BRAND_TOKENS = [
  { name: "Gold",  var: "--gold" },
  { name: "Rust",  var: "--rust" },
  { name: "Olive", var: "--olive" },
  { name: "Teal",  var: "--teal" },
];

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-[11px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md border border-border/50 whitespace-nowrap">
      {children}
    </code>
  );
}

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 lg:scroll-mt-20 mb-14">
      <h2 className="text-[22px] font-semibold text-foreground mb-1">{title}</h2>
      <div className="h-px bg-border/60 mb-6" />
      {children}
    </section>
  );
}

function TokenSwatch({ name, varName, hex }: { name: string; varName: string; hex: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(hex).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [hex]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={copy}
        title={`Copy ${hex}`}
        className="w-10 h-10 rounded-xl border border-border/50 flex-shrink-0 transition-transform active:scale-[0.92]"
        style={{ backgroundColor: hex }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground">{name}</p>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <Code>{varName}</Code>
          <button
            onClick={copy}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? "copied!" : hex}
          </button>
        </div>
      </div>
    </div>
  );
}

function GlassTile({ label, className }: { label: string; className: string }) {
  return (
    <div className={`${className} rounded-2xl px-4 py-5 flex flex-col gap-1`}>
      <p className="text-[13px] font-semibold text-foreground">{label}</p>
      <Code>{label}</Code>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Nav
// ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "colors",     label: "Colors" },
  { id: "glass",      label: "Glass" },
  { id: "typography", label: "Typography" },
  { id: "badges",     label: "Badges" },
  { id: "buttons",    label: "Buttons" },
  { id: "inputs",     label: "Inputs" },
  { id: "chips",      label: "Chips" },
  { id: "menus",      label: "Menus" },
  { id: "animations", label: "Animations" },
];

function NavLinks({ vertical = false, activeId }: { vertical?: boolean; activeId: string }) {
  if (vertical) {
    return (
      <nav className="flex flex-col gap-0.5 py-6 px-3">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground px-3 mb-2">
          Contents
        </p>
        {NAV_ITEMS.map((n) => {
          const isActive = activeId === n.id;
          return (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={`text-[13px] px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-gold/10 text-gold font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {n.label}
            </a>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 py-2.5">
      {NAV_ITEMS.map((n) => {
        const isActive = activeId === n.id;
        return (
          <a
            key={n.id}
            href={`#${n.id}`}
            className={`flex-shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors border ${
              isActive
                ? "bg-gold/15 text-gold border-gold/30"
                : "liquid-glass-surface border-border/50 text-muted-foreground"
            }`}
          >
            {n.label}
          </a>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Theme toggle
// ─────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-8 h-8 rounded-xl liquid-glass-surface border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        // Sun icon
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // Moon icon
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────
const DesignSystemPage = () => {
  const { resolvedTheme } = useTheme();
  const [hexMap, setHexMap] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState("colors");

  // Resolve hex values whenever theme changes
  useEffect(() => {
    const all = [...CORE_TOKENS, ...BRAND_TOKENS];
    const map: Record<string, string> = {};
    all.forEach((t) => { map[t.var] = resolveVarHex(t.var); });
    setHexMap(map);
  }, [resolvedTheme]);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const hex = (varName: string) => hexMap[varName] ?? "#888888";

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ───────────────────────────────────────────── */}
      <header className="liquid-glass-nav sticky top-0 z-50 h-14 flex items-center gap-3 px-4">
        <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </a>
        <span className="text-[17px] font-semibold text-foreground">Design System</span>
        <span className="hidden sm:block text-[11px] uppercase tracking-widest text-muted-foreground font-semibold ml-2">
          Capsule
        </span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* ── Mobile horizontal nav (below header, small screens only) ── */}
      <div className="lg:hidden sticky top-14 z-40 liquid-glass-nav border-t border-border/30">
        <NavLinks activeId={activeId} />
      </div>

      {/* ── Body: sidebar + content ───────────────────────────── */}
      <div className="lg:flex">

        {/* Sidebar (large screens only) */}
        <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-border/40">
          <NavLinks vertical activeId={activeId} />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-2xl mx-auto px-4 py-8 pb-24">

            {/* ── Colors ─────────────────────────────────────── */}
            <Section id="colors" title="Colors">
              <p className="text-[13px] text-muted-foreground mb-5">
                All colors are HSL CSS custom properties in <Code>src/index.css</Code>.
                Reference with <Code>hsl(var(--token))</Code> or Tailwind's <Code>bg-*</Code> / <Code>text-*</Code> utilities.
                Click any swatch to copy its hex value.
              </p>

              <h3 className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Core tokens</h3>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {CORE_TOKENS.map((t) => (
                  <TokenSwatch key={t.var} name={t.name} varName={t.var} hex={hex(t.var)} />
                ))}
              </div>

              <h3 className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Brand palette</h3>
              <div className="grid grid-cols-1 gap-3">
                {BRAND_TOKENS.map((t) => (
                  <TokenSwatch key={t.var} name={t.name} varName={t.var} hex={hex(t.var)} />
                ))}
              </div>
            </Section>

            {/* ── Glass ──────────────────────────────────────── */}
            <Section id="glass" title="Glass Utilities">
              <p className="text-[13px] text-muted-foreground mb-5">
                Five <Code>backdrop-filter</Code> utility classes in <Code>src/index.css</Code>.
                Each has a <Code>.dark</Code> override. Glass is most visible over colorful or textured backgrounds.
              </p>

              <div
                className="grid gap-3 rounded-2xl p-3"
                style={{ background: "linear-gradient(135deg, hsl(var(--gold)/0.3) 0%, hsl(var(--rust)/0.25) 50%, hsl(var(--teal)/0.25) 100%)" }}
              >
                <GlassTile label="liquid-glass-card"    className="liquid-glass-card" />
                <GlassTile label="liquid-glass-surface" className="liquid-glass-surface border border-border/40" />
                <GlassTile label="liquid-glass-sheet"   className="liquid-glass-sheet" />
                <GlassTile label="liquid-glass-nav"     className="liquid-glass-nav" />
                <GlassTile label="liquid-glass-input"   className="liquid-glass-input" />
              </div>

              <div className="mt-4 space-y-2 text-[12px] text-muted-foreground">
                <p><Code>liquid-glass-card</Code> — card containers; includes built-in white border</p>
                <p><Code>liquid-glass-surface</Code> — same blur/bg but no border; pair with Tailwind border classes</p>
                <p><Code>liquid-glass-sheet</Code> — bottom sheets &amp; drawers; higher opacity for readability</p>
                <p><Code>liquid-glass-nav</Code> — tab bar; highest opacity + top border</p>
                <p><Code>liquid-glass-input</Code> — apply to wrapper <Code>&lt;div&gt;</Code>, never directly on <Code>&lt;input&gt;</Code></p>
              </div>
            </Section>

            {/* ── Typography ─────────────────────────────────── */}
            <Section id="typography" title="Typography">
              <p className="text-[13px] text-muted-foreground mb-5">
                Font: <Code>Inter</Code> / <Code>-apple-system</Code> stack, 400 base weight.
                All sizes use <Code>text-[Npx]</Code> arbitrary Tailwind values.
              </p>

              <div className="space-y-5 liquid-glass-card rounded-2xl px-5 py-5">
                {[
                  { sample: "Screen Title",              cls: "text-[34px] font-bold text-foreground leading-tight",                      code: "text-[34px] font-bold" },
                  { sample: "Section Heading",           cls: "text-[22px] font-semibold text-foreground",                               code: "text-[22px] font-semibold" },
                  { sample: "Sheet / Card Title",        cls: "text-[17px] font-semibold text-foreground",                               code: "text-[17px] font-semibold" },
                  { sample: "Item Name",                 cls: "text-[15px] font-medium text-foreground",                                 code: "text-[15px] font-medium" },
                  { sample: "Subtitle / secondary row",  cls: "text-[13px] text-muted-foreground",                                       code: "text-[13px] text-muted-foreground" },
                  { sample: "Caption / helper text",     cls: "text-[12px] text-muted-foreground",                                       code: "text-[12px] text-muted-foreground" },
                  { sample: "SECTION LABEL",             cls: "text-[11px] uppercase tracking-widest font-semibold text-muted-foreground", code: "text-[11px] uppercase tracking-widest font-semibold" },
                ].map((row, i, arr) => (
                  <div key={row.code}>
                    <p className={row.cls}>{row.sample}</p>
                    <Code>{row.code}</Code>
                    {i < arr.length - 1 && <div className="h-px bg-border/40 mt-4" />}
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Badges ─────────────────────────────────────── */}
            <Section id="badges" title="AppBadge">
              <p className="text-[13px] text-muted-foreground mb-5">
                <Code>src/components/AppBadge.tsx</Code> — pill badge.
                Use <Code>variant</Code> for semantic meaning; use <Code>bg</Code> / <Code>borderColor</Code> / <Code>color</Code> props for dynamic palette badges.
              </p>

              <div className="space-y-6">
                <div>
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Variants — size="md"</p>
                  <div className="flex gap-4 flex-wrap">
                    {(["owned", "rental", "muted", "gold"] as const).map((v) => (
                      <div key={v} className="flex flex-col items-start gap-1">
                        <AppBadge variant={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</AppBadge>
                        <Code>variant="{v}"</Code>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Sizes — variant="muted"</p>
                  <div className="flex gap-4 items-end flex-wrap">
                    {(["sm", "md", "lg"] as const).map((s) => (
                      <div key={s} className="flex flex-col items-start gap-1">
                        <AppBadge size={s} variant="muted">{s.toUpperCase()}</AppBadge>
                        <Code>size="{s}"</Code>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Dynamic — inline style props</p>
                  <div className="flex flex-col items-start gap-1">
                    <AppBadge bg="rgba(176,196,222,0.2)" borderColor="rgba(176,196,222,0.5)" color="#6090b0">Cool</AppBadge>
                    <Code>bg / borderColor / color</Code>
                  </div>
                </div>
              </div>
            </Section>

            {/* ── Buttons ────────────────────────────────────── */}
            <Section id="buttons" title="Buttons">
              <p className="text-[13px] text-muted-foreground mb-5">
                All buttons use <Code>transition-all active:scale-[0.97]</Code>. No shared component — composed inline with Tailwind.
              </p>

              <div className="space-y-4">
                {[
                  {
                    label: "Primary",
                    el: <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all active:scale-[0.97]">Save Outfit</button>,
                    code: "bg-primary text-primary-foreground font-medium text-sm py-3 rounded-xl",
                  },
                  {
                    label: "Destructive",
                    el: <button className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm transition-all active:scale-[0.97]">Delete</button>,
                    code: "bg-destructive text-destructive-foreground",
                  },
                  {
                    label: "Ghost / Cancel",
                    el: <button className="w-full py-3 rounded-xl liquid-glass-surface border border-border/50 text-foreground font-medium text-sm transition-all active:scale-[0.97]">Cancel</button>,
                    code: "liquid-glass-surface border border-border/50 text-foreground",
                  },
                  {
                    label: "Gold Outline (AI / Suggest)",
                    el: <button className="w-full py-3 rounded-xl border border-gold/40 text-gold font-medium text-sm transition-all active:scale-[0.97]">✦ Suggest</button>,
                    code: "border border-gold/40 text-gold",
                  },
                ].map((b) => (
                  <div key={b.label}>
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">{b.label}</p>
                    {b.el}
                    <p className="text-[11px] text-muted-foreground mt-1.5"><Code>{b.code}</Code></p>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Inputs ─────────────────────────────────────── */}
            <Section id="inputs" title="Search Input">
              <p className="text-[13px] text-muted-foreground mb-5">
                Apply <Code>liquid-glass-input</Code> to the wrapper <Code>&lt;div&gt;</Code> — never on <Code>&lt;input&gt;</Code> directly.
                <Code>backdrop-filter</Code> creates a new stacking context that would obscure absolutely-positioned children (search icon).
              </p>

              <div className="relative liquid-glass-input rounded-xl focus-within:ring-1 focus-within:ring-gold/50">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Search…" readOnly className="w-full bg-transparent border-0 py-2.5 pl-9 pr-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Wrapper: <Code>relative liquid-glass-input rounded-xl focus-within:ring-1 focus-within:ring-gold/50</Code><br />
                Input: <Code>w-full bg-transparent border-0 py-2.5 pl-9 pr-3 text-[15px] focus:outline-none</Code>
              </p>
            </Section>

            {/* ── Chips ──────────────────────────────────────── */}
            <Section id="chips" title="Filter Chips">
              <p className="text-[13px] text-muted-foreground mb-5">
                Two chip patterns: <Code>CategoryChip</Code> (wardrobe + outfit builder filters) and AppBadge-based occasion pills.
              </p>

              {/* CategoryChip */}
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">CategoryChip — <Code>WardrobeGuide.tsx</Code></p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {[
                    { label: "All", icon: "✦", active: true },
                    { label: "Tops", icon: "👕", active: false },
                    { label: "Bottoms", icon: "👖", active: false },
                    { label: "Shoes", icon: "👟", active: false },
                  ].map((c) => (
                    <button
                      key={c.label}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        c.active
                          ? "bg-primary text-primary-foreground border-primary/70"
                          : "text-muted-foreground border-border/60"
                      }`}
                      style={c.active ? {
                        boxShadow: "0 1px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
                      } : {
                        backdropFilter: "blur(10px) saturate(140%)",
                        WebkitBackdropFilter: "blur(10px) saturate(140%)",
                        backgroundColor: "color-mix(in srgb, hsl(var(--card)) 45%, transparent)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                      }}
                    >
                      <span className="text-sm">{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Active: <Code>bg-primary text-primary-foreground border-primary/70</Code><br />
                  Inactive: <Code>text-muted-foreground border-border/60</Code> + <Code>color-mix</Code> backdrop bg
                </p>
              </div>

              <div className="h-px bg-border/40 mb-6" />

              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Occasion / temp pills — OutfitPickerSheet</p>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {[
                    { label: "All",          icon: "",   active: true },
                    { label: "Office",       icon: "👔", active: false },
                    { label: "Casual",       icon: "☀️", active: false },
                    { label: "Going Out",    icon: "🍹", active: false },
                  ].map((c) => (
                    <button
                      key={c.label}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        c.active
                          ? "bg-primary text-primary-foreground border-primary/70"
                          : "text-muted-foreground border-border/60"
                      }`}
                      style={c.active ? {
                        boxShadow: "0 1px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
                      } : {
                        backdropFilter: "blur(10px) saturate(140%)",
                        WebkitBackdropFilter: "blur(10px) saturate(140%)",
                        backgroundColor: "color-mix(in srgb, hsl(var(--card)) 45%, transparent)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                      }}
                    >
                      {c.icon && <span>{c.icon}</span>}
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Same pattern as <Code>CategoryChip</Code> — Active: <Code>bg-primary text-primary-foreground border-primary/70</Code><br />
                  Inactive: <Code>text-muted-foreground border-border/60</Code> + <Code>color-mix</Code> backdrop bg
                </p>
              </div>

              <div className="mt-6">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Selected piece chips (outfit builder)</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["Black Blazer", "White Tee", "Navy Trousers"].map((name) => (
                    <span key={name} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-gold/15 text-gold border border-gold/25">
                      {name}
                      <span className="text-gold/60 ml-0.5">×</span>
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  <Code>text-[11px] font-medium px-2 py-1 rounded-full bg-gold/15 text-gold border border-gold/25</Code>
                </p>
              </div>
            </Section>

            {/* ── Menus ──────────────────────────────────────── */}
            <Section id="menus" title="Menus">
              <p className="text-[13px] text-muted-foreground mb-5">
                Floating action menus (edit / delete) use <Code>liquid-glass-menu</Code> — higher opacity than cards for legibility when floating over content.
              </p>

              <div className="space-y-4">
                {/* Live preview */}
                <div className="relative h-28 liquid-glass-card rounded-2xl overflow-hidden flex items-start justify-end p-3">
                  <div className="liquid-glass-menu rounded-xl py-1 min-w-[148px] shadow-none">
                    <button className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit item
                    </button>
                    <button className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-destructive hover:bg-muted transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      Delete item
                    </button>
                  </div>
                </div>

                <div className="liquid-glass-card rounded-xl px-4 py-4 space-y-2 text-[12px] text-muted-foreground">
                  <div><Code>liquid-glass-menu</Code> — light: <Code>rgba(255,255,255,0.82)</Code>, blur 20px, strong border highlight</div>
                  <div>Dark: <Code>rgba(22,20,18,0.72)</Code> — higher opacity than card/surface for floating legibility</div>
                  <div>Box shadow includes outer elevation + inset top highlight for depth</div>
                  <div className="pt-1">Usage: <Code>{"<div className=\"absolute ... liquid-glass-menu rounded-xl py-1\">"}</Code></div>
                </div>
              </div>
            </Section>

            {/* ── Animations ─────────────────────────────────── */}
            <Section id="animations" title="Animations">
              <p className="text-[13px] text-muted-foreground mb-5">
                All keyframes defined in <Code>src/index.css</Code>.
              </p>

              <div className="space-y-3">
                {[
                  { cls: "animate-reveal-up",  desc: "Fade + slide up + blur. List items / cards on mount. 0.45s cubic-bezier(0.16,1,0.3,1)." },
                  { cls: "animate-sheet-up",   desc: "Sheet enters from bottom. 0.32s spring." },
                  { cls: "animate-sheet-down", desc: "Sheet exits to bottom. 0.28s ease-in." },
                  { cls: "fade-overlay",       desc: "Opacity 0→1 for sheet backdrop. 0.28s ease-out. (keyframe name, not utility class)" },
                ].map((a) => (
                  <div key={a.cls} className="liquid-glass-card rounded-xl px-4 py-4">
                    <Code>{a.cls}</Code>
                    <p className="text-[12px] text-muted-foreground mt-2">{a.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

          </div>
        </main>
      </div>
    </div>
  );
};

export default DesignSystemPage;
