import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { Particle } from '../../core/ParticleSystem';
import { FadingCanvas } from "../ui/FadingCanvas";
import { GameOverBanner } from "../ui/GameOverBanner";

export const PacManGame = ({ settings, updateHighScore }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [powerMode, setPowerMode] = useState(false);
  const [powerTimer, setPowerTimer] = useState(0);
  const [debugInfo, setDebugInfo] = useState('Initializing...');

  const gameRef = useRef({
    // Game state
    pacman: { x: 13, y: 23, direction: 0, nextDirection: 0, speed: 0.1 },
    ghosts: [
      { x: 13, y: 11, direction: 0, mode: 'scatter', color: '#ff0000', name: 'Blinky', speed: 0.08 },
      { x: 13, y: 13, direction: 2, mode: 'scatter', color: '#ffb8ff', name: 'Pinky', speed: 0.08 },
      { x: 12, y: 13, direction: 1, mode: 'scatter', color: '#00ffff', name: 'Inky', speed: 0.08 },
      { x: 14, y: 13, direction: 3, mode: 'scatter', color: '#ffb852', name: 'Clyde', speed: 0.08 }
    ],
    
    // Maze layout (26x31 grid)
    maze: [
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
    
    // Game mechanics
    lastUpdate: 0,
    particles: [],
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
      { x: 13, y: 11, direction: 0, mode: 'scatter', color: '#ff0000', name: 'Blinky', speed: 0.08 + level * 0.002 },
      { x: 13, y: 13, direction: 2, mode: 'scatter', color: '#ffb8ff', name: 'Pinky', speed: 0.08 + level * 0.002 },
      { x: 12, y: 13, direction: 1, mode: 'scatter', color: '#00ffff', name: 'Inky', speed: 0.08 + level * 0.002 },
      { x: 14, y: 13, direction: 3, mode: 'scatter', color: '#ffb852', name: 'Clyde', speed: 0.08 + level * 0.002 }
    ];
  }, [level]);

  // Check if position is walkable
  const isWalkable = useCallback((x, y) => {
    const game = gameRef.current;
    if (y < 0 || y >= game.maze.length || x < 0 || x >= game.maze[y].length) {
      return false;
    }
    return game.maze[y][x] !== 1;
  }, []);

  // Handle tunnel wrapping
  const wrapPosition = useCallback((x, y) => {
    if (x < 0) x = 25;
    if (x > 25) x = 0;
    return { x, y };
  }, []);

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

    // Update Pac-Man
    const pacman = game.pacman;
    
    // Check if we can change direction
    const nextDir = game.directions[pacman.nextDirection];
    const testNextX = pacman.x + nextDir.x * 0.5;
    const testNextY = pacman.y + nextDir.y * 0.5;
    if (isWalkable(Math.floor(testNextX), Math.floor(testNextY))) {
      pacman.direction = pacman.nextDirection;
    }
    
    // Try to move Pac-Man in current direction
    const moveDir = game.directions[pacman.direction];
    const newX = pacman.x + moveDir.x * pacman.speed;
    const newY = pacman.y + moveDir.y * pacman.speed;
    
    // Check if new position is walkable
    const testX = Math.floor(newX);
    const testY = Math.floor(newY);
    
    if (isWalkable(testX, testY)) {
      // Move is valid
      pacman.x = newX;
      pacman.y = newY;
      
      // Handle tunnel wrapping
      const wrapped = wrapPosition(pacman.x, pacman.y);
      pacman.x = wrapped.x;
    }
    // If move is invalid, Pac-Man stays in current position

    // Eat dots and power pellets
    const pacX = Math.floor(pacman.x);
    const pacY = Math.floor(pacman.y);
    if (game.maze[pacY] && game.maze[pacY][pacX] === 2) {
      game.maze[pacY][pacX] = 0;
      game.dotsRemaining--;
      setScore(prev => prev + 10);
      
      // Dot collection particles
      for (let i = 0; i < 3; i++) {
        game.particles.push(new Particle(
          pacman.x * 20, pacman.y * 20,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          game.colors.dot,
          300
        ));
      }
      
      if (settings.sound) {
        soundManager.playCollect();
      }
    } else if (game.maze[pacY] && game.maze[pacY][pacX] === 3) {
      game.maze[pacY][pacX] = 0;
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
        game.particles.push(new Particle(
          pacman.x * 20, pacman.y * 20,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          game.colors.powerPellet,
          800
        ));
      }
      
      if (settings.sound) {
        soundManager.playPowerUp();
      }
    }

    // Update ghosts
    game.ghosts.forEach((ghost, index) => {
      // Only change direction at intersections or when forced
      const currentX = Math.floor(ghost.x);
      const currentY = Math.floor(ghost.y);
      const isAtIntersection = Math.abs(ghost.x - (currentX + 0.5)) < 0.1 && Math.abs(ghost.y - (currentY + 0.5)) < 0.1;
      
      if (isAtIntersection || !ghost.lastDirectionChange || timestamp - ghost.lastDirectionChange > 500) {
        // Get target based on mode
        let target;
        if (ghost.mode === 'frightened') {
          // Simple random direction when frightened
          target = {
            x: ghost.x + (Math.random() > 0.5 ? 5 : -5),
            y: ghost.y + (Math.random() > 0.5 ? 5 : -5)
          };
        } else {
          target = getGhostTarget(ghost, pacman);
        }

        // Get valid directions (exclude reverse unless forced)
        const directions = [0, 1, 2, 3].filter(dir => {
          const dirVector = game.directions[dir];
          const newX = Math.floor(ghost.x + dirVector.x * 0.6);
          const newY = Math.floor(ghost.y + dirVector.y * 0.6);
          return isWalkable(newX, newY);
        });

        // Remove reverse direction unless it's the only option
        const nonReverseDirections = directions.filter(dir => dir !== (ghost.direction + 2) % 4);
        const validDirections = nonReverseDirections.length > 0 ? nonReverseDirections : directions;

        if (validDirections.length > 0) {
          // Choose best direction toward target, but add some randomness to prevent oscillation
          let bestDir = ghost.direction;
          let bestDist = Infinity;
          
          validDirections.forEach(dir => {
            const dirVector = game.directions[dir];
            const newX = ghost.x + dirVector.x;
            const newY = ghost.y + dirVector.y;
            const dist = Math.sqrt((newX - target.x) ** 2 + (newY - target.y) ** 2);
            
            // Add small random factor to prevent oscillation
            const randomFactor = Math.random() * 0.5;
            const adjustedDist = dist + randomFactor;
            
            if (adjustedDist < bestDist) {
              bestDist = adjustedDist;
              bestDir = dir;
            }
          });
          
          if (bestDir !== ghost.direction) {
            ghost.direction = bestDir;
            ghost.lastDirectionChange = timestamp;
          }
        }
      }

      // Move ghost
      const ghostDir = game.directions[ghost.direction];
      ghost.x += ghostDir.x * ghost.speed;
      ghost.y += ghostDir.y * ghost.speed;
      
      // Handle tunnel wrapping
      const wrappedGhost = wrapPosition(ghost.x, ghost.y);
      ghost.x = wrappedGhost.x;

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
            game.particles.push(new Particle(
              ghost.x * 20, ghost.y * 20,
              (Math.random() - 0.5) * 80,
              (Math.random() - 0.5) * 80,
              '#ffffff',
              500
            ));
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
      setLevel(prev => prev + 1);
      setScore(prev => prev + 1000);
      initializeGame();
    }

    // Update particles
    game.particles = game.particles.filter(particle => {
      particle.update(deltaTime);
      return particle.life > 0;
    });

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
    game.particles.forEach(particle => {
      particle.draw(ctx);
    });
    
  }, [gameOver, paused, isWalkable, wrapPosition, getGhostTarget, initializeGame, settings.sound, score, updateHighScore]);

  // Input handling
  const handleInput = useCallback((direction) => {
    if (gameOver || paused) return;
    gameRef.current.pacman.nextDirection = direction;
  }, [gameOver, paused]);

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

    const handleTouch = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0] || e.changedTouches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const dx = x - centerX;
      const dy = y - centerY;
      
      // Require minimum distance to avoid accidental inputs
      const minDistance = 20;
      if (Math.abs(dx) < minDistance && Math.abs(dy) < minDistance) return;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        handleInput(dx > 0 ? 0 : 2); // Right or Left
      } else {
        handleInput(dy > 0 ? 3 : 1); // Down or Up
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchend', handleTouch, { passive: false });

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
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('touchend', handleTouch);
      document.removeEventListener('touchstart', preventScroll);
      document.removeEventListener('touchend', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gameLoop, handleInput, gameOver, paused]);

  const resetGame = useCallback(() => {
    setScore(0);
    setLevel(1);
    setLives(3);
    setGameOver(false);
    setPaused(false);
    setPowerMode(false);
    setPowerTimer(0);
    setDebugInfo('Resetting game...');
    
    const game = gameRef.current;
    game.particles = [];
    game.lastUpdate = 0;
    game.modeTimer = 0;
    game.frightTimer = 0;
    
    // Reset maze to original state
    for (let y = 0; y < game.maze.length; y++) {
      for (let x = 0; x < game.maze[y].length; x++) {
        if (game.maze[y][x] === 0) {
          // Restore dots that were eaten
          if ((x + y) % 3 !== 0 && Math.random() > 0.1) {
            game.maze[y][x] = 2;
          }
        }
      }
    }
    
    // Reset power pellets
    game.maze[2][1] = 3;
    game.maze[2][24] = 3;
    game.maze[19][1] = 3;
    game.maze[19][24] = 3;
    
    initializeGame();
  }, [initializeGame]);

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
        <p>Use arrow keys or WASD to move. Eat all dots to advance levels!</p>
        <p>Power pellets make ghosts vulnerable. Touch screen edges to change direction on mobile.</p>
        <div className="mt-2 text-red-400 font-mono">Debug: {debugInfo}</div>
      </div>
    </div>
  );
};