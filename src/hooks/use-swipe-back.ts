import { useEffect, useRef } from "react";

/**
 * Detects a right-swipe from the left edge of the screen and calls `onBack`.
 * touchstart must begin within `edgeThreshold` px of the left edge.
 * Horizontal travel must exceed `swipeThreshold` px with vertical drift < 0.4× horizontal.
 */
export function useSwipeBack(
  onBack: () => void,
  { edgeThreshold = 20, swipeThreshold = 50 } = {}
) {
  const start = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX <= edgeThreshold) {
        start.current = { x: touch.clientX, y: touch.clientY };
      } else {
        start.current = null;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!start.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.current.x;
      const dy = Math.abs(touch.clientY - start.current.y);
      if (dx > swipeThreshold && dy < dx * 0.4) {
        onBack();
      }
      start.current = null;
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onBack, edgeThreshold, swipeThreshold]);
}
