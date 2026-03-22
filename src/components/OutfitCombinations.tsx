import { useState, useEffect, useRef } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, CalendarPlus, Loader2 } from "lucide-react";
import { occasionDefs, temperatureBadges } from "@/data/darkautumn";
import type { OutfitPiece } from "@/data/darkautumn";
import OutfitBuilder from "./OutfitBuilder";
import AddToDaySheet from "./AddToDaySheet";
import DeleteOutfitSheet from "./DeleteOutfitSheet";
import OutfitDetailSheet from "./OutfitDetailSheet";
import { useOutfits, type DbOutfit } from "@/hooks/use-outfits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OutfitCombinationsProps {
  onBuilderOpen?: (open: boolean) => void;
  onPieceTap?: (itemId: string) => void;
}

const OutfitCombinations = ({ onBuilderOpen, onPieceTap }: OutfitCombinationsProps) => {
  const [activeOccasion, setActiveOccasion] = useState(occasionDefs[0].id);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editOutfit, setEditOutfit] = useState<DbOutfit | null>(null);
  const [addToDayOutfit, setAddToDayOutfit] = useState<{ id: string; name: string } | null>(null);
  const [deleteOutfit, setDeleteOutfit] = useState<{ id: string; name: string } | null>(null);
  const [detailOutfit, setDetailOutfit] = useState<DbOutfit | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { outfits, loading, error, refetch } = useOutfits();

  const openBuilder = (outfit?: DbOutfit) => {
    setEditOutfit(outfit ?? null);
    setShowBuilder(true);
    onBuilderOpen?.(true);
  };

  const closeBuilder = () => {
    setShowBuilder(false);
    setEditOutfit(null);
    onBuilderOpen?.(false);
  };

  const handleDelete = async () => {
    if (!deleteOutfit) return;
    setDeleting(true);
    const { error } = await supabase.from("custom_outfits").delete().eq("id", deleteOutfit.id);
    setDeleting(false);
    if (error) {
      console.error(error);
      toast.error("Failed to delete outfit");
    } else {
      toast.success("Outfit deleted");
      setDeleteOutfit(null);
      refetch();
    }
  };

  if (showBuilder) {
    return (
      <OutfitBuilder
        onBack={closeBuilder}
        onSaved={() => {
          closeBuilder();
          refetch();
        }}
        editOutfit={editOutfit ? {
          id: editOutfit.id,
          name: editOutfit.name,
          notes: editOutfit.notes || "",
          temp: editOutfit.temp,
          occasion_id: editOutfit.occasion_id,
          pieces: editOutfit.pieces as any[],
        } : null}
      />
    );
  }

  const outfitsForOccasion = outfits.filter((o) => o.occasion_id === activeOccasion);

  return (
    <div className="px-4 pb-6 space-y-5">
      <div className="pt-2 animate-reveal-up flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground text-balance">Outfits</h2>
          <p className="text-secondary text-sm mt-1">
            {outfits.length} curated looks across {occasionDefs.length} occasions
          </p>
        </div>
        <button
          onClick={() => openBuilder()}
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center active:scale-[0.95] transition-all shadow-md"
          style={{ backgroundColor: "#B08030" }}
          aria-label="Add outfit"
        >
          <Plus size={22} color="#141008" strokeWidth={2.5} />
        </button>
      </div>

      {/* Occasion tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 animate-reveal-up" style={{ animationDelay: "60ms" }}>
        {occasionDefs.map((occ) => (
          <button
            key={occ.id}
            onClick={() => setActiveOccasion(occ.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.96] ${
              activeOccasion === occ.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="mr-1.5">{occ.icon}</span>
            {occ.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 animate-reveal-up">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading outfits…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-16 animate-reveal-up">
          <p className="text-destructive text-sm mb-2">Failed to load outfits</p>
          <button onClick={refetch} className="text-sm text-gold underline">Retry</button>
        </div>
      )}

      {/* Outfit cards */}
      {!loading && !error && outfitsForOccasion.map((outfit, i) => {
        const tempBadge = temperatureBadges[outfit.temp];
        const pieces = outfit.pieces as OutfitPiece[];
        return (
          <OutfitCard
            key={outfit.id}
            outfit={outfit}
            tempBadge={tempBadge}
            pieces={pieces}
            delay={i * 50}
            onTap={() => setDetailOutfit(outfit)}
            onEdit={() => openBuilder(outfit)}
            onDelete={() => setDeleteOutfit({ id: outfit.id, name: outfit.name })}
            onAddToDay={() => setAddToDayOutfit({ id: outfit.id, name: outfit.name })}
          />
        );
      })}

      {!loading && !error && outfitsForOccasion.length === 0 && (
        <div className="text-center py-16 animate-reveal-up">
          <p className="text-muted-foreground text-sm">No outfits for this occasion yet.</p>
        </div>
      )}

      <OutfitDetailSheet
        open={!!detailOutfit}
        outfit={detailOutfit ? {
          id: detailOutfit.id,
          name: detailOutfit.name,
          temp: detailOutfit.temp,
          pieces: detailOutfit.pieces as OutfitPiece[],
          notes: detailOutfit.notes || "",
        } : null}
        onClose={() => setDetailOutfit(null)}
        onEdit={() => openBuilder(detailOutfit!)}
        onDelete={() => setDeleteOutfit({ id: detailOutfit!.id, name: detailOutfit!.name })}
        onAddToDay={() => setAddToDayOutfit({ id: detailOutfit!.id, name: detailOutfit!.name })}
      />

      <AddToDaySheet
        open={!!addToDayOutfit}
        outfit={addToDayOutfit}
        onClose={() => setAddToDayOutfit(null)}
      />

      <DeleteOutfitSheet
        open={!!deleteOutfit}
        outfitName={deleteOutfit?.name ?? ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOutfit(null)}
      />
    </div>
  );
};

function OutfitCard({
  outfit,
  tempBadge,
  pieces,
  delay,
  onTap,
  onEdit,
  onDelete,
  onAddToDay,
}: {
  outfit: DbOutfit;
  tempBadge: any;
  pieces: OutfitPiece[];
  delay: number;
  onTap: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddToDay: () => void;
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
      className={`w-full text-left bg-card rounded-xl border border-border animate-reveal-up cursor-pointer active:scale-[0.99] transition-transform relative ${menuOpen ? "z-40" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onTap}
    >
      <div className="flex">
        {/* Vertical color strips */}
        <div className="flex flex-shrink-0 py-3 pl-3 items-center" style={{ gap: "2px" }}>
          {pieces.map((piece, pi) => (
            <div
              key={pi}
              style={{ backgroundColor: piece.hex, width: "10px", height: "36px", borderRadius: "2px" }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-foreground font-medium text-sm truncate">{outfit.name}</h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {tempBadge && (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap"
                  style={{ backgroundColor: tempBadge.bg, borderColor: tempBadge.border, color: tempBadge.text }}
                >
                  {outfit.temp} · {tempBadge.range}
                </span>
              )}
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
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors active:scale-[0.97]"
                    >
                      <Pencil size={14} className="text-muted-foreground" />
                      Edit outfit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAddToDay(); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors active:scale-[0.97]"
                    >
                      <CalendarPlus size={14} className="text-muted-foreground" />
                      Add to day
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors active:scale-[0.97]"
                    >
                      <Trash2 size={14} />
                      Delete outfit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            {pieces.map((p) => p.name).join(" · ")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default OutfitCombinations;
