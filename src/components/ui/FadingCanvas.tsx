import { useEffect, useState, forwardRef, ReactNode, HTMLAttributes } from 'react';

interface FadingCanvasProps extends HTMLAttributes<HTMLCanvasElement> {
  active?: boolean;
  slide?: boolean;
  children?: ReactNode;
}

export const FadingCanvas = forwardRef<HTMLCanvasElement, FadingCanvasProps>(
  ({ active = true, slide = false, children, ...props }, ref) => {
    const [visible, setVisible] = useState<boolean>(active);

    useEffect(() => {
      setVisible(active);
    }, [active]);

    const classes: string = slide
      ? `transition-all duration-700 transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`
      : `transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`;

    // If children are provided, wrap them. Otherwise, render a canvas with the ref
    if (children) {
      return <div className={classes}>{children}</div>;
    }

    return (
      <canvas
        ref={ref}
        className={`${classes} border border-gray-600 rounded`}
        {...props}
      />
    );
  }
);

// Add display name for debugging purposes
FadingCanvas.displayName = 'FadingCanvas';