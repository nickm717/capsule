import { useState, useCallback, useEffect } from "react";
import { Star, Plus } from "lucide-react";
import { wardrobeCategories, swatches, type WardrobeItem, type WardrobeCategory } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import AddItemSheet from "./AddItemSheet";

type Filter = "all" | "owned" | "gaps";

const WardrobeGuide = () => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customItemsRaw, setCustomItemsRaw] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("darkautumn-favorites");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const fetchItems = useCallback(async () => {
    const { data } = await supabase.from("custom_items").select("*").order("created_at", { ascending: false });
    if (data) setCustomItemsRaw(data);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const allCategories: WardrobeCategory[] = wardrobeCategories.map((cat) => {
    const extras: WardrobeItem[] = customItemsRaw
      .filter((row: any) => row.category === cat.id)
      .map((row: any) => ({
        id: `ci-${row.id}`,
        name: row.name,
        brand: row.brand || undefined,
        color: row.color,
        hex: row.hex,
        owned: row.owned,
        gap: !row.owned,
        notes: row.notes || "",
      }));
    return { ...cat, items: [...cat.items, ...extras] };
  });

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("darkautumn-favorites", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const categories = activeCategory === "all"
    ? allCategories
    : allCategories.filter((c) => c.id === activeCategory);

  const filterItem = (item: WardrobeItem) => {
    if (filter === "owned") return item.owned;
    if (filter === "gaps") return item.gap === true;
    return true;
  };

  const totalPieces = allCategories.reduce((s, c) => s + c.items.length, 0);
  const ownedCount = allCategories.reduce((s, c) => s + c.items.filter((i) => i.owned).length, 0);
  const gapCount = allCategories.reduce((s, c) => s + c.items.filter((i) => i.gap).length, 0);

  return (
    <div className="px-4 pb-6 space-y-5">
      {/* Header */}
      <div className="pt-2 animate-reveal-up flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground text-balance">Wardrobe Guide</h2>
          <p className="text-secondary text-sm mt-1">
            {ownedCount} owned · {gapCount} gaps · {totalPieces} total
          </p>
          <div className="flex gap-1.5 mt-3">
            {swatches.map((s) => (
              <div
                key={s.name}
                className="w-6 h-6 rounded-full border border-border/40"
                style={{ backgroundColor: s.hex }}
                title={s.name}
              />
            ))}
          </div>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-[0.93]"
          style={{ backgroundColor: "#B08030" }}
        >
          <Plus size={22} style={{ color: "#141008" }} strokeWidth={2.5} />
        </button>
      </div>

      {/* Category chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 animate-reveal-up"
        style={{ animationDelay: "50ms" }}
      >
        <CategoryChip
          label="All"
          icon="✦"
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        />
        {allCategories.map((cat) => (
          <CategoryChip
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            active={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id)}
          />
        ))}
      </div>

      {/* Filter bar */}
      <div
        className="flex gap-1 bg-muted rounded-lg p-1 animate-reveal-up"
        style={{ animationDelay: "100ms" }}
      >
        {([
          { key: "all" as Filter, label: "All", count: totalPieces },
          { key: "owned" as Filter, label: "Owned", count: ownedCount },
          { key: "gaps" as Filter, label: "Gaps", count: gapCount },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 text-center py-1.5 rounded-md text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
              filter === f.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            <span className="ml-1 text-[11px] opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Item cards */}
      {categories.map((cat) => {
        const filtered = cat.items.filter(filterItem);
        if (filtered.length === 0) return null;

        return (
          <section key={cat.id}>
            {activeCategory === "all" && (
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2 animate-reveal-up">
                <span>{cat.icon}</span> {cat.label}
                <span className="text-xs font-normal">{filtered.length}</span>
              </h3>
            )}
            <div className="space-y-2.5">
              {filtered.map((item, i) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isFavorite={favorites.has(item.id)}
                  onToggleFavorite={toggleFavorite}
                  delay={i * 40}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Empty state */}
      {categories.every((c) => c.items.filter(filterItem).length === 0) && (
        <div className="text-center py-16 animate-reveal-up">
          <p className="text-muted-foreground text-sm">No items match this filter.</p>
        </div>
      )}

      <AddItemSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSaved={fetchItems}
      />
    </div>
  );
};

function CategoryChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.96] ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className="text-xs">{icon}</span>
      {label}
    </button>
  );
}

function ItemCard({
  item,
  isFavorite,
  onToggleFavorite,
  delay,
}: {
  item: WardrobeItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  delay: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-card rounded-xl border border-border overflow-hidden animate-reveal-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex">
        <div
          className="w-1.5 flex-shrink-0 rounded-l-xl"
          style={{ backgroundColor: item.hex }}
        />
        <div className="flex-1 p-3.5 min-w-0">
          <div className="flex items-start gap-2.5">
            <span
              className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border border-border/40"
              style={{ backgroundColor: item.hex }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-medium leading-tight truncate">
                {item.name}
              </p>
              {item.brand && (
                <p className="text-muted-foreground text-[11px] mt-0.5">{item.brand}</p>
              )}
              <p className="text-muted-foreground text-xs mt-0.5">{item.color}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item.id);
              }}
              className="p-1 -m-1 flex-shrink-0 transition-all duration-150 active:scale-[0.9]"
            >
              <Star
                size={18}
                className={
                  isFavorite
                    ? "fill-gold text-gold"
                    : "text-muted-foreground/40 hover:text-muted-foreground"
                }
              />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.owned && <Badge label="OWNED" variant="owned" />}
            {item.gap && <Badge label="GAP" variant="gap" />}
            {item.priority && <Badge label="PRIORITY" variant="priority" />}
            {item.seasonal && <Badge label="SEASONAL" variant="seasonal" />}
          </div>

          {item.notes && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-left w-full"
            >
              <p
                className={`text-muted-foreground text-xs leading-relaxed transition-all duration-200 ${
                  expanded ? "" : "line-clamp-2"
                }`}
              >
                {item.notes}
              </p>
              {item.notes.length > 80 && (
                <span className="text-gold text-[11px] font-medium mt-0.5 inline-block">
                  {expanded ? "Show less" : "Read more"}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ label, variant }: { label: string; variant: "owned" | "gap" | "priority" | "seasonal" }) {
  const styles: Record<string, string> = {
    owned: "bg-teal/15 text-teal border-teal/30",
    gap: "bg-rust/15 text-rust border-rust/30",
    priority: "bg-gold/15 text-gold border-gold/30",
    seasonal: "bg-olive/15 text-olive border-olive/30",
  };

  return (
    <span
      className={`text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded border ${styles[variant]}`}
    >
      {label}
    </span>
  );
}

export default WardrobeGuide;
