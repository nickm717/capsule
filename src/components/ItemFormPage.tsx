import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { swatches } from "@/data/darkautumn";
import type { ItemFormData } from "./ItemForm";
import { useSwipeBack } from "@/hooks/use-swipe-back";

const CATEGORIES = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "outerwear", label: "Outerwear" },
  { value: "dresses", label: "Dresses" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
];

function closestPaletteHex(colorLabel: string): string {
  const lower = colorLabel.toLowerCase();
  const match = swatches.find((s) => lower.includes(s.name.toLowerCase()));
  return match ? match.hex : "#5C3317";
}

interface ItemFormPageProps {
  prefill?: Partial<ItemFormData> | null;
  editId?: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

const ItemFormPage = ({ prefill, editId, onSaved, onCancel }: ItemFormPageProps) => {
  const isEdit = !!editId;
  useSwipeBack(useCallback(() => onCancel(), [onCancel]));

  const [form, setForm] = useState<ItemFormData>({
    name: "",
    brand: "",
    category: "tops",
    color: "",
    hex: "#5C3317",
    notes: "",
    owned: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefill) {
      setForm((prev) => ({
        ...prev,
        ...prefill,
        hex: prefill.hex || (prefill.color ? closestPaletteHex(prefill.color) : prev.hex),
      }));
    }
  }, [prefill]);

  const update = (key: keyof ItemFormData, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "color" && typeof value === "string" && !prefill?.hex) {
        next.hex = closestPaletteHex(value);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      color: form.color.trim(),
      hex: form.hex,
      notes: form.notes.trim(),
      owned: form.owned,
    };
    let error;
    if (isEdit) {
      ({ error } = await supabase.from("custom_items").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("custom_items").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast.error("Failed to save item");
      console.error(error);
    } else {
      toast.success(isEdit ? "Item updated!" : "Item saved!");
      onSaved();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* iOS-style navigation bar */}
      <header className="flex-shrink-0 flex items-center h-12 px-4 relative border-b border-border/50">
        <button
          onClick={onCancel}
          className="text-[17px] font-normal text-gold active:opacity-60 transition-opacity"
        >
          Cancel
        </button>
        <h1
          className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-foreground"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}
        >
          {isEdit ? "Edit Item" : "New Item"}
        </h1>
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="text-[17px] font-semibold text-gold disabled:opacity-40 active:opacity-60 transition-opacity flex items-center gap-1.5"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Save" : "Add"}
          </button>
        </div>
      </header>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto bg-muted/30">
        <div className="px-4 py-6 space-y-8">

          {/* Section 1 — Item details */}
          <FormSection label="Item Details">
            <FormRow label="Name" isFirst isLast={false}>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Cashmere Crewneck"
                className="flex-1 bg-transparent text-[17px] text-foreground text-right outline-none placeholder:text-muted-foreground/40 min-w-0"
                autoFocus={!isEdit}
              />
            </FormRow>
            <FormRow label="Brand" isFirst={false} isLast={false}>
              <input
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
                placeholder="Optional"
                className="flex-1 bg-transparent text-[17px] text-foreground text-right outline-none placeholder:text-muted-foreground/40 min-w-0"
              />
            </FormRow>
            <FormRow label="Category" isFirst={false} isLast={false}>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[17px] text-muted-foreground">
                  {CATEGORIES.find((c) => c.value === form.category)?.label}
                </span>
                <ChevronDown size={16} className="text-muted-foreground/50" />
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  style={{ fontSize: "16px" }}
                />
              </div>
            </FormRow>
            <FormRow label="Color" isFirst={false} isLast>
              <input
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
                placeholder="e.g. Olive, Rust"
                className="flex-1 bg-transparent text-[17px] text-foreground text-right outline-none placeholder:text-muted-foreground/40 min-w-0"
              />
            </FormRow>
          </FormSection>

          {/* Section 2 — Color picker */}
          <FormSection label="Color Swatch">
            <div className="px-4 py-4 space-y-3">
              {/* Selected swatch preview */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: form.hex }}
                />
                <div className="flex gap-2 flex-wrap flex-1">
                  {swatches.map((s) => (
                    <button
                      key={s.hex}
                      onClick={() => update("hex", s.hex)}
                      className={`w-7 h-7 rounded-full transition-all active:scale-[0.88] ${
                        form.hex === s.hex
                          ? "ring-2 ring-offset-2 ring-gold ring-offset-card scale-110"
                          : "border border-black/10 dark:border-white/10"
                      }`}
                      style={{ backgroundColor: s.hex }}
                      title={s.name}
                    />
                  ))}
                </div>
              </div>
              {/* Custom hex */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="color"
                  value={form.hex}
                  onChange={(e) => update("hex", e.target.value)}
                  className="w-9 h-9 rounded-xl border border-border cursor-pointer bg-transparent"
                />
                <span className="text-[13px] text-muted-foreground">Custom color</span>
              </div>
            </div>
          </FormSection>

          {/* Section 3 — Status */}
          <FormSection label="Status">
            <FormRow label="Ownership" isFirst isLast>
              <div className="flex items-center gap-2.5 ml-auto">
                <span className={`text-[15px] ${!form.owned ? "text-rust font-medium" : "text-muted-foreground"}`}>
                  Rental
                </span>
                <Switch
                  checked={form.owned}
                  onCheckedChange={(v) => update("owned", v)}
                />
                <span className={`text-[15px] ${form.owned ? "text-teal font-medium" : "text-muted-foreground"}`}>
                  Own
                </span>
              </div>
            </FormRow>
          </FormSection>

          {/* Section 4 — Notes */}
          <FormSection label="Notes">
            <div className="px-4 py-3">
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Styling tips, pairing ideas…"
                rows={3}
                className="w-full bg-transparent text-[17px] text-foreground outline-none placeholder:text-muted-foreground/40 resize-none leading-relaxed"
                style={{ fontSize: "16px" }}
              />
            </div>
          </FormSection>

        </div>
      </div>

      {/* iOS-style bottom safe-area button */}
      <div
        className="flex-shrink-0 px-4 pt-3 border-t border-border/50 bg-background"
        style={{ paddingBottom: `max(16px, env(safe-area-inset-bottom))` }}
      >
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className="w-full py-3.5 rounded-2xl font-semibold text-[17px] transition-all active:scale-[0.97] active:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(145deg, rgba(184,128,48,0.85) 0%, rgba(160,100,24,0.80) 100%)",
            backdropFilter: "blur(12px) saturate(160%)",
            WebkitBackdropFilter: "blur(12px) saturate(160%)",
            border: "1px solid rgba(255,200,100,0.4)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.28)",
            color: "rgba(255,255,255,0.95)",
          }}
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {isEdit ? "Save Changes" : "Add to Wardrobe"}
        </button>
      </div>
    </div>
  );
};

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-medium text-muted-foreground uppercase px-1 mb-1.5" style={{ letterSpacing: "0.08em" }}>
        {label}
      </p>
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm dark:shadow-none">
        {children}
      </div>
    </div>
  );
}

function FormRow({ label, isFirst, isLast, children }: { label: string; isFirst: boolean; isLast: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex items-center px-4 py-3 relative min-h-[52px] ${!isLast ? "border-b border-border/40" : ""}`}>
      <span className="text-[17px] text-foreground flex-shrink-0 mr-3">{label}</span>
      {children}
    </div>
  );
}

export default ItemFormPage;
