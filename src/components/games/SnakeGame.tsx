import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Star, Zap, Shield, Timer, Play, Pause, RotateCcw, Skull } from 'lucide-react';
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
  type:
    | 'speed'
    | 'points'
    | 'shield'
    | 'shrink'
    | 'reverse'
    | 'slow'
    | 'invincible'
    | 'multiplier'
    | 'poison';
  lifeTime: number;
}

interface Obstacle {
  x: number;
  y: number;
}

interface BigFood {
  x: number;
  y: number;
  lifeTime: number;
}

interface PortalPair {
  a: Position;
  b: Position;
  lifeTime: number;
}

interface Ghost {
  position: Position;
  direction: Direction;
}

interface GameState {
  snake: Position[];
  direction: Direction;
  nextDirection: Direction;
  food: Position;
  bigFood: BigFood | null;
  portals: PortalPair | null;
  obstacles: Obstacle[];
  ghost: Ghost | null;
  particles: Particle[];
  speed: number;
  lastUpdate: number;
  gridSize: number;
  scoreMultiplier: number;
  reverseControls: boolean;
  invincibleUntil: number;
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
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [bigFood, setBigFood] = useState<BigFood | null>(null);
  const [portals, setPortals] = useState<PortalPair | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [lives, setLives] = useState<number>(3);
  const animationIdRef = useRef<number | null>(null);
  const speedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const effectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scoreFlashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const foodsEatenRef = useRef<number>(0);

  const baseSpeed =
    settings.difficulty === 'easy' ? 150 : settings.difficulty === 'hard' ? 80 : 100;
  
  const gameRef = useRef<GameState>({
    snake: [{ x: 10, y: 10 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: { x: 15, y: 15 },
    bigFood: null,
    portals: null,
    obstacles: [],
    ghost: null,
    particles: [],
    speed: baseSpeed,
    lastUpdate: 0,
    gridSize: 20,
    scoreMultiplier: 1,
    reverseControls: false,
    invincibleUntil: 0
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
          if (game.direction.y === 0)
            game.nextDirection = game.reverseControls ? { x: 0, y: 1 } : { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
          if (game.direction.y === 0)
            game.nextDirection = game.reverseControls ? { x: 0, y: -1 } : { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
          if (game.direction.x === 0)
            game.nextDirection = game.reverseControls ? { x: 1, y: 0 } : { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
          if (game.direction.x === 0)
            game.nextDirection = game.reverseControls ? { x: -1, y: 0 } : { x: 1, y: 0 };
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
      if (Math.random() < 0.3 && powerUps.length < 3) {
        const types: PowerUp['type'][] = [
          'speed',
          'points',
          'shield',
          'shrink',
          'reverse',
          'slow',
          'invincible',
          'multiplier',
          'poison'
        ];
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

    const spawnObstacle = () => {
      if (obstacles.length < 5 && Math.random() < 0.2) {
        const newObs: Obstacle = {
          x: Math.floor(Math.random() * gameRef.current.gridSize),
          y: Math.floor(Math.random() * gameRef.current.gridSize)
        };
        setObstacles(o => [...o, newObs]);
      }
    };

    const spawnBigFood = () => {
      if (!bigFood && Math.random() < 0.1) {
        const bf: BigFood = {
          x: Math.floor(Math.random() * gameRef.current.gridSize),
          y: Math.floor(Math.random() * gameRef.current.gridSize),
          lifeTime: 7000
        };
        setBigFood(bf);
      }
    };

    const spawnPortals = () => {
      if (!portals && Math.random() < 0.05) {
        const pair: PortalPair = {
          a: {
            x: Math.floor(Math.random() * gameRef.current.gridSize),
            y: Math.floor(Math.random() * gameRef.current.gridSize)
          },
          b: {
            x: Math.floor(Math.random() * gameRef.current.gridSize),
            y: Math.floor(Math.random() * gameRef.current.gridSize)
          },
          lifeTime: 10000
        };
        setPortals(pair);
      }
    };

    const spawnGhost = () => {
      if (!ghost && Math.random() < 0.05) {
        const g: Ghost = {
          position: {
            x: Math.floor(Math.random() * gameRef.current.gridSize),
            y: Math.floor(Math.random() * gameRef.current.gridSize)
          },
          direction: { x: 1, y: 0 }
        };
        setGhost(g);
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
      if (!paused && !gameOver) {
        const deltaTime = timestamp - gameRef.current.lastUpdate;

        if (bigFood) {
          bigFood.lifeTime -= deltaTime;
          if (bigFood.lifeTime <= 0) setBigFood(null);
        }
        if (portals) {
          portals.lifeTime -= deltaTime;
          if (portals.lifeTime <= 0) setPortals(null);
        }
        if (ghost) {
          if (Math.random() < 0.3) {
            const dirs: Direction[] = [
              { x: 1, y: 0 },
              { x: -1, y: 0 },
              { x: 0, y: 1 },
              { x: 0, y: -1 }
            ];
            ghost.direction = dirs[Math.floor(Math.random() * dirs.length)];
          }
          ghost.position.x += ghost.direction.x;
          ghost.position.y += ghost.direction.y;
          if (ghost.position.x < 0) ghost.position.x = gameRef.current.gridSize - 1;
          if (ghost.position.x >= gameRef.current.gridSize) ghost.position.x = 0;
          if (ghost.position.y < 0) ghost.position.y = gameRef.current.gridSize - 1;
          if (ghost.position.y >= gameRef.current.gridSize) ghost.position.y = 0;
        }
        
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

          if (portals) {
            if (head.x === portals.a.x && head.y === portals.a.y) {
              head.x = portals.b.x;
              head.y = portals.b.y;
            } else if (head.x === portals.b.x && head.y === portals.b.y) {
              head.x = portals.a.x;
              head.y = portals.a.y;
            }
          }

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

            // Check obstacle collision
            const hitObstacle = obstacles.some(o => o.x === head.x && o.y === head.y);
            const hitGhost = ghost && ghost.position.x === head.x && ghost.position.y === head.y;
            if ((hitObstacle || hitGhost) && timestamp > game.invincibleUntil) {
              if (lives > 1) {
                setLives(l => l - 1);
                soundManager.playHit();
                createParticles(head.x, head.y, '#ef4444', 20);
                game.snake = [{ x: 10, y: 10 }];
                game.direction = { x: 1, y: 0 };
                game.nextDirection = { x: 1, y: 0 };
              } else {
                setGameOver(true);
                soundManager.playGameOver();
                updateHighScore('snake', score);
                return;
              }
            }

            // Check food collision
            if (head.x === game.food.x && head.y === game.food.y) {
              setScore(s => s + 10 * game.scoreMultiplier);
              soundManager.playCollect();
              createParticles(game.food.x, game.food.y, '#10b981', 15);
              
              // Spawn new food
              do {
                game.food = {
                  x: Math.floor(Math.random() * game.gridSize),
                  y: Math.floor(Math.random() * game.gridSize)
                };
              } while (snake.some(s => s.x === game.food.x && s.y === game.food.y));
              
              foodsEatenRef.current += 1;
              if (foodsEatenRef.current % 5 === 0) {
                game.speed = Math.max(40, game.speed - 10);
              }
              spawnPowerUp();
              spawnObstacle();
              spawnBigFood();
              spawnPortals();
              spawnGhost();
            } else if (bigFood && head.x === bigFood.x && head.y === bigFood.y) {
              setScore(s => s + 30 * game.scoreMultiplier);
              createParticles(bigFood.x, bigFood.y, '#fde047', 25);
              setBigFood(null);
              foodsEatenRef.current += 1;
              if (foodsEatenRef.current % 5 === 0) {
                game.speed = Math.max(40, game.speed - 10);
              }
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
                        game.speed = baseSpeed;
                        speedTimeoutRef.current = null;
                      }, 5000);
                      break;
                    case 'shield':
                      setLives(l => Math.min(5, l + 1));
                      break;
                    case 'shrink':
                      if (snake.length > 3) {
                        snake.splice(-2);
                      }
                      break;
                    case 'reverse':
                      game.reverseControls = true;
                      if (effectTimeoutRef.current) clearTimeout(effectTimeoutRef.current);
                      effectTimeoutRef.current = setTimeout(() => {
                        game.reverseControls = false;
                        effectTimeoutRef.current = null;
                      }, 5000);
                      break;
                    case 'slow':
                      game.speed = baseSpeed * 1.5;
                      if (speedTimeoutRef.current) clearTimeout(speedTimeoutRef.current);
                      speedTimeoutRef.current = setTimeout(() => {
                        game.speed = baseSpeed;
                        speedTimeoutRef.current = null;
                      }, 5000);
                      break;
                    case 'invincible':
                      game.invincibleUntil = timestamp + 5000;
                      break;
                    case 'multiplier':
                      game.scoreMultiplier = 2;
                      if (effectTimeoutRef.current) clearTimeout(effectTimeoutRef.current);
                      effectTimeoutRef.current = setTimeout(() => {
                        game.scoreMultiplier = 1;
                        effectTimeoutRef.current = null;
                      }, 5000);
                      break;
                    case 'poison':
                      setScore(s => Math.max(0, s - 20));
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
      const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = bgGrad;
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
        const hue = 160 - index * 3;
        ctx.fillStyle = `hsl(${hue},70%,45%)`;
        ctx.shadowBlur = index === 0 ? 20 : 10;
        ctx.shadowColor = '#10b981';
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

      if (bigFood) {
        ctx.save();
        ctx.translate(
          bigFood.x * cellSize + cellSize / 2,
          bigFood.y * cellSize + cellSize / 2
        );
        ctx.rotate((timestamp / 200) % (Math.PI * 2));
        ctx.fillStyle = '#fde047';
        for (let i = 0; i < 5; i++) {
          ctx.rotate((Math.PI * 2) / 5);
          ctx.beginPath();
          ctx.moveTo(0, -cellSize / 2);
          ctx.lineTo(cellSize / 6, -cellSize / 6);
          ctx.lineTo(cellSize / 2, 0);
          ctx.lineTo(cellSize / 6, cellSize / 6);
          ctx.lineTo(0, cellSize / 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw power-ups
      powerUps.forEach(powerUp => {
        const colors: Record<PowerUp['type'], string> = {
          speed: '#3b82f6',
          points: '#f59e0b',
          shield: '#8b5cf6',
          shrink: '#ec4899',
          reverse: '#f97316',
          slow: '#38bdf8',
          invincible: '#a21caf',
          multiplier: '#84cc16',
          poison: '#dc2626'
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

      obstacles.forEach(o => {
        ctx.fillStyle = '#334155';
        ctx.fillRect(o.x * cellSize + 2, o.y * cellSize + 2, cellSize - 4, cellSize - 4);
      });

      if (portals) {
        const colors = ['#38bdf8', '#f472b6'];
        [portals.a, portals.b].forEach((p, i) => {
          ctx.fillStyle = colors[i];
          ctx.beginPath();
          ctx.arc(p.x * cellSize + cellSize / 2, p.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (ghost) {
        ctx.fillStyle = 'rgba(192,132,252,0.8)';
        ctx.beginPath();
        ctx.arc(
          ghost.position.x * cellSize + cellSize / 2,
          ghost.position.y * cellSize + cellSize / 2,
          cellSize / 2.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

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
      if (effectTimeoutRef.current) {
        clearTimeout(effectTimeoutRef.current);
        effectTimeoutRef.current = null;
      }
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [paused, gameOver, lives, score, powerUps, settings.difficulty, updateHighScore]);

  const updateDirectionByDelta = (dx: number, dy: number) => {
    const game = gameRef.current;
    const factor = game.reverseControls ? -1 : 1;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (game.direction.x === 0) {
        game.nextDirection = dx * factor > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
      }
    } else {
      if (game.direction.y === 0) {
        game.nextDirection = dy * factor > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
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
      bigFood: null,
      portals: null,
      obstacles: [],
      ghost: null,
      particles: [],
      speed: baseSpeed,
      lastUpdate: 0,
      gridSize: 20,
      scoreMultiplier: 1,
      reverseControls: false,
      invincibleUntil: 0
    };
    setScore(0);
    setLives(3);
    setPowerUps([]);
    setObstacles([]);
    setBigFood(null);
    setPortals(null);
    setGhost(null);
    foodsEatenRef.current = 0;
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
      if (effectTimeoutRef.current) {
        clearTimeout(effectTimeoutRef.current);
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
                {p.type === 'reverse' && <RotateCcw size={16} />}
                {p.type === 'slow' && <Pause size={16} />}
                {p.type === 'invincible' && <Shield size={16} className="fill-purple-500" />}
                {p.type === 'multiplier' && <Star size={16} className="text-green-400" />}
                {p.type === 'poison' && <Skull size={16} />}
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