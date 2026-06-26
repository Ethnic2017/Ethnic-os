import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (el && el.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      // Prevent native scroll when pulling
      if (delta > 10) e.preventDefault();
      setPullY(Math.min(delta * 0.45, THRESHOLD + 20));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    startY.current = null;
    setPullY(0);
  }, [pullY, refreshing, onRefresh]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const shouldTrigger = pullY >= THRESHOLD;

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: pullY > 0 ? 'none' : 'auto' }}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden z-20 transition-all pointer-events-none"
        style={{ height: pullY > 0 ? `${pullY}px` : refreshing ? `${THRESHOLD}px` : '0px' }}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            shouldTrigger || refreshing ? 'bg-[#C9A96E]/20' : 'bg-white/5'
          }`}
          style={{ transform: `rotate(${progress * 180}deg)` }}
        >
          <RefreshCw
            className={`w-4 h-4 transition-colors ${
              shouldTrigger || refreshing ? 'text-[#C9A96E]' : 'text-[#8A8A8A]'
            } ${refreshing ? 'animate-spin' : ''}`}
          />
        </div>
      </div>

      {/* Content shifted down while pulling */}
      <div style={{ transform: `translateY(${pullY > 0 ? pullY : refreshing ? THRESHOLD : 0}px)`, transition: pullY > 0 ? 'none' : 'transform 0.3s ease' }}>
        {children}
      </div>
    </div>
  );
}