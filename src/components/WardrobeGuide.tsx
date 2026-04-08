import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import ProfileButton from "@/components/ProfileButton";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, X } from "lucide-react";
import { type WardrobeItem } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import { useWardrobeItems } from "@/hooks/use-wardrobe-items";
import { useOutfits } from "@/hooks/use-outfits";
import AddItemSheet from "./AddItemSheet";
import ItemFormPage from "./ItemFormPage";
import DeleteItemSheet from "./DeleteItemSheet";
import ItemDetailSheet from "./ItemDetailSheet";
import WardrobeFilterSheet from "./WardrobeFilterSheet";
import BrandManagerSheet from "./BrandManagerSheet";
import AppBadge from "./AppBadge";
import type { ItemFormData } from "./ItemForm";
import { COLOR_FAMILIES, hexToFamily } from "@/lib/colorFamilies";

type Filter = "all" | "owned" | "gaps";

interface WardrobeGuideProps {
  onFormOpen?: (open: boolean) => void;
  openItemId?: string | null;
  onOpenItemConsumed?: () => void;
}

const WardrobeGuide = ({ onFormOpen, openItemId, onOpenItemConsumed }: WardrobeGuideProps) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formPrefill, setFormPrefill] = useState<Partial<ItemFormData> | undefined>();
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [detailItem, setDetailItem] = useState<{ item: any; row: any } | null>(null);
  const [openMenuCatId, setOpenMenuCatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [brandManagerOpen, setBrandManagerOpen] = useState(false);
  const [selectedColorFamilies, setSelectedColorFamilies] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const { categories: allCategories, loading, error, refetch: fetchItems } = useWardrobeItems();
  const { outfits, refetch: refreshOutfits } = useOutfits();

  useEffect(() => {
    if (!openItemId || loading) return;
    const row = allCategories.flatMap((c) => c.rows).find((r: any) => r.id === openItemId);
    if (row) handleEdit(row);
    onOpenItemConsumed?.();
  }, [openItemId, loading]);

  const openForm = (prefill?: Partial<ItemFormData>, id?: string) => {
    setFormPrefill(prefill);
    setEditId(id || null);
    setFormOpen(true);
    onFormOpen?.(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormPrefill(undefined);
    setEditId(null);
    onFormOpen?.(false);
  };

  const handleFormSaved = () => { fetchItems(); closeForm(); };

  const handleEdit = (row: any) => {
    openForm({
      name: row.name,
      brand: row.brand || "",
      category: row.category,
      color: row.color,
      hex: row.hex,
      notes: row.notes || "",
      owned: row.owned,
      price: row.price != null ? String(row.price) : "",
    }, row.id);
  };

  const affectedOutfits = deleteTarget
    ? outfits.filter((o) => o.pieces.some((p) => p.item_id === deleteTarget.id))
    : [];

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const itemId = deleteTarget.id;
    const { error } = await supabase.from("custom_items").delete().eq("id", itemId);
    if (!error) {
      fetchItems();
      await Promise.all(
        affectedOutfits.map((outfit) =>
          supabase
            .from("custom_outfits")
            .update({ pieces: outfit.pieces.filter((p) => p.item_id !== itemId) as any })
            .eq("id", outfit.id)
        )
      );
      if (affectedOutfits.length > 0) refreshOutfits();
    }
    setDeleteTarget(null);
  };

  const filterItem = (item: WardrobeItem) => {
    if (filter === "owned") return item.owned;
    if (filter === "gaps") return item.gap === true;
    return true;
  };

  const baseCategoriesForFilter = activeCategory === "all" ? allCategories : allCategories.filter((c) => c.id === activeCategory);
  const filteredCategories = baseCategoriesForFilter;
  const totalPieces = filteredCategories.reduce((s, c) => s + c.items.length, 0);
  const ownedCount = filteredCategories.reduce((s, c) => s + c.items.filter((i) => i.owned).length, 0);
  const gapCount = filteredCategories.reduce((s, c) => s + c.items.filter((i) => i.gap).length, 0);

  const availableColorFamilies = useMemo(() => {
    const presentIds = new Set<string>();
    allCategories.forEach((cat) =>
      cat.items.forEach((item) => {
        presentIds.add(hexToFamily(item.hex));
      })
    );
    return COLOR_FAMILIES.filter((f) => presentIds.has(f.id));
  }, [allCategories]);

  const availableBrands = useMemo(() => {
    const seen = new Set<string>();
    allCategories.forEach((cat) =>
      cat.items.forEach((item) => {
        if (item.brand) seen.add(item.brand);
      })
    );
    return Array.from(seen).sort();
  }, [allCategories]);

  const hasActiveFilters = selectedColorFamilies.length > 0 || selectedBrands.length > 0;

  const clearAllFilters = () => {
    setSelectedColorFamilies([]);
    setSelectedBrands([]);
  };

  const displayCategories = useMemo(() => {
    const colorBrandFilter = (item: WardrobeItem) => {
      const colorMatch = selectedColorFamilies.length === 0 || selectedColorFamilies.includes(hexToFamily(item.hex));
      const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(item.brand ?? "");
      return colorMatch && brandMatch;
    };

    let base;
    if (!searchQuery.trim()) {
      base = filteredCategories.map((cat) => ({ ...cat, displayItems: cat.items.filter(filterItem) }));
    } else {
      const q = searchQuery.toLowerCase();
      base = allCategories.map((cat) => ({
        ...cat,
        displayItems: cat.items.filter(
          (item) =>
            item.name?.toLowerCase().includes(q) ||
            item.brand?.toLowerCase().includes(q) ||
            item.color?.toLowerCase().includes(q)
        ),
      }));
    }

    if (hasActiveFilters) {
      base = base.map((cat) => ({
        ...cat,
        displayItems: cat.displayItems.filter(colorBrandFilter),
      }));
    }

    return base;
  }, [allCategories, filteredCategories, searchQuery, filter, selectedColorFamilies, selectedBrands]);

  if (formOpen) {
    return <ItemFormPage prefill={formPrefill} editId={editId} onSaved={handleFormSaved} onCancel={closeForm} />;
  }

  return (
    <div className="px-4 pb-6 space-y-5 pt-5">
      {/* Header — title + profile */}
      <div className="flex items-center justify-between animate-reveal-up">
        <h2 className="text-[34px] font-bold text-foreground tracking-tight leading-none">
          Wardrobe
        </h2>
        <ProfileButton />
      </div>

      {/* Search + Filter button */}
      <div className="flex items-center gap-2 animate-reveal-up" style={{ animationDelay: "30ms" }}>
        <div className="relative flex-1 liquid-glass-input rounded-xl focus-within:ring-1 focus-within:ring-gold/50">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wardrobe…"
            className="w-full bg-transparent border-0 rounded-xl py-2.5 pl-9 pr-9 text-foreground placeholder:text-muted-foreground focus:outline-none"
            style={{ fontSize: 16 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground active:text-foreground"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter icon button */}
        <button
          onClick={() => setFilterSheetOpen(true)}
          className="relative flex-shrink-0 flex items-center justify-center rounded-xl liquid-glass-input transition-all active:scale-[0.92]"
          style={{ width: 44, height: 44, minWidth: 44 }}
          aria-label="Filter wardrobe"
        >
          <svg
            width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke={hasActiveFilters ? "hsl(var(--primary))" : "currentColor"}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={hasActiveFilters ? "" : "text-foreground/60"}
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          {hasActiveFilters && (
            <span
              className="absolute top-1.5 right-1.5 rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: "hsl(var(--primary))",
              }}
            />
          )}
        </button>
      </div>

      {/* Active filter strip */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap animate-reveal-up -mt-2">
          {selectedColorFamilies.map((familyId) => {
            const family = COLOR_FAMILIES.find((f) => f.id === familyId);
            if (!family) return null;
            return (
              <button
                key={`family-${familyId}`}
                onClick={() => setSelectedColorFamilies(selectedColorFamilies.filter((f) => f !== familyId))}
                className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full text-[13px] font-medium border border-border/60 active:scale-[0.95] transition-transform"
                style={{
                  backdropFilter: "blur(10px) saturate(140%)",
                  WebkitBackdropFilter: "blur(10px) saturate(140%)",
                  backgroundColor: "color-mix(in srgb, hsl(var(--card)) 55%, transparent)",
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: family.hex,
                    border: "1px solid hsl(var(--border))",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span className="text-foreground">{family.label}</span>
                <X size={11} className="text-muted-foreground ml-0.5" />
              </button>
            );
          })}
          {selectedBrands.map((brand) => (
            <button
              key={`brand-${brand}`}
              onClick={() => setSelectedBrands(selectedBrands.filter((b) => b !== brand))}
              className="flex items-center gap-1.5 pl-2.5 pr-2.5 py-1 rounded-full text-[13px] font-medium border border-border/60 active:scale-[0.95] transition-transform"
              style={{
                backdropFilter: "blur(10px) saturate(140%)",
                WebkitBackdropFilter: "blur(10px) saturate(140%)",
                backgroundColor: "color-mix(in srgb, hsl(var(--card)) 55%, transparent)",
              }}
            >
              <span className="text-foreground">{brand}</span>
              <X size={11} className="text-muted-foreground ml-0.5" />
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-[13px] text-primary font-medium ml-1 active:opacity-60 transition-opacity"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Solid FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-[0.92] active:opacity-90"
        style={{
          bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
          backgroundColor: "hsl(var(--primary))",
          boxShadow: "0 2px 12px rgba(0,0,0,0.22)",
        }}
      >
        <Plus size={22} color="white" strokeWidth={2.5} />
      </button>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 animate-reveal-up [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ animationDelay: "50ms", opacity: searchQuery ? 0.4 : 1, transition: "opacity 0.2s ease", pointerEvents: searchQuery ? "none" : undefined }}>
        <CategoryChip label="All" icon="" active={activeCategory === "all"} onClick={() => setActiveCategory("all")} />
        {allCategories.map((cat) => (
          <CategoryChip key={cat.id} label={cat.label} icon={cat.icon} active={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)} />
        ))}
      </div>

      {/* Segmented filter — only shown when rentals exist */}
      {gapCount > 0 && <div
        className="flex gap-0.5 rounded-[10px] p-0.5 animate-reveal-up border border-border/40 liquid-glass-surface"
        style={{
          animationDelay: "100ms",
          opacity: searchQuery ? 0.4 : 1,
          transition: "opacity 0.2s ease",
          pointerEvents: searchQuery ? "none" : undefined,
        }}
      >
        {[
          { key: "all" as Filter, label: "All", count: totalPieces },
          { key: "owned" as Filter, label: "Owned", count: ownedCount },
          ...(gapCount > 0 ? [{ key: "gaps" as Filter, label: "Rentals", count: gapCount }] : []),
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 text-center py-[7px] rounded-[8px] text-[14px] font-medium transition-all duration-150 active:scale-[0.97] ${
              filter === f.key
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
            style={filter === f.key ? {
              backgroundColor: "hsl(var(--card))",
              boxShadow: "0 1px 3px rgba(0,0,0,0.18), 0 0.5px 0 rgba(255,255,255,0.06)",
              border: "0.5px solid hsl(var(--border))",
            } : undefined}
          >
            {f.label}
            <span className="ml-1 text-[12px]">{f.count}</span>
          </button>
        ))}
      </div>}

      {loading && (
        <div className="flex items-center justify-center py-16 animate-reveal-up">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-xs text-muted-foreground">Loading wardrobe…</span>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-16 animate-reveal-up">
          <p className="text-destructive text-sm mb-2">Failed to load items</p>
          <button onClick={fetchItems} className="text-xs text-gold underline">Retry</button>
        </div>
      )}

      {/* Grouped item list */}
      {!loading && !error && displayCategories.map((cat) => {
        if (cat.displayItems.length === 0) return null;
        return (
          <section key={cat.id} className={`animate-reveal-up relative ${openMenuCatId === cat.id ? "z-50" : ""}`}>
            {(activeCategory === "all" || searchQuery) && (
              <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1.5 px-1" style={{ letterSpacing: "0.1em" }}>
                {cat.icon}  {cat.label}
              </p>
            )}
            <div className="liquid-glass-card rounded-2xl">
              {cat.displayItems.map((item, i) => {
                const row = cat.rows.find((r: any) => r.id === item.id);
                return (
                  <ItemRow
                    key={item.id}
                    item={item}
                    isLast={i === cat.displayItems.length - 1}
                    onTap={() => row && setDetailItem({ item, row })}
                    onEdit={() => row && handleEdit(row)}
                    onDelete={() => setDeleteTarget({ id: item.id, name: item.name })}
                    delay={i * 30}
                    onMenuOpenChange={(open) => setOpenMenuCatId(open ? cat.id : null)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {!loading && !error && displayCategories.every((c) => c.displayItems.length === 0) && (
        <div className="text-center py-20 animate-reveal-up">
          <p className="text-muted-foreground text-sm">
            {searchQuery
              ? "No items match your search."
              : hasActiveFilters
              ? "No items match these filters."
              : "No items match this filter."}
          </p>
          {hasActiveFilters && !searchQuery && (
            <button
              onClick={clearAllFilters}
              className="mt-2 text-sm text-primary underline active:opacity-60"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <AddItemSheet open={sheetOpen} onOpenChange={setSheetOpen} onOpenForm={openForm} />
      <WardrobeFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        availableColorFamilies={availableColorFamilies}
        availableBrands={availableBrands}
        selectedColorFamilies={selectedColorFamilies}
        selectedBrands={selectedBrands}
        onColorFamiliesChange={setSelectedColorFamilies}
        onBrandsChange={setSelectedBrands}
        onManageBrands={() => { setFilterSheetOpen(false); setBrandManagerOpen(true); }}
      />
      <BrandManagerSheet
        open={brandManagerOpen}
        onOpenChange={setBrandManagerOpen}
        brands={availableBrands}
        onRenameComplete={() => { fetchItems(); setSelectedBrands([]); }}
      />
      <ItemDetailSheet
        open={!!detailItem}
        item={detailItem?.item ?? null}
        brand={detailItem?.row?.brand || undefined}
        category={detailItem?.row?.category || undefined}
        onClose={() => setDetailItem(null)}
        onEdit={() => detailItem?.row && handleEdit(detailItem.row)}
        onDelete={() => detailItem && setDeleteTarget({ id: detailItem.item.id, name: detailItem.item.name })}
      />
      <DeleteItemSheet
        open={!!deleteTarget}
        itemName={deleteTarget?.name || ""}
        affectedOutfitCount={affectedOutfits.length}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

function CategoryChip({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.96] border ${
        active
          ? "bg-primary text-primary-foreground border-primary/70"
          : "text-muted-foreground border-border/60"
      }`}
      style={active ? {
        boxShadow: "0 1px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
      } : {
        backdropFilter: "blur(10px) saturate(140%)",
        WebkitBackdropFilter: "blur(10px) saturate(140%)",
        backgroundColor: "color-mix(in srgb, hsl(var(--card)) 45%, transparent)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
      }}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {label}
    </button>
  );
}

function ItemRow({
  item,
  isLast,
  onTap,
  onEdit,
  onDelete,
  delay,
  onMenuOpenChange,
}: {
  item: WardrobeItem;
  isLast: boolean;
  onTap: () => void;
  onEdit: () => void;
  onDelete: () => void;
  delay: number;
  onMenuOpenChange: (open: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSetMenuOpen = (open: boolean) => {
    setMenuOpen(open);
    onMenuOpenChange(open);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) handleSetMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div
      className={`animate-reveal-up relative ${menuOpen ? "z-40" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`flex items-center px-4 py-3 active:bg-muted/40 transition-colors cursor-pointer ${!isLast ? "border-b border-border/40" : ""}`}
        onClick={onTap}
      >
        <div className="w-9 h-9 rounded-xl flex-shrink-0 border border-black/10 dark:border-white/10" style={{ backgroundColor: item.hex }} />
        <div className="flex-1 min-w-0 ml-3">
          <p className="text-foreground text-[15px] font-medium leading-snug truncate">{item.name}</p>
          <p className="text-muted-foreground text-[13px] mt-0.5 truncate">
            {item.brand ? `${item.brand} · ` : ""}{item.color}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <AppBadge size="sm" variant={item.owned ? "owned" : "rental"}>
            {item.owned ? "Own" : "Rental"}
          </AppBadge>
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); handleSetMenuOpen(!menuOpen); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground active:bg-muted/60 transition-colors active:scale-[0.92]"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-50 min-w-[150px] rounded-2xl border border-border bg-card shadow-xl py-1 animate-in fade-in-0 zoom-in-95 duration-150">
                <button
                  onClick={(e) => { e.stopPropagation(); handleSetMenuOpen(false); onEdit(); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[15px] text-foreground active:bg-muted transition-colors"
                >
                  <Pencil size={14} className="text-muted-foreground" />
                  Edit item
                </button>
                <div className="h-px bg-border/60 mx-3" />
                <button
                  onClick={(e) => { e.stopPropagation(); handleSetMenuOpen(false); onDelete(); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[15px] text-destructive active:bg-muted transition-colors"
                >
                  <Trash2 size={14} />
                  Delete item
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WardrobeGuide;
