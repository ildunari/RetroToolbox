import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Play, Pause } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { Particle } from '../../core/ParticleSystem';
import { FadingCanvas } from "../ui/FadingCanvas";
import { GameOverBanner } from "../ui/GameOverBanner";

// Interfaces
interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

interface Paddle {
  x: number;
  width: number;
  height: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hits: number;
  maxHits: number;
  powerUp: PowerUpType | null;
}

type PowerUpType = 'multiball' | 'expand' | 'laser';

interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  vy: number;
}

interface GameState {
  paddle: Paddle;
  ball: Ball;
  bricks: Brick[];
  particles: Particle[];
  powerUps: PowerUp[];
  lastUpdate: number;
}

interface BreakoutGameProps {
  settings: {
    soundEnabled: boolean;
    soundVolume: number;
  };
  updateHighScore: (game: string, score: number) => void;
}



export const BreakoutGame: React.FC<BreakoutGameProps> = ({ settings, updateHighScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [level, setLevel] = useState(1);
  const [scoreFlash, setScoreFlash] = useState(false);
  const prevScore = useRef(0);
  
  const gameRef = useRef<GameState>({
    paddle: {
      x: 350,
      width: 100,
      height: 10
    },
    ball: {
      x: 400,
      y: 300,
      vx: 4,
      vy: -4,
      size: 8
    },
    bricks: [],
    particles: [],
    powerUps: [],
    lastUpdate: 0
  });

  const initBricks = useCallback(() => {
    const bricks: Brick[] = [];
    const rows = 4 + level;
    const cols = 10;
    const brickWidth = 70;
    const brickHeight = 20;
    const padding = 5;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const powerUpTypes: PowerUpType[] = ['multiball', 'expand', 'laser'];
        bricks.push({
          x: c * (brickWidth + padding) + 35,
          y: r * (brickHeight + padding) + 60,
          width: brickWidth,
          height: brickHeight,
          color: `hsl(${r * 40}, 70%, 50%)`,
          hits: rows - r,
          maxHits: rows - r,
          powerUp: Math.random() < 0.1 ? powerUpTypes[Math.floor(Math.random() * 3)] : null
        });
      }
    }
    gameRef.current.bricks = bricks;
  }, [level]);

  useEffect(() => {
    initBricks();
  }, [level, initBricks]);

  // Collision detection functions
  const checkBallWallCollision = (ball: Ball, canvasWidth: number): boolean => {
    return ball.x <= ball.size || ball.x >= canvasWidth - ball.size;
  };

  const checkBallCeilingCollision = (ball: Ball): boolean => {
    return ball.y <= ball.size;
  };

  const checkBallPaddleCollision = (ball: Ball, paddle: Paddle, canvasHeight: number): boolean => {
    return ball.y + ball.size >= canvasHeight - 30 - paddle.height &&
           ball.y - ball.size <= canvasHeight - 30 &&
           ball.x >= paddle.x &&
           ball.x <= paddle.x + paddle.width;
  };

  const checkBallBrickCollision = (ball: Ball, brick: Brick): boolean => {
    return ball.x + ball.size >= brick.x &&
           ball.x - ball.size <= brick.x + brick.width &&
           ball.y + ball.size >= brick.y &&
           ball.y - ball.size <= brick.y + brick.height;
  };

  const checkPowerUpPaddleCollision = (powerUp: PowerUp, paddle: Paddle, canvasHeight: number): boolean => {
    return powerUp.y >= canvasHeight - 30 - paddle.height &&
           powerUp.x >= paddle.x &&
           powerUp.x <= paddle.x + paddle.width;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    
    const resizeCanvas = () => {
      canvas.width = Math.min(window.innerWidth - 32, 800);
      canvas.height = 600;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleBlur = () => setPaused(true);
    const handleFocus = () => setPaused(false);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameRef.current.paddle.x = e.clientX - rect.left - gameRef.current.paddle.width / 2;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      gameRef.current.paddle.x = e.touches[0].clientX - rect.left - gameRef.current.paddle.width / 2;
    };

    const handleKeyboard = (e: KeyboardEvent) => {
      const speed = 20;
      const paddle = gameRef.current.paddle;
      
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        paddle.x = Math.max(0, paddle.x - speed);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        paddle.x = Math.min(canvas.width - paddle.width, paddle.x + speed);
      } else if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        setPaused(p => !p);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyboard);

    const createParticles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 15; i++) {
        gameRef.current.particles.push(new Particle(
          x, y,
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200,
          color,
          0.8
        ));
      }
    };

    const gameLoop = (timestamp: number) => {
      if (!paused && !gameOver && !transitioning) {
        const game = gameRef.current;
        const { paddle, ball } = game;
        
        // Update ball
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Ball collision with walls
        if (checkBallWallCollision(ball, canvas.width)) {
          ball.vx = -ball.vx;
          soundManager.playTone(220, 50);
        }
        
        if (checkBallCeilingCollision(ball)) {
          ball.vy = -ball.vy;
          soundManager.playTone(220, 50);
        }

        // Ball fell off bottom
        if (ball.y > canvas.height) {
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameOver(true);
              soundManager.playGameOver();
              updateHighScore('breakout', score);
            } else {
              soundManager.playHit();
            }
            return newLives;
          });
          
          // Reset ball
          ball.x = canvas.width / 2;
          ball.y = canvas.height - 100;
          ball.vx = 4;
          ball.vy = -4;
        }

        // Paddle collision
        if (checkBallPaddleCollision(ball, paddle, canvas.height)) {
          const relativeX = (ball.x - paddle.x) / paddle.width;
          const angle = (relativeX - 0.5) * Math.PI / 3;
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          
          ball.vx = speed * Math.sin(angle);
          ball.vy = -speed * Math.cos(angle);
          
          soundManager.playCollect();
          createParticles(ball.x, canvas.height - 30, '#3b82f6');
        }

        // Brick collision
        game.bricks = game.bricks.filter(brick => {
          if (checkBallBrickCollision(ball, brick)) {
            brick.hits--;
            
            if (brick.hits <= 0) {
              setScore(s => s + (brick.maxHits * 10));
              soundManager.playCollect();
              createParticles(brick.x + brick.width/2, brick.y + brick.height/2, brick.color);
              
              if (brick.powerUp) {
                game.powerUps.push({
                  x: brick.x + brick.width/2,
                  y: brick.y + brick.height/2,
                  type: brick.powerUp,
                  vy: 2
                });
              }
              
              return false;
            } else {
              soundManager.playTone(440, 50);
            }
            
            // Bounce ball
            const ballCenterX = ball.x;
            const ballCenterY = ball.y;
            const brickCenterX = brick.x + brick.width / 2;
            const brickCenterY = brick.y + brick.height / 2;
            
            const dx = Math.abs(ballCenterX - brickCenterX);
            const dy = Math.abs(ballCenterY - brickCenterY);
            
            if (dx / brick.width > dy / brick.height) {
              ball.vx = -ball.vx;
            } else {
              ball.vy = -ball.vy;
            }
            
            return true;
          }
          return true;
        });

        // Power-up collision
        game.powerUps = game.powerUps.filter(powerUp => {
          powerUp.y += powerUp.vy;
          
          if (powerUp.y > canvas.height) return false;
          
          if (checkPowerUpPaddleCollision(powerUp, paddle, canvas.height)) {
            soundManager.playPowerUp();
            setScore(s => s + 50);
            
            switch(powerUp.type) {
              case 'expand':
                paddle.width = Math.min(200, paddle.width + 20);
                setTimeout(() => paddle.width = 100, 10000);
                break;
              // Additional power-ups can be implemented here
            }
            
            return false;
          }
          return true;
        });

        // Check level complete
        if (game.bricks.length === 0 && !transitioning) {
          setTransitioning(true);
          setPaused(true);
          soundManager.playPowerUp();
          setTimeout(() => {
            setLevel(l => l + 1);
            initBricks();
            setPaused(false);
            setTransitioning(false);
          }, 700);
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

      // Draw bricks
      gameRef.current.bricks.forEach(brick => {
        const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
        gradient.addColorStop(0, brick.color);
        gradient.addColorStop(1, brick.color + '88');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        if (brick.hits > 1) {
          ctx.fillStyle = 'white';
          ctx.font = '12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(brick.hits.toString(), brick.x + brick.width/2, brick.y + brick.height/2 + 4);
        }
      });

      // Draw paddle
      const { paddle } = gameRef.current;
      const paddleGradient = ctx.createLinearGradient(0, canvas.height - 30, 0, canvas.height - 20);
      paddleGradient.addColorStop(0, '#3b82f6');
      paddleGradient.addColorStop(1, '#2563eb');
      
      ctx.fillStyle = paddleGradient;
      ctx.fillRect(paddle.x, canvas.height - 30, paddle.width, paddle.height);

      // Draw ball
      const { ball } = gameRef.current;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fbbf24';
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw power-ups
      gameRef.current.powerUps.forEach(powerUp => {
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(powerUp.x - 10, powerUp.y - 10, 20, 20);
      });

      // Draw particles
      gameRef.current.particles.forEach(p => p.draw(ctx));

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyboard);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [paused, gameOver, score, level, initBricks, updateHighScore]);

  const restart = () => {
    const game = gameRef.current;
    game.ball.x = 400;
    game.ball.y = 300;
    game.ball.vx = 4;
    game.ball.vy = -4;
    game.paddle.width = 100;
    game.powerUps = [];
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setTransitioning(false);
    setPaused(false);
    initBricks();
  };

  useEffect(() => {
    if (score > prevScore.current) {
      setScoreFlash(true);
      const t = setTimeout(() => setScoreFlash(false), 300);
      prevScore.current = score;
      return () => clearTimeout(t);
    }
  }, [score]);

  const remaining = gameRef.current.bricks.length;

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 flex items-center gap-4 flex-wrap justify-center">
        <div className={`text-white font-bold text-xl transition-transform ${scoreFlash ? 'scale-125 text-yellow-400' : ''}`}>Score: {score}</div>
        <div className="text-white font-bold text-xl">Level: {level}</div>
        <div className="text-white font-bold text-xl">Bricks Left: {remaining}</div>
        <div className="flex items-center gap-1">
          {Array.from({ length: lives }).map((_, i) => (
            <Heart key={i} size={20} className="text-red-500 fill-red-500" />
          ))}
        </div>
      </div>
      
      <FadingCanvas active={!gameOver && !transitioning} slide={transitioning}>
        <canvas
          ref={canvasRef}
          className="border-2 border-red-500 rounded-lg shadow-lg shadow-red-500/50 cursor-none touch-none"
        />
      </FadingCanvas>
      <GameOverBanner show={gameOver} />
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setPaused(p => !p)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          {paused ? <Play size={20} /> : <Pause size={20} />}
        </button>
        <button
          onClick={restart}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Restart
        </button>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-gray-400 text-sm">Move mouse/touch or use A/D keys</p>
      </div>
    </div>
  );
};