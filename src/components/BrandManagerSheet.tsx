import { useState } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface BrandManagerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: string[];
  onRenameComplete: () => void;
}

const BrandManagerSheet = ({
  open,
  onOpenChange,
  brands,
  onRenameComplete,
}: BrandManagerSheetProps) => {
  const { user } = useAuth();
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (brand: string) => {
    setEditingBrand(brand);
    setDraftName(brand);
  };

  const cancelEdit = () => setEditingBrand(null);

  const handleRename = async (oldName: string) => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingBrand(null);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("custom_items")
      .update({ brand: trimmed })
      .eq("brand", oldName)
      .eq("user_id", user!.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to rename brand");
      console.error(error);
    } else {
      toast.success(`Renamed "${oldName}" to "${trimmed}"`);
      setEditingBrand(null);
      onRenameComplete();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle>Manage Brands</DrawerTitle>
          <p className="text-sm text-muted-foreground">
            Rename a brand to consolidate duplicates across all items.
          </p>
        </DrawerHeader>
        <div className="px-4 pb-10 overflow-y-auto" style={{ maxHeight: "65vh" }}>
          {brands.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              No brands in your wardrobe yet.
            </p>
          ) : (
            <div className="bg-card rounded-2xl overflow-hidden">
              {brands.map((brand, i) => {
                const isEditing = editingBrand === brand;
                const isLast = i === brands.length - 1;
                return (
                  <div
                    key={brand}
                    className={`flex items-center px-4 py-3 min-h-[52px] ${!isLast ? "border-b border-border/40" : ""}`}
                  >
                    {isEditing ? (
                      <>
                        <input
                          autoFocus
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(brand);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="flex-1 bg-transparent text-[17px] text-foreground outline-none border-b border-primary/50 pb-0.5 min-w-0 mr-2"
                        />
                        {saving ? (
                          <Loader2 size={16} className="animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleRename(brand)}
                              className="w-11 h-11 flex items-center justify-center text-primary active:opacity-60 transition-opacity"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="w-11 h-11 flex items-center justify-center text-muted-foreground active:opacity-60 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-[17px] text-foreground truncate">{brand}</span>
                        <button
                          onClick={() => startEdit(brand)}
                          className="w-11 h-11 flex items-center justify-center text-muted-foreground active:opacity-60 transition-opacity"
                        >
                          <Pencil size={16} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BrandManagerSheet;
