import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Play, Pause, RotateCcw } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { Particle } from '../../core/ParticleSystem';
import { ResponsiveCanvas } from "../ui/ResponsiveCanvas";
import { FadingCanvas } from "../ui/FadingCanvas";
import { CANVAS_CONFIG } from "../../core/CanvasConfig";



// Type definitions
interface Position {
  x: number;
  y: number;
}

interface GameObject extends Position {
  width: number;
  height: number;
}

interface Player extends GameObject {
  speed: number;
}

interface Enemy extends GameObject {
  type: number;
  alive: boolean;
  points: number;
}

interface Projectile extends GameObject {
  speed: number;
  isPlayer: boolean;
}

interface Barrier extends GameObject {
  health: number;
}

interface PowerUp extends GameObject {
  type: 'rapidfire' | 'multishot' | 'shield';
  speed: number;
}

interface GameState {
  player: Player;
  bullets: Projectile[];
  alienBullets: Projectile[];
  aliens: Enemy[];
  barriers: Barrier[];
  powerUps: PowerUp[];
  particles: Particle[];
  lastUpdate: number;
  alienDirection: number;
  alienSpeed: number;
  fireRate: number;
  playerFireCooldown: number;
  powerUpEndTime: number;
  keys: Record<string, boolean>;
  mouseX: number;
  autoFire: boolean;
}

interface SpaceInvadersGameProps {
  settings: {
    soundEnabled: boolean;
    volume: number;
  };
  updateHighScore: (game: string, score: number) => void;
}

export const SpaceInvadersGame: React.FC<SpaceInvadersGameProps> = ({ settings, updateHighScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [level, setLevel] = useState(1);
  const [powerUp, setPowerUp] = useState<PowerUp['type'] | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const gameOverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const gameRef = useRef<GameState>({
    player: { x: 400, y: 500, width: 40, height: 30, speed: 8 },
    bullets: [],
    alienBullets: [],
    aliens: [],
    barriers: [],
    powerUps: [],
    particles: [],
    lastUpdate: 0,
    alienDirection: 1,
    alienSpeed: 1,
    fireRate: 0.02,
    playerFireCooldown: 0,
    powerUpEndTime: 0,
    keys: {},
    mouseX: 0,
    autoFire: false
  });

  const initAliens = useCallback(() => {
    const aliens: Enemy[] = [];
    const rows = 4 + Math.floor(level / 3);
    const cols = 8 + Math.floor(level / 5);
    const alienWidth = 30;
    const alienHeight = 25;
    const spacing = 40;
    const startX = (800 - (cols * spacing)) / 2;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        aliens.push({
          x: startX + c * spacing,
          y: 50 + r * spacing,
          width: alienWidth,
          height: alienHeight,
          type: r % 3, // Different alien types
          alive: true,
          points: (3 - (r % 3)) * 10 // Higher rows worth more points
        });
      }
    }
    gameRef.current.aliens = aliens;
  }, [level]);

  const initBarriers = useCallback(() => {
    const barriers: Barrier[] = [];
    const barrierCount = 4;
    const barrierWidth = 60;
    const barrierHeight = 40;
    const spacing = (800 - (barrierCount * barrierWidth)) / (barrierCount + 1);
    
    for (let i = 0; i < barrierCount; i++) {
      barriers.push({
        x: spacing + i * (barrierWidth + spacing),
        y: 400,
        width: barrierWidth,
        height: barrierHeight,
        health: 3
      });
    }
    gameRef.current.barriers = barriers;
  }, []);

  useEffect(() => {
    initAliens();
    initBarriers();
  }, [level, initAliens, initBarriers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    
    canvas.width = CANVAS_CONFIG.spaceInvaders.width;
    canvas.height = CANVAS_CONFIG.spaceInvaders.height;

    const handleBlur = () => setPaused(true);
    const handleFocus = () => {
      setPaused(false);
      canvasRef.current?.focus();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      gameRef.current.keys[e.key] = true;
      
      if (e.key === 'p' || e.key === 'Escape') {
        e.preventDefault();
        setPaused(prev => {
          const next = !prev;
          if (!next) {
            canvasRef.current?.focus();
          }
          return next;
        });
      }
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        gameRef.current.autoFire = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key] = false;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        gameRef.current.autoFire = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gameOver) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        gameRef.current.mouseX = e.clientX - rect.left;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameOver) return;
      gameRef.current.autoFire = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      gameRef.current.autoFire = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameOver) return;
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        gameRef.current.mouseX = e.touches[0].clientX - rect.left;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (gameOver) return;
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        gameRef.current.mouseX = e.touches[0].clientX - rect.left;
        gameRef.current.autoFire = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      gameRef.current.autoFire = false;
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    const gameLoop = (timestamp: number) => {
      if (gameOver) {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      const deltaTime = timestamp - gameRef.current.lastUpdate;
      gameRef.current.lastUpdate = timestamp;

      const game = gameRef.current;
      
      // Skip game logic updates when paused, but still render
      if (!paused) {
      
      // Smooth player movement
      const moveSpeed = game.player.speed;
      if (game.keys['ArrowLeft'] || game.keys['a']) {
        game.player.x = Math.max(0, game.player.x - moveSpeed);
      }
      if (game.keys['ArrowRight'] || game.keys['d']) {
        game.player.x = Math.min(canvas.width - game.player.width, game.player.x + moveSpeed);
      }
      
      // Mouse/touch movement
      if (game.mouseX > 0) {
        const targetX = game.mouseX - game.player.width / 2;
        const diff = targetX - game.player.x;
        if (Math.abs(diff) > 2) {
          game.player.x += diff * 0.15; // Smooth interpolation
        }
        game.player.x = Math.max(0, Math.min(canvas.width - game.player.width, game.player.x));
      }
      
      // Update player fire cooldown
      if (game.playerFireCooldown > 0) {
        game.playerFireCooldown--;
      }

      // Auto-fire when space/mouse is held
      if (game.autoFire && game.playerFireCooldown <= 0) {
        const maxBullets = powerUp === 'multishot' ? 6 : 3;
        if (game.bullets.filter(b => b.isPlayer).length < maxBullets) {
          if (powerUp === 'multishot') {
            // Triple shot with enhanced spread
            for (let i = -1; i <= 1; i++) {
              game.bullets.push({
                x: game.player.x + game.player.width / 2 - 2 + i * 20,
                y: game.player.y,
                width: 4,
                height: 12,
                speed: 10,
                isPlayer: true
              });
            }
          } else {
            game.bullets.push({
              x: game.player.x + game.player.width / 2 - 2,
              y: game.player.y,
              width: 4,
              height: 12,
              speed: 10,
              isPlayer: true
            });
          }
          soundManager.playTone(1200, 30);
          game.playerFireCooldown = powerUp === 'rapidfire' ? 3 : 8;
        }
      }

      // Check power-up expiration
      if (powerUp && timestamp > game.powerUpEndTime) {
        setPowerUp(null);
      }

      // Update bullets
      game.bullets = game.bullets.filter(bullet => {
        bullet.y += bullet.isPlayer ? -bullet.speed : bullet.speed;
        return bullet.y > -bullet.height && bullet.y < canvas.height + bullet.height;
      });

      // Update aliens
      let edgeHit = false;
      const aliveAliens = game.aliens.filter(alien => alien.alive);
      
      if (aliveAliens.length > 0) {
        // Check if any alien hits the edge
        aliveAliens.forEach(alien => {
          alien.x += game.alienDirection * game.alienSpeed;
          if (alien.x <= 0 || alien.x >= canvas.width - alien.width) {
            edgeHit = true;
          }
        });

        if (edgeHit) {
          game.alienDirection *= -1;
          aliveAliens.forEach(alien => {
            alien.y += 20;
          });
          game.alienSpeed += 0.2;
        }

        // Alien firing
        if (Math.random() < game.fireRate) {
          const shooters = aliveAliens.filter(alien => 
            !aliveAliens.some(other => other.x === alien.x && other.y > alien.y)
          );
          if (shooters.length > 0) {
            const shooter = shooters[Math.floor(Math.random() * shooters.length)];
            game.alienBullets.push({
              x: shooter.x + shooter.width / 2 - 2,
              y: shooter.y + shooter.height,
              width: 4,
              height: 8,
              speed: 3,
              isPlayer: false
            });
          }
        }
      }

      // Update alien bullets
      game.alienBullets = game.alienBullets.filter(bullet => {
        bullet.y += bullet.speed;
        return bullet.y < canvas.height;
      });

      // Collision detection - Player bullets vs aliens
      const bulletsToRemove: number[] = [];
      game.bullets.forEach((bullet, bulletIndex) => {
        if (!bullet.isPlayer) return;
        game.aliens.forEach((alien, alienIndex) => {
          if (alien.alive && 
              bullet.x < alien.x + alien.width &&
              bullet.x + bullet.width > alien.x &&
              bullet.y < alien.y + alien.height &&
              bullet.y + bullet.height > alien.y) {
            
            // Alien hit
            alien.alive = false;
            bulletsToRemove.push(bulletIndex);
            
            const newScore = score + alien.points;
            setScore(newScore);
            
            // Create enhanced particles
            for (let i = 0; i < 15; i++) {
              game.particles.push(new Particle(
                alien.x + alien.width / 2,
                alien.y + alien.height / 2,
                Math.random() * 8 - 4,
                Math.random() * 8 - 4,
                `hsl(${alien.type * 60 + 180}, 90%, ${60 + Math.random() * 30}%)`,
                60
              ));
            }
            
            soundManager.playHit();
            
            // Power-up chance
            if (Math.random() < 0.1) {
              const powerUpTypes: PowerUp['type'][] = ['rapidfire', 'multishot', 'shield'];
              game.powerUps.push({
                x: alien.x + alien.width / 2,
                y: alien.y + alien.height / 2,
                width: 20,
                height: 20,
                type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
                speed: 2
              });
            }
          }
        });
      });
      // Remove marked bullets
      game.bullets = game.bullets.filter((_, index) => !bulletsToRemove.includes(index));

      // Collision detection - Alien bullets vs player
      const alienBulletsToRemove: number[] = [];
      game.alienBullets.forEach((bullet, bulletIndex) => {
        if (bullet.x < game.player.x + game.player.width &&
            bullet.x + bullet.width > game.player.x &&
            bullet.y < game.player.y + game.player.height &&
            bullet.y + bullet.height > game.player.y) {
          
          alienBulletsToRemove.push(bulletIndex);
          
          if (powerUp !== 'shield') {
            setLives(prev => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                if (gameOverTimeoutRef.current) {
                  clearTimeout(gameOverTimeoutRef.current);
                }
                gameOverTimeoutRef.current = setTimeout(() => {
                  setGameOver(true);
                  updateHighScore('spaceInvaders', score);
                  soundManager.playGameOver();
                  gameOverTimeoutRef.current = null;
                }, 100);
              } else {
                soundManager.playHit();
              }
              return newLives;
            });
            
            // Create particles
            for (let i = 0; i < 12; i++) {
              game.particles.push(new Particle(
                game.player.x + game.player.width / 2,
                game.player.y + game.player.height / 2,
                Math.random() * 6 - 3,
                Math.random() * 6 - 3,
                '#ff6b6b',
                40
              ));
            }
          }
        }
      });
      // Remove marked alien bullets
      game.alienBullets = game.alienBullets.filter((_, index) => !alienBulletsToRemove.includes(index));

      // Collision detection - Bullets vs barriers
      const playerBulletsToRemove: number[] = [];
      const alienBulletsToRemove2: number[] = [];
      
      // Check player bullets vs barriers
      game.bullets.forEach((bullet, bulletIndex) => {
        game.barriers.forEach(barrier => {
          if (barrier.health > 0 &&
              bullet.x < barrier.x + barrier.width &&
              bullet.x + bullet.width > barrier.x &&
              bullet.y < barrier.y + barrier.height &&
              bullet.y + bullet.height > barrier.y) {
            
            barrier.health--;
            playerBulletsToRemove.push(bulletIndex);
            
            // Create particles
            for (let i = 0; i < 4; i++) {
              game.particles.push(new Particle(
                bullet.x,
                bullet.y,
                Math.random() * 4 - 2,
                Math.random() * 4 - 2,
                '#4ecdc4',
                20
              ));
            }
          }
        });
      });
      
      // Check alien bullets vs barriers
      game.alienBullets.forEach((bullet, bulletIndex) => {
        game.barriers.forEach(barrier => {
          if (barrier.health > 0 &&
              bullet.x < barrier.x + barrier.width &&
              bullet.x + bullet.width > barrier.x &&
              bullet.y < barrier.y + barrier.height &&
              bullet.y + bullet.height > barrier.y) {
            
            barrier.health--;
            alienBulletsToRemove2.push(bulletIndex);
            
            // Create particles
            for (let i = 0; i < 4; i++) {
              game.particles.push(new Particle(
                bullet.x,
                bullet.y,
                Math.random() * 4 - 2,
                Math.random() * 4 - 2,
                '#4ecdc4',
                20
              ));
            }
          }
        });
      });
      
      // Remove marked bullets
      game.bullets = game.bullets.filter((_, index) => !playerBulletsToRemove.includes(index));
      game.alienBullets = game.alienBullets.filter((_, index) => !alienBulletsToRemove2.includes(index));

      // Update power-ups
      game.powerUps = game.powerUps.filter(powerUpItem => {
        powerUpItem.y += powerUpItem.speed;
        
        // Check collision with player
        if (powerUpItem.x < game.player.x + game.player.width &&
            powerUpItem.x + powerUpItem.width > game.player.x &&
            powerUpItem.y < game.player.y + game.player.height &&
            powerUpItem.y + powerUpItem.height > game.player.y) {
          
          setPowerUp(powerUpItem.type);
          game.powerUpEndTime = timestamp + 10000; // 10 seconds
          soundManager.playPowerUp();
          
          // Create particles
          for (let i = 0; i < 10; i++) {
            game.particles.push(new Particle(
              powerUpItem.x + powerUpItem.width / 2,
              powerUpItem.y + powerUpItem.height / 2,
              Math.random() * 6 - 3,
              Math.random() * 6 - 3,
              '#ffd93d',
              30
            ));
          }
          
          return false;
        }
        
        return powerUpItem.y < canvas.height;
      });

      // Update particles
      game.particles = game.particles.filter(particle => {
        particle.update(1); // Pass deltaTime as 1 for frame-based update
        return particle.life > 0;
      });

      // Check win condition
      if (aliveAliens.length === 0) {
        setLevel(prev => prev + 1);
        initAliens();
        initBarriers();
        game.alienSpeed = 1;
        game.fireRate = Math.min(0.04, game.fireRate + 0.005);
      }

      // Check lose condition - aliens reached player
      if (aliveAliens.some(alien => alien.y + alien.height >= game.player.y)) {
        if (gameOverTimeoutRef.current) {
          clearTimeout(gameOverTimeoutRef.current);
        }
        gameOverTimeoutRef.current = setTimeout(() => {
          setGameOver(true);
          updateHighScore('spaceInvaders', score);
          soundManager.playGameOver();
          gameOverTimeoutRef.current = null;
        }, 100);
      }
      
      } // End of pause check

      // Render
      ctx.fillStyle = '#000814';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 50; i++) {
        const x = (i * 47) % canvas.width;
        const y = (i * 73 + timestamp * 0.01) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
      }

      // Draw enhanced starship
      const playerGlow = powerUp === 'shield' ? '#4ecdc4' : '#00f5ff';
      const centerX = game.player.x + game.player.width / 2;
      const centerY = game.player.y + game.player.height / 2;
      
      // Ship glow effect
      ctx.shadowColor = playerGlow;
      ctx.shadowBlur = 15;
      
      // Main ship body (diamond/arrow shape)
      ctx.fillStyle = playerGlow;
      ctx.beginPath();
      ctx.moveTo(centerX, game.player.y); // Top point
      ctx.lineTo(game.player.x + game.player.width - 5, centerY); // Right point  
      ctx.lineTo(centerX, game.player.y + game.player.height); // Bottom point
      ctx.lineTo(game.player.x + 5, centerY); // Left point
      ctx.closePath();
      ctx.fill();
      
      // Ship core with gradient
      ctx.shadowBlur = 0;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 15);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, playerGlow);
      gradient.addColorStop(1, '#001122');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 12, 8, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      // Wing details
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(game.player.x + 2, centerY - 2, 8, 4);
      ctx.fillRect(game.player.x + game.player.width - 10, centerY - 2, 8, 4);
      
      // Engine glow
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(game.player.x + 8, game.player.y + game.player.height - 3, 6, 8);
      ctx.fillRect(game.player.x + game.player.width - 14, game.player.y + game.player.height - 3, 6, 8);
      
      // Cockpit
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.ellipse(centerX, game.player.y + 8, 4, 6, 0, 0, 2 * Math.PI);
      ctx.fill();

      // Draw aliens
      game.aliens.forEach(alien => {
        if (alien.alive) {
          const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'];
          ctx.fillStyle = colors[alien.type];
          ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
          
          // Add alien details
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(alien.x + 5, alien.y + 5, 5, 5);
          ctx.fillRect(alien.x + 20, alien.y + 5, 5, 5);
        }
      });

      // Draw bullets with glow effects
      ctx.shadowBlur = 8;
      
      // Player bullets
      ctx.shadowColor = '#00f5ff';
      ctx.fillStyle = '#00f5ff';
      game.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        // Add bullet trail
        ctx.fillStyle = 'rgba(0, 245, 255, 0.3)';
        ctx.fillRect(bullet.x - 1, bullet.y + bullet.height, bullet.width + 2, 8);
        ctx.fillStyle = '#00f5ff';
      });

      // Alien bullets
      ctx.shadowColor = '#ff6b6b';
      ctx.fillStyle = '#ff6b6b';
      game.alienBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        // Add bullet trail
        ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
        ctx.fillRect(bullet.x - 1, bullet.y - 8, bullet.width + 2, 8);
        ctx.fillStyle = '#ff6b6b';
      });
      
      ctx.shadowBlur = 0;

      // Draw barriers
      game.barriers.forEach(barrier => {
        if (barrier.health > 0) {
          const alpha = barrier.health / 3;
          ctx.fillStyle = `rgba(76, 205, 196, ${alpha})`;
          ctx.fillRect(barrier.x, barrier.y, barrier.width, barrier.height);
        }
      });

      // Draw power-ups
      game.powerUps.forEach(powerUpItem => {
        const colors: Record<PowerUp['type'], string> = {
          rapidfire: '#ff9500',
          multishot: '#9c88ff',
          shield: '#4ecdc4'
        };
        ctx.fillStyle = colors[powerUpItem.type];
        ctx.fillRect(powerUpItem.x, powerUpItem.y, powerUpItem.width, powerUpItem.height);
        
        // Add icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const icons: Record<PowerUp['type'], string> = { rapidfire: 'R', multishot: 'M', shield: 'S' };
        ctx.fillText(icons[powerUpItem.type], powerUpItem.x + powerUpItem.width/2, powerUpItem.y + powerUpItem.height/2 + 4);
      });

      // Draw particles
      game.particles.forEach(particle => {
        particle.draw(ctx);
      });

      animationIdRef.current = requestAnimationFrame(gameLoop);
    };

    animationIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameOver, paused, score, powerUp, level, updateHighScore, initAliens, initBarriers]);

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setLevel(1);
    setPowerUp(null);
    const game = gameRef.current;
    game.player.x = 400;
    game.bullets = [];
    game.alienBullets = [];
    game.particles = [];
    game.powerUps = [];
    game.alienDirection = 1;
    game.alienSpeed = 1;
    game.fireRate = 0.02;
    game.playerFireCooldown = 0;
    initAliens();
    initBarriers();
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-900 text-white p-2 h-full">
      <div className="relative max-w-4xl w-full flex flex-col h-full">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">Score:</span>
              <span className="text-lg font-bold text-yellow-400">{score}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold">Lives:</span>
              <span className="text-lg font-bold text-red-400">{lives}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">Level:</span>
              <span className="text-lg font-bold text-blue-400">{level}</span>
            </div>
            {powerUp && (
              <div className="flex items-center gap-1 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                {powerUp.toUpperCase()}
              </div>
            )}
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
        
        <div className="flex-grow flex items-center justify-center w-full min-h-0">
          <ResponsiveCanvas
            width={CANVAS_CONFIG.spaceInvaders.width}
            height={CANVAS_CONFIG.spaceInvaders.height}
          >
            <canvas
              ref={canvasRef}
              className="border-2 border-gray-600 rounded-lg bg-black mx-auto block"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </ResponsiveCanvas>
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Arrow Keys/WASD to move • Mouse/Touch to follow • Hold Space/Click to auto-fire • P to pause</p>
          <p>Power-ups: R=Rapid Fire, M=Multi-shot, S=Shield Protection</p>
        </div>
        
        <FadingCanvas
          active={paused && !gameOver}
          className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="text-center bg-gray-800 p-8 rounded-lg border-2 border-blue-500">
            <h2 className="text-3xl font-bold text-blue-400 mb-4">PAUSED</h2>
            <p className="text-lg mb-4 text-gray-300">Game is paused</p>
            <div className="text-sm text-gray-400 mb-4">
              <p>Press P or ESC to resume</p>
              <p>Current Score: {score}</p>
              <p>Level: {level}</p>
            </div>
            <button
              onClick={() => {
                setPaused(false);
                canvasRef.current?.focus();
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Resume Game
            </button>
          </div>
        </FadingCanvas>
        
        {gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
              <p className="text-xl mb-2">Final Score: {score}</p>
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