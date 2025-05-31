export interface GameSettings {
  soundEnabled: boolean;
  volume: number;
  difficulty: 'easy' | 'normal' | 'hard';
  theme: string;
  renderer: 'canvas2d' | 'webgl';
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