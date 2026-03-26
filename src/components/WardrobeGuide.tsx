import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { type WardrobeItem } from "@/data/darkautumn";
import { supabase } from "@/integrations/supabase/client";
import { useWardrobeItems } from "@/hooks/use-wardrobe-items";
import AddItemSheet from "./AddItemSheet";
import ItemFormPage from "./ItemFormPage";
import DeleteItemSheet from "./DeleteItemSheet";
import ItemDetailSheet from "./ItemDetailSheet";
import AppBadge from "./AppBadge";
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
    }, row.id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("custom_items").delete().eq("id", deleteTarget.id);
    if (!error) fetchItems();
    setDeleteTarget(null);
  };

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
      {/* Header — title only */}
      <div className="animate-reveal-up">
        <h2 className="text-[34px] font-bold text-foreground tracking-tight leading-none">
          Wardrobe
        </h2>
      </div>

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
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 animate-reveal-up [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ animationDelay: "50ms" }}>
        <CategoryChip label="All" icon="✦" active={activeCategory === "all"} onClick={() => setActiveCategory("all")} />
        {allCategories.map((cat) => (
          <CategoryChip key={cat.id} label={cat.label} icon={cat.icon} active={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)} />
        ))}
      </div>

      {/* Segmented filter */}
      <div
        className="flex gap-0.5 rounded-[10px] p-0.5 animate-reveal-up border border-border/60 shadow-sm glass"
        style={{
          backgroundColor: "color-mix(in srgb, hsl(var(--muted)) 70%, transparent)",
          animationDelay: "100ms",
        }}
      >
        {[
          { key: "all" as Filter, label: "All", count: totalPieces },
          { key: "owned" as Filter, label: "Owned", count: ownedCount },
          { key: "gaps" as Filter, label: "Rentals", count: gapCount },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 text-center py-[7px] rounded-[8px] text-[13px] font-medium transition-all duration-150 active:scale-[0.97] ${
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
            <span className="ml-1 text-[11px] opacity-50">{f.count}</span>
          </button>
        ))}
      </div>

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
      {!loading && !error && filteredCategories.map((cat) => {
        const filtered = cat.items.filter(filterItem);
        if (filtered.length === 0) return null;
        return (
          <section key={cat.id} className="animate-reveal-up">
            {activeCategory === "all" && (
              <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1.5 px-1" style={{ letterSpacing: "0.1em" }}>
                {cat.icon}  {cat.label}
              </p>
            )}
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm dark:shadow-none">
              {filtered.map((item, i) => {
                const row = cat.rows.find((r: any) => r.id === item.id);
                return (
                  <ItemRow
                    key={item.id}
                    item={item}
                    isLast={i === filtered.length - 1}
                    onTap={() => row && setDetailItem({ item, row })}
                    onEdit={() => row && handleEdit(row)}
                    onDelete={() => setDeleteTarget({ id: item.id, name: item.name })}
                    delay={i * 30}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {!loading && !error && filteredCategories.every((c) => c.items.filter(filterItem).length === 0) && (
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
          ? "bg-primary text-primary-foreground border-primary/70 shadow-sm"
          : "bg-muted/60 text-muted-foreground border-border/40"
      }`}
    >
      <span className="text-sm">{icon}</span>
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
}: {
  item: WardrobeItem;
  isLast: boolean;
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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
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
              onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground active:bg-muted/60 transition-colors active:scale-[0.92]"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-50 min-w-[150px] rounded-2xl border border-border bg-card shadow-xl py-1 animate-in fade-in-0 zoom-in-95 duration-150">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[15px] text-foreground active:bg-muted transition-colors"
                >
                  <Pencil size={14} className="text-muted-foreground" />
                  Edit item
                </button>
                <div className="h-px bg-border/60 mx-3" />
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
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
