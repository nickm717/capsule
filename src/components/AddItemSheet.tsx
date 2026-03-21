import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ClipboardPaste, Camera, FileText } from "lucide-react";
import ItemForm, { type ItemFormData } from "./ItemForm";
import UrlExtractor from "./UrlExtractor";
import PhotoExtractor from "./PhotoExtractor";

type Mode = "menu" | "form" | "url" | "photo";

interface AddItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const AddItemSheet = ({ open, onOpenChange, onSaved }: AddItemSheetProps) => {
  const [mode, setMode] = useState<Mode>("menu");
  const [prefill, setPrefill] = useState<Partial<ItemFormData> | null>(null);

  const reset = () => {
    setMode("menu");
    setPrefill(null);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleExtracted = (data: Partial<ItemFormData>) => {
    setPrefill(data);
    setMode("form");
  };

  const handleSaved = () => {
    onSaved();
    handleClose(false);
  };

  const tiles = [
    { key: "form" as Mode, icon: FileText, label: "Fill out form", desc: "Enter details manually" },
    { key: "url" as Mode, icon: ClipboardPaste, label: "Paste a URL", desc: "Extract from product page" },
    { key: "photo" as Mode, icon: Camera, label: "Take a photo", desc: "AI identifies the item" },
  ];

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-lg">
            {mode === "menu" && "Add Item"}
            {mode === "form" && "New Item"}
            {mode === "url" && "Paste URL"}
            {mode === "photo" && "Photo"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-6">
          {mode === "menu" && (
            <div className="grid gap-3 pb-2">
              {tiles.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setMode(t.key)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors active:scale-[0.97] text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-gold/15 flex items-center justify-center flex-shrink-0">
                    <t.icon size={22} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {mode === "url" && (
            <UrlExtractor
              onExtracted={handleExtracted}
              onBack={() => setMode("menu")}
            />
          )}

          {mode === "photo" && (
            <PhotoExtractor
              onExtracted={handleExtracted}
              onBack={() => setMode("menu")}
            />
          )}

          {mode === "form" && (
            <ItemForm
              prefill={prefill}
              onSaved={handleSaved}
              onBack={() => {
                setPrefill(null);
                setMode("menu");
              }}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddItemSheet;
