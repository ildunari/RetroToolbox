import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Star, Zap, Shield, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { Particle } from '../../core/ParticleSystem';
import { FadingCanvas } from "../ui/FadingCanvas";
import { GameOverBanner } from "../ui/GameOverBanner";
import { ResponsiveCanvas } from "../ui/ResponsiveCanvas";
import { CANVAS_CONFIG } from "../../core/CanvasConfig";

interface Position {
  x: number;
  y: number;
}

interface Direction {
  x: number;
  y: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'speed' | 'points' | 'shield' | 'shrink';
  lifeTime: number;
}

interface ActivePowerUp {
  type: PowerUp['type'];
  remaining: number;
  duration: number;
  warned: boolean;
}

interface GameState {
  snake: Position[];
  direction: Direction;
  nextDirection: Direction;
  food: Position;
  particles: Particle[];
  speed: number;
  lastUpdate: number;
  gridSize: number;
}

interface Settings {
  difficulty: string;
}

interface SnakeGameProps {
  settings: Settings;
  updateHighScore: (game: string, score: number) => void;
}

export const SnakeGame: React.FC<SnakeGameProps> = ({ settings, updateHighScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [scoreFlash, setScoreFlash] = useState<boolean>(false);
  const prevScore = useRef<number>(0);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [lives, setLives] = useState<number>(3);
  const animationIdRef = useRef<number | null>(null);
  const speedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scoreFlashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const activePowerUpsRef = useRef<ActivePowerUp[]>([]);
  const lastFrameRef = useRef<number>(0);
  
  const gameRef = useRef<GameState>({
    snake: [{ x: 10, y: 10 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
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
    if (!ctx) return;
    let animationId: number;
    
    canvas.width = 400;
    canvas.height = 400;

    const handleBlur = () => setPaused(true);
    const handleFocus = () => setPaused(false);
    
    const handleInput = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      const game = gameRef.current;
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
          if (game.direction.y === 0) game.nextDirection = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
          if (game.direction.y === 0) game.nextDirection = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
          if (game.direction.x === 0) game.nextDirection = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
          if (game.direction.x === 0) game.nextDirection = { x: 1, y: 0 };
          break;
        case ' ':
        case 'Escape':
          e.preventDefault();
          setPaused(p => !p);
          break;
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleInput);

    const spawnPowerUp = () => {
      if (Math.random() < 0.3 && powerUps.length < 2) {
        const types: PowerUp['type'][] = ['speed', 'points', 'shield', 'shrink'];
        const type = types[Math.floor(Math.random() * types.length)];
        const powerUp: PowerUp = {
          x: Math.floor(Math.random() * gameRef.current.gridSize),
          y: Math.floor(Math.random() * gameRef.current.gridSize),
          type,
          lifeTime: 10000
        };
        setPowerUps(prev => [...prev, powerUp]);
      }
    };

    const createParticles = (x: number, y: number, color: string, count: number = 10) => {
      const particles = gameRef.current.particles;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        particles.push(new Particle(
          x * (canvas.width / gameRef.current.gridSize) + 10,
          y * (canvas.height / gameRef.current.gridSize) + 10,
          Math.cos(angle) * 100,
          Math.sin(angle) * 100,
          color,
          0.5
        ));
      }
    };

    const gameLoop = (timestamp: DOMHighResTimeStamp) => {
      const frameDelta = lastFrameRef.current ? timestamp - lastFrameRef.current : 0;
      lastFrameRef.current = timestamp;

      if (!paused && !gameOver) {
        const deltaTime = timestamp - gameRef.current.lastUpdate;
        // Update active power-up timers
        activePowerUpsRef.current = activePowerUpsRef.current
          .map(p => {
            const remaining = p.remaining - frameDelta;
            if (!p.warned && remaining <= 1000 && remaining > 0) {
              soundManager.playWarning();
              return { ...p, remaining, warned: true } as ActivePowerUp;
            }
            return { ...p, remaining } as ActivePowerUp;
          })
          .filter(p => p.remaining > 0);
        
        if (deltaTime >= gameRef.current.speed) {
          const game = gameRef.current;
          const snake = game.snake;
          
          // Update direction
          game.direction = game.nextDirection;
          
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
            snake.unshift(head);            // Check food collision
            if (head.x === game.food.x && head.y === game.food.y) {
              setScore(s => s + 10);
              soundManager.playCollect();
              createParticles(game.food.x, game.food.y, '#10b981', 15);
              
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
                  // Clear existing timeout if any
                  if (speedTimeoutRef.current) {
                    clearTimeout(speedTimeoutRef.current);
                  }
                  speedTimeoutRef.current = setTimeout(() => {
                    game.speed = settings.difficulty === 'easy' ? 150 : settings.difficulty === 'hard' ? 80 : 100;
                    speedTimeoutRef.current = null;
                  }, 5000);
                  activePowerUpsRef.current.push({
                    type: 'speed',
                    remaining: 5000,
                    duration: 5000,
                    warned: false
                  });
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

      // Update particles
      gameRef.current.particles = gameRef.current.particles.filter(p => {
        p.update(0.016);
        return p.life > 0;
      });

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

      // Draw active power-up icons near the head
      const head = snake[0];
      const headX = head.x * cellSize + cellSize / 2;
      const headY = head.y * cellSize + cellSize / 2;
      const iconSize = cellSize / 2.5;
      const iconSpacing = iconSize + 4;
      const colors: Record<PowerUp['type'], string> = {
        speed: '#3b82f6',
        points: '#f59e0b',
        shield: '#8b5cf6',
        shrink: '#ec4899'
      };
      activePowerUpsRef.current.forEach((ap, idx) => {
        const x = headX + (idx - (activePowerUpsRef.current.length - 1) / 2) * iconSpacing;
        const y = headY - cellSize;
        ctx.fillStyle = colors[ap.type];
        ctx.fillRect(x - iconSize / 2, y - iconSize / 2, iconSize, iconSize);
        ctx.strokeStyle = colors[ap.type];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          x,
          y,
          iconSize * 0.7,
          -Math.PI / 2,
          -Math.PI / 2 + 2 * Math.PI * (ap.remaining / ap.duration)
        );
        ctx.stroke();
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
        const colors: Record<PowerUp['type'], string> = {
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

      animationIdRef.current = requestAnimationFrame(gameLoop);
    };

    animationIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (speedTimeoutRef.current) {
        clearTimeout(speedTimeoutRef.current);
        speedTimeoutRef.current = null;
      }
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [paused, gameOver, lives, score, powerUps, settings.difficulty, updateHighScore]);

  const updateDirectionByDelta = (dx: number, dy: number) => {
    const game = gameRef.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (game.direction.x === 0) {
        game.nextDirection = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
      }
    } else {
      if (game.direction.y === 0) {
        game.nextDirection = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
      }
    }
  };

  const updateDirectionFromPos = (x: number, y: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    updateDirectionByDelta(x - centerX, y - centerY);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    if (!gameOver) {
      updateDirectionFromPos(touch.clientX, touch.clientY);
    }
  }, [gameOver]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameOver || !touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      updateDirectionByDelta(dx, dy);
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [gameOver]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameOver || !touchStartRef.current) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      updateDirectionByDelta(dx, dy);
    }
    touchStartRef.current = null;
  }, [gameOver]);

  const restart = () => {
    gameRef.current = {
      snake: [{ x: 10, y: 10 }],
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
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
      if (scoreFlashTimeoutRef.current) {
        clearTimeout(scoreFlashTimeoutRef.current);
      }
      scoreFlashTimeoutRef.current = setTimeout(() => {
        setScoreFlash(false);
        scoreFlashTimeoutRef.current = null;
      }, 300);
      prevScore.current = score;
    }
  }, [score]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scoreFlashTimeoutRef.current) {
        clearTimeout(scoreFlashTimeoutRef.current);
      }
      if (speedTimeoutRef.current) {
        clearTimeout(speedTimeoutRef.current);
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col items-center p-2">
      <div className="mb-2 flex items-center gap-4 flex-wrap justify-center">
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
      
      <div className="flex-grow flex items-center justify-center w-full min-h-0">
        <ResponsiveCanvas
          width={CANVAS_CONFIG.snake.width}
          height={CANVAS_CONFIG.snake.height}
        >
        <FadingCanvas active={!gameOver}>
          <canvas
            ref={canvasRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="border-2 border-green-500 rounded-lg shadow-lg shadow-green-500/50 touch-none"
          />
        </FadingCanvas>
        </ResponsiveCanvas>
        <GameOverBanner show={gameOver} />
      </div>
      
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
        <p className="text-gray-400 text-sm">Use WASD/Arrows or touch to move</p>
      </div>
    </div>
  );
};

SnakeGame.displayName = 'SnakeGame';