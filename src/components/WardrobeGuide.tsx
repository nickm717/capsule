import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { swatches, type WardrobeItem } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import { useWardrobeItems } from "@/hooks/use-wardrobe-items";
import AddItemSheet from "./AddItemSheet";
import ItemFormPage from "./ItemFormPage";
import DeleteItemSheet from "./DeleteItemSheet";
import ItemDetailSheet from "./ItemDetailSheet";
import type { ItemFormData } from "./ItemForm";

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

  const { categories: allCategories, loading, error, refetch: fetchItems } = useWardrobeItems();

  useEffect(() => {
    if (!openItemId || loading) return;
    const row = allCategories.flatMap((c) => c.rows).find((r: any) => r.id === openItemId);
    if (row) {
      handleEdit(row);
    }
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

  const handleFormSaved = () => {
    fetchItems();
    closeForm();
  };

  const handleEdit = (row: any) => {
    openForm(
      {
        name: row.name,
        brand: row.brand || "",
        category: row.category,
        color: row.color,
        hex: row.hex,
        notes: row.notes || "",
        owned: row.owned,
      },
      row.id
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("custom_items").delete().eq("id", deleteTarget.id);
    if (!error) {
      fetchItems();
    }
    setDeleteTarget(null);
  };

  const categories = activeCategory === "all" ? allCategories : allCategories.filter((c) => c.id === activeCategory);

  const filterItem = (item: WardrobeItem) => {
    if (filter === "owned") return item.owned;
    if (filter === "gaps") return item.gap === true;
    return true;
  };

  const filteredCategories = activeCategory === "all" ? allCategories : allCategories.filter((c) => c.id === activeCategory);
  const totalPieces = filteredCategories.reduce((s, c) => s + c.items.length, 0);
  const ownedCount = filteredCategories.reduce((s, c) => s + c.items.filter((i) => i.owned).length, 0);
  const gapCount = filteredCategories.reduce((s, c) => s + c.items.filter((i) => i.gap).length, 0);

  if (formOpen) {
    return <ItemFormPage prefill={formPrefill} editId={editId} onSaved={handleFormSaved} onCancel={closeForm} />;
  }

  return (
    <div className="px-4 pb-6 space-y-5 pt-5">
      {/* Header */}
      <div className="animate-reveal-up">
        <h2 className="text-4xl font-medium text-foreground" style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic" }}>
          Wardrobe
        </h2>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-muted-foreground text-xs tracking-wide uppercase" style={{ letterSpacing: "0.08em" }}>
            {ownedCount} owned · {gapCount} rentals · {totalPieces} total
          </p>
        </div>
        {/* Color palette row */}
        <div className="flex gap-1.5 mt-3">
          {swatches.map((s) => (
            <div
              key={s.name}
              className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0"
              style={{ backgroundColor: s.hex }}
              title={s.name}
            />
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-[0.93] shadow-xl"
        style={{
          backgroundColor: "hsl(38 80% 54%)",
          bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)"
        }}
      >
        <Plus size={22} color="hsl(26 22% 5%)" strokeWidth={2.5} />
      </button>

      {/* Category chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 animate-reveal-up [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ animationDelay: "50ms" }}
      >
        <CategoryChip label="All" icon="✦" active={activeCategory === "all"} onClick={() => setActiveCategory("all")} />
        {allCategories.map((cat) => (
          <CategoryChip key={cat.id} label={cat.label} icon={cat.icon} active={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)} />
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-1 bg-muted/60 rounded-xl p-1 animate-reveal-up border border-border/40" style={{ animationDelay: "100ms" }}>
        {[
          { key: "all" as Filter, label: "All", count: totalPieces },
          { key: "owned" as Filter, label: "Owned", count: ownedCount },
          { key: "gaps" as Filter, label: "Rentals", count: gapCount },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.97] tracking-wide ${
              filter === f.key
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
            style={{ letterSpacing: "0.04em" }}
          >
            {f.label}
            <span className="ml-1.5 text-[10px] opacity-50">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 animate-reveal-up">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-xs text-muted-foreground tracking-wide">Loading wardrobe…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-16 animate-reveal-up">
          <p className="text-destructive text-sm mb-2">Failed to load items</p>
          <button onClick={fetchItems} className="text-xs text-gold underline">Retry</button>
        </div>
      )}

      {/* Item grid */}
      {!loading && !error && categories.map((cat) => {
        const filtered = cat.items.filter(filterItem);
        if (filtered.length === 0) return null;
        return (
          <section key={cat.id}>
            {activeCategory === "all" && (
              <div className="flex items-center gap-2 mb-3 animate-reveal-up">
                <span className="text-base">{cat.icon}</span>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest" style={{ letterSpacing: "0.12em" }}>
                  {cat.label}
                </h3>
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-[10px] text-muted-foreground/60">{filtered.length}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              {filtered.map((item, i) => {
                const row = cat.rows.find((r: any) => r.id === item.id);
                return (
                  <ItemGridCard
                    key={item.id}
                    item={item}
                    onTap={() => row && setDetailItem({ item, row })}
                    onEdit={() => row && handleEdit(row)}
                    onDelete={() => setDeleteTarget({ id: item.id, name: item.name })}
                    delay={i * 35}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {!loading && !error && categories.every((c) => c.items.filter(filterItem).length === 0) && (
        <div className="text-center py-20 animate-reveal-up">
          <p className="text-muted-foreground text-sm">No items match this filter.</p>
        </div>
      )}

      <AddItemSheet open={sheetOpen} onOpenChange={setSheetOpen} onOpenForm={openForm} />
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
      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-[0.96] border ${
        active
          ? "bg-primary text-primary-foreground border-primary/80"
          : "bg-muted/60 text-muted-foreground hover:text-foreground border-border/40"
      }`}
      style={{ letterSpacing: "0.03em" }}
    >
      <span className="text-sm">{icon}</span>
      {label}
    </button>
  );
}

function ItemGridCard({
  item,
  onTap,
  onEdit,
  onDelete,
  delay,
}: {
  item: WardrobeItem;
  onTap: () => void;
  onEdit: () => void;
  onDelete: () => void;
  delay: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div
      className={`bg-card rounded-2xl border border-border/60 overflow-hidden animate-reveal-up active:scale-[0.97] transition-transform relative ${menuOpen ? "z-40" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Color swatch area */}
      <div
        className="relative w-full cursor-pointer"
        style={{ height: "90px", backgroundColor: item.hex }}
        onClick={onTap}
      >
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

        {/* Top-right: menu button */}
        <div className="absolute top-2 right-2 z-10" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((p) => !p);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/30 text-white/80 hover:bg-black/50 transition-colors active:scale-[0.9] backdrop-blur-sm"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 min-w-[140px] rounded-xl border border-border bg-card shadow-xl py-1 animate-in fade-in-0 zoom-in-95 duration-150">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Pencil size={13} className="text-muted-foreground" />
                Edit item
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
              >
                <Trash2 size={13} />
                Delete item
              </button>
            </div>
          )}
        </div>

        {/* Bottom-left: owned badge */}
        <div className="absolute bottom-2 left-2">
          <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md backdrop-blur-sm ${
            item.owned
              ? "bg-black/40 text-white/90 border border-white/20"
              : "bg-black/40 text-white/70 border border-white/15"
          }`}>
            {item.owned ? "Own" : "Rental"}
          </span>
        </div>
      </div>

      {/* Info area */}
      <div className="p-2.5 cursor-pointer" onClick={onTap}>
        <p className="text-foreground text-xs font-medium leading-snug line-clamp-1">{item.name}</p>
        {item.brand && (
          <p className="text-muted-foreground text-[10px] mt-0.5 line-clamp-1">{item.brand}</p>
        )}
        <p className="text-muted-foreground/60 text-[10px] mt-0.5">{item.color}</p>
      </div>
    </div>
  );
}

export default WardrobeGuide;
