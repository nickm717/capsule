import { wardrobeItems } from "@/data/darkautumn";

const categoryColors: Record<string, string> = {
  top: "bg-gold",
  bottom: "bg-olive",
  outerwear: "bg-rust",
  shoes: "bg-teal",
  accessory: "bg-primary",
};

const WardrobeGuide = () => {
  const grouped = wardrobeItems.reduce<Record<string, typeof wardrobeItems>>((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-reveal-up">
        <h2 className="text-3xl font-semibold text-foreground mb-3">Your Wardrobe</h2>
        <p className="text-secondary max-w-xs">
          Paste your wardrobe data into <code className="text-gold text-sm">src/data/darkautumn.ts</code> to see items here.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 space-y-8">
      <div className="pt-2 animate-reveal-up">
        <h2 className="text-3xl font-semibold text-foreground text-balance">Wardrobe Guide</h2>
        <p className="text-secondary text-sm mt-1">{wardrobeItems.length} pieces in your palette</p>
      </div>

      {categories.map((cat, ci) => (
        <section key={cat} className="animate-reveal-up" style={{ animationDelay: `${ci * 80}ms` }}>
          <h3 className="text-lg font-medium text-foreground capitalize mb-3 flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${categoryColors[cat.toLowerCase()] || "bg-muted-foreground"}`} />
            {cat}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {grouped[cat].map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-lg p-3.5 border border-border hover:border-gold/40 transition-colors duration-200 active:scale-[0.97]"
              >
                {item.colorHex && (
                  <div
                    className="w-full h-10 rounded-md mb-2.5"
                    style={{ backgroundColor: item.colorHex }}
                  />
                )}
                <p className="text-foreground text-sm font-medium leading-tight">{item.name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{item.color}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default WardrobeGuide;
