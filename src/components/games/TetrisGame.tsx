import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Play, Pause, RotateCcw } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { Particle } from '../../core/ParticleSystem';



// Interfaces
interface Tetromino {
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

type GameBoard = number[][];

interface Position {
  x: number;
  y: number;
}

interface BlockParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
}

interface TrailPosition {
  x: number;
  y: number;
  piece: string;
  rotation: number;
  life: number;
}

interface Explosion {
  lineY: number;
  triggerTime: number;
  blockData: (string | 0)[];
}

interface GameState {
  board: GameBoard;
  currentPiece: string | null;
  currentPosition: Position;
  currentRotation: number;
  nextPiece: string | null;
  holdPiece: string | null;
  canHold: boolean;
  dropTimer: number;
  dropInterval: number;
  particles: (Particle | BlockParticle)[];
  shockwaves: Shockwave[];
  trailPositions: TrailPosition[];
  explosionQueue: Explosion[];
  lastUpdate: number;
  keys: Record<string, boolean>;
  softDropTimer: number;
}

interface TetrisGameProps {
  settings: {
    soundEnabled: boolean;
    volume: number;
  };
  updateHighScore: (game: string, score: number) => void;
}

// Tetromino definitions
const TETROMINOES: Record<string, number[][][]> = {
  I: [
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]]
  ],
  O: [
    [[1, 1], [1, 1]]
  ],
  T: [
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1], [1, 1], [0, 1]]
  ],
  S: [
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]]
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]]
  ],
  J: [
    [[1, 0, 0], [1, 1, 1]],
    [[1, 1], [1, 0], [1, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[0, 1], [0, 1], [1, 1]]
  ],
  L: [
    [[0, 0, 1], [1, 1, 1]],
    [[1, 0], [1, 0], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1], [0, 1], [0, 1]]
  ]
};

const COLORS: Record<string, string> = {
  I: '#00f5ff', // Cyan - keep this cool color
  O: '#39ff14', // Electric lime instead of yellow
  T: '#9c88ff', // Purple - keep this
  S: '#4ecdc4', // Teal - keep this cool color
  Z: '#ff1493', // Deep pink instead of red-orange
  J: '#1e90ff', // Dodger blue - more vibrant
  L: '#00bfff'  // Deep sky blue instead of orange
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 25;

// Enhanced drawing function with modern glow and sharp squares
const drawGlowBlock = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  color: string, 
  size: number = CELL_SIZE, 
  glowIntensity: number = 1
): void => {
  // Create linear gradient for segmented square look
  const gradient = ctx.createLinearGradient(x, y, x, y + size);
  gradient.addColorStop(0, color + 'ff');
  gradient.addColorStop(0.5, color + 'ee');
  gradient.addColorStop(1, color + 'cc');
  
  // Add sharp outer glow
  ctx.shadowBlur = 8 * glowIntensity;
  ctx.shadowColor = color;
  
  // Draw main block as solid square
  ctx.fillStyle = gradient;
  ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
  
  // Add bright edge highlights for segmented look
  ctx.shadowBlur = 0;
  
  // Top edge highlight
  ctx.fillStyle = color + 'ff';
  ctx.fillRect(x + 2, y + 2, size - 4, 2);
  
  // Left edge highlight  
  ctx.fillRect(x + 2, y + 2, 2, size - 4);
  
  // Bottom edge shadow
  ctx.fillStyle = color + '88';
  ctx.fillRect(x + 2, y + size - 4, size - 4, 2);
  
  // Right edge shadow
  ctx.fillRect(x + size - 4, y + 2, 2, size - 4);
  
  // Outer glow border
  ctx.shadowBlur = 4 * glowIntensity;
  ctx.shadowColor = color;
  ctx.strokeStyle = color + 'aa';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  ctx.shadowBlur = 0;
};

export const TetrisGame: React.FC<TetrisGameProps> = ({ settings, updateHighScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  
  const gameRef = useRef<GameState>({
    board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)),
    currentPiece: null,
    currentPosition: { x: 0, y: 0 },
    currentRotation: 0,
    nextPiece: null,
    holdPiece: null,
    canHold: true,
    dropTimer: 0,
    dropInterval: 1000,
    particles: [],
    shockwaves: [],
    trailPositions: [],
    explosionQueue: [],
    lastUpdate: 0,
    keys: {},
    softDropTimer: 0,
  });

  // Touch interaction refs
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);

  const getRandomPiece = useCallback((): string => {
    // DEBUG CODE REMOVED - 2025-05-27
    const pieces = Object.keys(TETROMINOES);
    return pieces[Math.floor(Math.random() * pieces.length)];
  }, []);

  const spawnPiece = useCallback(() => {
    const game = gameRef.current;
    
    if (!game.nextPiece) {
      game.nextPiece = getRandomPiece();
    }
    
    game.currentPiece = game.nextPiece;
    game.nextPiece = getRandomPiece();
    game.currentPosition = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };
    game.currentRotation = 0;
    game.canHold = true;
    
    // Check if game over
    if (game.currentPiece && isCollision(game.currentPiece, game.currentPosition, game.currentRotation, game.board)) {
      setGameOver(true);
      updateHighScore('tetris', score);
      soundManager.playGameOver();
    }
  }, [getRandomPiece, score, updateHighScore]);

  const isCollision = (piece: string, position: Position, rotation: number, board: GameBoard): boolean => {
    const shape = TETROMINOES[piece][rotation];
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = position.x + x;
          const newY = position.y + y;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }
          
          if (newY >= 0 && board[newY][newX]) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  const placePiece = useCallback(() => {
    console.log('🔴 PLACE PIECE CALLED');
    const game = gameRef.current;
    if (!game.currentPiece) return;
    
    const shape = TETROMINOES[game.currentPiece][game.currentRotation];
    
    // Place piece on board
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = game.currentPosition.x + x;
          const boardY = game.currentPosition.y + y;
          
          if (boardY >= 0) {
            game.board[boardY][boardX] = game.currentPiece as any;
          }
        }
      }
    }
    
    soundManager.playHit();
    
    // Create shockwave effect
    const centerX = (game.currentPosition.x + 1.5) * CELL_SIZE;
    const centerY = (game.currentPosition.y + 1.5) * CELL_SIZE;
    game.shockwaves.push({
      x: centerX,
      y: centerY,
      radius: 0,
      maxRadius: 100,
      life: 1.0
    });
    
    // Check for completed lines
    const completedLines: number[] = [];
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (game.board[y].every(cell => cell !== 0)) {
        completedLines.push(y);
      }
    }
    
    if (completedLines.length > 0) {
      console.log('🎯 LINES DETECTED:', completedLines, 'Total:', completedLines.length);
      
      // Queue serialized explosions - start from bottom line and work up
      completedLines.sort((a, b) => b - a); // Sort descending (bottom to top)
      
      // Store block data for explosions before clearing
      const explosionData = completedLines.map(lineY => ({
        lineY: lineY,
        blockData: [...game.board[lineY]] as (string | 0)[]
      }));
      
      // Remove completed lines first from bottom to top
      completedLines.sort((a, b) => b - a);
      completedLines.forEach(lineY => {
        game.board.splice(lineY, 1);
      });

      // Then add the same number of empty lines at the top
      for (let i = 0; i < completedLines.length; i++) {
        game.board.unshift(Array(BOARD_WIDTH).fill(0));
      }
      
      // Then queue explosions with the stored data
      explosionData.forEach((data, index) => {
        const delay = completedLines.length === 1 ? 50 : index * 150; 
        
        game.explosionQueue.push({
          lineY: data.lineY,
          triggerTime: performance.now() + delay,
          blockData: data.blockData
        });
      });
      
      // Update score and lines
      const linePoints = [0, 100, 300, 500, 800][completedLines.length];
      const newScore = score + linePoints * level;
      const newLines = lines + completedLines.length;
      
      console.log(`📊 SCORING: Cleared ${completedLines.length} lines, Points: ${linePoints}, New Score: ${newScore}, New Lines: ${newLines}`);
      
      setScore(newScore);
      setLines(newLines);
      
      // Level up every 10 lines
      if (Math.floor(newLines / 10) > level - 1) {
        setLevel(prev => {
          const newLevel = prev + 1;
          game.dropInterval = Math.max(100, 1000 - (newLevel - 1) * 100);
          return newLevel;
        });
      }
      
      soundManager.playPowerUp();
    }
    
    spawnPiece();
  }, [score, lines, level, spawnPiece]);

  const movePiece = useCallback((dx: number, dy: number, newRotation: number | null = null): boolean => {
    const game = gameRef.current;
    if (!game.currentPiece) return false;
    
    const newPosition: Position = {
      x: game.currentPosition.x + dx,
      y: game.currentPosition.y + dy
    };
    
    const rotation = newRotation !== null ? newRotation : game.currentRotation;
    
    if (!isCollision(game.currentPiece, newPosition, rotation, game.board)) {
      game.currentPosition = newPosition;
      if (newRotation !== null) {
        game.currentRotation = newRotation;
      }
      return true;
    }
    
    return false;
  }, []);

  const rotatePiece = useCallback(() => {
    const game = gameRef.current;
    if (!game.currentPiece) return;
    
    const maxRotations = TETROMINOES[game.currentPiece].length;
    const newRotation = (game.currentRotation + 1) % maxRotations;
    
    // Try basic rotation
    if (movePiece(0, 0, newRotation)) {
      soundManager.playTone(440, 50);
      return;
    }
    
    // Try wall kicks
    const kicks: [number, number][] = [[-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]];
    for (const [dx, dy] of kicks) {
      if (!isCollision(game.currentPiece, 
          { x: game.currentPosition.x + dx, y: game.currentPosition.y + dy }, 
          newRotation, game.board)) {
        game.currentPosition.x += dx;
        game.currentPosition.y += dy;
        game.currentRotation = newRotation;
        soundManager.playTone(440, 50);
        return;
      }
    }
  }, [movePiece]);

  const holdPiece = useCallback(() => {
    const game = gameRef.current;
    if (!game.canHold || !game.currentPiece) return;
    
    if (game.holdPiece) {
      // Swap current and hold pieces
      const temp = game.currentPiece;
      game.currentPiece = game.holdPiece;
      game.holdPiece = temp;
    } else {
      // Hold current piece and spawn new one
      game.holdPiece = game.currentPiece;
      game.currentPiece = game.nextPiece;
      game.nextPiece = getRandomPiece();
    }
    
    game.currentPosition = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };
    game.currentRotation = 0;
    game.canHold = false;
    
    soundManager.playCollect();
  }, [getRandomPiece]);

  const hardDrop = useCallback(() => {
    const game = gameRef.current;
    if (!game.currentPiece) return;
    
    let dropDistance = 0;
    while (movePiece(0, 1)) {
      dropDistance++;
    }
    
    setScore(prev => prev + dropDistance * 2);
    console.log('🟡 HARD DROP calling placePiece');
    placePiece();
  }, [movePiece, placePiece]);

  // Initial spawn only
  useEffect(() => {
    if (!gameRef.current.currentPiece) {
      spawnPiece();
    }
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    
    const resizeCanvas = () => {
      canvas.width = BOARD_WIDTH * CELL_SIZE + 200; // Extra space for UI
      canvas.height = BOARD_HEIGHT * CELL_SIZE;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleBlur = () => setPaused(true);
    const handleFocus = () => setPaused(false);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = performance.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = e.touches[0].clientY - touchStartYRef.current;
      if (deltaY > 10) {
        e.preventDefault();
        gameRef.current.keys['ArrowDown'] = true;
      } else {
        gameRef.current.keys['ArrowDown'] = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
      const deltaTime = performance.now() - touchStartTimeRef.current;
      gameRef.current.keys['ArrowDown'] = false;
      if (Math.abs(deltaY) < 10 && deltaTime < 200) {
        rotatePiece();
      } else if (deltaY > 50 && deltaTime < 200) {
        hardDrop();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      // Prevent key repeat for critical actions
      if (e.repeat) return;
      
      gameRef.current.keys[e.key] = true;
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
          movePiece(1, 0);
          break;
        // ArrowDown and 's' are handled by the game loop's soft drop logic
        // to prevent race conditions
        case 'ArrowUp':
        case 'w':
        case ' ':
          e.preventDefault();
          rotatePiece();
          break;
        case 'c':
          holdPiece();
          break;
        case 'Enter':
          hardDrop();
          break;
        case 'p':
        case 'Escape':
          e.preventDefault();
          setPaused(!paused);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    const gameLoop = (timestamp: number) => {
      if (gameOver) {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      const deltaTime = timestamp - gameRef.current.lastUpdate;
      gameRef.current.lastUpdate = timestamp;
      const time = timestamp * 0.001; // Convert to seconds for animations

      const game = gameRef.current;
      
      // Skip game logic when paused, but still render
      if (!paused) {
      
      // Soft drop when down key is held
      if (game.keys['ArrowDown'] || game.keys['s']) {
        game.softDropTimer += deltaTime;
        if (game.softDropTimer >= 50) { // 50ms intervals for smooth soft drop
          if (movePiece(0, 1)) {
            setScore(prev => prev + 1);
            game.dropTimer = 0;
          } else {
            console.log('🔵 SOFT DROP calling placePiece');
            placePiece();
          }
          game.softDropTimer = 0;
        }
      }
      
      // Normal drop timer
      game.dropTimer += deltaTime;
      if (game.dropTimer >= game.dropInterval) {
        if (!movePiece(0, 1)) {
          console.log('🟢 NORMAL DROP calling placePiece');
          placePiece();
        }
        game.dropTimer = 0;
      }

      // Update particles (handle both old Particle class and custom block particles)
      game.particles = game.particles.filter(particle => {
        if ('update' in particle) {
          particle.update();
        }
        return particle.life > 0;
      });
      
      // Process explosion queue for serialized line clear effects
      const currentTime = performance.now();
      game.explosionQueue = game.explosionQueue.filter(explosion => {
        if (currentTime >= explosion.triggerTime) {
          // Trigger explosion for this line
          for (let x = 0; x < BOARD_WIDTH; x++) {
            const blockColor = explosion.blockData[x] ? COLORS[explosion.blockData[x] as string] : '#ffffff';
            
            if (explosion.blockData[x]) { // Only explode if there was a block
              // Create block-like particles that look like mini tetromino pieces
              for (let i = 0; i < 4; i++) { // Reduced from 6 to 4 for cleaner look
                const angle = (i / 4) * Math.PI * 2;
                const speed = 25 + Math.random() * 35; // Slightly slower and more controlled
                
                // Create custom block particle
                const blockParticle: BlockParticle = {
                  x: x * CELL_SIZE + CELL_SIZE / 2,
                  y: explosion.lineY * CELL_SIZE + CELL_SIZE / 2,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  color: blockColor,
                  life: 2.0, // Reduced to 2 seconds for cleaner gameplay
                  maxLife: 2.0,
                  size: CELL_SIZE * 0.5, // Slightly smaller for cleaner look
                  rotation: Math.random() * Math.PI * 2,
                  rotationSpeed: (Math.random() - 0.5) * 0.08, // Slightly slower rotation
                  
                  update: function() {
                    this.x += this.vx * 0.016;
                    this.y += this.vy * 0.016;
                    this.vy += 80 * 0.016; // Slightly less gravity
                    this.vx *= 0.99; // Less air resistance for smoother movement
                    this.rotation += this.rotationSpeed;
                    this.life -= 0.016;
                  },
                  
                  draw: function(ctx: CanvasRenderingContext2D) {
                    const alpha = Math.max(0, this.life / this.maxLife);
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    
                    // Draw block particle using the same glow function
                    ctx.globalAlpha = alpha;
                    drawGlowBlock(ctx, -this.size/2, -this.size/2, this.color, this.size, alpha);
                    ctx.restore();
                  }
                };
                
                game.particles.push(blockParticle);
              }
              
              // Add line-wide shockwave
              game.shockwaves.push({
                x: BOARD_WIDTH * CELL_SIZE / 2,
                y: explosion.lineY * CELL_SIZE + CELL_SIZE / 2,
                radius: 0,
                maxRadius: BOARD_WIDTH * CELL_SIZE,
                life: 0.8
              });
            }
          }
          
          // Play sound for each line explosion
          soundManager.playHit();
          return false; // Remove from queue
        }
        return true; // Keep in queue
      });
      
      // Update shockwaves
      game.shockwaves = game.shockwaves.filter(shockwave => {
        shockwave.radius += 3;
        shockwave.life -= 0.02;
        return shockwave.life > 0 && shockwave.radius < shockwave.maxRadius;
      });
      
      // Update trail positions for falling piece
      if (game.currentPiece) {
        game.trailPositions.push({
          x: game.currentPosition.x,
          y: game.currentPosition.y,
          piece: game.currentPiece,
          rotation: game.currentRotation,
          life: 1.0
        });
        
        // Limit trail length and update life
        game.trailPositions = game.trailPositions.filter(trail => {
          trail.life -= 0.1;
          return trail.life > 0;
        }).slice(-10); // Keep last 10 positions
      }
      
      } // End pause check

      // Render animated background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#001122');
      bgGradient.addColorStop(0.5, '#000a1a');
      bgGradient.addColorStop(1, '#001122');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add moving background pattern
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 20; i++) {
        const x = (i * 40 + time * 10) % canvas.width;
        const gradient = ctx.createLinearGradient(x, 0, x + 20, canvas.height);
        gradient.addColorStop(0, '#00ffff00');
        gradient.addColorStop(0.5, '#00ffff22');
        gradient.addColorStop(1, '#00ffff00');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, 0, 2, canvas.height);
      }
      ctx.globalAlpha = 1;

      // Draw neon grid lines
      const pulse = 0.5 + 0.3 * Math.sin(time * 2);
      
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + pulse * 0.2})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#00ffff';
      
      for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);
        ctx.stroke();
      }
      for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(BOARD_WIDTH * CELL_SIZE, y * CELL_SIZE);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Draw placed pieces with glow
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          if (game.board[y][x]) {
            drawGlowBlock(ctx, x * CELL_SIZE, y * CELL_SIZE, COLORS[game.board[y][x] as string], CELL_SIZE, 0.8);
          }
        }
      }

      // Draw trailing effect for falling piece
      game.trailPositions.forEach((trail, index) => {
        const shape = TETROMINOES[trail.piece][trail.rotation];
        const alpha = trail.life * 0.3;
        
        for (let y = 0; y < shape.length; y++) {
          for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
              const drawX = (trail.x + x) * CELL_SIZE;
              const drawY = (trail.y + y) * CELL_SIZE;
              
              if (drawY >= 0) {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = COLORS[trail.piece] + '40';
                ctx.fillRect(drawX + 1, drawY + 1, CELL_SIZE - 2, CELL_SIZE - 2);
              }
            }
          }
        }
      });
      ctx.globalAlpha = 1;
      
      // Draw current piece with enhanced glow
      if (game.currentPiece) {
        const shape = TETROMINOES[game.currentPiece][game.currentRotation];
        
        for (let y = 0; y < shape.length; y++) {
          for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
              const drawX = (game.currentPosition.x + x) * CELL_SIZE;
              const drawY = (game.currentPosition.y + y) * CELL_SIZE;
              
              if (drawY >= 0) {
                drawGlowBlock(ctx, drawX, drawY, COLORS[game.currentPiece], CELL_SIZE, 1.2);
              }
            }
          }
        }
        
        // Draw ghost piece
        let ghostY = game.currentPosition.y;
        while (!isCollision(game.currentPiece, { x: game.currentPosition.x, y: ghostY + 1 }, game.currentRotation, game.board)) {
          ghostY++;
        }
        
        if (ghostY !== game.currentPosition.y) {
          ctx.fillStyle = COLORS[game.currentPiece] + '40';
          for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
              if (shape[y][x]) {
                const drawX = (game.currentPosition.x + x) * CELL_SIZE;
                const drawY = (ghostY + y) * CELL_SIZE;
                
                if (drawY >= 0) {
                  ctx.fillRect(drawX + 1, drawY + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                }
              }
            }
          }
        }
      }

      // Draw UI area with glow effects
      const uiX = BOARD_WIDTH * CELL_SIZE + 10;
      
      // Draw next piece with holographic effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ffff';
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('NEXT', uiX, 30);
      ctx.shadowBlur = 0;
      
      if (game.nextPiece) {
        const nextShape = TETROMINOES[game.nextPiece][0];
        const hologramPulse = 0.5 + 0.3 * Math.sin(time * 3);
        
        for (let y = 0; y < nextShape.length; y++) {
          for (let x = 0; x < nextShape[y].length; x++) {
            if (nextShape[y][x]) {
              // Holographic effect with transparency and scan lines
              ctx.globalAlpha = 0.7 * hologramPulse;
              drawGlowBlock(ctx, uiX + x * 20, 40 + y * 20, COLORS[game.nextPiece], 18, 0.6);
              
              // Add scan lines
              ctx.globalAlpha = 0.3;
              ctx.fillStyle = '#00ffff';
              if ((Math.floor(time * 10) + y) % 3 === 0) {
                ctx.fillRect(uiX + x * 20, 40 + y * 20 + 6, 18, 1);
              }
            }
          }
        }
        ctx.globalAlpha = 1;
      }
      
      // Draw hold piece
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff6b6b';
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('HOLD', uiX, 130);
      ctx.shadowBlur = 0;
      
      if (game.holdPiece) {
        const holdShape = TETROMINOES[game.holdPiece][0];
        const holdAlpha = game.canHold ? 1 : 0.3;
        
        for (let y = 0; y < holdShape.length; y++) {
          for (let x = 0; x < holdShape[y].length; x++) {
            if (holdShape[y][x]) {
              ctx.globalAlpha = holdAlpha;
              drawGlowBlock(ctx, uiX + x * 20, 140 + y * 20, COLORS[game.holdPiece], 18, 0.5);
            }
          }
        }
        ctx.globalAlpha = 1;
      }
      
      // Draw score info with glow
      const scorePulse = 1 + 0.2 * Math.sin(time * 4);
      
      ctx.font = 'bold 18px monospace';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffd93d';
      ctx.fillStyle = '#ffd93d';
      ctx.fillText(`SCORE: ${score}`, uiX, 230);
      
      ctx.shadowColor = '#4ecdc4';
      ctx.fillStyle = '#4ecdc4';
      ctx.fillText(`LINES: ${lines}`, uiX, 250);
      
      ctx.shadowBlur = 10 * scorePulse;
      ctx.shadowColor = '#9c88ff';
      ctx.fillStyle = '#9c88ff';
      ctx.fillText(`LEVEL: ${level}`, uiX, 270);
      ctx.shadowBlur = 0;

      // Draw particles
      game.particles.forEach(particle => {
        particle.draw(ctx);
      });
      
      // Draw shockwaves
      game.shockwaves.forEach(shockwave => {
        ctx.strokeStyle = `rgba(255, 255, 255, ${shockwave.life * 0.5})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gameOver, paused, movePiece, rotatePiece, holdPiece, hardDrop, placePiece]);

  const resetGame = () => {
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    const game = gameRef.current;
    game.board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
    game.currentPiece = null;
    game.nextPiece = null;
    game.holdPiece = null;
    game.canHold = true;
    game.dropTimer = 0;
    game.dropInterval = 1000;
    game.particles = [];
    spawnPiece();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="relative max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">Score:</span>
              <span className="text-lg font-bold text-yellow-400">{score}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">Lines:</span>
              <span className="text-lg font-bold text-blue-400">{lines}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">Level:</span>
              <span className="text-lg font-bold text-green-400">{level}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPaused(!paused)}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              disabled={gameOver}
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={resetGame}
              className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <canvas
          ref={canvasRef}
          className="border-2 border-gray-600 rounded-lg bg-black mx-auto block"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Arrow Keys/WASD to move • Tap to rotate • Swipe down to drop</p>
          <p>Slow swipe down for soft drop • Enter for hard drop • C to hold • P to pause</p>
        </div>
        
        {paused && !gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center bg-gray-800 p-8 rounded-lg border-2 border-purple-500">
              <h2 className="text-3xl font-bold text-purple-400 mb-4">PAUSED</h2>
              <p className="text-lg mb-4 text-gray-300">Game is paused</p>
              <div className="text-sm text-gray-400 mb-4">
                <p>Press P or ESC to resume</p>
                <p>Score: {score} | Lines: {lines} | Level: {level}</p>
              </div>
              <button
                onClick={() => setPaused(false)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
              >
                Resume Game
              </button>
            </div>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
              <p className="text-xl mb-2">Final Score: {score}</p>
              <p className="text-lg mb-2">Lines Cleared: {lines}</p>
              <p className="text-lg mb-4">Level Reached: {level}</p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};