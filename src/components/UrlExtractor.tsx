import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ItemFormData } from "./ItemForm";

interface UrlExtractorProps {
  onExtracted: (data: Partial<ItemFormData>) => void;
  onBack: () => void;
}

const UrlExtractor = ({ onExtracted, onBack }: UrlExtractorProps) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-item", {
        body: { mode: "url", url: url.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onExtracted({
        name: data.name || "",
        brand: data.brand || "",
        category: data.category || "tops",
        color: data.color || "",
        hex: data.hex || "",
        notes: data.notes || "",
      });
    } catch (e) {
      console.error(e);
      toast.error("Couldn't extract item details. Opening blank form.");
      onExtracted({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <p className="text-sm text-muted-foreground">
        Paste a product URL and AI will extract the item details.
      </p>

      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/product/..."
        type="url"
        autoFocus={false}
      />

      <button
        onClick={handleExtract}
        disabled={loading || !url.trim()}
        className="w-full py-3 rounded-xl bg-gold text-white font-medium text-sm transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Extracting…" : "Extract Item"}
      </button>
    </div>
  );
};

export default UrlExtractor;
