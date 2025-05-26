import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Star, Zap, Shield, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { Particle, particleManager } from '../../core/ParticleSystem';
import { FadingCanvas } from "../ui/FadingCanvas";
import { GameOverBanner } from "../ui/GameOverBanner";
import { GameProps } from '../../core/GameTypes';

interface Position {
  x: number;
  y: number;
}

interface PowerUp extends Position {
  type: 'speed' | 'slow' | 'shield' | 'points' | 'life';
  lifetime: number;
}

interface GameRef {
  snake: Position[];
  direction: Position;
  nextDirection: Position;
  inputBuffer: Position[];
  food: Position;
  particles: Particle[];
  speed: number;
  lastUpdate: number;
  gridSize: number;
}

export const SnakeGame: React.FC<GameProps> = ({ settings, updateHighScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scoreFlash, setScoreFlash] = useState(false);
  const prevScore = useRef(0);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [lives, setLives] = useState(3);
  
  const gameRef = useRef<GameRef>({
    snake: [{ x: 10, y: 10 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    inputBuffer: [],
    food: { x: 15, y: 15 },
    particles: [],
    speed: settings.difficulty === 'easy' ? 150 : settings.difficulty === 'hard' ? 80 : 100,
    lastUpdate: 0,
    gridSize: 20
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const resizeCanvas = () => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // Get full viewport dimensions
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      
      // Use much more of the screen - only leave 80px for header and minimal padding
      const availableWidth = vw - 16;
      const availableHeight = vh - 80;
      
      // Square canvas - use the smaller dimension but at least 80% of available space
      const maxSize = Math.min(availableWidth, availableHeight);
      const displaySize = Math.max(maxSize * 0.85, Math.min(300, maxSize));
      const size = Math.floor(displaySize);
      
      canvas.width = size * devicePixelRatio;
      canvas.height = size * devicePixelRatio;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    
    resizeCanvas();
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

    const handleBlur = () => setPaused(true);
    const handleFocus = () => setPaused(false);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    const handleInput = (e) => {
      if (gameOver) return;
      
      const game = gameRef.current;
      let newDirection = null;
      
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
          e.preventDefault();
          if (game.direction.y === 0) newDirection = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
          e.preventDefault();
          if (game.direction.y === 0) newDirection = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
          e.preventDefault();
          if (game.direction.x === 0) newDirection = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
          e.preventDefault();
          if (game.direction.x === 0) newDirection = { x: 1, y: 0 };
          break;
        case ' ':
        case 'Escape':
          e.preventDefault();
          setPaused(p => !p);
          break;
      }
      
      // Add to input buffer if valid direction (max 2 inputs buffered)
      if (newDirection && game.inputBuffer.length < 2) {
        game.inputBuffer.push(newDirection);
      }
    };

    const handleTouch = (e) => {
      if (gameOver) return;
      
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
      const minDistance = 30;
      if (Math.abs(dx) < minDistance && Math.abs(dy) < minDistance) return;
      
      const game = gameRef.current;
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal movement
        if (dx > 0 && game.direction.x === 0) {
          game.nextDirection = { x: 1, y: 0 }; // Right
        } else if (dx < 0 && game.direction.x === 0) {
          game.nextDirection = { x: -1, y: 0 }; // Left
        }
      } else {
        // Vertical movement
        if (dy > 0 && game.direction.y === 0) {
          game.nextDirection = { x: 0, y: 1 }; // Down
        } else if (dy < 0 && game.direction.y === 0) {
          game.nextDirection = { x: 0, y: -1 }; // Up
        }
      }
    };

    window.addEventListener('keydown', handleInput);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchend', handleTouch, { passive: false });

    const spawnPowerUp = () => {
      if (Math.random() < 0.3 && powerUps.length < 2) {
        const types = ['speed', 'points', 'shield', 'shrink'];
        const type = types[Math.floor(Math.random() * types.length)];
        const powerUp = {
          x: Math.floor(Math.random() * gameRef.current.gridSize),
          y: Math.floor(Math.random() * gameRef.current.gridSize),
          type,
          lifeTime: 10000
        };
        setPowerUps(prev => [...prev, powerUp]);
      }
    };

    const createParticles = (x, y, color, count = 10) => {
      const particles = gameRef.current.particles;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const particle = particleManager.addParticle({
          x: x * (canvas.width / gameRef.current.gridSize) + 10,
          y: y * (canvas.height / gameRef.current.gridSize) + 10,
          vx: Math.cos(angle) * 100,
          vy: Math.sin(angle) * 100,
          color: color,
          life: 0.5,
          size: 2
        });
        if (particle) {
          particles.push(particle);
        }
      }
    };

    const gameLoop = (timestamp) => {
      if (!paused && !gameOver) {
        const deltaTime = timestamp - gameRef.current.lastUpdate;
        
        if (deltaTime >= gameRef.current.speed) {
          const game = gameRef.current;
          const snake = game.snake;
          
          // First check nextDirection, then fall back to input buffer
          if (game.nextDirection.x !== game.direction.x || game.nextDirection.y !== game.direction.y) {
            // Validate nextDirection is valid (not opposite to current)
            if ((game.nextDirection.x !== 0 && game.direction.x === 0) || 
                (game.nextDirection.y !== 0 && game.direction.y === 0)) {
              game.direction = game.nextDirection;
            }
          } else if (game.inputBuffer.length > 0) {
            const bufferedDirection = game.inputBuffer.shift();
            // Validate buffered direction is still valid
            if ((bufferedDirection.x !== 0 && game.direction.x === 0) || 
                (bufferedDirection.y !== 0 && game.direction.y === 0)) {
              game.direction = bufferedDirection;
            }
          }
          
          // Calculate new head position
          const head = { ...snake[0] };
          head.x += game.direction.x;
          head.y += game.direction.y;

          // Wrap around walls
          if (head.x < 0) head.x = game.gridSize - 1;
          if (head.x >= game.gridSize) head.x = 0;
          if (head.y < 0) head.y = game.gridSize - 1;
          if (head.y >= game.gridSize) head.y = 0;

          // Check self collision
          if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            if (lives > 1) {
              setLives(l => l - 1);
              soundManager.playHit();
              createParticles(head.x, head.y, '#ef4444', 20);
              // Reset snake
              game.snake = [{ x: 10, y: 10 }];
              game.direction = { x: 1, y: 0 };
              game.nextDirection = { x: 1, y: 0 };
            } else {
              setGameOver(true);
              soundManager.playGameOver();
              updateHighScore('snake', score);
              return;
            }
          } else {
            snake.unshift(head);

            // Check food collision
            if (head.x === game.food.x && head.y === game.food.y) {
              setScore(s => s + 10);
              soundManager.playCollect();
              createParticles(game.food.x, game.food.y, '#10b981', 15);
              
              // Brief pause for food collection feedback
              game.lastUpdate = timestamp + 50; // 50ms pause
              
              // Spawn new food
              do {
                game.food = {
                  x: Math.floor(Math.random() * game.gridSize),
                  y: Math.floor(Math.random() * game.gridSize)
                };
              } while (snake.some(s => s.x === game.food.x && s.y === game.food.y));
              
              spawnPowerUp();
            } else {
              snake.pop();
            }

            // Check power-up collision
            setPowerUps(prev => {
              const collected = prev.filter(p => {
                if (head.x === p.x && head.y === p.y) {
                  soundManager.playPowerUp();
                  createParticles(p.x, p.y, '#f59e0b', 20);
                  
                  switch(p.type) {
                    case 'points':
                      setScore(s => s + 50);
                      break;
                    case 'speed':
                      game.speed = Math.max(50, game.speed - 20);
                      setTimeout(() => game.speed = settings.difficulty === 'easy' ? 150 : settings.difficulty === 'hard' ? 80 : 100, 5000);
                      break;
                    case 'shield':
                      setLives(l => Math.min(5, l + 1));
                      break;
                    case 'shrink':
                      if (snake.length > 3) {
                        snake.splice(-2);
                      }
                      break;
                  }
                  return false;
                }
                return true;
              });
              return collected;
            });
          }
          
          gameRef.current.lastUpdate = timestamp;
        }
      }

      // Update particles with memory leak prevention
      gameRef.current.particles = gameRef.current.particles.filter(p => {
        p.update(0.016);
        return p.life > 0;
      });
      
      // Prevent memory leak - limit max particles
      if (gameRef.current.particles.length > 100) {
        gameRef.current.particles = gameRef.current.particles.slice(-50);
      }

      // Draw
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid with subtle lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      const cellSize = canvas.width / gameRef.current.gridSize;
      
      for (let i = 0; i <= gameRef.current.gridSize; i++) {
        const pos = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
      }

      // Draw snake with gradient and glow
      const snake = gameRef.current.snake;
      snake.forEach((segment, index) => {
        const gradient = ctx.createRadialGradient(
          segment.x * cellSize + cellSize/2,
          segment.y * cellSize + cellSize/2,
          0,
          segment.x * cellSize + cellSize/2,
          segment.y * cellSize + cellSize/2,
          cellSize/2
        );

        if (index === 0) {
          gradient.addColorStop(0, '#10b981');
          gradient.addColorStop(1, '#059669');
        } else {
          gradient.addColorStop(0, '#059669');
          gradient.addColorStop(1, '#047857');
        }

        ctx.shadowBlur = 20;
        ctx.shadowColor = '#10b981';
        ctx.fillStyle = gradient;
        ctx.fillRect(
          segment.x * cellSize + 2,
          segment.y * cellSize + 2,
          cellSize - 4,
          cellSize - 4
        );
        ctx.shadowBlur = 0;
      });

      // Draw food with animation and subtle glow
      const foodPulse = Math.sin(timestamp * 0.005) * 0.2 + 0.8;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(
        gameRef.current.food.x * cellSize + (1 - foodPulse) * cellSize/2,
        gameRef.current.food.y * cellSize + (1 - foodPulse) * cellSize/2,
        cellSize * foodPulse,
        cellSize * foodPulse
      );
      ctx.shadowBlur = 0;

      // Draw power-ups
      powerUps.forEach(powerUp => {
        const colors = {
          speed: '#3b82f6',
          points: '#f59e0b',
          shield: '#8b5cf6',
          shrink: '#ec4899'
        };
        
        ctx.fillStyle = colors[powerUp.type];
        ctx.save();
        ctx.translate(
          powerUp.x * cellSize + cellSize/2,
          powerUp.y * cellSize + cellSize/2
        );
        ctx.rotate(timestamp * 0.002);
        ctx.fillRect(-cellSize/3, -cellSize/3, cellSize/1.5, cellSize/1.5);
        ctx.restore();
      });

      // Draw particles
      gameRef.current.particles.forEach(p => p.draw(ctx));

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('touchend', handleTouch);
      document.removeEventListener('touchstart', preventScroll);
      document.removeEventListener('touchend', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [paused, gameOver, lives, score, powerUps, settings.difficulty, updateHighScore]);

  // Touch and swipe handling
  const touchStartRef = useRef(null);
  const touchRef = useRef({ isDown: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    if (gameOver) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    touchRef.current = {
      isDown: true,
      startX: touch.clientX - rect.left,
      startY: touch.clientY - rect.top,
      currentX: touch.clientX - rect.left,
      currentY: touch.clientY - rect.top
    };
    touchStartRef.current = Date.now();
  }, [gameOver]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    if (gameOver || !touchRef.current.isDown) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    touchRef.current.currentX = touch.clientX - rect.left;
    touchRef.current.currentY = touch.clientY - rect.top;
    
    // Real-time direction change for held touch
    const dx = touchRef.current.currentX - touchRef.current.startX;
    const dy = touchRef.current.currentY - touchRef.current.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only change direction if moved a minimum distance
    if (distance > 20) {
      const game = gameRef.current;
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal movement
        if (dx > 0 && game.direction.x !== -1) {
          game.nextDirection = { x: 1, y: 0 };
        } else if (dx < 0 && game.direction.x !== 1) {
          game.nextDirection = { x: -1, y: 0 };
        }
      } else {
        // Vertical movement
        if (dy > 0 && game.direction.y !== -1) {
          game.nextDirection = { x: 0, y: 1 };
        } else if (dy < 0 && game.direction.y !== 1) {
          game.nextDirection = { x: 0, y: -1 };
        }
      }
      // Reset start position to current for continuous movement
      touchRef.current.startX = touchRef.current.currentX;
      touchRef.current.startY = touchRef.current.currentY;
    }
  }, [gameOver]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    if (gameOver || !touchRef.current.isDown) return;
    
    const touchDuration = Date.now() - touchStartRef.current;
    const dx = touchRef.current.currentX - touchRef.current.startX;
    const dy = touchRef.current.currentY - touchRef.current.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Quick tap/swipe detection
    if (touchDuration < 300 && distance > 10) {
      const game = gameRef.current;
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0 && game.direction.x !== -1) {
          game.nextDirection = { x: 1, y: 0 };
        } else if (dx < 0 && game.direction.x !== 1) {
          game.nextDirection = { x: -1, y: 0 };
        }
      } else {
        // Vertical swipe
        if (dy > 0 && game.direction.y !== -1) {
          game.nextDirection = { x: 0, y: 1 };
        } else if (dy < 0 && game.direction.y !== 1) {
          game.nextDirection = { x: 0, y: -1 };
        }
      }
    } else if (touchDuration < 200 && distance < 10) {
      // Quick tap to pause/resume
      setPaused(p => !p);
    }
    
    touchRef.current.isDown = false;
  }, [gameOver]);

  const restart = () => {
    gameRef.current = {
      snake: [{ x: 10, y: 10 }],
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      inputBuffer: [],
      food: { x: 15, y: 15 },
      particles: [],
      speed: settings.difficulty === 'easy' ? 150 : settings.difficulty === 'hard' ? 80 : 100,
      lastUpdate: 0,
      gridSize: 20
    };
    setScore(0);
    setLives(3);
    setPowerUps([]);
    setGameOver(false);
    setPaused(false);
  };
  useEffect(() => {
    if (score > prevScore.current) {
      setScoreFlash(true);
      const t = setTimeout(() => setScoreFlash(false), 300);
      prevScore.current = score;
      return () => clearTimeout(t);
    }
  }, [score]);


  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 flex items-center gap-4 flex-wrap justify-center">
        <div className={`text-white font-bold text-xl transition-transform ${scoreFlash ? 'scale-125 text-yellow-400' : ''}`}>Score: {score}</div>
        <div className="flex items-center gap-1">
          {Array.from({ length: lives }).map((_, i) => (
            <Heart key={i} size={20} className="text-red-500 fill-red-500" />
          ))}
        </div>
        {powerUps.length > 0 && (
          <div className="flex items-center gap-2">
            {powerUps.map((p, i) => (
              <div key={i} className="flex items-center gap-1 text-yellow-400">
                {p.type === 'speed' && <Zap size={16} />}
                {p.type === 'points' && <Star size={16} />}
                {p.type === 'shield' && <Shield size={16} />}
                {p.type === 'shrink' && <Timer size={16} />}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <FadingCanvas active={!gameOver}>
        <canvas
          ref={canvasRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="border-2 border-green-500 rounded-lg shadow-lg shadow-green-500/50 touch-none"
        />
      </FadingCanvas>
      <GameOverBanner show={gameOver} />
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setPaused(p => !p)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 touch-manipulation"
        >
          {paused ? <Play size={20} /> : <Pause size={20} />}
        </button>
        {gameOver && (
          <button
            onClick={restart}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 touch-manipulation"
          >
            <RotateCcw size={20} /> Restart
          </button>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-gray-400 text-sm">Use WASD/Arrows, swipe, or hold & drag to move</p>
        <p className="text-gray-400 text-xs">Quick tap to pause</p>
      </div>
    </div>
  );
};