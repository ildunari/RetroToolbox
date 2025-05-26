import { useEffect, useRef, useCallback } from 'react';

export interface SwipeOptions {
  minDistance?: number;
  maxTime?: number;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  preventScroll?: boolean;
}

export function useSwipe(elementRef: React.RefObject<HTMLElement>, options: SwipeOptions = {}) {
  const {
    minDistance = 30,
    maxTime = 300,
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    onTap,
    preventScroll = true
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventScroll) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchMoveRef.current = null;
  }, [preventScroll]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    if (preventScroll) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    touchMoveRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  }, [preventScroll]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const endTime = Date.now();
    const timeDiff = endTime - touchStartRef.current.time;
    
    // Use touchMove position if available, otherwise use touchEnd position
    const endTouch = touchMoveRef.current || (e.changedTouches[0] ? {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    } : null);
    
    if (!endTouch) return;
    
    const deltaX = endTouch.x - touchStartRef.current.x;
    const deltaY = endTouch.y - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Check if it's a tap
    if (distance < minDistance && timeDiff < maxTime && onTap) {
      onTap();
      touchStartRef.current = null;
      return;
    }
    
    // Check if it's a valid swipe
    if (distance >= minDistance && timeDiff <= maxTime) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // Determine swipe direction
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }
    
    touchStartRef.current = null;
    touchMoveRef.current = null;
  }, [minDistance, maxTime, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onTap]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll]);

  return {
    reset: useCallback(() => {
      touchStartRef.current = null;
      touchMoveRef.current = null;
    }, [])
  };
}