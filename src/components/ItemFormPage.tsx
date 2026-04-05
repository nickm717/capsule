import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePaletteContext } from "@/contexts/PaletteContext";
import type { ItemFormData } from "./ItemForm";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { useAppData } from "@/contexts/AppDataContext";
import BrandCombobox from "./BrandCombobox";

const CATEGORIES = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "outerwear", label: "Outerwear" },
  { value: "dresses", label: "Dresses" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
];

function closestPaletteHex(colorLabel: string, swatches: { name: string; hex: string }[]): string {
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
  const { user } = useAuth();
  const { palette } = usePaletteContext();
  const { wardrobeItems } = useAppData();
  const brandSuggestions = useMemo(() => {
    const seen = new Set<string>();
    wardrobeItems.forEach((item) => { if (item.brand) seen.add(item.brand); });
    return Array.from(seen).sort();
  }, [wardrobeItems]);
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
    price: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefill) {
      setForm((prev) => ({
        ...prev,
        ...prefill,
        hex: prefill.hex || (prefill.color ? closestPaletteHex(prefill.color, palette) : prev.hex),
      }));
    }
  }, [prefill]);

  const update = (key: keyof ItemFormData, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "color" && typeof value === "string" && !prefill?.hex) {
        next.hex = closestPaletteHex(value, palette);
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
      price: form.price ? parseFloat(form.price) : null,
    };
    let error;
    if (isEdit) {
      ({ error } = await supabase.from("custom_items").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("custom_items").insert({ ...payload, user_id: user!.id }));
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
      <header className="flex-shrink-0 flex items-center h-12 px-4 relative border-b border-border/30">
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
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="px-4 py-6 space-y-8">

          {/* Section 1 — Item details */}
          <FormSection label="Item Details">
            <FormRow label="Name" isFirst isLast={false}>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Cashmere Crewneck"
                className="flex-1 bg-transparent text-[17px] text-foreground text-right outline-none placeholder:text-muted-foreground min-w-0"
                autoFocus={!isEdit}
              />
            </FormRow>
            <FormRow label="Brand" isFirst={false} isLast={false}>
              <BrandCombobox
                value={form.brand}
                onChange={(val) => update("brand", val)}
                suggestions={brandSuggestions}
              />
            </FormRow>
            <FormRow label="Category" isFirst={false} isLast={false}>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[17px] text-muted-foreground">
                  {CATEGORIES.find((c) => c.value === form.category)?.label}
                </span>
                <ChevronDown size={16} className="text-muted-foreground" />
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  style={{ fontSize: "16px" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </FormRow>
            <FormRow label="Color" isFirst={false} isLast={false}>
              <input
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
                placeholder="e.g. Olive, Rust"
                className="flex-1 bg-transparent text-[17px] text-foreground text-right outline-none placeholder:text-muted-foreground min-w-0"
              />
            </FormRow>
            <FormRow label="Price" isFirst={false} isLast>
              <div className="flex items-center gap-0.5 ml-auto">
                <span className={`text-[17px] ${form.price ? "text-foreground" : "text-muted-foreground"}`}>$</span>
                <input
                  value={form.price}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d.]/g, "");
                    const [whole, ...rest] = raw.split(".");
                    const sanitized = rest.length > 0
                      ? whole + "." + rest.join("").slice(0, 2)
                      : whole;
                    update("price", sanitized);
                  }}
                  placeholder="0"
                  inputMode="decimal"
                  className="w-24 bg-transparent text-[17px] text-foreground text-right outline-none placeholder:text-muted-foreground min-w-0"
                />
              </div>
            </FormRow>
          </FormSection>

          {/* Section 2 — Color picker */}
          <FormSection label="Color">
            {/* Palette swatches grid */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex flex-wrap gap-2.5">
                {palette.map((s) => (
                  <button
                    key={s.hex}
                    onClick={() => update("hex", s.hex)}
                    title={s.name}
                    className={`w-9 h-9 rounded-xl transition-all active:scale-[0.88] ${
                      form.hex === s.hex
                        ? "ring-2 ring-gold ring-offset-2 ring-offset-card scale-105 shadow-sm"
                        : "border border-black/10 dark:border-white/10"
                    }`}
                    style={{ backgroundColor: s.hex }}
                  />
                ))}
              </div>
            </div>
            {/* Custom color — iOS-style row at bottom of section */}
            <div className="border-t border-border/40 flex items-center justify-between px-4 py-3">
              <span className="text-[17px] text-foreground">Custom</span>
              <div className="relative w-9 h-9">
                <div
                  className="w-9 h-9 rounded-xl border border-black/10 dark:border-white/10 shadow-sm"
                  style={{ backgroundColor: form.hex }}
                />
                <input
                  type="color"
                  value={form.hex}
                  onChange={(e) => update("hex", e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer rounded-xl"
                />
              </div>
            </div>
          </FormSection>

          {/* Section 3 — Ownership */}
          <FormSection label="Ownership">
            <div className="grid grid-cols-2 divide-x divide-border/40">
              {([{ value: true, label: "Own" }, { value: false, label: "Rental" }] as const).map(({ value, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => update("owned", value)}
                  className="flex items-center justify-between px-4 py-3.5 active:bg-muted/40 transition-colors"
                >
                  <span className={`text-[17px] ${form.owned === value ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                  <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-colors ${
                    form.owned === value ? "border-gold" : "border-muted-foreground/30"
                  }`}>
                    {form.owned === value && (
                      <div className="w-[11px] h-[11px] rounded-full bg-gold" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </FormSection>

          {/* Section 4 — Notes */}
          <FormSection label="Notes">
            <div className="px-4 py-3">
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Styling tips, pairing ideas…"
                rows={3}
                className="w-full bg-transparent text-[17px] text-foreground outline-none placeholder:text-muted-foreground resize-none leading-relaxed"
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
            background: "linear-gradient(145deg, rgba(184,128,48,0.55) 0%, rgba(160,100,24,0.50) 100%)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
            border: "1px solid rgba(255,200,100,0.35)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.22)",
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
      <div className="bg-card rounded-2xl overflow-hidden">
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
