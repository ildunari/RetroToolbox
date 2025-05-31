import React, { useRef, useEffect, useState, useCallback } from 'react';

interface ResponsiveCanvasProps {
  width: number;
  height: number;
  className?: string;
  onResize?: (width: number, height: number) => void;
  maintainAspectRatio?: boolean;
  maxScale?: number;
}

export const ResponsiveCanvas: React.FC<ResponsiveCanvasProps> = ({
  width,
  height,
  className = '',
  onResize,
  maintainAspectRatio = true,
  maxScale = 2.5,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const [_scale /* unused */, setScale] = useState(1);

  const calculateCanvasSize = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Account for mobile browser chrome
    const visualViewport = window.visualViewport;
    const viewportWidth = visualViewport?.width || window.innerWidth;
    const viewportHeight = visualViewport?.height || window.innerHeight;
    
    // Use the smaller of container size or viewport size
    const availableWidth = Math.min(containerRect.width, viewportWidth);
    const availableHeight = Math.min(containerRect.height, viewportHeight);

    if (maintainAspectRatio) {
      const aspectRatio = width / height;
      const containerAspectRatio = availableWidth / availableHeight;

      let newWidth, newHeight, newScale;

      if (containerAspectRatio > aspectRatio) {
        // Container is wider than canvas aspect ratio
        newHeight = availableHeight;
        newWidth = newHeight * aspectRatio;
        newScale = newHeight / height;
      } else {
        // Container is taller than canvas aspect ratio
        newWidth = availableWidth;
        newHeight = newWidth / aspectRatio;
        newScale = newWidth / width;
      }

      // Limit scale to prevent over-scaling
      newScale = Math.min(newScale, maxScale);
      newWidth = width * newScale;
      newHeight = height * newScale;

      setCanvasSize({ width: newWidth, height: newHeight });
      setScale(newScale);
      onResize?.(newWidth, newHeight);
    } else {
      setCanvasSize({ width: availableWidth, height: availableHeight });
      setScale(Math.min(availableWidth / width, availableHeight / height));
      onResize?.(availableWidth, availableHeight);
    }
  }, [width, height, maintainAspectRatio, maxScale, onResize]);

  useEffect(() => {
    calculateCanvasSize();

    const handleResize = () => {
      calculateCanvasSize();
    };

    const handleOrientationChange = () => {
      // Delay calculation to ensure browser has updated layout
      setTimeout(calculateCanvasSize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.visualViewport?.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [calculateCanvasSize]);

  return (
    <div 
      ref={containerRef}
      className={`responsive-canvas-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          position: 'relative',
          transform: 'translate3d(0, 0, 0)' // Hardware acceleration
        }}
      >
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && child.type === 'canvas') {
            return React.cloneElement(child as React.ReactElement<any>, {
              width: width,
              height: height,
              style: {
                ...child.props.style,
                width: canvasSize.width,
                height: canvasSize.height,
                imageRendering: 'pixelated'
              }
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};