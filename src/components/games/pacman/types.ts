export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export interface Position {
  x: number;
  y: number;
}

export interface GridPosition {
  row: number;
  col: number;
}

export interface Ghost {
  id: string;
  position: Position;
  gridPos: GridPosition;
  targetGridPos: GridPosition;
  color: string;
  mode: 'chase' | 'scatter' | 'frightened' | 'eaten' | 'in_house' | 'exiting';
  speed: number;
  aiType: 'blinky' | 'pinky' | 'inky' | 'clyde';
  direction: Direction;
  scatterTarget: GridPosition;
  exitTimer: number;
}

export interface PowerUp {
  type: 'speed' | 'freeze' | 'magnet' | 'shield';
  gridPos: GridPosition;
  duration: number;
  icon: string;
}

export interface GameState {
  pacman: {
    position: Position;
    gridPos: GridPosition;
    targetGridPos: GridPosition;
    previousGridPos: GridPosition;
    direction: Direction;
    nextDirection: Direction;
    speed: number;
    mouthOpen: boolean;
    mouthTimer: number;
    powerUpActive: string | null;
    powerUpTimer: number;
    invincibleTimer: number;
    shieldHits: number;
  };
  ghosts: Ghost[];
  maze: number[][];
  pellets: Set<string>;
  powerPellets: Set<string>;
  powerUps: Map<string, PowerUp>;
  score: number;
  lives: number;
  level: number;
  combo: number;
  comboTimer: number;
  particles: any[]; // using any to avoid tight coupling with Particle type
  gamePhase: 'ready' | 'playing' | 'levelComplete' | 'gameOver' | 'dying';
  frightenedTimer: number;
  freezeTimer: number;
  lastUpdate: number;
  mazeCacheCanvas: HTMLCanvasElement | null;
  mazeCacheCtx: CanvasRenderingContext2D | null;
  mazeCacheDirty: boolean;
  pelletCacheCanvas: HTMLCanvasElement | null;
  pelletCacheCtx: CanvasRenderingContext2D | null;
  pelletCacheDirty: boolean;
  waveTimer: number;
  waveMode: 'scatter' | 'chase';
  globalDotCounter: number;
  pelletsEaten: number;
  ghostScoreMultiplier: number;
  deathTimer: number;
  levelCompleteTimer: number;
  qualityLevel: 'high' | 'medium' | 'low';
  showDPad: boolean;
  fruit: {
    type: string;
    position: GridPosition | null;
    points: number;
    timer: number;
  } | null;
  fruitSpawnCount: number;
}

