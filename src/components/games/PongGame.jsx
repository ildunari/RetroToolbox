import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { SoundManager } from '../../core/SoundManager';
import { Particle } from '../../core/ParticleSystem';

import { FadingCanvas } from "../ui/FadingCanvas";
import { GameOverBanner } from "../ui/GameOverBanner";
const soundManager = new SoundManager();

export const PongGame = ({ settings, updateHighScore }) => {
  const canvasRef = useRef(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playerFlash, setPlayerFlash] = useState(false);
  const [aiFlash, setAiFlash] = useState(false);
  const prevPlayer = useRef(0);
  const prevAi = useRef(0);
  
  const gameRef = useRef({
    playerY: 200,
    aiY: 200,
    ballX: 400,
    ballY: 200,
    ballVX: 5,
    ballVY: 3,
    ballSpeed: 5,
    aiSpeed: settings.difficulty === 'easy' ? 3 : settings.difficulty === 'hard' ? 6 : 4,
    aiReactionTime: settings.difficulty === 'easy' ? 0.8 : settings.difficulty === 'hard' ? 0.95 : 0.9,
    particles: [],
    paddleHeight: 80,
    paddleWidth: 10,
    ballSize: 10,
    lastUpdate: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const resizeCanvas = () => {
      canvas.width = Math.min(window.innerWidth - 32, 800);
      canvas.height = 400;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleBlur = () => setPaused(true);
    const handleFocus = () => setPaused(false);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      gameRef.current.playerY = e.clientY - rect.top;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      gameRef.current.playerY = e.touches[0].clientY - rect.top;
    };

    const handleKeyboard = (e) => {
      const speed = 20;
      if (e.key === 'ArrowUp' || e.key === 'w') {
        gameRef.current.playerY = Math.max(40, gameRef.current.playerY - speed);
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        gameRef.current.playerY = Math.min(canvas.height - 40, gameRef.current.playerY + speed);
      } else if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        setPaused(p => !p);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyboard);

    const createParticles = (x, y, vx, color) => {
      for (let i = 0; i < 20; i++) {
        gameRef.current.particles.push(new Particle(
          x, y,
          vx + (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200,
          color,
          0.5
        ));
      }
    };

    const gameLoop = (timestamp) => {
      if (!paused && !gameOver) {
        const deltaTime = (timestamp - gameRef.current.lastUpdate) / 1000;
        gameRef.current.lastUpdate = timestamp;
        
        const game = gameRef.current;
        
        // Update ball position
        game.ballX += game.ballVX;
        game.ballY += game.ballVY;

        // Ball collision with top/bottom
        if (game.ballY <= game.ballSize || game.ballY >= canvas.height - game.ballSize) {
          game.ballVY = -game.ballVY;
          soundManager.playTone(440, 50);
        }

        // Ball collision with paddles
        const paddleHit = (paddleY) => {
          return game.ballY >= paddleY - game.paddleHeight/2 && 
                 game.ballY <= paddleY + game.paddleHeight/2;
        };

        // Player paddle collision
        if (game.ballX <= game.paddleWidth + game.ballSize && 
            game.ballX > game.paddleWidth &&
            paddleHit(game.playerY)) {
          const relativeIntersectY = (game.playerY - game.ballY) / (game.paddleHeight / 2);
          const bounceAngle = relativeIntersectY * Math.PI / 4;
          
          game.ballSpeed = Math.min(game.ballSpeed * 1.05, 15);
          game.ballVX = game.ballSpeed * Math.cos(-bounceAngle);
          game.ballVY = game.ballSpeed * Math.sin(-bounceAngle);
          
          soundManager.playCollect();
          createParticles(game.paddleWidth, game.ballY, 100, '#3b82f6');
        }

        // AI paddle collision
        if (game.ballX >= canvas.width - game.paddleWidth - game.ballSize && 
            game.ballX < canvas.width - game.paddleWidth &&
            paddleHit(game.aiY)) {
          const relativeIntersectY = (game.aiY - game.ballY) / (game.paddleHeight / 2);
          const bounceAngle = relativeIntersectY * Math.PI / 4;
          
          game.ballSpeed = Math.min(game.ballSpeed * 1.05, 15);
          game.ballVX = -game.ballSpeed * Math.cos(-bounceAngle);
          game.ballVY = game.ballSpeed * Math.sin(-bounceAngle);
          
          soundManager.playCollect();
          createParticles(canvas.width - game.paddleWidth, game.ballY, -100, '#ef4444');
        }

        // Score
        if (game.ballX < -game.ballSize) {
          setAiScore(s => s + 1);
          soundManager.playHit();
          game.ballX = canvas.width / 2;
          game.ballY = canvas.height / 2;
          game.ballSpeed = 5;
          game.ballVX = -5;
          game.ballVY = (Math.random() - 0.5) * 6;
        }

        if (game.ballX > canvas.width + game.ballSize) {
          setPlayerScore(s => s + 1);
          soundManager.playCollect();
          game.ballX = canvas.width / 2;
          game.ballY = canvas.height / 2;
          game.ballSpeed = 5;
          game.ballVX = 5;
          game.ballVY = (Math.random() - 0.5) * 6;
        }

        // Enhanced AI movement
        const targetY = game.ballY + (game.ballVY * 10);
        const diff = targetY - game.aiY;
        
        if (Math.random() < game.aiReactionTime) {
          if (Math.abs(diff) > 5) {
            game.aiY += Math.sign(diff) * Math.min(game.aiSpeed, Math.abs(diff));
          }
        }
        
        // Keep AI paddle in bounds
        game.aiY = Math.max(game.paddleHeight/2, Math.min(canvas.height - game.paddleHeight/2, game.aiY));
      }

      // Update particles
      gameRef.current.particles = gameRef.current.particles.filter(p => {
        p.update(0.016);
        return p.life > 0;
      });

      // Draw
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line
      ctx.strokeStyle = '#3b82f6';
      ctx.setLineDash([10, 10]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles with glow effect
      const drawPaddle = (x, y, color) => {
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        
        const gradient = ctx.createLinearGradient(x, y - gameRef.current.paddleHeight/2, x, y + gameRef.current.paddleHeight/2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color + 'ff');
        gradient.addColorStop(1, color);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y - gameRef.current.paddleHeight/2, gameRef.current.paddleWidth, gameRef.current.paddleHeight);
        ctx.shadowBlur = 0;
      };

      drawPaddle(0, gameRef.current.playerY, '#3b82f6');
      drawPaddle(canvas.width - gameRef.current.paddleWidth, gameRef.current.aiY, '#ef4444');

      // Draw ball with trail
      const game = gameRef.current;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#fbbf24';
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(game.ballX - game.ballSize/2, game.ballY - game.ballSize/2, game.ballSize, game.ballSize);
      ctx.shadowBlur = 0;

      // Draw particles
      gameRef.current.particles.forEach(p => p.draw(ctx));

      // Draw scores
      ctx.font = 'bold 48px monospace';
      ctx.fillStyle = '#3b82f6';
      ctx.fillText(playerScore, canvas.width / 4, 60);
      ctx.fillStyle = '#ef4444';
      ctx.fillText(aiScore, 3 * canvas.width / 4, 60);

      animationId = requestAnimationFrame(gameLoop);
    };

    gameRef.current.lastUpdate = performance.now();
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
  }, [paused, gameOver, playerScore, aiScore, settings.difficulty]);

  useEffect(() => {
    if (playerScore >= 7 || aiScore >= 7) {
      setGameOver(true);
      if (playerScore > aiScore) {
        soundManager.playPowerUp();
        updateHighScore('pong', playerScore);
      } else {
        soundManager.playGameOver();
      }
    }
  }, [playerScore, aiScore, updateHighScore]);

  useEffect(() => {
    if (playerScore > prevPlayer.current) {
      setPlayerFlash(true);
      const t = setTimeout(() => setPlayerFlash(false), 300);
      prevPlayer.current = playerScore;
      return () => clearTimeout(t);
    }
    if (aiScore > prevAi.current) {
      setAiFlash(true);
      const t = setTimeout(() => setAiFlash(false), 300);
      prevAi.current = aiScore;
      return () => clearTimeout(t);
    }
  }, [playerScore, aiScore]);

  const restart = () => {
    gameRef.current.ballX = 400;
    gameRef.current.ballY = 200;
    gameRef.current.ballVX = 5;
    gameRef.current.ballVY = 3;
    gameRef.current.ballSpeed = 5;
    setPlayerScore(0);
    setAiScore(0);
    setGameOver(false);
    setPaused(false);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 text-center">
        <p className="text-gray-400 text-sm mb-2">First to 7 wins!</p>
      </div>

      <div className="flex justify-between w-full max-w-xl mb-2 text-4xl font-mono font-bold">
        <span className={`text-blue-400 transition-transform ${playerFlash ? 'scale-125' : ''}`}>{playerScore}</span>
        <span className={`text-red-400 transition-transform ${aiFlash ? 'scale-125' : ''}`}>{aiScore}</span>
      </div>

      <FadingCanvas active={!gameOver}>
        <canvas
          ref={canvasRef}
          className="border-2 border-blue-500 rounded-lg shadow-lg shadow-blue-500/50 cursor-none touch-none"
        />
      </FadingCanvas>
      <GameOverBanner show={gameOver} />
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setPaused(p => !p)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {paused ? <Play size={20} /> : <Pause size={20} />}
        </button>
        {gameOver && (
          <button
            onClick={restart}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={20} /> Restart
          </button>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-gray-400 text-sm">Move mouse/touch or use W/S keys</p>
      </div>
    </div>
  );
};
