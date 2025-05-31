import { useCallback, useRef } from 'react';

export interface GridPosition {
  row: number;
  col: number;
}

const getGridKey = (row: number, col: number): string => `${row}-${col}`;

export function useBFSPathfinder() {
  const neighborsRef = useRef<Map<string, GridPosition[]>>(new Map());

  const setMaze = useCallback((maze: number[][]) => {
    const map = new Map<string, GridPosition[]>();
    const height = maze.length;
    const width = maze[0]?.length ?? 0;

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (maze[row][col] === 0) continue; // wall
        const neighbors: GridPosition[] = [];
        if (row > 0 && maze[row - 1][col] !== 0) neighbors.push({ row: row - 1, col });
        if (row < height - 1 && maze[row + 1][col] !== 0) neighbors.push({ row: row + 1, col });
        if (col > 0 && maze[row][col - 1] !== 0) neighbors.push({ row, col: col - 1 });
        if (col < width - 1 && maze[row][col + 1] !== 0) neighbors.push({ row, col: col + 1 });
        map.set(getGridKey(row, col), neighbors);
      }
    }

    neighborsRef.current = map;
  }, []);

  const findPath = useCallback(
    (start: GridPosition, end: GridPosition): GridPosition[] => {
      if (start.row === end.row && start.col === end.col) return [start];
      const neighborsMap = neighborsRef.current;
      const queue: GridPosition[] = [start];
      const visited = new Set<string>([getGridKey(start.row, start.col)]);
      const cameFrom = new Map<string, GridPosition>();

      while (queue.length > 0) {
        const current = queue.shift() as GridPosition;
        if (current.row === end.row && current.col === end.col) {
          const path: GridPosition[] = [];
          let temp: GridPosition | undefined = current;
          while (temp) {
            path.unshift(temp);
            temp = cameFrom.get(getGridKey(temp.row, temp.col));
          }
          return path;
        }

        const neighbors = neighborsMap.get(getGridKey(current.row, current.col)) || [];
        for (const n of neighbors) {
          const key = getGridKey(n.row, n.col);
          if (!visited.has(key)) {
            visited.add(key);
            cameFrom.set(key, current);
            queue.push(n);
          }
        }
      }

      return [];
    },
    []
  );

  return { setMaze, findPath };
}
