import { Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { WardrobeItem } from "@/data/darkautumn";

interface ItemDetailSheetProps {
  open: boolean;
  item: WardrobeItem | null;
  brand?: string;
  category?: string;
  onClose: () => void;
  onEdit: () => void;
}

const ItemDetailSheet = ({ open, item, brand, category, onClose, onEdit }: ItemDetailSheetProps) => {
  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8 pt-5">
        <SheetHeader className="text-left mb-5">
          <SheetTitle className="text-lg font-semibold text-foreground flex items-center gap-3">
            <span className="w-6 h-6 rounded-full flex-shrink-0 border border-border/40" style={{ backgroundColor: item.hex }} />
            {item.name}
          </SheetTitle>
        </SheetHeader>

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

        <button
          onClick={() => { onClose(); onEdit(); }}
          className="w-full mt-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2"
        >
          <Pencil size={14} />
          Edit item
        </button>
      </SheetContent>
    </Sheet>
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
