import React, { useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

/**
 * Lightweight pull-to-refresh wrapper using native touch events.
 * Wraps scrollable content; detects pull-down when scroll parent is at top.
 */
export default function PullToRefresh({ onRefresh, children, className = "" }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const scrollParent = useRef(null);

  const THRESHOLD = 70;
  const MAX_PULL = 100;

  const getScrollParent = useCallback((node) => {
    let parent = node?.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (/(auto|scroll)/.test(style.overflowY)) return parent;
      parent = parent.parentElement;
    }
    return null;
  }, []);

  const onTouchStart = (e) => {
    const sp = getScrollParent(e.currentTarget);
    scrollParent.current = sp;
    if (sp && sp.scrollTop <= 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
    } else {
      startY.current = null;
    }
  };

  const onTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && scrollParent.current && scrollParent.current.scrollTop <= 0) {
      e.preventDefault();
      setPullDistance(Math.min(delta * 0.45, MAX_PULL));
    }
  };

  const onTouchEnd = async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } catch (err) {
        console.error(err);
      } finally {
        setRefreshing(false);
      }
    }
    setPullDistance(0);
    startY.current = null;
  };

  const showIndicator = pullDistance > 0 || refreshing;
  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div className={`relative ${className}`}>
      {showIndicator && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center text-hive-gold pointer-events-none"
          style={{ top: 0, height: `${pullDistance}px`, opacity: Math.max(progress, refreshing ? 1 : 0) }}
        >
          <Loader2 className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
        </div>
      )}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 && !refreshing ? "transform 0.2s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}