import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Star, Zap, Shield, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { ParticleSystem } from '../../core/ParticleSystem';

export const SnakeGame = ({ settings, updateHighScore }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [powerUps, setPowerUps] = useState([]);
  const [lives, setLives] = useState(3);
  
  const gameRef = useRef({
    snake: [{ x: 10, y: 10 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: { x: 15, y: 15 },
    speed: settings.difficulty === 'easy' ? 150 : settings.difficulty === 'hard' ? 80 : 100,
    lastUpdate: 0,
    gridSize: 20
  });

  const particleSystemRef = useRef(new ParticleSystem());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const resizeCanvas = () => {
      const size = Math.min(window.innerWidth - 32, 400);
      canvas.width = size;
      canvas.height = size;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleInput = (e) => {
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

    window.addEventListener('keydown', handleInput);

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
      const cellSize = canvas.width / gameRef.current.gridSize;
      particleSystemRef.current.createExplosion(
        x * cellSize + cellSize / 2,
        y * cellSize + cellSize / 2,
        color,
        count
      );
    };

    const gameLoop = (timestamp) => {
      if (!paused && !gameOver) {
        const deltaTime = timestamp - gameRef.current.lastUpdate;

        if (deltaTime >= gameRef.current.speed) {
          const game = gameRef.current;
          const snake = game.snake;

          // Handle turn particles
          const prevDir = game.direction;
          game.direction = game.nextDirection;
          if (prevDir.x !== game.direction.x || prevDir.y !== game.direction.y) {
            const cellSize = canvas.width / game.gridSize;
            particleSystemRef.current.createBurst(
              snake[0].x * cellSize + cellSize / 2,
              snake[0].y * cellSize + cellSize / 2,
              -prevDir.x * 100,
              '#10b981',
              8
            );
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

      // Update particles
      particleSystemRef.current.update(0.016);

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

      // Draw snake with gradient
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
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          segment.x * cellSize + 2,
          segment.y * cellSize + 2,
          cellSize - 4,
          cellSize - 4
        );
      });

      // Draw food with animation
      const foodPulse = Math.sin(timestamp * 0.005) * 0.2 + 0.8;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(
        gameRef.current.food.x * cellSize + (1 - foodPulse) * cellSize/2,
        gameRef.current.food.y * cellSize + (1 - foodPulse) * cellSize/2,
        cellSize * foodPulse,
        cellSize * foodPulse
      );

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
      particleSystemRef.current.draw(ctx);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('resize', resizeCanvas);
      particleSystemRef.current.clear();
    };
  }, [paused, gameOver, lives, score, powerUps, settings.difficulty, updateHighScore]);

  const handleTouch = useCallback((e) => {
    if (gameOver) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const dx = x - centerX;
    const dy = y - centerY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      gameRef.current.nextDirection = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
      gameRef.current.nextDirection = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }
  }, [gameOver]);

  const restart = () => {
    gameRef.current = {
      snake: [{ x: 10, y: 10 }],
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      food: { x: 15, y: 15 },
      speed: settings.difficulty === 'easy' ? 150 : settings.difficulty === 'hard' ? 80 : 100,
      lastUpdate: 0,
      gridSize: 20
    };
    particleSystemRef.current.clear();
    setScore(0);
    setLives(3);
    setPowerUps([]);
    setGameOver(false);
    setPaused(false);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 flex items-center gap-4 flex-wrap justify-center">
        <div className="text-white font-bold text-xl">Score: {score}</div>
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
      
      <canvas
        ref={canvasRef}
        onTouchStart={handleTouch}
        className="border-2 border-green-500 rounded-lg shadow-lg shadow-green-500/50 touch-none"
      />
      
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
        {gameOver && (
          <div className="mt-2 text-red-500 font-bold text-xl animate-pulse">
            GAME OVER! Final Score: {score}
          </div>
        )}
      </div>
    </div>
  );
};