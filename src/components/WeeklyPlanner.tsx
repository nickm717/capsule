import { weeklyPlan, outfitCombinations, wardrobeItems } from "@/data/darkautumn";

const dayAbbr: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const WeeklyPlanner = () => {
  if (weeklyPlan.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-reveal-up">
        <h2 className="text-3xl font-semibold text-foreground mb-3">Weekly Planner</h2>
        <p className="text-secondary max-w-xs">
          Paste your weekly plan data into <code className="text-gold text-sm">src/data/darkautumn.ts</code> to plan your week.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 space-y-4">
      <div className="pt-2 animate-reveal-up">
        <h2 className="text-3xl font-semibold text-foreground text-balance">Weekly Planner</h2>
        <p className="text-secondary text-sm mt-1">Your week at a glance</p>
      </div>

      {weeklyPlan.map((day, i) => {
        const outfit = outfitCombinations.find((o) => o.id === day.outfitId);
        const pieces = outfit
          ? outfit.items.map((id) => wardrobeItems.find((w) => w.id === id)).filter(Boolean)
          : [];

        return (
          <div
            key={day.day}
            className="bg-card rounded-xl p-4 border border-border animate-reveal-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-gold font-semibold text-sm uppercase tracking-wider w-10">
                {dayAbbr[day.day.toLowerCase()] || day.day.slice(0, 3)}
              </span>
              <h3 className="text-foreground font-medium text-base">
                {outfit?.name || "No outfit planned"}
              </h3>
            </div>

            {day.notes && (
              <p className="text-muted-foreground text-sm ml-[52px] mb-2">{day.notes}</p>
            )}

            {pieces.length > 0 && (
              <div className="flex flex-wrap gap-1.5 ml-[52px]">
                {pieces.map((item) => (
                  <div
                    key={item!.id}
                    className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5"
                  >
                    {item!.colorHex && (
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item!.colorHex }}
                      />
                    )}
                    <span className="text-[11px] text-foreground">{item!.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyPlanner;
