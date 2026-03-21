import { outfitCombinations, wardrobeItems } from "@/data/darkautumn";

const OutfitCombinations = () => {
  if (outfitCombinations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-reveal-up">
        <h2 className="text-3xl font-semibold text-foreground mb-3">Outfit Combos</h2>
        <p className="text-secondary max-w-xs">
          Paste your outfit data into <code className="text-gold text-sm">src/data/darkautumn.ts</code> to see combinations here.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 space-y-6">
      <div className="pt-2 animate-reveal-up">
        <h2 className="text-3xl font-semibold text-foreground text-balance">Outfit Combinations</h2>
        <p className="text-secondary text-sm mt-1">{outfitCombinations.length} curated looks</p>
      </div>

      {outfitCombinations.map((outfit, i) => {
        const pieces = outfit.items
          .map((id) => wardrobeItems.find((w) => w.id === id))
          .filter(Boolean);

        return (
          <div
            key={outfit.id}
            className="bg-card rounded-xl p-4 border border-border animate-reveal-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-foreground font-medium text-base">{outfit.name}</h3>
                <span className="text-xs text-gold capitalize">{outfit.occasion}</span>
              </div>
            </div>

            {outfit.description && (
              <p className="text-muted-foreground text-sm mb-3">{outfit.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {pieces.map((item) => (
                <div
                  key={item!.id}
                  className="flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1"
                >
                  {item!.colorHex && (
                    <span
                      className="w-3 h-3 rounded-full border border-border"
                      style={{ backgroundColor: item!.colorHex }}
                    />
                  )}
                  <span className="text-xs text-foreground">{item!.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OutfitCombinations;
