import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { particleManager } from '../../core/ParticleSystem';
import { FadingCanvas } from "../ui/FadingCanvas";
import { GameOverBanner } from "../ui/GameOverBanner";
import { GameProps } from '../../core/GameTypes';

interface Position {
  x: number;
  y: number;
}

interface Ghost extends Position {
  color: string;
  mode: 'chase' | 'scatter' | 'frightened';
  targetX: number;
  targetY: number;
  speed: number;
}

interface GameRef {
  pacman: Position & { direction: Position; nextDirection: Position };
  ghosts: Ghost[];
  dots: boolean[][];
  powerPellets: Position[];
  score: number;
  frightenedTimer: number;
  level: number;
}

export const PacManGame: React.FC<GameProps> = ({ settings, updateHighScore }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [powerMode, setPowerMode] = useState(false);
  const [powerTimer, setPowerTimer] = useState(0);
  const [debugInfo, setDebugInfo] = useState('Initializing...');

  // Touch gesture state management
  const [touchState, setTouchState] = useState({
    isActive: false,
    startPoint: null,
    currentPoint: null,
    startTime: 0,
    direction: null,
    showTouchFeedback: false,
    feedbackPosition: null
  });

  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isTracking: false,
    minSwipeDistance: 30,      // Minimum pixels for swipe
    maxSwipeTime: 800,         // Maximum time for swipe (ms)
    tapThreshold: 10,          // Maximum movement for tap
    velocity: { x: 0, y: 0 }   // Current swipe velocity
  });

  const gameRef = useRef({
    // Store the original maze template (immutable)
    originalMaze: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,3,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,3,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
      [1,2,2,2,2,2,2,1,1,2,2,2,1,1,2,2,2,1,1,2,2,2,2,2,2,1],
      [1,1,1,1,1,1,2,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1],
      [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0],
      [1,1,1,1,1,1,2,1,1,0,1,1,0,0,0,1,1,0,1,1,2,1,1,1,1,1],
      [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0],
      [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1],
      [0,0,0,0,0,1,2,1,1,0,1,0,0,0,0,0,1,0,1,1,2,1,0,0,0,0],
      [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1],
      [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0],
      [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1],
      [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0],
      [1,1,1,1,1,1,2,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,2,1],
      [1,3,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,3,1],
      [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
      [1,2,2,2,2,2,2,1,1,2,2,2,1,1,2,2,2,1,1,2,2,2,2,2,2,1],
      [1,2,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],

    // Working maze (will be modified during gameplay)  
    maze: [],

    // Store original positions for complete reset
    originalPositions: {
      pacman: { x: 13, y: 23, direction: 0, nextDirection: 0 },
      ghosts: [
        { x: 13, y: 11, direction: 0, mode: 'scatter', name: 'Blinky' },
        { x: 13, y: 13, direction: 2, mode: 'scatter', name: 'Pinky' },
        { x: 12, y: 13, direction: 1, mode: 'scatter', name: 'Inky' },
        { x: 14, y: 13, direction: 3, mode: 'scatter', name: 'Clyde' }
      ]
    },

    // Track game state for proper cleanup
    gameState: {
      timers: {
        modeTimer: 0,
        frightTimer: 0,
        powerTimer: 0
      },
      counters: {
        dotsRemaining: 0,
        level: 1,
        score: 0,
        lives: 3
      },
      flags: {
        gameOver: false,
        paused: false,
        powerMode: false
      }
    },
    
    // Game mechanics
    lastUpdate: 0,
    powerPellets: [],
    dotsRemaining: 0,
    modeTimer: 0,
    frightTimer: 0,
    directions: [
      { x: 1, y: 0 },   // Right
      { x: 0, y: -1 },  // Up  
      { x: -1, y: 0 },  // Left
      { x: 0, y: 1 }    // Down
    ],
    
    // Colors
    colors: {
      wall: '#0080ff',
      dot: '#ffff00',
      powerPellet: '#ffff00',
      pacman: '#ffff00',
      pacmanMouth: '#000000',
      frightened: '#0000ff',
      background: '#000022'
    }
  });

  // Initialize game
  const initializeGame = useCallback(() => {
    const game = gameRef.current;
    
    // Count dots and mark power pellets
    let dots = 0;
    game.powerPellets = [];
    
    for (let y = 0; y < game.maze.length; y++) {
      for (let x = 0; x < game.maze[y].length; x++) {
        if (game.maze[y][x] === 2) {
          dots++;
        } else if (game.maze[y][x] === 3) {
          game.powerPellets.push({x, y});
          dots++;
        }
      }
    }
    
    game.dotsRemaining = dots;
    game.modeTimer = 0;
    game.frightTimer = 0;
    
    // Reset positions
    game.pacman = { x: 13, y: 23, direction: 0, nextDirection: 0, speed: 0.1 + level * 0.005 };
    game.ghosts = [
      { 
        x: 13, y: 11, direction: 0, mode: 'scatter', color: '#ff0000', name: 'Blinky', 
        speed: 0.08 + level * 0.002,
        lastDirectionChange: 0,
        directionChangeTimeout: 0,
        stuckCounter: 0,
        previousPosition: { x: 13, y: 11 },
        targetHistory: []
      },
      { 
        x: 13, y: 13, direction: 2, mode: 'scatter', color: '#ffb8ff', name: 'Pinky', 
        speed: 0.08 + level * 0.002,
        lastDirectionChange: 0,
        directionChangeTimeout: 0,
        stuckCounter: 0,
        previousPosition: { x: 13, y: 13 },
        targetHistory: []
      },
      { 
        x: 12, y: 13, direction: 1, mode: 'scatter', color: '#00ffff', name: 'Inky', 
        speed: 0.08 + level * 0.002,
        lastDirectionChange: 0,
        directionChangeTimeout: 0,
        stuckCounter: 0,
        previousPosition: { x: 12, y: 13 },
        targetHistory: []
      },
      { 
        x: 14, y: 13, direction: 3, mode: 'scatter', color: '#ffb852', name: 'Clyde', 
        speed: 0.08 + level * 0.002,
        lastDirectionChange: 0,
        directionChangeTimeout: 0,
        stuckCounter: 0,
        previousPosition: { x: 14, y: 13 },
        targetHistory: []
      }
    ];
  }, [level]);

  // Create complete maze reset function
  const resetMazeToOriginal = useCallback(() => {
    const game = gameRef.current;

    // Deep clone the original maze to avoid reference issues
    game.maze = game.originalMaze.map(row => [...row]);

    // Count initial dots and power pellets
    let totalDots = 0;
    game.powerPellets = [];

    for (let y = 0; y < game.maze.length; y++) {
      for (let x = 0; x < game.maze[y].length; x++) {
        if (game.maze[y][x] === 2) {
          totalDots++;
        } else if (game.maze[y][x] === 3) {
          game.powerPellets.push({ x, y });
          totalDots++;
        }
      }
    }

    game.dotsRemaining = totalDots;
    console.log(`Maze reset: ${totalDots} dots, ${game.powerPellets.length} power pellets`);
  }, []);

  // Check if position is walkable
  const isWalkable = useCallback((x, y) => {
    const game = gameRef.current;
    if (y < 0 || y >= game.maze.length || x < 0 || x >= game.maze[y].length) {
      return false;
    }
    return game.maze[y][x] !== 1;
  }, []);

  // Enhanced collision detection that accounts for Pac-Man's size
  const checkCollisionWithRadius = useCallback((x, y, radius = 0.4) => {
    const game = gameRef.current;

    // Check all four corners of Pac-Man's bounding box
    const corners = [
      { x: x - radius, y: y - radius }, // Top-left
      { x: x + radius, y: y - radius }, // Top-right  
      { x: x - radius, y: y + radius }, // Bottom-left
      { x: x + radius, y: y + radius }  // Bottom-right
    ];

    // Also check center and edge midpoints for thoroughness
    const checkPoints = [
      ...corners,
      { x: x, y: y - radius },         // Top center
      { x: x, y: y + radius },         // Bottom center
      { x: x - radius, y: y },         // Left center  
      { x: x + radius, y: y },         // Right center
      { x: x, y: y }                   // Center
    ];

    for (const point of checkPoints) {
      // Handle tunnel wrapping for horizontal edges
      let checkX = point.x;
      if (checkX < 0) checkX = 25 + (checkX % 1);
      if (checkX > 25) checkX = (checkX % 1);

      const tileX = Math.floor(checkX);
      const tileY = Math.floor(point.y);

      // Boundary checks
      if (tileY < 0 || tileY >= game.maze.length) return false;
      if (tileX < 0 || tileX >= game.maze[tileY].length) {
        // Allow horizontal tunnel wrapping
        if (tileY === 12 && (tileX < 0 || tileX >= 26)) continue;
        return false;
      }

      // Check if tile is walkable
      if (game.maze[tileY][tileX] === 1) return false;
    }

    return true;
  }, []);

  // Handle tunnel wrapping
  const wrapPosition = useCallback((x, y) => {
    if (x < 0) x = 25;
    if (x > 25) x = 0;
    return { x, y };
  }, []);

  // Improved intersection detection with hysteresis
  const isAtValidIntersection = useCallback((ghost, threshold = 0.15) => {
    const game = gameRef.current;
    const currentX = Math.floor(ghost.x + 0.5);
    const currentY = Math.floor(ghost.y + 0.5);

    // Check if ghost is close enough to tile center
    const centerDistance = Math.sqrt(
      Math.pow(ghost.x - currentX, 2) +
      Math.pow(ghost.y - currentY, 2)
    );

    if (centerDistance > threshold) return false;

    // Count available directions from this position
    const availableDirections = [0, 1, 2, 3].filter(dir => {
      const dirVector = game.directions[dir];
      const testX = Math.floor(currentX + dirVector.x);
      const testY = Math.floor(currentY + dirVector.y);
      return isWalkable(testX, testY);
    });

    // Only consider it an intersection if there are 3+ directions or it's a forced turn
    return availableDirections.length >= 3 ||
           !availableDirections.includes(ghost.direction);
  }, [isWalkable]);

  // Get ghost target based on mode and personality
  const getGhostTarget = useCallback((ghost, pacman) => {
    const { x: px, y: py, direction: pDir } = pacman;
    const pDirVector = gameRef.current.directions[pDir];
    
    switch (ghost.name) {
      case 'Blinky': // Direct chase
        return { x: px, y: py };
      case 'Pinky': // Ambush ahead of Pac-Man
        return { x: px + pDirVector.x * 4, y: py + pDirVector.y * 4 };
      case 'Inky': // Complex targeting
        const blinky = gameRef.current.ghosts[0];
        const targetX = px + pDirVector.x * 2;
        const targetY = py + pDirVector.y * 2;
        return { 
          x: targetX + (targetX - blinky.x), 
          y: targetY + (targetY - blinky.y) 
        };
      case 'Clyde': // Patrol behavior
        const dist = Math.sqrt((ghost.x - px) ** 2 + (ghost.y - py) ** 2);
        return dist > 8 ? { x: px, y: py } : { x: 0, y: 24 };
      default:
        return { x: px, y: py };
    }
  }, []);

  // Game loop
  const gameLoop = useCallback((timestamp) => {
    if (gameOver || paused) return;

    const game = gameRef.current;
    const deltaTime = Math.min(timestamp - game.lastUpdate, 50) / 1000;
    game.lastUpdate = timestamp;

    // Update mode timers
    game.modeTimer += deltaTime;
    if (game.frightTimer > 0) {
      game.frightTimer -= deltaTime;
      if (game.frightTimer <= 0) {
        game.ghosts.forEach(ghost => {
          if (ghost.mode === 'frightened') {
            ghost.mode = 'chase';
          }
        });
        setPowerMode(false);
        setPowerTimer(0);
      } else {
        setPowerTimer(game.frightTimer);
      }
    }

    // Update Pac-Man with enhanced collision detection
    const pacman = game.pacman;

    // Check if we can change direction with lookahead
    const nextDir = game.directions[pacman.nextDirection];
    const lookaheadDistance = 0.6; // Look ahead more than current radius
    const testNextX = pacman.x + nextDir.x * lookaheadDistance;
    const testNextY = pacman.y + nextDir.y * lookaheadDistance;

    if (checkCollisionWithRadius(testNextX, testNextY)) {
      pacman.direction = pacman.nextDirection;
    }

    // Calculate new position based on current direction
    const moveDir = game.directions[pacman.direction];
    const proposedX = pacman.x + moveDir.x * pacman.speed;
    const proposedY = pacman.y + moveDir.y * pacman.speed;

    // Validate movement with collision detection
    if (checkCollisionWithRadius(proposedX, proposedY)) {
      // Movement is valid - apply it
      pacman.x = proposedX;
      pacman.y = proposedY;

      // Handle tunnel wrapping (only for horizontal movement)
      if (pacman.y >= 12 && pacman.y <= 13) { // Tunnel row
        if (pacman.x < -0.5) pacman.x = 25.5;
        if (pacman.x > 25.5) pacman.x = -0.5;
      }
    } else {
      // Movement blocked - try to slide along walls
      // Test X movement only
      if (checkCollisionWithRadius(proposedX, pacman.y)) {
        pacman.x = proposedX;
      }
      // Test Y movement only  
      else if (checkCollisionWithRadius(pacman.x, proposedY)) {
        pacman.y = proposedY;
      }
      // If both fail, Pac-Man stays in current position
    }

    // Eat dots and power pellets with precise positioning
    const pacCenterX = Math.floor(pacman.x + 0.5);
    const pacCenterY = Math.floor(pacman.y + 0.5);

    // Only collect dots when Pac-Man's center is close to tile center
    const distanceFromCenter = Math.sqrt(
      Math.pow(pacman.x - pacCenterX + 0.5, 2) +
      Math.pow(pacman.y - pacCenterY + 0.5, 2)
    );

    if (distanceFromCenter < 0.3 && game.maze[pacCenterY] && game.maze[pacCenterY][pacCenterX] === 2) {
      game.maze[pacCenterY][pacCenterX] = 0;
      game.dotsRemaining--;
      setScore(prev => prev + 10);
      
      // Dot collection particles
      for (let i = 0; i < 3; i++) {
        particleManager.getParticleSystem().addParticle({
          x: pacman.x * 20,
          y: pacman.y * 20,
          vx: (Math.random() - 0.5) * 50,
          vy: (Math.random() - 0.5) * 50,
          color: game.colors.dot,
          life: 300,
          size: 2
        });
      }
      
      if (settings.sound) {
        soundManager.playCollect();
      }
    } else if (game.maze[pacCenterY] && game.maze[pacCenterY][pacCenterX] === 3) {
      game.maze[pacCenterY][pacCenterX] = 0;
      game.dotsRemaining--;
      setScore(prev => prev + 50);
      
      // Power pellet effect
      game.frightTimer = 8; // 8 seconds of power mode
      game.ghosts.forEach(ghost => {
        ghost.mode = 'frightened';
        ghost.direction = (ghost.direction + 2) % 4; // Reverse direction
      });
      
      setPowerMode(true);
      setPowerTimer(8);
      
      // Power pellet particles
      for (let i = 0; i < 10; i++) {
        particleManager.getParticleSystem().addParticle({
          x: pacman.x * 20,
          y: pacman.y * 20,
          vx: (Math.random() - 0.5) * 100,
          vy: (Math.random() - 0.5) * 100,
          color: game.colors.powerPellet,
          life: 800,
          size: 3
        });
      }
      
      if (settings.sound) {
        soundManager.playPowerUp();
      }
    }

    // Update ghosts with enhanced AI
    game.ghosts.forEach((ghost, index) => {
      const currentTime = timestamp;

      // Update stuck detection
      const positionDistance = Math.sqrt(
        Math.pow(ghost.x - ghost.previousPosition.x, 2) +
        Math.pow(ghost.y - ghost.previousPosition.y, 2)
      );

      if (positionDistance < 0.01) {
        ghost.stuckCounter++;
      } else {
        ghost.stuckCounter = 0;
        ghost.previousPosition = { x: ghost.x, y: ghost.y };
      }

      // Force direction change if stuck for too long
      const forceDirectionChange = ghost.stuckCounter > 30;

      // Check if direction change is allowed
      const timeSinceLastChange = currentTime - ghost.lastDirectionChange;
      const canChangeDirection =
        timeSinceLastChange > ghost.directionChangeTimeout ||
        forceDirectionChange ||
        !isWalkable(
          Math.floor(ghost.x + game.directions[ghost.direction].x),
          Math.floor(ghost.y + game.directions[ghost.direction].y)
        );

      // Only consider direction changes at valid intersections or when forced
      if (canChangeDirection && (isAtValidIntersection(ghost) || forceDirectionChange)) {

        // Get target based on current mode
        let target;
        if (ghost.mode === 'frightened') {
          // Run away from Pac-Man when frightened
          target = {
            x: ghost.x + (ghost.x - pacman.x) * 2,
            y: ghost.y + (ghost.y - pacman.y) * 2
          };
        } else {
          target = getGhostTarget(ghost, pacman);
        }

        // Get all valid directions (never reverse unless it's the only option)
        const allDirections = [0, 1, 2, 3].filter(dir => {
          const dirVector = game.directions[dir];
          const newX = Math.floor(ghost.x + dirVector.x * 0.8);
          const newY = Math.floor(ghost.y + dirVector.y * 0.8);
          return isWalkable(newX, newY);
        });

        // Remove reverse direction unless it's the only option or ghost is stuck
        const reverseDirection = (ghost.direction + 2) % 4;
        const forwardDirections = allDirections.filter(dir => dir !== reverseDirection);
        const validDirections = (forwardDirections.length > 0 && !forceDirectionChange) ?
                               forwardDirections : allDirections;

        if (validDirections.length > 0) {
          // Score each direction based on distance to target
          const directionScores = validDirections.map(dir => {
            const dirVector = game.directions[dir];
            const futureX = ghost.x + dirVector.x * 3; // Look ahead 3 tiles
            const futureY = ghost.y + dirVector.y * 3;

            const distance = Math.sqrt(
              Math.pow(futureX - target.x, 2) +
              Math.pow(futureY - target.y, 2)
            );

            // Add penalty for recently chosen directions to prevent cycling
            const recentPenalty = ghost.targetHistory.includes(dir) ? 2 : 0;

            // Add random factor to prevent deterministic behavior
            const randomFactor = Math.random() * 1.5;

            return {
              direction: dir,
              score: distance + recentPenalty + randomFactor
            };
          });

          // Choose direction with best (lowest) score
          directionScores.sort((a, b) => a.score - b.score);
          const chosenDirection = directionScores[0].direction;

          if (chosenDirection !== ghost.direction) {
            ghost.direction = chosenDirection;
            ghost.lastDirectionChange = currentTime;
            ghost.directionChangeTimeout = ghost.mode === 'frightened' ? 200 : 400; // ms
            ghost.stuckCounter = 0;

            // Update target history (keep last 3 directions)
            ghost.targetHistory.push(chosenDirection);
            if (ghost.targetHistory.length > 3) {
              ghost.targetHistory.shift();
            }
          }
        }
      }

      // Move ghost with enhanced collision detection
      const ghostDir = game.directions[ghost.direction];
      const proposedX = ghost.x + ghostDir.x * ghost.speed;
      const proposedY = ghost.y + ghostDir.y * ghost.speed;

      // Check if movement is valid
      if (checkCollisionWithRadius(proposedX, proposedY, 0.3)) {
        ghost.x = proposedX;
        ghost.y = proposedY;

        // Handle tunnel wrapping
        if (ghost.y >= 12 && ghost.y <= 13) {
          if (ghost.x < -0.5) ghost.x = 25.5;
          if (ghost.x > 25.5) ghost.x = -0.5;
        }
      } else {
        // Movement blocked - force direction change on next update
        ghost.directionChangeTimeout = 0;
        ghost.stuckCounter += 5; // Increase stuck counter more rapidly
      }

      // Check collision with Pac-Man
      const dist = Math.sqrt((ghost.x - pacman.x) ** 2 + (ghost.y - pacman.y) ** 2);
      if (dist < 0.7) {
        if (ghost.mode === 'frightened') {
          // Eat ghost
          setScore(prev => prev + 200 * (index + 1));
          ghost.x = 13;
          ghost.y = 13;
          ghost.mode = 'scatter';
          
          // Ghost eaten particles
          for (let i = 0; i < 8; i++) {
            particleManager.getParticleSystem().addParticle({
              x: ghost.x * 20,
              y: ghost.y * 20,
              vx: (Math.random() - 0.5) * 80,
              vy: (Math.random() - 0.5) * 80,
              color: '#ffffff',
              life: 500,
              size: 3
            });
          }
          
          if (settings.sound) {
            soundManager.playHit();
          }
        } else {
          // Pac-Man dies
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameOver(true);
              updateHighScore('pac-man', score);
              if (settings.sound) {
                soundManager.playGameOver();
              }
            } else {
              // Reset positions
              pacman.x = 13;
              pacman.y = 23;
              pacman.direction = 0;
              game.ghosts.forEach((g, i) => {
                g.x = 13;
                g.y = 11 + (i > 0 ? 2 : 0);
                g.mode = 'scatter';
              });
              if (settings.sound) {
                soundManager.playHit();
              }
            }
            return newLives;
          });
        }
      }
    });

    // Check for level completion
    if (game.dotsRemaining <= 0) {
      console.log(`Level ${level} completed! Advancing to level ${level + 1}...`);
      
      // Reset maze but keep level progression
      resetMazeToOriginal();
      
      // Reset positions but maintain speed increases
      const originalPacman = game.originalPositions.pacman;
      game.pacman = {
        ...originalPacman,
        speed: 0.1 + (level + 1) * 0.005 // Increase speed with level
      };

      game.ghosts = game.originalPositions.ghosts.map((originalGhost, index) => ({
        x: originalGhost.x,
        y: originalGhost.y,
        direction: originalGhost.direction,
        mode: originalGhost.mode,
        color: ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'][index],
        name: originalGhost.name,
        speed: 0.08 + (level + 1) * 0.002, // Increase ghost speed with level

        // Reset AI state
        lastDirectionChange: 0,
        directionChangeTimeout: 0,
        stuckCounter: 0,
        previousPosition: { x: originalGhost.x, y: originalGhost.y },
        targetHistory: []
      }));

      // Clear effects but maintain game progress
      game.modeTimer = 0;
      game.frightTimer = 0;
      setPowerMode(false);
      setPowerTimer(0);

      // Add level bonus and advance level
      setScore(prev => prev + 1000);
      setLevel(prev => prev + 1);
      
      console.log(`Level ${level + 1} initialized with increased difficulty`);
    }

    // Update particles
    particleManager.update(deltaTime);

    // Render
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('PacManGame: Canvas lost during game loop');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('PacManGame: Could not get 2D context');
      return;
    }
    
    const cellSize = canvas.width / 26;
    
    // Debug: check if cellSize is valid
    if (cellSize <= 0 || !isFinite(cellSize)) {
      console.error('Invalid cellSize:', cellSize, 'canvas.width:', canvas.width);
      return;
    }
    
    // Clear canvas with dark blue background (more visible than black)
    ctx.fillStyle = '#001133';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Debug: log rendering info occasionally
    if (Math.random() < 0.01) {
      console.log('Rendering:', {
        canvasSize: `${canvas.width}x${canvas.height}`,
        cellSize: cellSize,
        pacman: `${game.pacman.x.toFixed(1)}, ${game.pacman.y.toFixed(1)}`,
        score: score
      });
    }
    
    // Draw maze
    ctx.strokeStyle = game.colors.wall;
    ctx.lineWidth = 2;
    
    for (let y = 0; y < game.maze.length; y++) {
      for (let x = 0; x < game.maze[y].length; x++) {
        const cell = game.maze[y][x];
        const px = x * cellSize;
        const py = y * cellSize;
        
        if (cell === 1) {
          // Wall - bright blue
          ctx.fillStyle = '#00aaff';
          ctx.fillRect(px, py, cellSize, cellSize);
        } else if (cell === 2) {
          // Dot - bright yellow
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(px + cellSize/2, py + cellSize/2, Math.max(2, cellSize/8), 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 3) {
          // Power pellet - bright yellow, larger
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(px + cellSize/2, py + cellSize/2, Math.max(6, cellSize/4), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // Draw Pac-Man - bright yellow
    const pacPx = pacman.x * cellSize;
    const pacPy = pacman.y * cellSize;
    
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    
    // Mouth animation based on direction
    const mouthAngle = Math.sin(timestamp * 0.01) * 0.5 + 0.5;
    const startAngle = (pacman.direction * Math.PI / 2) + (mouthAngle * 0.3);
    const endAngle = startAngle + (Math.PI * 2 - mouthAngle * 0.6);
    
    ctx.arc(pacPx + cellSize/2, pacPy + cellSize/2, Math.max(cellSize/3, 8), startAngle, endAngle);
    ctx.lineTo(pacPx + cellSize/2, pacPy + cellSize/2);
    ctx.fill();
    
    // Draw ghosts
    game.ghosts.forEach(ghost => {
      const ghostPx = ghost.x * cellSize;
      const ghostPy = ghost.y * cellSize;
      
      ctx.fillStyle = ghost.mode === 'frightened' ? 
        (game.frightTimer < 2 && Math.floor(timestamp / 200) % 2 ? '#ffffff' : game.colors.frightened) :
        ghost.color;
      
      // Ghost body - make bigger and more visible
      const ghostRadius = Math.max(cellSize/3, 8);
      ctx.beginPath();
      ctx.arc(ghostPx + cellSize/2, ghostPy + cellSize/2, ghostRadius, Math.PI, 0);
      ctx.lineTo(ghostPx + cellSize/2 + ghostRadius, ghostPy + cellSize/2 + ghostRadius);
      ctx.lineTo(ghostPx + cellSize/2 + ghostRadius/2, ghostPy + cellSize/2 + ghostRadius*0.75);
      ctx.lineTo(ghostPx + cellSize/2, ghostPy + cellSize/2 + ghostRadius);
      ctx.lineTo(ghostPx + cellSize/2 - ghostRadius/2, ghostPy + cellSize/2 + ghostRadius*0.75);
      ctx.lineTo(ghostPx + cellSize/2 - ghostRadius, ghostPy + cellSize/2 + ghostRadius);
      ctx.closePath();
      ctx.fill();
      
      // Ghost eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ghostPx + cellSize/2 - 4, ghostPy + cellSize/2 - 2, 3, 0, Math.PI * 2);
      ctx.arc(ghostPx + cellSize/2 + 4, ghostPy + cellSize/2 - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      
      if (ghost.mode !== 'frightened') {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(ghostPx + cellSize/2 - 4, ghostPy + cellSize/2 - 2, 1, 0, Math.PI * 2);
        ctx.arc(ghostPx + cellSize/2 + 4, ghostPy + cellSize/2 - 2, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Draw particles
    particleManager.draw(ctx);
    
  }, [gameOver, paused, isWalkable, wrapPosition, getGhostTarget, resetMazeToOriginal, settings.sound, score, updateHighScore, level, checkCollisionWithRadius, isAtValidIntersection]);

  // Input handling
  const handleInput = useCallback((direction) => {
    if (gameOver || paused) return;
    gameRef.current.pacman.nextDirection = direction;
  }, [gameOver, paused]);

  // Touch event handlers - moved outside useEffect to avoid React hook violations
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (gameOver || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // Initialize touch tracking
    touchStateRef.current = {
      ...touchStateRef.current,
      startX: touchX,
      startY: touchY,
      currentX: touchX,
      currentY: touchY,
      startTime: performance.now(),
      isTracking: true,
      velocity: { x: 0, y: 0 }
    };

    // Show touch feedback
    setTouchState(prev => ({
      ...prev,
      isActive: true,
      startPoint: { x: touchX, y: touchY },
      currentPoint: { x: touchX, y: touchY },
      startTime: performance.now(),
      showTouchFeedback: true,
      feedbackPosition: { x: touchX, y: touchY }
    }));

    console.log('Touch started at:', touchX, touchY);
  }, [gameOver]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!touchStateRef.current.isTracking || gameOver || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // Update current position and calculate velocity
    const deltaTime = performance.now() - touchStateRef.current.startTime;
    if (deltaTime > 0) {
      touchStateRef.current.velocity = {
        x: (touchX - touchStateRef.current.startX) / deltaTime,
        y: (touchY - touchStateRef.current.startY) / deltaTime
      };
    }

    touchStateRef.current.currentX = touchX;
    touchStateRef.current.currentY = touchY;

    // Update visual feedback
    setTouchState(prev => ({
      ...prev,
      currentPoint: { x: touchX, y: touchY }
    }));
  }, [gameOver]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!touchStateRef.current.isTracking || gameOver || !canvasRef.current) return;

    const touchData = touchStateRef.current;
    const swipeDistance = Math.sqrt(
      Math.pow(touchData.currentX - touchData.startX, 2) +
      Math.pow(touchData.currentY - touchData.startY, 2)
    );
    const swipeTime = performance.now() - touchData.startTime;

    // Determine gesture type and direction
    let direction = null;
    let gestureType = 'none';

    if (swipeDistance < touchData.tapThreshold) {
      // Handle tap gesture - change direction toward tap location
      gestureType = 'tap';
      const canvas = canvasRef.current;
      const cellSize = canvas.width / 26;
      const pacman = gameRef.current.pacman;

      // Convert touch position to game coordinates
      const gameX = touchData.currentX / cellSize;
      const gameY = touchData.currentY / cellSize;

      // Calculate direction from Pac-Man to tap location
      const dx = gameX - pacman.x;
      const dy = gameY - pacman.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 0 : 2; // Right or Left
      } else {
        direction = dy > 0 ? 3 : 1; // Down or Up
      }

    } else if (swipeDistance >= touchData.minSwipeDistance && swipeTime <= touchData.maxSwipeTime) {
      // Handle swipe gesture
      gestureType = 'swipe';
      const dx = touchData.currentX - touchData.startX;
      const dy = touchData.currentY - touchData.startY;

      // Determine primary swipe direction
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 0 : 2; // Right or Left
      } else {
        direction = dy > 0 ? 3 : 1; // Down or Up
      }

      // Validate swipe velocity (prevent accidental slow drags)
      const velocityThreshold = 0.1; // pixels per ms
      const currentVelocity = Math.sqrt(
        touchData.velocity.x * touchData.velocity.x +
        touchData.velocity.y * touchData.velocity.y
      );

      if (currentVelocity < velocityThreshold) {
        direction = null; // Too slow, ignore
        gestureType = 'drag';
      }
    }

    // Apply direction change if valid
    if (direction !== null) {
      handleInput(direction);

      // Show direction feedback
      const directionNames = ['Right', 'Up', 'Left', 'Down'];
      console.log(`${gestureType} detected: ${directionNames[direction]} (distance: ${swipeDistance.toFixed(1)}px, time: ${swipeTime.toFixed(1)}ms)`);

      // Visual feedback for successful gesture
      setTouchState(prev => ({
        ...prev,
        direction: direction,
        showTouchFeedback: true
      }));

      // Play feedback sound
      if (settings.sound) {
        soundManager.playTone(800, 50);
      }
    }

    // Clear touch tracking
    touchStateRef.current.isTracking = false;

    // Hide feedback after delay
    setTimeout(() => {
      setTouchState(prev => ({
        ...prev,
        isActive: false,
        showTouchFeedback: false,
        direction: null
      }));
    }, 200);

  }, [gameOver, handleInput, settings.sound]);

  // Set up game loop and input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setDebugInfo('ERROR: Canvas ref is null');
      console.error('PacManGame: Canvas ref is null');
      return;
    }
    
    setDebugInfo('Canvas found, setting up...');

    const resizeCanvas = () => {
      // Get full viewport dimensions
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      
      // Use much more of the screen - only leave 80px for header and minimal padding
      const availableWidth = vw - 16; // Only 8px padding on each side
      const availableHeight = vh - 80; // Only 80px for header and controls
      
      // Maintain 26:25 aspect ratio (maze dimensions)
      const aspectRatio = 26 / 25;
      let width = availableWidth;
      let height = width / aspectRatio;
      
      // If height is too big, scale down from height
      if (height > availableHeight) {
        height = availableHeight;
        width = height * aspectRatio;
      }
      
      // Ensure we use at least 80% of available space
      const minWidth = Math.min(availableWidth * 0.8, width);
      const minHeight = Math.min(availableHeight * 0.8, height);
      
      if (width < minWidth) {
        width = minWidth;
        height = width / aspectRatio;
      }
      
      // Set canvas dimensions
      canvas.width = Math.floor(width);
      canvas.height = Math.floor(height);
      canvas.style.width = `${Math.floor(width)}px`;
      canvas.style.height = `${Math.floor(height)}px`;
      
      console.log(`Canvas resized to: ${Math.floor(width)}x${Math.floor(height)} (viewport: ${vw}x${vh})`);
      setDebugInfo(`Canvas: ${Math.floor(width)}x${Math.floor(height)}`);
    };

    try {
      resizeCanvas();
      setDebugInfo('Canvas resized, setting up game loop...');
    } catch (error) {
      console.error('PacManGame: Error in resizeCanvas:', error);
      setDebugInfo(`ERROR: ${error.message}`);
    }
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    // Prevent scrolling when in game
    const preventScroll = (e) => {
      if (e.target === canvas || canvas.contains(e.target)) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventScroll, { passive: false });
    document.addEventListener('touchend', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });

    const handleKeyDown = (e) => {
      if (gameOver) return;
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleInput(2); // Left
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleInput(0); // Right
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleInput(1); // Up
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleInput(3); // Down
          break;
        case ' ':
        case 'Escape':
          e.preventDefault();
          setPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Prevent context menu on long press
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    let animationId;
    let isLoopRunning = false;
    
    const startGameLoop = () => {
      if (gameOver || paused || isLoopRunning) return;
      
      try {
        isLoopRunning = true;
        const animate = (timestamp) => {
          if (gameOver || paused) {
            isLoopRunning = false;
            return;
          }
          gameLoop(timestamp);
          animationId = requestAnimationFrame(animate);
        };
        animationId = requestAnimationFrame(animate);
        setDebugInfo('Game loop started!');
      } catch (error) {
        console.error('PacManGame: Error starting game loop:', error);
        setDebugInfo(`LOOP ERROR: ${error.message}`);
        isLoopRunning = false;
      }
    };

    // Initial render without animation
    try {
      gameLoop(performance.now());
    } catch (error) {
      console.error('PacManGame: Error in initial render:', error);
    }

    startGameLoop();

    return () => {
      isLoopRunning = false;
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
      document.removeEventListener('touchstart', preventScroll);
      document.removeEventListener('touchend', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gameLoop, handleInput, gameOver, paused, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const resetGame = useCallback(() => {
    console.log('Starting complete game reset...');

    const game = gameRef.current;

    // 1. Reset maze to original state
    resetMazeToOriginal();

    // 2. Reset all React state
    setScore(0);
    setLevel(1);
    setLives(3);
    setGameOver(false);
    setPaused(false);
    setPowerMode(false);
    setPowerTimer(0);
    setDebugInfo('Game reset complete');

    // 3. Reset Pac-Man to original position and state
    const originalPacman = game.originalPositions.pacman;
    game.pacman = {
      x: originalPacman.x,
      y: originalPacman.y,
      direction: originalPacman.direction,
      nextDirection: originalPacman.nextDirection,
      speed: 0.1 // Base speed, will be adjusted by initializeGame
    };

    // 4. Reset ghosts to original positions and state
    game.ghosts = game.originalPositions.ghosts.map((originalGhost, index) => ({
      x: originalGhost.x,
      y: originalGhost.y,
      direction: originalGhost.direction,
      mode: originalGhost.mode,
      color: ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'][index],
      name: originalGhost.name,
      speed: 0.08, // Base speed, will be adjusted by initializeGame

      // Reset enhanced AI state
      lastDirectionChange: 0,
      directionChangeTimeout: 0,
      stuckCounter: 0,
      previousPosition: { x: originalGhost.x, y: originalGhost.y },
      targetHistory: []
    }));

    // 5. Clear all particles and effects

    // 6. Reset all timers and counters
    game.lastUpdate = 0;
    game.modeTimer = 0;
    game.frightTimer = 0;

    // 7. Reset game state tracking
    game.gameState = {
      timers: { modeTimer: 0, frightTimer: 0, powerTimer: 0 },
      counters: { dotsRemaining: game.dotsRemaining, level: 1, score: 0, lives: 3 },
      flags: { gameOver: false, paused: false, powerMode: false }
    };

    // 8. Re-initialize with level 1 settings
    initializeGame();

    console.log('Game reset completed:', {
      dotsRemaining: game.dotsRemaining,
      pacmanPosition: `${game.pacman.x}, ${game.pacman.y}`,
      ghostCount: game.ghosts.length,
      particleCount: particleManager.getStats().active
    });
  }, [resetMazeToOriginal, initializeGame]);

  useEffect(() => {
    console.log('PacManGame: Component mounted, initializing game...');
    resetGame();
  }, [resetGame]);

  // Add debugging for game state
  useEffect(() => {
    console.log('PacManGame: Game state changed', { gameOver, paused, score, level, lives });
  }, [gameOver, paused, score, level, lives]);

  return (
    <div className="flex flex-col items-center space-y-4 text-white">
      <div className="text-center space-y-2">
        <div className="flex justify-center space-x-8 text-sm">
          <div>Score: <span className="text-yellow-400">{score.toLocaleString()}</span></div>
          <div>Level: <span className="text-cyan-400">{level}</span></div>
          <div>Lives: <span className="text-red-400">{'● '.repeat(lives)}</span></div>
        </div>
        
        {powerMode && (
          <div className="flex justify-center items-center space-x-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <div className="text-yellow-400 text-sm">
              Power Mode: {powerTimer.toFixed(1)}s
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <canvas 
          ref={canvasRef} 
          className="border border-gray-600 rounded"
          style={{ display: 'block', touchAction: 'none' }}
        />
        
        {/* Touch feedback overlay */}
        {touchState.showTouchFeedback && (
          <div 
            className="absolute pointer-events-none"
            style={{
              left: `${touchState.feedbackPosition?.x || 0}px`,
              top: `${touchState.feedbackPosition?.y || 0}px`,
              transform: 'translate(-50%, -50%)',
              transition: 'opacity 0.2s ease-out'
            }}
          >
            {/* Swipe direction indicator */}
            {touchState.direction !== null && (
              <div className="bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
                {['→', '↑', '←', '↓'][touchState.direction]}
              </div>
            )}

            {/* Touch ripple effect */}
            <div 
              className="absolute inset-0 bg-yellow-400 rounded-full opacity-30 animate-ping"
              style={{
                width: '40px',
                height: '40px',
                marginLeft: '-20px',
                marginTop: '-20px'
              }}
            />
          </div>
        )}
        
        {gameOver && (
          <GameOverBanner
            score={score}
            onRestart={resetGame}
            message={`Level ${level} reached!`}
          />
        )}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => setPaused(!paused)}
          disabled={gameOver}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded flex items-center space-x-2"
        >
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          <span>{paused ? 'Resume' : 'Pause'}</span>
        </button>
        
        <button
          onClick={resetGame}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restart</span>
        </button>
      </div>

      <div className="text-xs text-gray-400 text-center max-w-md">
        <p>Desktop: Use arrow keys or WASD to move</p>
        <p>Mobile: Swipe anywhere on screen or tap where you want to go</p>
        <p className="text-yellow-400 mt-1">
          {touchState.isActive ? 'Touch detected...' : 'Touch controls active'}
        </p>
        <p className="mt-1">Power pellets make ghosts vulnerable. Eat all dots to advance levels!</p>
        <div className="mt-2 text-red-400 font-mono">Debug: {debugInfo}</div>
      </div>
    </div>
  );
};