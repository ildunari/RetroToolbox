import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, Shield, Gauge } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { Particle } from '../../core/ParticleSystem';
import { FadingCanvas } from '../ui/FadingCanvas';
import { GameOverBanner } from '../ui/GameOverBanner';

// TypeScript interfaces
interface Position {
  x: number;
  y: number;
}

interface GridPosition {
  row: number;
  col: number;
}

interface Ghost {
  id: string;
  position: Position;
  gridPos: GridPosition;
  targetGridPos: GridPosition;
  color: string;
  mode: 'chase' | 'scatter' | 'frightened' | 'eaten';
  speed: number;
  aiType: 'blinky' | 'pinky' | 'inky' | 'clyde';
  direction: Direction;
  scatterTarget: GridPosition;
}

interface PowerUp {
  type: 'speed' | 'freeze' | 'magnet' | 'shield';
  gridPos: GridPosition;
  duration: number;
  icon: string;
}

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface GameState {
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
  particles: Particle[];
  gamePhase: 'ready' | 'playing' | 'levelComplete' | 'gameOver';
  frightenedTimer: number;
  freezeTimer: number;
  lastUpdate: number;
}

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

export const PacManGame: React.FC<PacManGameProps> = ({ settings, updateHighScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  
  const gameRef = useRef<GameState>({
    pacman: {
      position: { x: 14 * CELL_SIZE, y: 23 * CELL_SIZE },
      gridPos: { row: 23, col: 14 },
      targetGridPos: { row: 23, col: 14 },
      previousGridPos: { row: 23, col: 14 },
      direction: 'none',
      nextDirection: 'none',
      speed: 0.15,
      mouthOpen: true,
      mouthTimer: 0,
      powerUpActive: null,
      powerUpTimer: 0
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
    lastUpdate: 0
  });

  // Initialize game
  const initializeGame = useCallback(() => {
    const game = gameRef.current;
    
    // Deep copy maze template
    game.maze = MAZE_TEMPLATE.map(row => [...row]);
    
    // Initialize pellets
    game.pellets.clear();
    game.powerPellets.clear();
    game.powerUps.clear();
    
    for (let row = 0; row < MAZE_HEIGHT; row++) {
      for (let col = 0; col < MAZE_WIDTH; col++) {
        const cell = game.maze[row][col];
        if (cell === 1) {
          game.pellets.add(`${row},${col}`);
        } else if (cell === 2) {
          game.powerPellets.add(`${row},${col}`);
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
        scatterTarget: { row: 0, col: 25 }
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
        scatterTarget: { row: 0, col: 2 }
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
        scatterTarget: { row: 35, col: 27 }
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
        scatterTarget: { row: 35, col: 0 }
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
      speed: 0.15,
      mouthOpen: true,
      mouthTimer: 0,
      powerUpActive: null,
      powerUpTimer: 0
    };
    
    game.particles = [];
    game.frightenedTimer = 0;
    game.freezeTimer = 0;
    game.gamePhase = 'ready';
  }, []);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const particles = gameRef.current.particles;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      particles.push(new Particle(
        x, y,
        Math.cos(angle) * 100,
        Math.sin(angle) * 100,
        color,
        0.8
      ));
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

  // Handle input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const game = gameRef.current;
      
      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        setPaused(p => !p);
        return;
      }
      
      let nextDir: Direction = 'none';
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          nextDir = 'up';
          break;
        case 'ArrowDown':
        case 's':
          nextDir = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
          nextDir = 'left';
          break;
        case 'ArrowRight':
        case 'd':
          nextDir = 'right';
          break;
      }
      
      if (nextDir !== 'none') {
        game.pacman.nextDirection = nextDir;
        if (game.gamePhase === 'ready') {
          game.gamePhase = 'playing';
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        gameRef.current.pacman.nextDirection = dx > 0 ? 'right' : 'left';
      } else {
        gameRef.current.pacman.nextDirection = dy > 0 ? 'down' : 'up';
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    
    const resizeCanvas = () => {
      canvas.width = MAZE_WIDTH * CELL_SIZE;
      canvas.height = MAZE_HEIGHT * CELL_SIZE;
    };
    
    resizeCanvas();
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
          animationId = requestAnimationFrame(gameLoop);
          return;
        }
        
        // Update Pac-Man
        updatePacMan(deltaTime);
        
        // Update ghosts
        updateGhosts(deltaTime);
        
        // Update particles
        game.particles = game.particles.filter(p => {
          p.update(deltaTime);
          return p.life > 0;
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
        
        // Check collisions
        checkCollisions();
        
        // Check win condition
        if (game.pellets.size === 0 && game.powerPellets.size === 0) {
          game.level++;
          setLevel(game.level);
          initializeGame();
        }
        
        // Update score display
        if (game.score !== score) {
          setScore(game.score);
        }
      }
      
      // Render
      render(ctx);
      
      animationId = requestAnimationFrame(gameLoop);
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
        const key = `${pacman.gridPos.row},${pacman.gridPos.col}`;
        if (game.pellets.has(key)) {
        game.pellets.delete(key);
        game.score += 10 * (game.combo + 1);
        game.combo++;
        game.comboTimer = 2;
        setCombo(game.combo);
        createParticles(pacman.position.x, pacman.position.y, '#ffff00', 5);
        if (settings.soundEnabled) {
          soundManager.playCollect();
        }
      }
      
      if (game.powerPellets.has(key)) {
        game.powerPellets.delete(key);
        game.score += 50 * (game.combo + 1);
        game.frightenedTimer = 8;
        game.ghosts.forEach(ghost => {
          if (ghost.mode !== 'eaten') {
            ghost.mode = 'frightened';
          }
        });
        createParticles(pacman.position.x, pacman.position.y, '#ff00ff', 15);
        if (settings.soundEnabled) {
          soundManager.playPowerUp();
        }
        }
        
        // Collect power-ups
        const powerUpKey = `${pacman.gridPos.row},${pacman.gridPos.col}`;
        if (game.powerUps.has(powerUpKey)) {
          const powerUp = game.powerUps.get(powerUpKey)!;
          game.powerUps.delete(powerUpKey);
          
          pacman.powerUpActive = powerUp.type;
          pacman.powerUpTimer = powerUp.duration;
          
          if (powerUp.type === 'freeze') {
            game.freezeTimer = powerUp.duration;
          }
          
          createParticles(pacman.position.x, pacman.position.y, '#00ff00', 20);
          if (settings.soundEnabled) {
            soundManager.playPowerUp();
          }
        }
      }
    };
    
    const updateGhosts = (deltaTime: number) => {
      const game = gameRef.current;
      
      game.ghosts.forEach(ghost => {
        // Skip if frozen
        if (game.freezeTimer > 0 && ghost.mode !== 'eaten') {
          return;
        }
        
        // Update AI target
        updateGhostAI(ghost);
        
        // Move ghost smoothly
        const currentGridCenter = gridToPixel(ghost.gridPos);
        const distToCenter = Math.sqrt(
          Math.pow(currentGridCenter.x - ghost.position.x, 2) + 
          Math.pow(currentGridCenter.y - ghost.position.y, 2)
        );
        
        // If at grid center, choose next direction
        if (distToCenter < 2) {
          // Choose next direction
          const possibleDirs: Direction[] = ['up', 'down', 'left', 'right'];
          const validDirs = possibleDirs.filter(dir => {
            if (dir === getOppositeDirection(ghost.direction)) return false;
            return canMove(ghost.gridPos, dir);
          });
          
          if (validDirs.length > 0) {
            // Choose direction based on AI
            let bestDir = validDirs[0];
            let bestDistance = Infinity;
            
            validDirs.forEach(dir => {
              const nextPos = getNextGridPos(ghost.gridPos, dir);
              const dist = getDistance(nextPos, ghost.mode === 'scatter' ? ghost.scatterTarget : game.pacman.gridPos);
              
              if (ghost.mode === 'frightened') {
                // Random movement when frightened
                if (Math.random() < 0.5) {
                  bestDir = dir;
                }
              } else if (dist < bestDistance) {
                bestDistance = dist;
                bestDir = dir;
              }
            });
            
            ghost.direction = bestDir;
            ghost.targetGridPos = getNextGridPos(ghost.gridPos, ghost.direction);
          }
        }
        
        // Move in current direction
        if (ghost.direction !== 'none') {
          const speed = ghost.mode === 'frightened' ? ghost.speed * 0.5 : 
                       ghost.mode === 'eaten' ? ghost.speed * 2 : ghost.speed;
          const moveDistance = speed * CELL_SIZE * deltaTime;
          
          switch (ghost.direction) {
            case 'up':
              ghost.position.y -= moveDistance;
              break;
            case 'down':
              ghost.position.y += moveDistance;
              break;
            case 'left':
              ghost.position.x -= moveDistance;
              break;
            case 'right':
              ghost.position.x += moveDistance;
              break;
          }
          
          // Update grid position when crossing grid boundaries
          const newGridPos = pixelToGrid(ghost.position);
          if (newGridPos.row !== ghost.gridPos.row || newGridPos.col !== ghost.gridPos.col) {
            ghost.gridPos = newGridPos;
          }
        }
      });
    };
    
    const updateGhostAI = (ghost: Ghost) => {
      const game = gameRef.current;
      
      // Switch between chase and scatter modes
      const timeInLevel = (Date.now() / 1000) % 20;
      if (ghost.mode !== 'frightened' && ghost.mode !== 'eaten') {
        ghost.mode = timeInLevel < 15 ? 'chase' : 'scatter';
      }
      
      // Return to normal after being eaten
      if (ghost.mode === 'eaten' && ghost.gridPos.row === 14 && ghost.gridPos.col === 14) {
        ghost.mode = 'chase';
      }
    };
    
    const getOppositeDirection = (dir: Direction): Direction => {
      switch (dir) {
        case 'up': return 'down';
        case 'down': return 'up';
        case 'left': return 'right';
        case 'right': return 'left';
        default: return 'none';
      }
    };
    
    const getDistance = (a: GridPosition, b: GridPosition): number => {
      return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
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
            game.score += 200 * (game.combo + 1);
            game.combo++;
            game.comboTimer = 2;
            setCombo(game.combo);
            createParticles(ghost.position.x, ghost.position.y, ghost.color, 20);
            if (settings.soundEnabled) {
              soundManager.playHit();
            }
          } else if (ghost.mode !== 'eaten' && pacman.powerUpActive !== 'shield') {
            // Pac-Man dies
            game.lives--;
            setLives(game.lives);
            createParticles(pacman.position.x, pacman.position.y, '#ffff00', 30);
            
            if (game.lives <= 0) {
              setGameOver(true);
              updateHighScore('pacman', game.score);
              if (settings.soundEnabled) {
                soundManager.playGameOver();
              }
            } else {
              // Reset positions
              pacman.position = { x: 14 * CELL_SIZE, y: 23 * CELL_SIZE };
              pacman.gridPos = { row: 23, col: 14 };
              pacman.targetGridPos = { row: 23, col: 14 };
              pacman.direction = 'none';
              pacman.nextDirection = 'none';
              
              if (settings.soundEnabled) {
                soundManager.playGameOver();
              }
            }
          } else if (pacman.powerUpActive === 'shield') {
            // Shield protects
            pacman.powerUpActive = null;
            pacman.powerUpTimer = 0;
            createParticles(pacman.position.x, pacman.position.y, '#00ffff', 20);
          }
        }
      });
    };
    
    const render = (ctx: CanvasRenderingContext2D) => {
      const game = gameRef.current;
      
      // Clear canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add glow effect
      ctx.shadowBlur = 20;
      
      // Draw maze
      ctx.strokeStyle = '#0044ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#0044ff';
      
      for (let row = 0; row < MAZE_HEIGHT; row++) {
        for (let col = 0; col < MAZE_WIDTH; col++) {
          if (game.maze[row][col] === 0) {
            const x = col * CELL_SIZE;
            const y = row * CELL_SIZE;
            
            // Draw walls with proper connections
            ctx.beginPath();
            if (row > 0 && game.maze[row - 1][col] === 0) {
              ctx.moveTo(x + CELL_SIZE / 2, y);
              ctx.lineTo(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
            }
            if (row < MAZE_HEIGHT - 1 && game.maze[row + 1][col] === 0) {
              ctx.moveTo(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
              ctx.lineTo(x + CELL_SIZE / 2, y + CELL_SIZE);
            }
            if (col > 0 && game.maze[row][col - 1] === 0) {
              ctx.moveTo(x, y + CELL_SIZE / 2);
              ctx.lineTo(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
            }
            if (col < MAZE_WIDTH - 1 && game.maze[row][col + 1] === 0) {
              ctx.moveTo(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
              ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE / 2);
            }
            ctx.stroke();
          }
        }
      }
      
      // Draw pellets
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 5;
      game.pellets.forEach(key => {
        const [row, col] = key.split(',').map(Number);
        ctx.beginPath();
        ctx.arc(col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw power pellets
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 10;
      game.powerPellets.forEach(key => {
        const [row, col] = key.split(',').map(Number);
        const pulse = Math.sin(Date.now() / 200) * 2 + 6;
        ctx.beginPath();
        ctx.arc(col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2, pulse, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw power-ups
      game.powerUps.forEach((powerUp, key) => {
        const [row, col] = key.split(',').map(Number);
        const x = col * CELL_SIZE + CELL_SIZE / 2;
        const y = row * CELL_SIZE + CELL_SIZE / 2;
        
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerUp.icon, x, y);
      });
      
      // Draw particles
      game.particles.forEach(particle => {
        particle.draw(ctx);
      });
      
      // Draw ghosts
      game.ghosts.forEach(ghost => {
        ctx.save();
        ctx.translate(ghost.position.x, ghost.position.y);
        
        if (ghost.mode === 'frightened') {
          ctx.fillStyle = game.frightenedTimer < 2 ? '#ffffff' : '#0000ff';
          ctx.shadowColor = '#0000ff';
        } else if (ghost.mode === 'eaten') {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
        } else {
          ctx.fillStyle = ghost.color;
          ctx.shadowColor = ghost.color;
        }
        
        ctx.shadowBlur = 20;
        
        // Ghost body
        ctx.beginPath();
        ctx.arc(0, -4, 8, Math.PI, 0, true);
        ctx.lineTo(8, 8);
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(8 - i * 4 - 2, 8 - (i % 2) * 3);
        }
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.fill();
        
        // Eyes
        if (ghost.mode !== 'eaten') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-3, -4, 2, 0, Math.PI * 2);
          ctx.arc(3, -4, 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(-3, -4, 1, 0, Math.PI * 2);
          ctx.arc(3, -4, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      });
      
      // Draw Pac-Man
      ctx.save();
      ctx.translate(game.pacman.position.x, game.pacman.position.y);
      
      // Power-up effects
      if (game.pacman.powerUpActive) {
        ctx.shadowBlur = 30;
        switch (game.pacman.powerUpActive) {
          case 'speed':
            ctx.shadowColor = '#00ffff';
            break;
          case 'shield':
            ctx.shadowColor = '#00ff00';
            break;
          case 'magnet':
            ctx.shadowColor = '#ff00ff';
            break;
        }
      } else {
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 20;
      }
      
      ctx.fillStyle = '#ffff00';
      
      // Draw trail if speed power-up is active
      if (game.pacman.powerUpActive === 'speed') {
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 5; i++) {
          const offset = i * 4;
          ctx.beginPath();
          ctx.arc(-offset * Math.cos(getDirectionAngle(game.pacman.direction)), 
                  -offset * Math.sin(getDirectionAngle(game.pacman.direction)), 
                  8 - i, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      
      // Rotate based on direction
      ctx.rotate(getDirectionAngle(game.pacman.direction));
      
      // Draw Pac-Man
      ctx.beginPath();
      if (game.pacman.mouthOpen) {
        ctx.arc(0, 0, 10, 0.2 * Math.PI, 1.8 * Math.PI);
      } else {
        ctx.arc(0, 0, 10, 0, 2 * Math.PI);
      }
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
      
      // Draw combo meter
      if (game.combo > 0) {
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 20;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${game.combo}x COMBO!`, canvas.width / 2, 50);
      }
      
      // Draw HUD
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${game.score}`, 10, 20);
      ctx.fillText(`Level: ${game.level}`, 10, 40);
      ctx.textAlign = 'right';
      ctx.fillText(`Lives: ${game.lives}`, canvas.width - 10, 20);
      
      // Draw power-up indicator
      if (game.pacman.powerUpActive) {
        ctx.textAlign = 'center';
        ctx.fillText(`Power: ${game.pacman.powerUpActive.toUpperCase()} ${Math.ceil(game.pacman.powerUpTimer)}s`, 
                     canvas.width / 2, 20);
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
    
    animationId = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameOver, paused, settings.soundEnabled, initializeGame, createParticles, updateHighScore, score]);

  // Spawn power-ups periodically
  useEffect(() => {
    const spawnPowerUp = () => {
      const game = gameRef.current;
      if (game.gamePhase !== 'playing' || paused || gameOver) return;
      
      // Find empty spots
      const emptySpots: GridPosition[] = [];
      for (let row = 0; row < MAZE_HEIGHT; row++) {
        for (let col = 0; col < MAZE_WIDTH; col++) {
          if (game.maze[row][col] !== 0 && 
              !game.pellets.has(`${row},${col}`) &&
              !game.powerPellets.has(`${row},${col}`) &&
              !game.powerUps.has(`${row},${col}`)) {
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
        
        game.powerUps.set(`${spot.row},${spot.col}`, {
          type: powerUp.type,
          gridPos: spot,
          duration: 5,
          icon: powerUp.icon
        });
      }
    };
    
    const interval = setInterval(spawnPowerUp, 15000);
    return () => clearInterval(interval);
  }, [paused, gameOver]);

  const resetGame = () => {
    initializeGame();
    setGameOver(false);
    setPaused(false);
    setScore(0);
    setLives(3);
    setLevel(1);
    setCombo(0);
    gameRef.current.score = 0;
    gameRef.current.lives = 3;
    gameRef.current.level = 1;
    gameRef.current.combo = 0;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="relative bg-black rounded-lg shadow-2xl overflow-hidden">
        <FadingCanvas 
          ref={canvasRef} 
          width={MAZE_WIDTH * CELL_SIZE}
          height={MAZE_HEIGHT * CELL_SIZE}
        />
        
        {gameOver && <GameOverBanner score={score} onRestart={resetGame} />}
        
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
      
      <div className="mt-4 flex gap-4">
        <button
          onClick={() => setPaused(!paused)}
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
      
      <div className="mt-4 text-white text-center">
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