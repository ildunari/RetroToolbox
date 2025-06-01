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

  // Add iteration limit to prevent infinite loops when maze sections are isolated
  const MAX_ITERATIONS = maze.length * maze[0].length * 2;
  let iterations = 0;

  while (queue.length && iterations++ < MAX_ITERATIONS) {
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
  let newTargetGridPos = ghost.targetGridPos;
  
  if (ghost.mode === 'scatter') {
    newTargetGridPos = ghost.scatterTarget;
  } else if (ghost.mode === 'chase') {
    switch (ghost.aiType) {
      case 'blinky':
        newTargetGridPos = pac.gridPos;
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
        newTargetGridPos = { row: Math.max(0, Math.min(game.maze.length - 1, tr)), col: Math.max(0, Math.min(game.maze[0].length - 1, tc)) };
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
        // Apply bounds checking to intermediate position before vector calculation
        pr = Math.max(0, Math.min(game.maze.length - 1, pr));
        pc = Math.max(0, Math.min(game.maze[0].length - 1, pc));
        
        if (blinky) {
          const vr = pr - blinky.gridPos.row;
          const vc = pc - blinky.gridPos.col;
          newTargetGridPos = {
            row: Math.max(0, Math.min(game.maze.length - 1, pr + vr)),
            col: Math.max(0, Math.min(game.maze[0].length - 1, pc + vc)),
          };
        } else {
          newTargetGridPos = pac.gridPos;
        }
        break; }
      case 'clyde':
        const dist = getDistance(ghost.gridPos, pac.gridPos);
        newTargetGridPos = dist > 8 ? pac.gridPos : ghost.scatterTarget;
        break;
    }
  } else if (ghost.mode === 'eaten') {
    newTargetGridPos = { row: 14, col: 14 };
  } else {
    newTargetGridPos = ghost.gridPos;
  }
  
  // Apply the target position change immutably
  ghost.targetGridPos = newTargetGridPos;
}

export function updateGhosts(game: GameState, deltaTime: number) {
  // Create new ghosts array with immutable updates
  game.ghosts = game.ghosts.map(ghost => {
    if (game.freezeTimer > 0 && ghost.mode !== 'eaten') return ghost;

    // Create a working copy of the ghost for modifications
    let updatedGhost = { ...ghost };
    
    updateGhostAI(game, updatedGhost);

    const path = findPath(game.maze, updatedGhost.gridPos, updatedGhost.targetGridPos);
    if (path.length > 1) {
      const next = path[1];
      let newDirection = updatedGhost.direction;
      if (next.row < updatedGhost.gridPos.row) newDirection = 'up';
      else if (next.row > updatedGhost.gridPos.row) newDirection = 'down';
      else if (next.col < updatedGhost.gridPos.col) newDirection = 'left';
      else if (next.col > updatedGhost.gridPos.col) newDirection = 'right';
      
      if (newDirection !== updatedGhost.direction) {
        updatedGhost = { ...updatedGhost, direction: newDirection };
      }
    }

    const speed = updatedGhost.speed * (updatedGhost.mode === 'frightened' ? 0.5 : 1);
    const moveDistance = speed * CELL_SIZE * deltaTime;
    
    // Calculate new position immutably
    let newPosition = { ...updatedGhost.position };
    switch (updatedGhost.direction) {
      case 'up':
        newPosition = { ...newPosition, y: newPosition.y - moveDistance };
        break;
      case 'down':
        newPosition = { ...newPosition, y: newPosition.y + moveDistance };
        break;
      case 'left':
        newPosition = { ...newPosition, x: newPosition.x - moveDistance };
        break;
      case 'right':
        newPosition = { ...newPosition, x: newPosition.x + moveDistance };
        break;
    }

    // Handle tunnel wrapping immutably
    if (newPosition.x < -CELL_SIZE / 2) {
      newPosition = { ...newPosition, x: game.maze[0].length * CELL_SIZE - CELL_SIZE / 2 };
    } else if (newPosition.x > game.maze[0].length * CELL_SIZE + CELL_SIZE / 2) {
      newPosition = { ...newPosition, x: CELL_SIZE / 2 };
    }

    // Add Y-axis tunnel wrapping for ghosts
    if (newPosition.y < -CELL_SIZE / 2) {
      newPosition = { ...newPosition, y: game.maze.length * CELL_SIZE - CELL_SIZE / 2 };
    } else if (newPosition.y > game.maze.length * CELL_SIZE + CELL_SIZE / 2) {
      newPosition = { ...newPosition, y: CELL_SIZE / 2 };
    }

    const newGridPos = pixelToGrid(newPosition, game.maze);
    
    // Return updated ghost with immutable changes
    return { 
      ...updatedGhost, 
      position: newPosition,
      gridPos: newGridPos
    };
  });
}

