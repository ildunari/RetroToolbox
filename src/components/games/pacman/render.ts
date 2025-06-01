import { GameState } from './types';

const CELL_SIZE = 20;

function drawMaze(ctx: CanvasRenderingContext2D, maze: number[][]) {
  ctx.strokeStyle = '#0044ff';
  ctx.lineWidth = 2;
  for (let r = 0; r < maze.length; r++) {
    for (let c = 0; c < maze[r].length; c++) {
      if (maze[r][c] === 0) {
        const x = c * CELL_SIZE;
        const y = r * CELL_SIZE;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}

function drawPellets(ctx: CanvasRenderingContext2D, pellets: Set<string>) {
  ctx.fillStyle = '#ffffff';
  pellets.forEach(k => {
    const num = parseInt(k);
    const r = Math.floor(num / 1000);
    const c = num % 1000;
    ctx.beginPath();
    ctx.arc(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPowerPellets(ctx: CanvasRenderingContext2D, pellets: Set<string>) {
  ctx.fillStyle = '#ffff00';
  pellets.forEach(k => {
    const num = parseInt(k);
    const r = Math.floor(num / 1000);
    const c = num % 1000;
    ctx.beginPath();
    ctx.arc(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 6, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function drawFrame(ctx: CanvasRenderingContext2D, game: GameState) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawMaze(ctx, game.maze);
  drawPellets(ctx, game.pellets);
  drawPowerPellets(ctx, game.powerPellets);

  for (const ghost of game.ghosts) {
    ctx.fillStyle = ghost.color;
    ctx.beginPath();
    ctx.arc(ghost.position.x, ghost.position.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(game.pacman.position.x, game.pacman.position.y, 10, 0, Math.PI * 2);
  ctx.fill();
}

