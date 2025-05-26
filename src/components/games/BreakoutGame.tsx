import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Play, Pause, RotateCcw } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { particleManager } from '../../core/ParticleSystem';
import { FadingCanvas } from "../ui/FadingCanvas";
import { GameOverBanner } from "../ui/GameOverBanner";
import { GameProps, Brick } from '../../core/GameTypes';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface GameRef {
  ball: Ball;
  paddle: Paddle;
  bricks: Brick[];
  powerUps: any[];
}

// Constants for paddle positioning
const PADDLE_Y_OFFSET = 40; // Distance from bottom of screen

export const BreakoutGame: React.FC<GameProps> = ({ settings, updateHighScore }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [level, setLevel] = useState(1);
  const [scoreFlash, setScoreFlash] = useState(false);
  const prevScore = useRef(0);
  
  const gameRef = useRef({
    paddleX: 0, // Will be initialized in useEffect
    paddleWidth: 100,
    paddleHeight: 10,
    ballX: 400,
    ballY: 300,
    ballVX: 4,
    ballVY: -4,
    ballSize: 8,
    bricks: [],
    powerUps: [],
    lastUpdate: 0
  });

  const initBricks = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const bricks = [];
    const rows = 4 + level;
    const cols = 10;
    const brickWidth = 70;
    const brickHeight = 20;
    const padding = 5;
    
    // Calculate total width of all bricks including padding
    const totalBrickWidth = cols * brickWidth + (cols - 1) * padding;
    const startX = (canvas.width - totalBrickWidth) / 2;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: startX + c * (brickWidth + padding),
          y: r * (brickHeight + padding) + 60,
          width: brickWidth,
          height: brickHeight,
          color: `hsl(${r * 40}, 70%, 50%)`,
          hits: rows - r,
          maxHits: rows - r,
          powerUp: Math.random() < 0.1 ? ['multiball', 'expand', 'laser'][Math.floor(Math.random() * 3)] : null
        });
      }
    }
    gameRef.current.bricks = bricks;
  }, [level]);

  useEffect(() => {
    initBricks();
  }, [level, initBricks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const resizeCanvas = () => {
      // Get full viewport dimensions
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      
      // Use much more of the screen
      const availableWidth = vw - 16;
      const availableHeight = vh - 80;
      
      // Maintain 4:3 aspect ratio for Breakout, use at least 85% of available space
      let width = availableWidth * 0.95;
      let height = (width * 3) / 4;
      
      if (height > availableHeight * 0.9) {
        height = availableHeight * 0.9;
        width = (height * 4) / 3;
      }
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${Math.floor(width)}px`;
      canvas.style.height = `${Math.floor(height)}px`;
      ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    
    // Initialize paddle position centered on screen
    gameRef.current.paddleX = (canvas.width - gameRef.current.paddleWidth) / 2;

    const handleBlur = () => setPaused(true);
    const handleFocus = () => setPaused(false);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - gameRef.current.paddleWidth / 2;
      const maxX = canvas.width - gameRef.current.paddleWidth;
      gameRef.current.paddleX = Math.max(0, Math.min(maxX, x));
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left - gameRef.current.paddleWidth / 2;
      const maxX = canvas.width - gameRef.current.paddleWidth;
      gameRef.current.paddleX = Math.max(0, Math.min(maxX, x));
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left - gameRef.current.paddleWidth / 2;
      const maxX = canvas.width - gameRef.current.paddleWidth;
      gameRef.current.paddleX = Math.max(0, Math.min(maxX, x));
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
    };

    const handleKeyboard = (e) => {
      const speed = 20;
      const maxX = canvas.width - gameRef.current.paddleWidth;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        gameRef.current.paddleX = Math.max(0, gameRef.current.paddleX - speed);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        gameRef.current.paddleX = Math.min(maxX, gameRef.current.paddleX + speed);
      } else if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        setPaused(p => !p);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('keydown', handleKeyboard);

    const createParticles = (x, y, color) => {
      for (let i = 0; i < 15; i++) {
        particleManager.getParticleSystem().addParticle({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 200,
          vy: (Math.random() - 0.5) * 200,
          color: color,
          life: 0.8,
          size: 2
        });
      }
    };

    const gameLoop = (timestamp) => {
      if (!paused && !gameOver && !transitioning) {
        const game = gameRef.current;
        
        // Continuous collision detection
        const prevX = game.ballX;
        const prevY = game.ballY;
        const nextX = game.ballX + game.ballVX;
        const nextY = game.ballY + game.ballVY;
        
        let collisionDetected = false;

        // Wall collision with continuous detection
        if (nextX <= game.ballSize) {
          game.ballX = game.ballSize;
          game.ballVX = Math.abs(game.ballVX);
          soundManager.playTone(220, 50);
          collisionDetected = true;
        } else if (nextX >= canvas.width - game.ballSize) {
          game.ballX = canvas.width - game.ballSize;
          game.ballVX = -Math.abs(game.ballVX);
          soundManager.playTone(220, 50);
          collisionDetected = true;
        }
        
        if (nextY <= game.ballSize) {
          game.ballY = game.ballSize;
          game.ballVY = Math.abs(game.ballVY);
          soundManager.playTone(220, 50);
          collisionDetected = true;
        }

        // Update position if no collision
        if (!collisionDetected) {
          game.ballX = nextX;
          game.ballY = nextY;
        }

        // Apply speed cap to prevent extreme velocities
        const maxSpeed = 15;
        const currentSpeed = Math.sqrt(game.ballVX * game.ballVX + game.ballVY * game.ballVY);
        if (currentSpeed > maxSpeed) {
          const scale = maxSpeed / currentSpeed;
          game.ballVX *= scale;
          game.ballVY *= scale;
        }

        // Ball fell off bottom
        if (game.ballY > canvas.height) {
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
          game.ballX = canvas.width / 2;
          game.ballY = canvas.height - 100;
          game.ballVX = 4;
          game.ballVY = -4;
        }

        // Paddle collision
        const paddleY = canvas.height - PADDLE_Y_OFFSET;
        if (game.ballY + game.ballSize >= paddleY - game.paddleHeight &&
            game.ballY - game.ballSize <= paddleY &&
            game.ballX >= game.paddleX &&
            game.ballX <= game.paddleX + game.paddleWidth) {
          
          const relativeX = (game.ballX - game.paddleX) / game.paddleWidth;
          const angle = (relativeX - 0.5) * Math.PI / 3;
          const speed = Math.sqrt(game.ballVX * game.ballVX + game.ballVY * game.ballVY);
          
          game.ballVX = speed * Math.sin(angle);
          game.ballVY = -speed * Math.cos(angle);
          
          soundManager.playCollect();
          createParticles(game.ballX, paddleY, '#3b82f6');
        }

        // Brick collision
        game.bricks = game.bricks.filter(brick => {
          if (game.ballX + game.ballSize >= brick.x &&
              game.ballX - game.ballSize <= brick.x + brick.width &&
              game.ballY + game.ballSize >= brick.y &&
              game.ballY - game.ballSize <= brick.y + brick.height) {
            
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
            
            // Improved brick collision response
            const ballCenterX = game.ballX;
            const ballCenterY = game.ballY;
            const brickCenterX = brick.x + brick.width / 2;
            const brickCenterY = brick.y + brick.height / 2;
            
            // Calculate which side of the brick was hit
            const overlapX = (brick.width / 2 + game.ballSize) - Math.abs(ballCenterX - brickCenterX);
            const overlapY = (brick.height / 2 + game.ballSize) - Math.abs(ballCenterY - brickCenterY);
            
            // Determine collision direction based on smallest overlap
            if (overlapX < overlapY) {
              // Hit from left or right
              game.ballVX = ballCenterX < brickCenterX ? -Math.abs(game.ballVX) : Math.abs(game.ballVX);
            } else {
              // Hit from top or bottom
              game.ballVY = ballCenterY < brickCenterY ? -Math.abs(game.ballVY) : Math.abs(game.ballVY);
            }
            
            return true;
          }
          return true;
        });

        // Power-up collision
        game.powerUps = game.powerUps.filter(powerUp => {
          powerUp.y += powerUp.vy;
          
          if (powerUp.y > canvas.height) return false;
          
          const paddleY = canvas.height - PADDLE_Y_OFFSET;
          if (powerUp.y >= paddleY - game.paddleHeight &&
              powerUp.x >= game.paddleX &&
              powerUp.x <= game.paddleX + game.paddleWidth) {
            
            soundManager.playPowerUp();
            setScore(s => s + 50);
            
            switch(powerUp.type) {
              case 'expand':
                game.paddleWidth = Math.min(200, game.paddleWidth + 20);
                setTimeout(() => game.paddleWidth = 100, 10000);
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
      particleManager.update(0.016);

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
        
        // Only show hit count on damaged bricks
        if (brick.hits > 1 && brick.hits < brick.maxHits) {
          ctx.fillStyle = 'white';
          ctx.font = '12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(brick.hits.toString(), brick.x + brick.width/2, brick.y + brick.height/2 + 4);
        }
      });

      // Draw paddle
      const paddleY = canvas.height - PADDLE_Y_OFFSET;
      const paddleGradient = ctx.createLinearGradient(0, paddleY, 0, paddleY + gameRef.current.paddleHeight);
      paddleGradient.addColorStop(0, '#3b82f6');
      paddleGradient.addColorStop(1, '#2563eb');
      
      ctx.fillStyle = paddleGradient;
      ctx.fillRect(gameRef.current.paddleX, paddleY, gameRef.current.paddleWidth, gameRef.current.paddleHeight);

      // Draw ball
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fbbf24';
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(gameRef.current.ballX, gameRef.current.ballY, gameRef.current.ballSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw power-ups
      gameRef.current.powerUps.forEach(powerUp => {
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(powerUp.x - 10, powerUp.y - 10, 20, 20);
      });

      // Draw particles
      particleManager.draw(ctx);

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
    const canvas = canvasRef.current;
    if (canvas) {
      gameRef.current.ballX = canvas.width / 2;
      gameRef.current.ballY = canvas.height / 2;
      gameRef.current.paddleX = (canvas.width - gameRef.current.paddleWidth) / 2;
    } else {
      gameRef.current.ballX = 400;
      gameRef.current.ballY = 300;
    }
    gameRef.current.ballVX = 4;
    gameRef.current.ballVY = -4;
    gameRef.current.paddleWidth = 100;
    gameRef.current.powerUps = [];
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
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <RotateCcw size={20} />
          Restart
        </button>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-gray-400 text-sm">Move mouse/touch or use A/D keys</p>
      </div>
    </div>
  );
};