import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, CalendarPlus, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { temperatureBadges } from "@/data/darkautumn";
import type { OutfitPiece } from "@/data/darkautumn";

interface OutfitDetailSheetProps {
  open: boolean;
  outfit: {
    id: string;
    name: string;
    temp: string;
    pieces: OutfitPiece[];
    notes: string;
  } | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddToDay: () => void;
}

const OutfitDetailSheet = ({ open, outfit, onClose, onEdit, onDelete, onAddToDay }: OutfitDetailSheetProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!outfit) return null;

  const tempBadge = temperatureBadges[outfit.temp];

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) { setMenuOpen(false); onClose(); } }}>
      <DrawerContent className="px-5 pb-8 pt-0">
        <DrawerHeader className="text-left px-0 pt-4 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <DrawerTitle className="text-lg font-semibold text-foreground">
                {outfit.name}
              </DrawerTitle>
              {tempBadge && (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap"
                  style={{ backgroundColor: tempBadge.bg, borderColor: tempBadge.border, color: tempBadge.text }}
                >
                  {outfit.temp} · {tempBadge.range}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-[0.92]"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-9 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[140px] animate-in fade-in-0 zoom-in-95 duration-150">
                    <button
                      onClick={() => { setMenuOpen(false); onClose(); onEdit(); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors active:scale-[0.97]"
                    >
                      <Pencil size={14} className="text-muted-foreground" />
                      Edit outfit
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); onClose(); onDelete(); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-destructive hover:bg-muted transition-colors active:scale-[0.97]"
                    >
                      <Trash2 size={14} />
                      Delete outfit
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => { setMenuOpen(false); onClose(); }}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-[0.92]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </DrawerHeader>

        {/* Piece list */}
        <div className="space-y-3">
          {outfit.pieces.map((piece, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-full flex-shrink-0 border border-border/40"
                style={{ backgroundColor: piece.hex }}
              />
              <span className="text-sm text-foreground">{piece.name}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {outfit.notes && (
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed italic" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              {outfit.notes}
            </p>
          </div>
        )}

        {/* Add to Day button */}
        <button
          onClick={() => { onClose(); onAddToDay(); }}
          className="w-full mt-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2"
        >
          <CalendarPlus size={14} />
          Add to day
        </button>
      </DrawerContent>
    </Drawer>
  );
};

export default OutfitDetailSheet;
