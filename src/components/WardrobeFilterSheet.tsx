import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { ColorFamily } from "@/lib/colorFamilies";

interface WardrobeFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableColorFamilies: ColorFamily[];
  availableBrands: string[];
  selectedColorFamilies: string[];
  selectedBrands: string[];
  onColorFamiliesChange: (families: string[]) => void;
  onBrandsChange: (brands: string[]) => void;
  onManageBrands: () => void;
}

const WardrobeFilterSheet = ({
  open,
  onOpenChange,
  availableColorFamilies,
  availableBrands,
  selectedColorFamilies,
  selectedBrands,
  onColorFamiliesChange,
  onBrandsChange,
  onManageBrands,
}: WardrobeFilterSheetProps) => {
  const toggleFamily = (id: string) =>
    onColorFamiliesChange(
      selectedColorFamilies.includes(id)
        ? selectedColorFamilies.filter((f) => f !== id)
        : [...selectedColorFamilies, id]
    );

  const toggleBrand = (brand: string) =>
    onBrandsChange(
      selectedBrands.includes(brand)
        ? selectedBrands.filter((b) => b !== brand)
        : [...selectedBrands, brand]
    );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle>Filter</DrawerTitle>
        </DrawerHeader>
        <div
          className="px-4 pb-10 space-y-6 overflow-y-auto"
          style={{ maxHeight: "70vh" }}
        >
          {availableColorFamilies.length > 0 && (
            <section>
              <p
                className="text-[11px] font-semibold text-muted-foreground uppercase mb-3"
                style={{ letterSpacing: "0.1em" }}
              >
                Color
              </p>
              <div className="flex flex-wrap gap-4">
                {availableColorFamilies.map(({ id, label, hex }) => {
                  const selected = selectedColorFamilies.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleFamily(id)}
                      title={label}
                      className="flex flex-col items-center gap-1.5 active:scale-[0.92] transition-transform"
                      style={{ minWidth: 44, minHeight: 44 }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          backgroundColor: hex,
                          border: selected
                            ? "2.5px solid hsl(var(--foreground))"
                            : "1.5px solid hsl(var(--border))",
                          boxShadow: selected
                            ? "0 0 0 2px hsl(var(--background))"
                            : undefined,
                        }}
                      />
                      <span
                        className="text-[10px] text-muted-foreground text-center"
                        style={{ lineHeight: 1.2 }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {availableBrands.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-[11px] font-semibold text-muted-foreground uppercase"
                  style={{ letterSpacing: "0.1em" }}
                >
                  Brand
                </p>
                <button
                  onClick={onManageBrands}
                  className="text-[13px] text-primary font-medium active:opacity-60 transition-opacity"
                >
                  Manage
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableBrands.map((brand) => {
                  const selected = selectedBrands.includes(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.96] border ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary/70"
                          : "text-muted-foreground border-border/60"
                      }`}
                      style={
                        selected
                          ? {
                              boxShadow:
                                "0 1px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
                            }
                          : {
                              backdropFilter: "blur(10px) saturate(140%)",
                              WebkitBackdropFilter: "blur(10px) saturate(140%)",
                              backgroundColor:
                                "color-mix(in srgb, hsl(var(--card)) 45%, transparent)",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                            }
                      }
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default WardrobeFilterSheet;
