import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { WardrobeItem } from "@/data/darkautumn";

interface ItemDetailSheetProps {
  open: boolean;
  item: WardrobeItem | null;
  brand?: string;
  category?: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ItemDetailSheet = ({ open, item, brand, category, onClose, onEdit, onDelete }: ItemDetailSheetProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!item) return null;

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) { setMenuOpen(false); onClose(); } }}>
      <DrawerContent className="px-5 pb-8 pt-0">
        <DrawerHeader className="text-left px-0 pt-4 pb-5">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold text-foreground flex items-center gap-3">
              <span className="w-6 h-6 rounded-full flex-shrink-0 border border-border/40" style={{ backgroundColor: item.hex }} />
              {item.name}
            </DrawerTitle>
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
                      Edit item
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); onClose(); onDelete(); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-destructive hover:bg-muted transition-colors active:scale-[0.97]"
                    >
                      <Trash2 size={14} />
                      Delete item
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

        <div className="space-y-4">
          {brand && (
            <DetailRow label="Brand" value={brand} />
          )}
          {category && (
            <DetailRow label="Category" value={category} />
          )}
          <DetailRow label="Color" value={item.color} />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className={`text-[10px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded border ${
              item.owned
                ? "bg-teal/15 text-teal border-teal/30"
                : "bg-rust/15 text-rust border-rust/30"
            }`}>
              {item.owned ? "OWN" : "RENTAL"}
            </span>
          </div>
          {item.notes && (
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Notes</span>
              <p className="text-sm text-foreground leading-relaxed">{item.notes}</p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground font-medium">{value}</span>
    </div>
  );
}

export default ItemDetailSheet;
