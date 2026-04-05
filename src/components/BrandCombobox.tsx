import { useState, useRef } from "react";

interface BrandComboboxProps {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
}

interface DropdownPos {
  top: number;
  right: number;
  width: number;
}

const BrandCombobox = ({ value, onChange, suggestions }: BrandComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = suggestions
    .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 8);

  const handleFocus = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
        width: rect.width,
      });
    }
    setOpen(true);
  };

  const handleBlur = () => {
    // Delay so onMouseDown on a suggestion fires first
    setTimeout(() => setOpen(false), 150);
  };

  const select = (brand: string) => {
    onChange(brand);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="flex-1 min-w-0">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Optional"
        className="w-full bg-transparent text-[17px] text-foreground text-right outline-none placeholder:text-muted-foreground"
      />
      {open && filtered.length > 0 && pos && (
        <div
          style={{
            position: "fixed",
            top: pos.top,
            right: pos.right,
            width: pos.width,
            zIndex: 100,
          }}
          className="bg-card rounded-2xl border border-border/40 shadow-xl py-1 overflow-hidden"
        >
          {filtered.map((brand) => (
            <button
              key={brand}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(brand)}
              className="w-full flex items-center justify-end px-4 text-[17px] text-foreground active:bg-muted/60 transition-colors"
              style={{ minHeight: 44 }}
            >
              {brand}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrandCombobox;
