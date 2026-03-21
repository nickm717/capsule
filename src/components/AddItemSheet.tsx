import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ClipboardPaste, Camera, FileText } from "lucide-react";
import UrlExtractor from "./UrlExtractor";
import PhotoExtractor from "./PhotoExtractor";
import type { ItemFormData } from "./ItemForm";

type Mode = "menu" | "url" | "photo";

interface AddItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenForm: (prefill?: Partial<ItemFormData>) => void;
}

function useViewportHeight(fraction = 0.5) {
  const [height, setHeight] = useState(() => {
    const vv = window.visualViewport;
    return Math.round((vv ? vv.height : window.innerHeight) * fraction);
  });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(Math.round(vv.height * fraction));
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, [fraction]);

  return height;
}

const AddItemSheet = ({ open, onOpenChange, onOpenForm }: AddItemSheetProps) => {
  const [mode, setMode] = useState<Mode>("menu");
  const sheetHeight = useViewportHeight(0.5);

  const reset = () => setMode("menu");

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleExtracted = (data: Partial<ItemFormData>) => {
    handleClose(false);
    onOpenForm(data);
  };

  const handleFormDirect = () => {
    handleClose(false);
    onOpenForm();
  };

  const tiles = [
    { key: "form" as const, icon: FileText, label: "Fill out form", desc: "Enter details manually" },
    { key: "url" as const, icon: ClipboardPaste, label: "Paste a URL", desc: "Extract from product page" },
    { key: "photo" as const, icon: Camera, label: "Take a photo", desc: "AI identifies the item" },
  ];

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent
        style={{ maxHeight: `${sheetHeight}px` }}
        className="overflow-hidden"
      >
        <DrawerHeader className="pb-2 flex-shrink-0">
          <DrawerTitle className="text-lg">
            {mode === "menu" && "Add Item"}
            {mode === "url" && "Paste URL"}
            {mode === "photo" && "Photo"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-6 flex-1 min-h-0">
          {mode === "menu" && (
            <div className="grid gap-3 pb-2">
              {tiles.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    if (t.key === "form") {
                      handleFormDirect();
                    } else {
                      setMode(t.key);
                    }
                  }}
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
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddItemSheet;
