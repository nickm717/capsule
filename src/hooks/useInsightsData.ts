import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { OutfitPiece } from "@/data/darkautumn";

export interface InsightsData {
  totalItems: number;
  totalOutfits: number;
  outfitsThisMonth: number;
  wornRate: number;
  topItems: { name: string; color: string; count: number; category: string }[];
  ghostItems: { name: string; color: string }[];
  categoryBreakdown: { category: string; count: number }[];
  outfitFrequency: { week: string; count: number }[];
  plannerCoverage: { weekLabel: string; days: boolean[] }[];
  mostRepeatedOutfits: { name: string; count: number }[];
  cpwItems: { name: string; price: number; wearCount: number; cpw: number }[];
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(d: Date): string {
  return `${d.toLocaleDateString("en-US", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`;
}

export function useInsightsData(): { data: InsightsData | null; loading: boolean } {
  const { user } = useAuth();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      setLoading(true);
      const uid = user!.id;

      // ── Three parallel base fetches ───────────────────────────
      const [itemsRes, outfitsRes, assignmentsRes] = await Promise.all([
        supabase
          .from("custom_items")
          .select("id, name, color, hex, category, price, created_at")
          .eq("user_id", uid),
        supabase
          .from("custom_outfits")
          .select("id, name, pieces")
          .eq("user_id", uid),
        supabase
          .from("planner_assignments")
          .select("day_key, outfit_id")
          .eq("user_id", uid),
      ]);

      if (cancelled) return;

      const items = itemsRes.data ?? [];
      const outfits = outfitsRes.data ?? [];
      const assignments = assignmentsRes.data ?? [];

      // ── Scalar counts ─────────────────────────────────────────
      const totalItems = items.length;
      const totalOutfits = outfits.length;
      const yearMonth = new Date().toISOString().slice(0, 7);
      const outfitsThisMonth = assignments.filter(a => a.day_key.startsWith(yearMonth)).length;

      // ── topItems: outfit-appearance count per item ────────────
      // Computed from already-fetched outfits — no extra queries needed.
      const itemOutfitCountMap = new Map<string, number>();
      outfits.forEach(o => {
        (o.pieces as OutfitPiece[]).forEach(p => {
          if (p.item_id) {
            itemOutfitCountMap.set(p.item_id, (itemOutfitCountMap.get(p.item_id) ?? 0) + 1);
          }
        });
      });
      const topItems = items
        .map(i => ({
          name: i.name,
          color: i.hex,
          count: itemOutfitCountMap.get(i.id) ?? 0,
          category: i.category || "Uncategorized",
        }))
        .sort((a, b) => b.count - a.count);

      // ── ghostItems — items absent from every outfit ───────────
      const usedItemIds = new Set<string>();
      outfits.forEach(o => {
        (o.pieces as OutfitPiece[]).forEach(p => { if (p.item_id) usedItemIds.add(p.item_id); });
      });
      const ghostItems = items
        .filter(i => !usedItemIds.has(i.id))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(i => ({ name: i.name, color: i.hex }));

      // ── wornRate ──────────────────────────────────────────────
      const assignedOutfitIds = new Set(assignments.map(a => a.outfit_id));
      const wornItemIds = new Set<string>();
      outfits
        .filter(o => assignedOutfitIds.has(o.id))
        .forEach(o => {
          (o.pieces as OutfitPiece[]).forEach(p => { if (p.item_id) wornItemIds.add(p.item_id); });
        });
      const wornRate = totalItems > 0 ? Math.round((wornItemIds.size / totalItems) * 100) : 0;

      // ── categoryBreakdown ─────────────────────────────────────
      const catMap = new Map<string, number>();
      items.forEach(i => {
        const cat = i.category || "Uncategorized";
        catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
      });
      const categoryBreakdown = Array.from(catMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // ── Week helpers: past 8 weeks ending with current week ───
      const currentWeekStart = getMonday(new Date());
      const weeks = Array.from({ length: 8 }, (_, i) => {
        const ws = new Date(currentWeekStart);
        ws.setDate(ws.getDate() - (7 - i) * 7);
        return ws;
      });

      // ── outfitFrequency ───────────────────────────────────────
      const outfitFrequency = weeks.map(weekStart => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const s = toIsoDate(weekStart);
        const e = toIsoDate(weekEnd);
        return {
          week: formatWeekLabel(weekStart),
          count: assignments.filter(a => a.day_key >= s && a.day_key <= e).length,
        };
      });

      // ── plannerCoverage ───────────────────────────────────────
      const dayKeySet = new Set(assignments.map(a => a.day_key));
      const plannerCoverage = weeks.map(weekStart => ({
        weekLabel: formatWeekLabel(weekStart),
        days: Array.from({ length: 7 }, (_, di) => {
          const d = new Date(weekStart);
          d.setDate(d.getDate() + di);
          return dayKeySet.has(toIsoDate(d));
        }),
      }));

      // ── mostRepeatedOutfits ───────────────────────────────────
      const outfitCountMap = new Map<string, number>();
      assignments.forEach(a => {
        outfitCountMap.set(a.outfit_id, (outfitCountMap.get(a.outfit_id) ?? 0) + 1);
      });
      const mostRepeatedOutfits = Array.from(outfitCountMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id, count]) => ({
          name: outfits.find(o => o.id === id)?.name ?? "Unknown",
          count,
        }));

      // ── cpwItems ──────────────────────────────────────────────
      const outfitAssignCounts = new Map<string, number>();
      assignments.forEach(a => {
        outfitAssignCounts.set(a.outfit_id, (outfitAssignCounts.get(a.outfit_id) ?? 0) + 1);
      });
      const cpwItems = items
        .filter(i => i.price != null && i.price > 0)
        .map(i => {
          const wearCount = outfits
            .filter(o => (o.pieces as OutfitPiece[]).some(p => p.item_id === i.id))
            .reduce((sum, o) => sum + (outfitAssignCounts.get(o.id) ?? 0), 0);
          return { name: i.name, price: i.price!, wearCount, cpw: Math.round(i.price! / wearCount) };
        })
        .filter(i => i.wearCount > 0)
        .sort((a, b) => a.cpw - b.cpw)
        .slice(0, 5);

      if (!cancelled) {
        setData({
          totalItems, totalOutfits, outfitsThisMonth, wornRate,
          topItems, ghostItems, categoryBreakdown, outfitFrequency,
          plannerCoverage, mostRepeatedOutfits, cpwItems,
        });
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  return { data, loading };
}
