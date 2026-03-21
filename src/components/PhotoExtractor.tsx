import { useState, useRef } from "react";
import { ArrowLeft, Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ItemFormData } from "./ItemForm";

interface PhotoExtractorProps {
  onExtracted: (data: Partial<ItemFormData>) => void;
  onBack: () => void;
}

const PhotoExtractor = ({ onExtracted, onBack }: PhotoExtractorProps) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("extract-item", {
          body: { mode: "photo", imageBase64: base64 },
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
        toast.error("Couldn't identify item. Opening blank form.");
        onExtracted({});
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
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
        Take a photo or choose from your library. AI will identify the item.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {preview ? (
        <div className="relative rounded-xl overflow-hidden">
          <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
          {loading && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Loader2 size={18} className="animate-spin" />
                Analyzing…
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-12 rounded-xl border-2 border-dashed border-border hover:border-gold/50 transition-colors flex flex-col items-center gap-2"
        >
          <Camera size={28} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tap to take a photo or choose</span>
        </button>
      )}
    </div>
  );
};

export default PhotoExtractor;
