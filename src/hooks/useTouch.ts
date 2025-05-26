import { useEffect, useRef, useState, useCallback } from 'react';

export interface TouchOptions {
  preventScroll?: boolean;
  normalizeCoordinates?: boolean;
  element?: HTMLElement | null;
}

export interface TouchState {
  isActive: boolean;
  touchCount: number;
  touches: Array<{
    id: number;
    x: number;
    y: number;
    normalizedX?: number;
    normalizedY?: number;
  }>;
}

export function useTouch(options: TouchOptions = {}) {
  const {
    preventScroll = true,
    normalizeCoordinates = true,
    element = null
  } = options;

  const [touchState, setTouchState] = useState<TouchState>({
    isActive: false,
    touchCount: 0,
    touches: []
  });

  const elementRef = useRef<HTMLElement | null>(element);

  const normalizeTouchCoordinates = useCallback((touch: Touch, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const normalizedX = (touch.clientX - rect.left) / rect.width;
    const normalizedY = (touch.clientY - rect.top) / rect.height;
    
    return {
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      normalizedX: Math.max(0, Math.min(1, normalizedX)),
      normalizedY: Math.max(0, Math.min(1, normalizedY))
    };
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventScroll) {
      e.preventDefault();
    }

    const targetElement = elementRef.current || document.body;
    const touches = Array.from(e.touches).map(touch => 
      normalizeCoordinates 
        ? normalizeTouchCoordinates(touch, targetElement)
        : {
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY
          }
    );

    setTouchState({
      isActive: true,
      touchCount: e.touches.length,
      touches
    });
  }, [preventScroll, normalizeCoordinates, normalizeTouchCoordinates]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventScroll) {
      e.preventDefault();
    }

    const targetElement = elementRef.current || document.body;
    const touches = Array.from(e.touches).map(touch => 
      normalizeCoordinates 
        ? normalizeTouchCoordinates(touch, targetElement)
        : {
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY
          }
    );

    setTouchState({
      isActive: true,
      touchCount: e.touches.length,
      touches
    });
  }, [preventScroll, normalizeCoordinates, normalizeTouchCoordinates]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const targetElement = elementRef.current || document.body;
    const touches = Array.from(e.touches).map(touch => 
      normalizeCoordinates 
        ? normalizeTouchCoordinates(touch, targetElement)
        : {
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY
          }
    );

    setTouchState({
      isActive: e.touches.length > 0,
      touchCount: e.touches.length,
      touches
    });
  }, [normalizeCoordinates, normalizeTouchCoordinates]);

  useEffect(() => {
    const targetElement = elementRef.current || document.body;

    targetElement.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    targetElement.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    targetElement.addEventListener('touchend', handleTouchEnd);
    targetElement.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      targetElement.removeEventListener('touchstart', handleTouchStart);
      targetElement.removeEventListener('touchmove', handleTouchMove);
      targetElement.removeEventListener('touchend', handleTouchEnd);
      targetElement.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll]);

  return touchState;
}