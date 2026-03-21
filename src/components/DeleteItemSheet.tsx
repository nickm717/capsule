import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DeleteItemSheetProps {
  open: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteItemSheet = ({ open, itemName, onConfirm, onCancel }: DeleteItemSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6 pt-5">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-base font-semibold text-foreground">Delete item</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete <span className="font-medium text-foreground">{itemName}</span>? This can't be undone.
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
            className="w-full py-3 rounded-xl bg-muted text-foreground font-medium text-sm transition-all active:scale-[0.97]"
          >
            Cancel
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DeleteItemSheet;
