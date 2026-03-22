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

  // Handle deep-link from piece tap
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
    <div className="px-4 pb-6 space-y-5">
      {/* Header */}
      <div className="pt-2 animate-reveal-up">
        <h2 className="text-3xl font-semibold text-foreground text-balance">Wardrobe</h2>
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

      {/* Floating Action Button */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-[0.93] shadow-lg shadow-black/30"
        style={{ backgroundColor: "#B08030", bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <Plus size={24} style={{ color: "#141008" }} strokeWidth={2.5} />
      </button>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 animate-reveal-up" style={{ animationDelay: "50ms" }}>
        <CategoryChip label="All" icon="✦" active={activeCategory === "all"} onClick={() => setActiveCategory("all")} />
        {allCategories.map((cat) => (
          <CategoryChip key={cat.id} label={cat.label} icon={cat.icon} active={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)} />
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 animate-reveal-up" style={{ animationDelay: "100ms" }}>
        {[
          { key: "all" as Filter, label: "All", count: totalPieces },
          { key: "owned" as Filter, label: "Owned", count: ownedCount },
          { key: "gaps" as Filter, label: "Rentals", count: gapCount },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 text-center py-1.5 rounded-md text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
              filter === f.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            <span className="ml-1 text-[11px] opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 animate-reveal-up">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading wardrobe…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-16 animate-reveal-up">
          <p className="text-destructive text-sm mb-2">Failed to load items</p>
          <button onClick={fetchItems} className="text-sm text-gold underline">Retry</button>
        </div>
      )}

      {/* Item cards */}
      {!loading && !error && categories.map((cat) => {
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
              {filtered.map((item, i) => {
                const row = cat.rows.find((r: any) => r.id === item.id);
                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onTap={() => row && setDetailItem({ item, row })}
                    onEdit={() => row && handleEdit(row)}
                    onDelete={() => setDeleteTarget({ id: item.id, name: item.name })}
                    delay={i * 40}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {!loading && !error && categories.every((c) => c.items.filter(filterItem).length === 0) && (
        <div className="text-center py-16 animate-reveal-up">
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
      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.96] ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className="text-xs">{icon}</span>
      {label}
    </button>
  );
}

function ItemCard({
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
      className={`bg-card rounded-xl border border-border animate-reveal-up cursor-pointer active:scale-[0.98] transition-transform relative ${menuOpen ? "z-40" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onTap}
    >
      <div className="flex">
        <div className="w-1.5 flex-shrink-0 rounded-l-xl" style={{ backgroundColor: item.hex }} />
        <div className="flex-1 p-3.5 min-w-0">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border border-border/40" style={{ backgroundColor: item.hex }} />
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-medium leading-tight truncate">{item.name}</p>
              {item.brand && <p className="text-muted-foreground text-[11px] mt-0.5">{item.brand}</p>}
              <p className="text-muted-foreground text-xs mt-0.5">{item.color}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded border ${
                item.owned ? "bg-teal/15 text-teal border-teal/30" : "bg-rust/15 text-rust border-rust/30"
              }`}>
                {item.owned ? "OWN" : "RENTAL"}
              </span>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((p) => !p);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-[0.92]"
                >
                  <MoreHorizontal size={16} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-9 z-50 min-w-[140px] rounded-lg border border-border bg-card shadow-lg py-1 animate-in fade-in-0 zoom-in-95 duration-150">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit();
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors active:scale-[0.97]"
                    >
                      <Pencil size={14} className="text-muted-foreground" />
                      Edit item
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDelete();
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors active:scale-[0.97]"
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
      </div>
    </div>
  );
}

export default WardrobeGuide;
