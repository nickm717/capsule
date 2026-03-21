import { wardrobeCategories, swatches } from "@/data/darkautumn";

const WardrobeGuide = () => {
  const totalPieces = wardrobeCategories.reduce((sum, cat) => sum + cat.items.length, 0);
  const ownedPieces = wardrobeCategories.reduce((sum, cat) => sum + cat.items.filter(i => i.owned).length, 0);

  return (
    <div className="px-4 pb-6 space-y-8">
      {/* Palette swatches */}
      <div className="pt-2 animate-reveal-up">
        <h2 className="text-3xl font-semibold text-foreground text-balance">Wardrobe Guide</h2>
        <p className="text-secondary text-sm mt-1">{ownedPieces} owned of {totalPieces} pieces</p>
        <div className="flex gap-1.5 mt-3">
          {swatches.map((s) => (
            <div
              key={s.name}
              className="w-7 h-7 rounded-full border border-border/50"
              style={{ backgroundColor: s.hex }}
              title={s.name}
            />
          ))}
        </div>
      </div>

      {wardrobeCategories.map((cat, ci) => (
        <section key={cat.id} className="animate-reveal-up" style={{ animationDelay: `${ci * 80}ms` }}>
          <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="text-base">{cat.icon}</span>
            {cat.label}
            <span className="text-xs text-muted-foreground ml-auto">{cat.items.length}</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {cat.items.map((item) => (
              <div
                key={item.id}
                className={`bg-card rounded-lg p-3.5 border transition-colors duration-200 active:scale-[0.97] ${
                  item.gap
                    ? "border-dashed border-gold/40"
                    : "border-border hover:border-gold/30"
                }`}
              >
                <div
                  className="w-full h-8 rounded-md mb-2.5"
                  style={{ backgroundColor: item.hex }}
                />
                <p className="text-foreground text-sm font-medium leading-tight">{item.name}</p>
                {item.brand && (
                  <p className="text-muted-foreground text-[11px] mt-0.5">{item.brand}</p>
                )}
                <p className="text-muted-foreground text-xs mt-0.5">{item.color}</p>
                {item.gap && (
                  <span className="inline-block mt-1.5 text-[10px] font-medium uppercase tracking-wider text-gold">
                    {item.priority ? "★ Priority Gap" : "Gap"}
                  </span>
                )}
                {!item.owned && !item.gap && (
                  <span className="inline-block mt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Wishlist
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default WardrobeGuide;
