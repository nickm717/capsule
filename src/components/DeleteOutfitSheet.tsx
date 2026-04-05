import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DeleteOutfitSheetProps {
  open: boolean;
  outfitName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteOutfitSheet = ({ open, outfitName, onConfirm, onCancel }: DeleteOutfitSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6 pt-5">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-base font-semibold text-foreground">Delete outfit</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete <span className="font-medium text-foreground">{outfitName}</span>? This can't be undone.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm transition-all active:scale-[0.97]"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl liquid-glass-surface border border-border/50 text-foreground font-medium text-sm transition-all active:scale-[0.97]"
          >
            Cancel
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DeleteOutfitSheet;
