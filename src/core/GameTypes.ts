export interface GameSettings {
  soundEnabled: boolean;
  volume: number;
  difficulty: 'easy' | 'normal' | 'hard';
  theme: string;
}

export interface GameStats {
  highScores: {
    snake: number;
    pong: number;
    breakout: number;
    tetris: number;
    spaceInvaders: number;
  };
  gamesPlayed: number;
  totalScore: number;
  achievements: string[];
}

export interface GameInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface GameComponentProps {
  settings: GameSettings;
  onScoreUpdate: (gameId: string, score: number) => void;
  onBack: () => void;
}

export interface PowerUp {
  x: number;
  y: number;
  type: string;
  lifeTime?: number;
  vy?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hits: number;
  maxHits: number;
  powerUp?: string | null;
}

// Core System Interfaces
export interface CoreSystemsConfig {
  soundManager: {
    poolSize: number;
    volume: number;
    enabled: boolean;
  };
  particleSystem: {
    maxParticles: number;
    poolSize: number;
    enableLayers: boolean;
  };
  inputManager: {
    bufferTime: number;
    gamepadDeadzone: number;
    gestureThreshold: number;
  };
}

export interface AudioContextState {
  initialized: boolean;
  suspended: boolean;
  sampleRate: number;
}

export interface ParticleStats {
  active: number;
  pooled: number;
  total: number;
  layerCounts: Record<number, number>;
}

export interface InputState {
  keyboard: Record<string, boolean>;
  mouse: { x: number; y: number; buttons: boolean[] };
  touch: { active: boolean; gestureType?: string };
  gamepad: { connected: boolean; index?: number };
}