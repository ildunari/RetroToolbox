export interface CanvasSize {
  width: number;
  height: number;
}

export const CANVAS_CONFIG: Record<string, CanvasSize> = {
  snake: { width: 400, height: 400 },
  pong: { width: 800, height: 400 },
  breakout: { width: 800, height: 600 },
  tetris: { width: 10 * 25 + 200, height: 20 * 25 },
  spaceInvaders: { width: 800, height: 600 },
  pacman: { width: 28 * 20, height: 31 * 20 },
  menu: { width: 800, height: 600 }
};
