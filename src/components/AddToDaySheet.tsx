import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOutfits } from "@/hooks/use-outfits";

const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatRange(dates: Date[]): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(dates[0])} – ${fmt(dates[6])}`;
}

interface AddToDaySheetProps {
  open: boolean;
  outfit: { id: string; name: string } | null;
  onClose: () => void;
  onSaved?: () => void;
}

const AddToDaySheet = ({ open, outfit, onClose, onSaved }: AddToDaySheetProps) => {
  const { user } = useAuth();
  const [closing, setClosing] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startY: 0, currentY: 0, dragging: false });

  const { outfits } = useOutfits();
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // Load assignments
  useEffect(() => {
    if (!open) return;
    setSelectedDay(null);
    setWeekOffset(0);
    setClosing(false);
    (async () => {
      const { data } = await supabase.from("planner_assignments").select("day_key, outfit_id").eq("user_id", user!.id);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.day_key] = r.outfit_id; });
        setAssignments(map);
      }
    })();
  }, [open]);

  const dismiss = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 280);
  }, [onClose]);

  const onTouchStart = (e: React.TouchEvent) => {
    dragRef.current.startY = e.touches[0].clientY;
    dragRef.current.dragging = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current.dragging || !sheetRef.current) return;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    if (dy > 0) sheetRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!dragRef.current.dragging || !sheetRef.current) return;
    const dy = e.changedTouches[0].clientY - dragRef.current.startY;
    dragRef.current.dragging = false;
    if (dy > 100) dismiss();
    sheetRef.current.style.transform = "";
  };

  const existingOutfitName = useMemo(() => {
    if (!selectedDay || !assignments[selectedDay]) return null;
    const found = outfits.find((o) => o.id === assignments[selectedDay]);
    return found?.name ?? "another outfit";
  }, [selectedDay, assignments, outfits]);

  const selectedDayLabel = useMemo(() => {
    if (!selectedDay) return "";
    const date = weekDates.find((d) => d.toISOString().slice(0, 10) === selectedDay);
    if (!date) return "";
    const idx = weekDates.indexOf(date);
    return `${DAY_ABBR[idx]} ${date.getDate()}`;
  }, [selectedDay, weekDates]);

  const handleSave = async () => {
    if (!selectedDay || !outfit) return;
    setSaving(true);
    await supabase
      .from("planner_assignments")
      .upsert({ day_key: selectedDay, outfit_id: outfit.id, user_id: user!.id }, { onConflict: "day_key,user_id" });
    setSaving(false);
    onSaved?.();
    dismiss();
  };

  if (!open && !closing) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-280 ${closing ? "opacity-0" : "opacity-100"}`}
        style={{ animation: closing ? undefined : "fade-overlay 0.28s ease-out" }}
        onClick={dismiss}
      />
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border flex flex-col ${closing ? "animate-sheet-down" : "animate-sheet-up"}`}
        style={{ willChange: "transform" }}
      >
        {/* Drag handle */}
        <div
          className="flex-shrink-0 px-4 pt-3 pb-2"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Add to day
          </h3>
          <p className="text-sm text-muted-foreground truncate">{outfit?.name}</p>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-2 text-muted-foreground hover:text-foreground active:scale-[0.92] transition-all rounded-lg hover:bg-muted"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`text-sm font-medium tracking-wide transition-colors active:scale-[0.97] px-3 py-1 rounded-lg ${weekOffset === 0 ? "text-gold" : "text-foreground hover:text-gold"}`}
          >
            {formatRange(weekDates)}
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-2 text-muted-foreground hover:text-foreground active:scale-[0.92] transition-all rounded-lg hover:bg-muted"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Day row */}
        <div className="flex justify-between px-4 py-3 gap-1">
          {weekDates.map((date, i) => {
            const key = date.toISOString().slice(0, 10);
            const isSelected = selectedDay === key;
            const hasAssignment = !!assignments[key];
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all active:scale-[0.95] ${
                  isSelected
                    ? "bg-gold/15 border border-gold/30"
                    : "border border-transparent hover:bg-muted/60"
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? "text-gold" : "text-muted-foreground"}`}>
                  {DAY_ABBR[i]}
                </span>
                <span className={`text-base font-medium ${isSelected ? "text-foreground" : "text-foreground/70"}`} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {date.getDate()}
                </span>
                {hasAssignment && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? "bg-gold" : "bg-muted-foreground/40"}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Replace warning */}
        <div className="px-4 min-h-[28px]">
          {selectedDay && existingOutfitName && (
            <p className="text-xs text-gold/80">
              Replaces <span className="font-medium">{existingOutfitName}</span> on {selectedDayLabel}
            </p>
          )}
        </div>

        {/* Save button */}
        <div className="px-4 pt-2 pb-6" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
          <button
            onClick={handleSave}
            disabled={!selectedDay || saving}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-gold text-background"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddToDaySheet;
