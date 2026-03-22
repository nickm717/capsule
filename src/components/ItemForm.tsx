import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { swatches } from "@/data/darkautumn";

export interface ItemFormData {
  name: string;
  brand: string;
  category: string;
  color: string;
  hex: string;
  notes: string;
  owned: boolean;
}

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

interface ItemFormProps {
  prefill?: Partial<ItemFormData> | null;
  onSaved: () => void;
  onBack: () => void;
}

const ItemForm = ({ prefill, onSaved, onBack }: ItemFormProps) => {
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
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("custom_items").insert({
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      color: form.color.trim(),
      hex: form.hex,
      notes: form.notes.trim(),
      owned: form.owned,
    });
    setSaving(false);
    if (error) {
      toast.error("Failed to save item");
      console.error(error);
    } else {
      toast.success("Item saved!");
      onSaved();
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="space-y-1.5">
        <Label htmlFor="item-name">Name</Label>
        <Input
          id="item-name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Cashmere Crewneck"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="item-brand">Brand (optional)</Label>
        <Input
          id="item-brand"
          value={form.brand}
          onChange={(e) => update("brand", e.target.value)}
          placeholder="e.g. Quince"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={form.category} onValueChange={(v) => update("category", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="item-color">Color Label</Label>
        <Input
          id="item-color"
          value={form.color}
          onChange={(e) => update("color", e.target.value)}
          placeholder="e.g. Olive, Rust"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="item-hex">Hex Color</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            id="item-hex"
            value={form.hex}
            onChange={(e) => update("hex", e.target.value)}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer"
          />
          <div className="flex gap-1.5 flex-wrap flex-1">
            {swatches.map((s) => (
              <button
                key={s.hex}
                onClick={() => update("hex", s.hex)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  form.hex === s.hex ? "border-gold scale-110" : "border-border/40"
                }`}
                style={{ backgroundColor: s.hex }}
                title={s.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="item-notes">Notes (optional)</Label>
        <Textarea
          id="item-notes"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Styling tips, pairing ideas…"
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <Label htmlFor="item-owned">Status</Label>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${!form.owned ? "text-rust" : "text-muted-foreground"}`}>
            Rental
          </span>
          <Switch
            id="item-owned"
            checked={form.owned}
            onCheckedChange={(v) => update("owned", v)}
          />
          <span className={`text-xs font-medium ${form.owned ? "text-teal" : "text-muted-foreground"}`}>
            Own
          </span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !form.name.trim()}
        className="w-full py-3 rounded-xl bg-gold text-white font-medium text-sm transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        Save Item
      </button>
    </div>
  );
};

export default ItemForm;
