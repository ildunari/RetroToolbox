// Gradient caching system for performance optimization
const gradientCache = new Map<string, CanvasGradient>();

export const getCachedGradient = (
  ctx: CanvasRenderingContext2D, 
  key: string, 
  createFn: (ctx: CanvasRenderingContext2D) => CanvasGradient
): CanvasGradient => {
  if (!gradientCache.has(key)) {
    gradientCache.set(key, createFn(ctx));
  }
  return gradientCache.get(key)!;
};

export const clearGradientCache = (): void => {
  gradientCache.clear();
};

// Optimized drawing functions
export const drawCircle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  fill: boolean = true
): void => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.stroke();
  }
};

export const drawRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  fill: boolean = true
): void => {
  if (fill) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  } else {
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, width, height);
  }
};