import { GameState, GridPosition, Direction } from './types';

const CELL_SIZE = 20;

function pixelToGrid(pos: { x: number; y: number }, maze: number[][]): GridPosition {
  return { 
    row: Math.max(0, Math.min(maze.length - 1, Math.floor(pos.y / CELL_SIZE))), 
    col: Math.max(0, Math.min(maze[0].length - 1, Math.floor(pos.x / CELL_SIZE)))
  };
}

function canMove(maze: number[][], pos: GridPosition, dir: Direction) {
  const { row, col } = pos;
  switch (dir) {
    case 'up':
      return row > 0 && maze[row - 1][col] !== 0;
    case 'down':
      return row < maze.length - 1 && maze[row + 1][col] !== 0;
    case 'left':
      return col > 0 && maze[row][col - 1] !== 0;
    case 'right':
      return col < maze[0].length - 1 && maze[row][col + 1] !== 0;
    default:
      return false;
  }
}

function getNext(pos: GridPosition, dir: Direction): GridPosition {
  switch (dir) {
    case 'up':
      return { row: pos.row - 1, col: pos.col };
    case 'down':
      return { row: pos.row + 1, col: pos.col };
    case 'left':
      return { row: pos.row, col: pos.col - 1 };
    case 'right':
      return { row: pos.row, col: pos.col + 1 };
    default:
      return pos;
  }
}

function getDistance(a: GridPosition, b: GridPosition) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

export function findPath(maze: number[][], start: GridPosition, end: GridPosition): GridPosition[] {
  const queue: GridPosition[] = [start];
  const cameFrom = new Map<string, GridPosition>();
  const key = (p: GridPosition) => `${p.row}:${p.col}`;
  const visited = new Set<string>([key(start)]);

  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.row === end.row && cur.col === end.col) {
      const path: GridPosition[] = [cur];
      let k = key(cur);
      while (cameFrom.has(k)) {
        const prev = cameFrom.get(k)!;
        path.unshift(prev);
        k = key(prev);
      }
      return path;
    }
    const dirs: Direction[] = ['up', 'down', 'left', 'right'];
    for (const d of dirs) {
      if (!canMove(maze, cur, d)) continue;
      const next = getNext(cur, d);
      const nk = key(next);
      if (!visited.has(nk)) {
        visited.add(nk);
        cameFrom.set(nk, cur);
        queue.push(next);
      }
    }
  }
  return [];
}

function updateGhostAI(game: GameState, ghost: GameState['ghosts'][number]) {
  const pac = game.pacman;
  if (ghost.mode === 'scatter') {
    ghost.targetGridPos = ghost.scatterTarget;
  } else if (ghost.mode === 'chase') {
    switch (ghost.aiType) {
      case 'blinky':
        ghost.targetGridPos = pac.gridPos;
        break;
      case 'pinky':
        let tr = pac.gridPos.row;
        let tc = pac.gridPos.col;
        switch (pac.direction) {
          case 'up':
            tr -= 4;
            break;
          case 'down':
            tr += 4;
            break;
          case 'left':
            tc -= 4;
            break;
          case 'right':
            tc += 4;
            break;
        }
        ghost.targetGridPos = { row: Math.max(0, Math.min(game.maze.length - 1, tr)), col: Math.max(0, Math.min(game.maze[0].length - 1, tc)) };
        break;
      case 'inky': {
        const blinky = game.ghosts.find(g => g.aiType === 'blinky');
        let pr = pac.gridPos.row;
        let pc = pac.gridPos.col;
        switch (pac.direction) {
          case 'up':
            pr -= 2; break;
          case 'down':
            pr += 2; break;
          case 'left':
            pc -= 2; break;
          case 'right':
            pc += 2; break;
        }
        if (blinky) {
          const vr = pr - blinky.gridPos.row;
          const vc = pc - blinky.gridPos.col;
          ghost.targetGridPos = {
            row: Math.max(0, Math.min(game.maze.length - 1, pr + vr)),
            col: Math.max(0, Math.min(game.maze[0].length - 1, pc + vc)),
          };
        } else {
          ghost.targetGridPos = pac.gridPos;
        }
        break; }
      case 'clyde':
        const dist = getDistance(ghost.gridPos, pac.gridPos);
        ghost.targetGridPos = dist > 8 ? pac.gridPos : ghost.scatterTarget;
        break;
    }
  } else if (ghost.mode === 'eaten') {
    ghost.targetGridPos = { row: 14, col: 14 };
  } else {
    ghost.targetGridPos = ghost.gridPos;
  }
}

export function updateGhosts(game: GameState, deltaTime: number) {
  for (const ghost of game.ghosts) {
    if (game.freezeTimer > 0 && ghost.mode !== 'eaten') continue;

    updateGhostAI(game, ghost);

    const path = findPath(game.maze, ghost.gridPos, ghost.targetGridPos);
    if (path.length > 1) {
      const next = path[1];
      if (next.row < ghost.gridPos.row) ghost.direction = 'up';
      else if (next.row > ghost.gridPos.row) ghost.direction = 'down';
      else if (next.col < ghost.gridPos.col) ghost.direction = 'left';
      else if (next.col > ghost.gridPos.col) ghost.direction = 'right';
    }

    const speed = ghost.speed * (ghost.mode === 'frightened' ? 0.5 : 1);
    const moveDistance = speed * CELL_SIZE * deltaTime;
    switch (ghost.direction) {
      case 'up':
        ghost.position.y -= moveDistance; break;
      case 'down':
        ghost.position.y += moveDistance; break;
      case 'left':
        ghost.position.x -= moveDistance; break;
      case 'right':
        ghost.position.x += moveDistance; break;
    }

    if (ghost.position.x < -CELL_SIZE / 2) {
      ghost.position.x = game.maze[0].length * CELL_SIZE - CELL_SIZE / 2;
    } else if (ghost.position.x > game.maze[0].length * CELL_SIZE + CELL_SIZE / 2) {
      ghost.position.x = CELL_SIZE / 2;
    }

    const newPos = pixelToGrid(ghost.position, game.maze);
    ghost.gridPos = newPos;
  }
}

