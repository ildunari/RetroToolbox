import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, Shield } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { Particle } from '../../core/ParticleSystem';
import { GameState, Position, GridPosition, Direction, Ghost, PowerUp } from './pacman/types';
import { updateGhosts } from './pacman/AI';
import { drawFrame } from './pacman/render';
import { setupInput } from './pacman/input';
import { FadingCanvas } from '../ui/FadingCanvas';
import { GameOverBanner } from '../ui/GameOverBanner';
import { ResponsiveCanvas } from "../ui/ResponsiveCanvas";
import { CANVAS_CONFIG } from "../../core/CanvasConfig";

interface PacManGameProps {
  settings: {
    soundEnabled: boolean;
    difficulty: 'easy' | 'normal' | 'hard';
  };
  updateHighScore: (gameId: string, score: number) => void;
}

// Maze constants
const CELL_SIZE = 20;
const MAZE_WIDTH = 28;
const MAZE_HEIGHT = 31;
const MAX_PARTICLES = 100;

// Score overflow protection helper
const addSafeScore = (currentScore: number, points: number): number => {
  return Math.min(currentScore + points, Number.MAX_SAFE_INTEGER);
};

// Particle pool for performance
class ParticlePool {
  private pool: Particle[] = [];
  private activeParticles: Particle[] = [];

  getParticle(x: number, y: number, vx: number, vy: number, color: string, life: number): Particle {
    let particle = this.pool.pop();
    if (!particle) {
      particle = new Particle(x, y, vx, vy, color, life);
    } else {
      // Reset particle properties
      particle.x = x;
      particle.y = y;
      particle.vx = vx;
      particle.vy = vy;
      particle.color = color;
      particle.life = life;
    }
    this.activeParticles.push(particle);
    return particle;
  }

  update(deltaTime: number): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      particle.update(deltaTime);
      if (particle.life <= 0) {
        this.activeParticles.splice(i, 1);
        this.pool.push(particle);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.activeParticles.forEach(particle => particle.draw(ctx));
  }

  getActiveCount(): number {
    return this.activeParticles.length;
  }

  clear(): void {
    this.pool.push(...this.activeParticles);
    this.activeParticles = [];
  }
}

// Classic Pac-Man maze layout (0 = wall, 1 = pellet, 2 = power pellet, 3 = empty)
const MAZE_TEMPLATE: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,2,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,2,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
  [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,3,3,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,3,3,3,3,3,3,0,1,0,0,1,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,0,3,3,3,3,3,3,0,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,1,0,0,1,0,3,3,3,3,3,3,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,2,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,2,0],
  [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
  [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
  [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
  [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// Create numeric key for grid position (more efficient than string concatenation)
const getGridKey = (row: number, col: number): string => `${row * 1000 + col}`;
const parseGridKey = (key: string): [number, number] => {
  const num = parseInt(key);
  return [Math.floor(num / 1000), num % 1000];
};

export const PacManGame: React.FC<PacManGameProps> = ({ settings, updateHighScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const particlePoolRef = useRef(new ParticlePool());
  const powerUpIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(settings.soundEnabled);
  
  const gameRef = useRef<GameState>({
    pacman: {
      position: { x: 14 * CELL_SIZE, y: 23 * CELL_SIZE },
      gridPos: { row: 23, col: 14 },
      targetGridPos: { row: 23, col: 14 },
      previousGridPos: { row: 23, col: 14 },
      direction: 'none',
      nextDirection: 'none',
      // Initial speed based on starting level
      speed: 0.15 + (level - 1) * 0.01,
      mouthOpen: true,
      mouthTimer: 0,
      powerUpActive: null,
      powerUpTimer: 0,
      invincibleTimer: 0,
      shieldHits: 0
    },
    ghosts: [],
    maze: [],
    pellets: new Set(),
    powerPellets: new Set(),
    powerUps: new Map(),
    score: 0,
    lives: 3,
    level: 1,
    combo: 0,
    comboTimer: 0,
    particles: [],
    gamePhase: 'ready',
    frightenedTimer: 0,
    freezeTimer: 0,
    lastUpdate: 0,
    mazeCacheCanvas: null,
    mazeCacheCtx: null,
    mazeCacheDirty: true,
    pelletCacheCanvas: null,
    pelletCacheCtx: null,
    pelletCacheDirty: true,
    waveTimer: 0,
    waveMode: 'scatter',
    globalDotCounter: 0,
    pelletsEaten: 0,
    ghostScoreMultiplier: 1,
    deathTimer: 0,
    levelCompleteTimer: 0,
    qualityLevel: 'high',
    showDPad: false,
    fruit: null,
    fruitSpawnCount: 0
  });

  // Initialize game
  const initializeGame = useCallback((reset: boolean = false) => {
    const game = gameRef.current;
    
    // Deep copy maze template
    game.maze = MAZE_TEMPLATE.map(row => [...row]);
    
    // Initialize pellets with numeric keys
    game.pellets.clear();
    game.powerPellets.clear();
    game.powerUps.clear();
    
    for (let row = 0; row < MAZE_HEIGHT; row++) {
      for (let col = 0; col < MAZE_WIDTH; col++) {
        const cell = game.maze[row][col];
        if (cell === 1) {
          game.pellets.add(getGridKey(row, col));
        } else if (cell === 2) {
          game.powerPellets.add(getGridKey(row, col));
        }
      }
    }
    
    // Initialize ghosts
    game.ghosts = [
      {
        id: 'blinky',
        position: { x: 14 * CELL_SIZE, y: 14 * CELL_SIZE },
        gridPos: { row: 14, col: 14 },
        targetGridPos: { row: 13, col: 14 },
        color: '#ff0000',
        mode: 'scatter',
        speed: 0.1 + (game.level - 1) * 0.01,
        aiType: 'blinky',
        direction: 'up',
        scatterTarget: { row: 0, col: 25 },
        exitTimer: 0
      },
      {
        id: 'pinky',
        position: { x: 13 * CELL_SIZE, y: 14 * CELL_SIZE },
        gridPos: { row: 14, col: 13 },
        targetGridPos: { row: 13, col: 13 },
        color: '#ffb8ff',
        mode: 'scatter',
        speed: 0.1 + (game.level - 1) * 0.01,
        aiType: 'pinky',
        direction: 'up',
        scatterTarget: { row: 0, col: 2 },
        exitTimer: 2
      },
      {
        id: 'inky',
        position: { x: 14 * CELL_SIZE, y: 15 * CELL_SIZE },
        gridPos: { row: 15, col: 14 },
        targetGridPos: { row: 14, col: 14 },
        color: '#00ffff',
        mode: 'scatter',
        speed: 0.1 + (game.level - 1) * 0.01,
        aiType: 'inky',
        direction: 'up',
        scatterTarget: { row: 35, col: 27 },
        exitTimer: 4
      },
      {
        id: 'clyde',
        position: { x: 15 * CELL_SIZE, y: 14 * CELL_SIZE },
        gridPos: { row: 14, col: 15 },
        targetGridPos: { row: 13, col: 15 },
        color: '#ffb851',
        mode: 'scatter',
        speed: 0.1 + (game.level - 1) * 0.01,
        aiType: 'clyde',
        direction: 'up',
        scatterTarget: { row: 35, col: 0 },
        exitTimer: 6
      }
    ];
    
    // Reset Pac-Man
    game.pacman = {
      position: { x: 14 * CELL_SIZE, y: 23 * CELL_SIZE },
      gridPos: { row: 23, col: 14 },
      targetGridPos: { row: 23, col: 14 },
      previousGridPos: { row: 23, col: 14 },
      direction: 'none',
      nextDirection: 'none',
      speed: 0.15 + (game.level - 1) * 0.01,
      mouthOpen: true,
      mouthTimer: 0,
      powerUpActive: null,
      powerUpTimer: 0,
      invincibleTimer: 0,
      shieldHits: 0
    };
    
    particlePoolRef.current.clear();
    game.frightenedTimer = 0;
    game.freezeTimer = 0;
    game.gamePhase = 'ready';
    game.mazeCacheDirty = true;
    game.pelletCacheDirty = true;
    game.waveTimer = 0;
    game.waveMode = 'scatter';
    game.globalDotCounter = 0;
    game.pelletsEaten = 0;
    game.ghostScoreMultiplier = 1;
    game.deathTimer = 0;
    game.levelCompleteTimer = 0;
    game.fruit = null;
    game.fruitSpawnCount = 0;
  }, []);

  // Create particles with pooling
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const pool = particlePoolRef.current;
    // Limit particles to prevent performance issues
    const availableSlots = MAX_PARTICLES - pool.getActiveCount();
    const actualCount = Math.min(count, availableSlots);
    
    for (let i = 0; i < actualCount; i++) {
      const angle = (Math.PI * 2 * i) / actualCount;
      pool.getParticle(
        x, y,
        Math.cos(angle) * 100,
        Math.sin(angle) * 100,
        color,
        0.8
      );
    }
  }, []);


  // Grid movement helpers
  const gridToPixel = (gridPos: GridPosition): Position => ({
    x: gridPos.col * CELL_SIZE + CELL_SIZE / 2,
    y: gridPos.row * CELL_SIZE + CELL_SIZE / 2
  });
  
  const pixelToGrid = (pos: Position): GridPosition => ({
    row: Math.floor(pos.y / CELL_SIZE),
    col: Math.floor(pos.x / CELL_SIZE)
  });

  const canMove = (gridPos: GridPosition, direction: Direction): boolean => {
    const { row, col } = gridPos;
    const maze = gameRef.current.maze;
    
    switch (direction) {
      case 'up':
        return row > 0 && maze[row - 1][col] !== 0;
      case 'down':
        return row < MAZE_HEIGHT - 1 && maze[row + 1][col] !== 0;
      case 'left':
        return col > 0 && maze[row][col - 1] !== 0;
      case 'right':
        return col < MAZE_WIDTH - 1 && maze[row][col + 1] !== 0;
      default:
        return false;
    }
  };

  const getNextGridPos = (gridPos: GridPosition, direction: Direction): GridPosition => {
    const { row, col } = gridPos;
    switch (direction) {
      case 'up':
        return { row: row - 1, col };
      case 'down':
        return { row: row + 1, col };
      case 'left':
        return { row, col: col - 1 };
      case 'right':
        return { row, col: col + 1 };
      default:
        return gridPos;
    }
  };

  const getOppositeDirection = (dir: Direction): Direction => {
    switch (dir) {
      case 'up':
        return 'down';
      case 'down':
        return 'up';
      case 'left':
        return 'right';
      case 'right':
        return 'left';
      default:
        return 'none';
    }
  };

  // Update sound enabled ref when settings change
  useEffect(() => {
    soundEnabledRef.current = settings.soundEnabled;
  }, [settings.soundEnabled]);

  // Input handlers - setup when component mounts
  useEffect(() => {
    return setupInput(canvasRef.current, gameRef, () => setPaused(p => !p), soundEnabledRef);
  }, []);

  // Detect device performance and set quality level
  useEffect(() => {
    const detectPerformance = () => {
      const game = gameRef.current;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowEndDevice = navigator.hardwareConcurrency ? navigator.hardwareConcurrency < 4 : false;
      
      if (isMobile) {
        game.qualityLevel = isLowEndDevice ? 'low' : 'medium';
        game.showDPad = true;
      } else {
        game.qualityLevel = 'high';
        game.showDPad = false;
      }
    };

    detectPerformance();
  }, []);

  // Game loop with proper animation frame cancellation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Cancel any existing animation frame
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    
    canvas.width = CANVAS_CONFIG.pacman.width;
    canvas.height = CANVAS_CONFIG.pacman.height;
    initializeGame();
    
    const gameLoop = (timestamp: number) => {
      if (!paused && !gameOver) {
        const game = gameRef.current;
        if (game.lastUpdate === 0) {
          game.lastUpdate = timestamp;
        }
        const deltaTime = (timestamp - game.lastUpdate) / 1000;
        game.lastUpdate = timestamp;
        
        if (deltaTime > 0.1) {
          animationIdRef.current = requestAnimationFrame(gameLoop);
          return;
        }
        
        // Only update game objects during playing phase
        if (game.gamePhase === 'playing') {
          // Update Pac-Man
          updatePacMan(deltaTime);
          
          // Update ghosts
          updateGhosts(game, deltaTime);
        }
        
        // Update particles
        particlePoolRef.current.update(deltaTime);
        
        // Update wave patterns (scatter/chase)
        if (game.gamePhase === 'playing') {
          game.waveTimer += deltaTime;
          
          // Wave patterns based on level
          const wavePattern = getWavePattern(game.level);
          let totalTime = 0;
          let currentMode: 'scatter' | 'chase' = 'scatter';
          
          for (const [mode, duration] of wavePattern) {
            if (game.waveTimer < totalTime + duration) {
              currentMode = mode;
              break;
            }
            totalTime += duration;
          }
          
          // Reset wave timer if we've gone through all patterns
          if (game.waveTimer >= totalTime) {
            game.waveTimer = game.waveTimer % totalTime;
          }
          
          game.waveMode = currentMode;
        }
        
        // Update ghost exit timers
        game.ghosts.forEach(ghost => {
          if (ghost.exitTimer > 0) {
            ghost.exitTimer -= deltaTime;
          }
        });
        
        // Update timers
        if (game.frightenedTimer > 0) {
          game.frightenedTimer -= deltaTime;
          if (game.frightenedTimer <= 0) {
            game.ghosts.forEach(ghost => {
              if (ghost.mode === 'frightened') {
                ghost.mode = 'chase';
              }
            });
            if (settings.soundEnabled) {
              soundManager.startGhostSiren('normal');
            }
          }
        }
        
        if (game.freezeTimer > 0) {
          game.freezeTimer -= deltaTime;
        }
        
        if (game.pacman.powerUpTimer > 0) {
          game.pacman.powerUpTimer -= deltaTime;
          if (game.pacman.powerUpTimer <= 0) {
            game.pacman.powerUpActive = null;
          }
        }
        
        if (game.comboTimer > 0) {
          game.comboTimer -= deltaTime;
          if (game.comboTimer <= 0) {
            game.combo = 0;
            setCombo(0);
          }
        }
        
        if (game.pacman.invincibleTimer > 0) {
          game.pacman.invincibleTimer -= deltaTime;
        }
        
        // Handle death timer
        if (game.deathTimer > 0) {
          game.deathTimer -= deltaTime;
          if (game.deathTimer <= 0 && game.gamePhase === 'dying') {
            // Reset positions after death animation
            game.pacman.position = { x: 14 * CELL_SIZE, y: 23 * CELL_SIZE };
            game.pacman.gridPos = { row: 23, col: 14 };
            game.pacman.targetGridPos = { row: 23, col: 14 };
            game.pacman.previousGridPos = { row: 23, col: 14 };
            game.pacman.direction = 'none';
            game.pacman.nextDirection = 'none';
            game.pacman.invincibleTimer = 3; // 3 seconds of invincibility
            
            // Reset ghost positions
            game.ghosts.forEach((ghost, index) => {
              const positions = [
                { x: 14 * CELL_SIZE, y: 14 * CELL_SIZE, row: 14, col: 14 },
                { x: 13 * CELL_SIZE, y: 14 * CELL_SIZE, row: 14, col: 13 },
                { x: 14 * CELL_SIZE, y: 15 * CELL_SIZE, row: 15, col: 14 },
                { x: 15 * CELL_SIZE, y: 14 * CELL_SIZE, row: 14, col: 15 }
              ];
              ghost.position = { x: positions[index].x, y: positions[index].y };
              ghost.gridPos = { row: positions[index].row, col: positions[index].col };
              ghost.mode = 'scatter';
              ghost.exitTimer = index * 2; // Stagger ghost exits
            });
            
            game.gamePhase = 'playing';
          }
        }
        
        // Handle level complete timer
        if (game.levelCompleteTimer > 0) {
          game.levelCompleteTimer -= deltaTime;
          if (game.levelCompleteTimer <= 0 && game.gamePhase === 'levelComplete') {
            game.level++;
            setLevel(game.level);
            initializeGame(false); // Keep score and lives
            game.gamePhase = 'ready';
          }
        }
        
        // Check collisions
        checkCollisions();
        
        // Spawn fruit bonus items
        if (!game.fruit && game.fruitSpawnCount < 2) {
          const pelletsNeeded = game.fruitSpawnCount === 0 ? 70 : 170;
          if (game.pelletsEaten >= pelletsNeeded) {
            const fruitTypes = [
              { type: '🍒', points: 100 },  // Cherry
              { type: '🍓', points: 300 },  // Strawberry
              { type: '🍊', points: 500 },  // Orange
              { type: '🍎', points: 700 },  // Apple
              { type: '🍈', points: 1000 }, // Melon
              { type: '🔔', points: 3000 }, // Bell
              { type: '🔑', points: 5000 }  // Key
            ];
            
            const fruitIndex = Math.min(game.level - 1, fruitTypes.length - 1);
            const selectedFruit = fruitTypes[fruitIndex];
            
            game.fruit = {
              type: selectedFruit.type,
              position: { row: 17, col: 14 }, // Center of maze
              points: selectedFruit.points,
              timer: 10 // Fruit stays for 10 seconds
            };
            game.fruitSpawnCount++;
            
            // Spawn effect
            createParticles(14 * CELL_SIZE, 17 * CELL_SIZE, '#ff00ff', 20);
          }
        }
        
        // Update fruit timer
        if (game.fruit) {
          game.fruit.timer -= deltaTime;
          if (game.fruit.timer <= 0) {
            game.fruit = null;
          }
        }
        
        // Check win condition
        if (game.pellets.size === 0 && game.powerPellets.size === 0 && game.gamePhase === 'playing') {
          game.gamePhase = 'levelComplete';
          game.levelCompleteTimer = 3; // Show level complete for 3 seconds
          
          // Add bonus score for level completion
          const levelBonus = 1000 * game.level;
          game.score = addSafeScore(game.score, levelBonus);
          setScore(game.score);
          
          createParticles(game.pacman.position.x, game.pacman.position.y, '#00ff00', 50);
          if (settings.soundEnabled) {
            soundManager.playLevelComplete();
            soundManager.stopGhostSiren(); // Stop siren when level complete
          }
        }
        
        // Update score display
        if (game.score !== score) {
          setScore(game.score);
        }
      }
      
      // Render
      drawFrame(ctx, game);
      
      animationIdRef.current = requestAnimationFrame(gameLoop);
    };
    
    const updatePacMan = (deltaTime: number) => {
      const game = gameRef.current;
      const pacman = game.pacman;
      
      // Update mouth animation
      pacman.mouthTimer += deltaTime * 10;
      pacman.mouthOpen = Math.sin(pacman.mouthTimer) > 0;
      
      // Check if we can change direction
      if (pacman.nextDirection !== 'none' && canMove(pacman.gridPos, pacman.nextDirection)) {
        pacman.direction = pacman.nextDirection;
        pacman.nextDirection = 'none';
        // Set new target when changing direction
        pacman.targetGridPos = getNextGridPos(pacman.gridPos, pacman.direction);
      }
      
      // Move Pac-Man
      if (pacman.direction !== 'none') {
        // Calculate distance to current grid center
        const currentGridCenter = gridToPixel(pacman.gridPos);
        const distToCenter = Math.sqrt(
          Math.pow(currentGridCenter.x - pacman.position.x, 2) + 
          Math.pow(currentGridCenter.y - pacman.position.y, 2)
        );
        
        // If we're close to grid center, we can move to next grid
        if (distToCenter < 2 && canMove(pacman.gridPos, pacman.direction)) {
          pacman.previousGridPos = pacman.gridPos;
          pacman.gridPos = getNextGridPos(pacman.gridPos, pacman.direction);
          pacman.targetGridPos = getNextGridPos(pacman.gridPos, pacman.direction);
        }
        
        // Always move in the current direction
        const speed = pacman.powerUpActive === 'speed' ? pacman.speed * 1.5 : pacman.speed;
        const moveDistance = speed * CELL_SIZE * deltaTime;
        
        switch (pacman.direction) {
          case 'up':
            pacman.position.y -= moveDistance;
            break;
          case 'down':
            pacman.position.y += moveDistance;
            break;
          case 'left':
            pacman.position.x -= moveDistance;
            break;
          case 'right':
            pacman.position.x += moveDistance;
            break;
        }
        
        // Handle tunnel wrap-around for Pac-Man
        if (pacman.position.x < -CELL_SIZE / 2) {
          pacman.position.x = MAZE_WIDTH * CELL_SIZE - CELL_SIZE / 2;
          pacman.gridPos = { row: pacman.gridPos.row, col: MAZE_WIDTH - 1 };
          pacman.previousGridPos = { row: pacman.gridPos.row, col: 0 };
        } else if (pacman.position.x > MAZE_WIDTH * CELL_SIZE + CELL_SIZE / 2) {
          pacman.position.x = CELL_SIZE / 2;
          pacman.gridPos = { row: pacman.gridPos.row, col: 0 };
          pacman.previousGridPos = { row: pacman.gridPos.row, col: MAZE_WIDTH - 1 };
        }
        
        // Snap to grid if we can't move further
        if (!canMove(pacman.gridPos, pacman.direction)) {
          const gridCenter = gridToPixel(pacman.gridPos);
          pacman.position.x = gridCenter.x;
          pacman.position.y = gridCenter.y;
          pacman.direction = 'none';
        }
      }
      
      // Collect pellets only when entering a new grid cell
      if (pacman.gridPos.row !== pacman.previousGridPos.row || 
          pacman.gridPos.col !== pacman.previousGridPos.col) {
        const key = getGridKey(pacman.gridPos.row, pacman.gridPos.col);
        if (game.pellets.has(key)) {
          game.pellets.delete(key);
          game.pelletCacheDirty = true; // Mark cache as dirty
          game.score = addSafeScore(game.score, 10 * (game.combo + 1));
          game.combo++;
          game.comboTimer = 2;
          setCombo(game.combo);

          // Show "+combo" floating text near Pac-Man
          const comboParticle = particlePoolRef.current.getParticle(
            pacman.position.x,
            pacman.position.y - 15,
            0,
            -30,
            '#ffff00',
            1
          );
          comboParticle.text = `+${game.combo}`;
          comboParticle.fontSize = 12;
          game.globalDotCounter++;
          game.pelletsEaten++;
          createParticles(pacman.position.x, pacman.position.y, '#ffff00', 5);
          if (settings.soundEnabled) {
            soundManager.playEatPellet();
          }
        }
        
        if (game.powerPellets.has(key)) {
          game.powerPellets.delete(key);
          game.pelletCacheDirty = true; // Mark cache as dirty
          game.score = addSafeScore(game.score, 50 * (game.combo + 1));
          game.globalDotCounter++;
          game.pelletsEaten++;
          game.frightenedTimer = Math.max(8 - (game.level - 1) * 0.5, 2); // Decrease frightened time per level (min 2s)
          game.ghostScoreMultiplier = 1; // Reset ghost score multiplier for new power pellet
          game.ghosts.forEach(ghost => {
            if (ghost.mode !== 'eaten' && ghost.mode !== 'in_house' && ghost.mode !== 'exiting') {
              ghost.mode = 'frightened';
            }
          });
          createParticles(pacman.position.x, pacman.position.y, '#ff00ff', 15);
          if (settings.soundEnabled) {
            soundManager.playPowerPellet();
            soundManager.startGhostSiren('frightened');
          }
        }
        
        // Collect power-ups
        const powerUpKey = getGridKey(pacman.gridPos.row, pacman.gridPos.col);
        if (game.powerUps.has(powerUpKey)) {
          const powerUp = game.powerUps.get(powerUpKey)!;
          game.powerUps.delete(powerUpKey);
          
          pacman.powerUpActive = powerUp.type;
          pacman.powerUpTimer = powerUp.duration;
          
          if (powerUp.type === 'freeze') {
            game.freezeTimer = powerUp.duration;
          } else if (powerUp.type === 'shield') {
            // Set shield hits to 1 when collected
            pacman.shieldHits = 1;
          }
          
          createParticles(pacman.position.x, pacman.position.y, '#00ff00', 20);
          if (settings.soundEnabled) {
            soundManager.playPowerUp();
          }
        }
        
        // Collect fruit bonus
        if (game.fruit && game.fruit.position &&
            pacman.gridPos.row === game.fruit.position.row &&
            pacman.gridPos.col === game.fruit.position.col) {
          game.score = addSafeScore(game.score, game.fruit.points);
          setScore(game.score);
          
          // Show points with text particle
          const textParticle = new Particle(
            pacman.position.x,
            pacman.position.y - 10,
            0,
            -50,
            '#ffffff',
            1.5
          );
          textParticle.text = `${game.fruit.points}`;
          textParticle.fontSize = 16;
          game.particles.push(textParticle);
          
          createParticles(pacman.position.x, pacman.position.y, '#ff00ff', 30);
          if (settings.soundEnabled) {
            soundManager.playFruitCollect();
          }
          
          game.fruit = null;
        }
        
        // Magnet power-up: auto-collect nearby pellets
        if (pacman.powerUpActive === 'magnet') {
          const magnetRadius = 2; // 2 tile radius
          for (let dr = -magnetRadius; dr <= magnetRadius; dr++) {
            for (let dc = -magnetRadius; dc <= magnetRadius; dc++) {
              if (dr === 0 && dc === 0) continue; // Skip center
              
              const nearRow = pacman.gridPos.row + dr;
              const nearCol = pacman.gridPos.col + dc;
              
              if (nearRow >= 0 && nearRow < MAZE_HEIGHT && nearCol >= 0 && nearCol < MAZE_WIDTH) {
                const nearKey = getGridKey(nearRow, nearCol);
                
                // Collect nearby pellets
                if (game.pellets.has(nearKey)) {
                  game.pellets.delete(nearKey);
                  game.pelletCacheDirty = true;
                  game.score = addSafeScore(game.score, 10 * (game.combo + 1));
                  game.globalDotCounter++;
                  game.pelletsEaten++;
                  
                  // Create magnetic attraction particles
                  const targetX = nearCol * CELL_SIZE + CELL_SIZE / 2;
                  const targetY = nearRow * CELL_SIZE + CELL_SIZE / 2;
                  createParticles(targetX, targetY, '#ffff00', 3);
                  
                  // Create attraction line particle
                  const particle = particlePoolRef.current.getParticle(
                    targetX, targetY,
                    (pacman.position.x - targetX) * 2,
                    (pacman.position.y - targetY) * 2,
                    '#00ff00',
                    0.5
                  );
                  
                  if (settings.soundEnabled) {
                    soundManager.playCollect();
                  }
                }
              }
            }
          }
        }
      }
    };
    
    
    const checkCollisions = () => {
      const game = gameRef.current;
      const pacman = game.pacman;
      
      game.ghosts.forEach(ghost => {
        const dx = ghost.position.x - pacman.position.x;
        const dy = ghost.position.y - pacman.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < CELL_SIZE * 0.8) {
          if (ghost.mode === 'frightened') {
            // Eat ghost
            ghost.mode = 'eaten';
            const points = 200 * Math.pow(2, game.ghostScoreMultiplier - 1);
            game.score = addSafeScore(game.score, points);
            game.ghostScoreMultiplier++;
            game.combo++;
            game.comboTimer = 2;
            setCombo(game.combo);

            // Show "+combo" floating text near Pac-Man
            const comboParticle = particlePoolRef.current.getParticle(
              pacman.position.x,
              pacman.position.y - 15,
              0,
              -30,
              '#ffff00',
              1
            );
            comboParticle.text = `+${game.combo}`;
            comboParticle.fontSize = 12;
            createParticles(ghost.position.x, ghost.position.y, ghost.color, 20);
            
            // Display ghost score value
            const scoreParticle = particlePoolRef.current.getParticle(
              ghost.position.x, ghost.position.y - 10,
              0, -30,
              '#ffffff',
              1.5
            );
            if (scoreParticle) {
              scoreParticle.text = points.toString();
              scoreParticle.fontSize = 16;
            }
            
            if (settings.soundEnabled) {
              soundManager.playHit();
            }
          } else if (ghost.mode !== 'eaten' && pacman.shieldHits <= 0 && pacman.invincibleTimer <= 0) {
            // Pac-Man dies (only if not invincible and no shield)
            game.lives--;
            setLives(game.lives);
            createParticles(pacman.position.x, pacman.position.y, '#ffff00', 30);
            
            if (game.lives <= 0) {
              setGameOver(true);
              updateHighScore('pacman', game.score);
              if (settings.soundEnabled) {
                soundManager.playGameOver();
                soundManager.stopGhostSiren(); // Stop siren on game over
              }
            } else {
              // Start death sequence
              game.gamePhase = 'dying';
              game.deathTimer = 1.5; // 1.5 second death animation
              
              if (settings.soundEnabled) {
                soundManager.playDeath();
                soundManager.stopGhostSiren(); // Stop siren during death
              }
            }
          } else if (pacman.shieldHits > 0 && ghost.mode !== 'eaten') {
            // Shield blocks one hit
            pacman.shieldHits--;
            if (pacman.shieldHits <= 0) {
              pacman.powerUpActive = null;
              pacman.powerUpTimer = 0;
            }
            createParticles(pacman.position.x, pacman.position.y, '#00ffff', 20);
            // Bounce ghost away
            ghost.direction = getOppositeDirection(ghost.direction);
            if (settings.soundEnabled) {
              soundManager.playHit();
            }
          }
        }
      });
    };
    
    
    const getWavePattern = (level: number): Array<['scatter' | 'chase', number]> => {
      // Wave patterns get more aggressive at higher levels
      if (level === 1) {
        return [
          ['scatter', 7],
          ['chase', 20],
          ['scatter', 7],
          ['chase', 20],
          ['scatter', 5],
          ['chase', 20],
          ['scatter', 5],
          ['chase', Infinity]
        ];
      } else if (level <= 4) {
        return [
          ['scatter', 7],
          ['chase', 20],
          ['scatter', 7],
          ['chase', 20],
          ['scatter', 5],
          ['chase', 1033],
          ['scatter', 1/60],
          ['chase', Infinity]
        ];
      } else {
        return [
          ['scatter', 5],
          ['chase', 20],
          ['scatter', 5],
          ['chase', 20],
          ['scatter', 5],
          ['chase', 1037],
          ['scatter', 1/60],
          ['chase', Infinity]
        ];
      }
    };

    const getDirectionAngle = (direction: Direction): number => {
      switch (direction) {
        case 'right': return 0;
        case 'down': return Math.PI / 2;
        case 'left': return Math.PI;
        case 'up': return -Math.PI / 2;
        default: return 0;
      }
    };
    
    animationIdRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [gameOver, paused, settings.soundEnabled, initializeGame, createParticles, updateHighScore, score]);

  // Spawn power-ups periodically with proper cleanup
  useEffect(() => {
    if (paused || gameOver) {
      // Clear interval when paused or game over
      if (powerUpIntervalRef.current) {
        clearInterval(powerUpIntervalRef.current);
        powerUpIntervalRef.current = null;
      }
      return;
    }

    const spawnPowerUp = () => {
      const game = gameRef.current;
      if (game.gamePhase !== 'playing') return;
      
      // Find empty spots
      const emptySpots: GridPosition[] = [];
      for (let row = 0; row < MAZE_HEIGHT; row++) {
        for (let col = 0; col < MAZE_WIDTH; col++) {
          const key = getGridKey(row, col);
          if (game.maze[row][col] !== 0 && 
              !game.pellets.has(key) &&
              !game.powerPellets.has(key) &&
              !game.powerUps.has(key)) {
            emptySpots.push({ row, col });
          }
        }
      }
      
      if (emptySpots.length > 0) {
        const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
        const types: Array<{ type: PowerUp['type']; icon: string }> = [
          { type: 'speed', icon: '⚡' },
          { type: 'freeze', icon: '❄️' },
          { type: 'magnet', icon: '🧲' },
          { type: 'shield', icon: '🛡️' }
        ];
        const powerUp = types[Math.floor(Math.random() * types.length)];
        
        game.powerUps.set(getGridKey(spot.row, spot.col), {
          type: powerUp.type,
          gridPos: spot,
          duration: 5,
          icon: powerUp.icon
        });
        
        // Create spawn effect particles
        const spawnX = spot.col * CELL_SIZE + CELL_SIZE / 2;
        const spawnY = spot.row * CELL_SIZE + CELL_SIZE / 2;
        
        // Sparkle effect
        for (let i = 0; i < 15; i++) {
          const angle = (Math.PI * 2 * i) / 15;
          const speed = 50 + Math.random() * 50;
          particlePoolRef.current.getParticle(
            spawnX, spawnY,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            '#00ff00',
            1.0
          );
        }
        
        // Pulse effect
        const pulseParticle = particlePoolRef.current.getParticle(
          spawnX, spawnY,
          0, 0,
          '#00ff00',
          0.8
        );
        if (pulseParticle) {
          pulseParticle.size = 20;
          pulseParticle.growthRate = -15; // Shrinking effect
        }
      }
    };
    
    powerUpIntervalRef.current = setInterval(spawnPowerUp, 15000);
    
    return () => {
      if (powerUpIntervalRef.current) {
        clearInterval(powerUpIntervalRef.current);
        powerUpIntervalRef.current = null;
      }
    };
  }, [paused, gameOver]);

  const resetGame = () => {
    initializeGame(true); // Reset everything
    setGameOver(false);
    setPaused(false);
    setScore(0);
    setLives(3);
    setLevel(1);
    setCombo(0);
    gameRef.current.lastUpdate = 0;
  };

  const togglePause = () => {
    setPaused(!paused);
    if (settings.soundEnabled) {
      if (!paused) {
        soundManager.stopGhostSiren();
      } else if (gameRef.current.gamePhase === 'playing') {
        const anyFrightened = gameRef.current.ghosts.some(g => g.mode === 'frightened');
        soundManager.startGhostSiren(anyFrightened ? 'frightened' : 'normal');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-900 p-2 h-full">
      <div className="flex-grow flex items-center justify-center w-full min-h-0">
        <div className="relative bg-black rounded-lg shadow-2xl overflow-hidden">
          <ResponsiveCanvas
            width={CANVAS_CONFIG.pacman.width}
            height={CANVAS_CONFIG.pacman.height}
          >
            <FadingCanvas ref={canvasRef} />
          </ResponsiveCanvas>
        
        {gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-white text-center">
              <h2 className="text-4xl font-bold mb-4">GAME OVER</h2>
              <p className="text-2xl mb-4">Score: {score}</p>
              <p className="text-lg mb-2">Level Reached: {level}</p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
        
        <GameOverBanner show={gameOver} />
        
        {paused && !gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-white text-center">
              <h2 className="text-4xl font-bold mb-4">PAUSED</h2>
              <p className="text-xl">Press SPACE to continue</p>
            </div>
          </div>
        )}
        
        {!gameOver && gameRef.current.gamePhase === 'ready' && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-white text-center">
              <h2 className="text-4xl font-bold mb-4">READY?</h2>
              <p className="text-xl">Press any arrow key to start</p>
              <p className="text-sm mt-2">Swipe on mobile</p>
            </div>
          </div>
        )}
        </div>
      </div>
      
      <div className="mt-2 flex gap-4">
        <button
          onClick={togglePause}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {paused ? <Play size={20} /> : <Pause size={20} />}
          {paused ? 'Resume' : 'Pause'}
        </button>
        
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          <RotateCcw size={20} />
          Restart
        </button>
      </div>
      
      <div className="mt-2 text-white text-center">
        <p className="text-sm opacity-75">Use arrow keys or WASD to move • Swipe on mobile</p>
        <div className="flex gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">●</span> Pellet (10pts)
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-lg">●</span> Power Pellet (50pts)
          </div>
          <div className="flex items-center gap-1">
            <Zap size={16} className="text-cyan-400" /> Speed
          </div>
          <div className="flex items-center gap-1">
            <Shield size={16} className="text-green-400" /> Shield
          </div>
        </div>
      </div>
    </div>
  );
};