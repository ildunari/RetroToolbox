import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Shield } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { particleManager } from '../../core/ParticleSystem';
import { FadingCanvas } from "../ui/FadingCanvas";
import { GameOverBanner } from "../ui/GameOverBanner";
import { GameProps } from '../../core/GameTypes';

interface Ship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  thrust: number;
  shield: boolean;
  shieldTime: number;
  fuel: number;
  rapidFire: boolean;
  rapidFireTime: number;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

interface GameRef {
  ship: Ship;
  asteroids: Asteroid[];
  bullets: any[];
  powerUps: any[];
  stars: any[];
  lastShot: number;
  animationFrame?: number;
}

export const StellarDriftGame: React.FC<GameProps> = ({ settings, updateHighScore }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [shields, setShields] = useState(3);
  const [multiplier, setMultiplier] = useState(1.0);
  const [scoreFlash, setScoreFlash] = useState(false);

  const gameRef = useRef({
    // Player pod with physics
    pod: { 
      x: 80, 
      y: 200, 
      width: 16, 
      height: 8, 
      invulnerable: 0, 
      velocityY: 0,
      accelerationY: 0
    },
    
    // World generation
    scrollSpeed: 120, // px/s base speed (reduced from 250)
    worldX: 0,
    chunks: [],
    chunkWidth: 512,
    activeChunkIndex: 0,
    
    // Tunnel generation
    tunnelAmplitude: 120, // Increased for better mobile experience
    tunnelFrequency: 0.002, // Gentler curves
    noiseOffset: 0,
    minTunnelGap: 140, // Minimum gap for mobile comfort
    
    // Game state
    obstacles: [],
    comets: [],
    lastUpdate: 0,
    invulnerabilityTime: 0,
    multiplierDecay: 0,
    nearMissMultiplier: 1.0,
    wallScrapeTime: 0,
    shieldRechargeTimer: 0,
    difficultyTimer: 0,
    
    // Physics constants - tuned for responsive feel
    gravity: 450,           // Downward acceleration (px/s²)
    thrustPower: 900,       // Upward thrust when space/touch pressed (px/s²)
    maxVelocity: 350,       // Maximum velocity in either direction (px/s)
    airResistance: 0.994,   // Velocity damping factor (higher = less drag)
    thrustActive: false,    // Whether thrust is currently being applied
    
    // Input state
    inputState: {
      thrust: false
    },
    
    // Colors (enhanced neon palette)
    colors: {
      magenta: '#ff00ff',
      cyan: '#00ffff', 
      violet: '#8b00ff',
      black: '#000000',
      white: '#ffffff',
      blue: '#0080ff',
      purple: '#c000ff',
      darkCyan: '#008080'
    }
  });

  // Perlin noise implementation for tunnel generation
  const noise = useRef({
    permutation: [],
    initialize() {
      // Initialize permutation array for Perlin noise
      for (let i = 0; i < 256; i++) {
        this.permutation[i] = i;
      }
      // Shuffle
      for (let i = 255; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
      }
      // Duplicate for overflow
      for (let i = 0; i < 256; i++) {
        this.permutation[256 + i] = this.permutation[i];
      }
    },
    
    fade(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    },
    
    grad(hash, x) {
      return (hash & 1) === 0 ? x : -x;
    },
    
    noise1D(x) {
      const X = Math.floor(x) & 255;
      x -= Math.floor(x);
      const u = this.fade(x);
      
      return (1 - u) * this.grad(this.permutation[X], x) +
             u * this.grad(this.permutation[X + 1], x - 1);
    }
  });

  // Initialize noise
  useEffect(() => {
    noise.current.initialize();
  }, []);

  const generateTunnelPoint = useCallback((x) => {
    const game = gameRef.current;
    const noiseValue = noise.current.noise1D((x + game.noiseOffset) * game.tunnelFrequency);
    const centerY = 200;
    const amplitude = game.tunnelAmplitude;
    
    return {
      ceiling: centerY - amplitude - (noiseValue * 30),
      floor: centerY + amplitude + (noiseValue * 30)
    };
  }, []);

  const generateChunk = useCallback((chunkIndex) => {
    const game = gameRef.current;
    const startX = chunkIndex * game.chunkWidth;
    const chunk = {
      index: chunkIndex,
      startX,
      endX: startX + game.chunkWidth,
      tunnelPoints: [],
      obstacles: [],
      comets: []
    };

    // Generate tunnel geometry
    for (let x = 0; x <= game.chunkWidth; x += 16) {
      const worldX = startX + x;
      chunk.tunnelPoints.push({
        x: worldX,
        ...generateTunnelPoint(worldX)
      });
    }

    // Generate static obstacles - smaller and more varied shapes
    const obstacleCount = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < obstacleCount; i++) {
      const x = startX + Math.random() * game.chunkWidth;
      const tunnel = generateTunnelPoint(x);
      const availableHeight = tunnel.floor - tunnel.ceiling - 60; // Safety margin
      
      if (availableHeight > 30) {
        const y = tunnel.ceiling + 30 + Math.random() * (availableHeight - 30);
        const obstacleType = Math.random();
        let obstacle;
        
        if (obstacleType < 0.3) { // Crystal
          obstacle = {
            x, y,
            width: 8 + Math.random() * 12,
            height: 8 + Math.random() * 12,
            type: 'crystal',
            shape: 'diamond'
          };
        } else if (obstacleType < 0.6) { // Debris
          obstacle = {
            x, y,
            width: 6 + Math.random() * 10,
            height: 6 + Math.random() * 10,
            type: 'debris',
            shape: 'rectangle',
            rotation: Math.random() * Math.PI
          };
        } else { // Plasma
          obstacle = {
            x, y,
            width: 10 + Math.random() * 8,
            height: 10 + Math.random() * 8,
            type: 'plasma',
            shape: 'circle',
            pulse: Math.random() * Math.PI * 2
          };
        }
        
        chunk.obstacles.push(obstacle);
      }
    }

    // Generate moving comets - smaller
    const cometCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < cometCount; i++) {
      const x = startX + Math.random() * game.chunkWidth;
      const tunnel = generateTunnelPoint(x);
      const y = tunnel.ceiling + 20 + Math.random() * (tunnel.floor - tunnel.ceiling - 40);
      
      chunk.comets.push({
        x,
        y,
        startY: y,
        width: 6,
        height: 6,
        velocityX: -60 - Math.random() * 80, // Slower
        velocityY: (Math.random() - 0.5) * 100, // Less erratic
        angle: 0,
        type: 'comet',
        trail: []
      });
    }

    return chunk;
  }, [generateTunnelPoint]);

  const checkCollision = useCallback((rect1, rect2) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  const takeDamage = useCallback(() => {
    const game = gameRef.current;
    
    if (game.invulnerabilityTime > 0) return;
    
    setShields(prev => {
      const newShields = prev - 1;
      if (newShields <= 0) {
        setGameOver(true);
        if (settings.sound) {
          soundManager.playGameOver();
        }
        updateHighScore('stellar-drift', score);
      } else {
        if (settings.sound) {
          soundManager.playHit();
        }
        game.invulnerabilityTime = 500; // 0.5s invulnerability
      }
      return newShields;
    });

    // Add explosion particles
    for (let i = 0; i < 10; i++) {
      particleManager.addParticle({
        x: game.pod.x + game.pod.width / 2,
        y: game.pod.y + game.pod.height / 2,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        color: game.colors.magenta,
        life: 1000 + Math.random() * 500,
        size: 2
      });
    }
  }, [settings.sound, score, updateHighScore]);

  const addNearMissMultiplier = useCallback(() => {
    const game = gameRef.current;
    game.nearMissMultiplier = Math.min(game.nearMissMultiplier * 1.2, 8.0);
    game.multiplierDecay = 2000; // 2 seconds before decay
    
    setMultiplier(game.nearMissMultiplier);
    
    if (settings.sound) {
      soundManager.playCollect();
    }
  }, [settings.sound]);

  const gameLoop = useCallback((timestamp) => {
    if (gameOver || paused) return;

    const game = gameRef.current;
    const deltaTime = Math.min(timestamp - game.lastUpdate, 50) / 1000;
    game.lastUpdate = timestamp;

    // Physics update - apply gravity and thrust
    let netAcceleration = game.gravity; // Always pull down
    
    // Check for thrust input
    const inputState = game.inputState;
    game.thrustActive = inputState.thrust;
    
    if (game.thrustActive) {
      netAcceleration -= game.thrustPower; // Subtract thrust (upward)
    }
    
    // Update velocity with acceleration and air resistance
    game.pod.velocityY += netAcceleration * deltaTime;
    game.pod.velocityY *= game.airResistance; // Air resistance
    
    // Clamp velocity to max
    game.pod.velocityY = Math.max(-game.maxVelocity, Math.min(game.maxVelocity, game.pod.velocityY));
    
    // Update position with velocity
    game.pod.y += game.pod.velocityY * deltaTime;
    
    // Keep pod within screen bounds with bounce
    if (game.pod.y <= 0) {
      game.pod.y = 0;
      game.pod.velocityY = Math.max(0, game.pod.velocityY * -0.3); // Small bounce
    }
    if (game.pod.y >= 400 - game.pod.height) {
      game.pod.y = 400 - game.pod.height;
      game.pod.velocityY = Math.min(0, game.pod.velocityY * -0.3); // Small bounce
    }

    // Increase difficulty over time
    game.difficultyTimer += deltaTime * 1000;
    if (game.difficultyTimer >= 30000) { // Every 30 seconds
      game.scrollSpeed *= 1.03; // Slower speed increase
      game.tunnelAmplitude *= 1.01; // Slower narrowing
      game.difficultyTimer = 0;
    }

    // Update world position
    game.worldX += game.scrollSpeed * deltaTime;
    
    // Update distance and score
    const newDistance = Math.floor(game.worldX / 10);
    setDistance(newDistance);
    setScore(Math.floor(newDistance * game.nearMissMultiplier));

    // Decay multiplier
    if (game.multiplierDecay > 0) {
      game.multiplierDecay -= deltaTime * 1000;
      if (game.multiplierDecay <= 0) {
        game.nearMissMultiplier = Math.max(1.0, game.nearMissMultiplier - 0.1);
        setMultiplier(game.nearMissMultiplier);
      }
    }

    // Update invulnerability
    if (game.invulnerabilityTime > 0) {
      game.invulnerabilityTime -= deltaTime * 1000;
    }

    // Shield recharge timer
    if (shields < 3 && game.invulnerabilityTime <= 0) {
      game.shieldRechargeTimer += deltaTime * 1000;
      if (game.shieldRechargeTimer >= 10000) { // 10 seconds
        setShields(prev => Math.min(prev + 1, 3));
        game.shieldRechargeTimer = 0;
        if (settings.sound) {
          soundManager.playPowerUp();
        }
      }
    }

    // Generate chunks as needed
    const currentChunk = Math.floor(game.worldX / game.chunkWidth);
    while (game.chunks.length <= currentChunk + 2) {
      game.chunks.push(generateChunk(game.chunks.length));
    }

    // Update comets and their trails
    game.chunks.forEach(chunk => {
      chunk.comets.forEach(comet => {
        // Add current position to trail
        comet.trail.push({ x: comet.x, y: comet.y });
        if (comet.trail.length > 8) {
          comet.trail.shift();
        }
        
        comet.x += comet.velocityX * deltaTime;
        comet.y += comet.velocityY * deltaTime;
        comet.angle += deltaTime * 3;
      });
    });

    // Update obstacle animations
    game.chunks.forEach(chunk => {
      chunk.obstacles.forEach(obstacle => {
        if (obstacle.type === 'plasma') {
          obstacle.pulse += deltaTime * 4;
        }
        if (obstacle.rotation !== undefined) {
          obstacle.rotation += deltaTime * 2;
        }
      });
    });

    // Update particles
    particleManager.getParticleSystem().update(deltaTime);

    // Collision detection
    const podRect = {
      x: game.pod.x,
      y: game.pod.y,
      width: game.pod.width,
      height: game.pod.height
    };

    let nearMiss = false;

    // Check tunnel walls
    const currentTunnel = generateTunnelPoint(game.worldX + game.pod.x);
    if (game.pod.y <= currentTunnel.ceiling + 8 || 
        game.pod.y + game.pod.height >= currentTunnel.floor - 8) {
      
      // Wall scraping for shield recharge
      if (game.pod.y <= currentTunnel.ceiling + 2 || 
          game.pod.y + game.pod.height >= currentTunnel.floor - 2) {
        takeDamage();
      } else {
        game.wallScrapeTime += deltaTime * 1000;
        if (game.wallScrapeTime >= 200 && shields < 3) { // 0.2s scraping
          setShields(prev => Math.min(prev + 1, 3));
          game.wallScrapeTime = 0;
          if (settings.sound) {
            soundManager.playPowerUp();
          }
        }
      }
    } else {
      game.wallScrapeTime = 0;
    }

    // Check obstacles and comets
    game.chunks.forEach(chunk => {
      if (chunk.startX > game.worldX + 600 || chunk.endX < game.worldX - 100) return;

      [...chunk.obstacles, ...chunk.comets].forEach(obstacle => {
        const obstacleRect = {
          x: obstacle.x - game.worldX,
          y: obstacle.y,
          width: obstacle.width,
          height: obstacle.height
        };

        // Check for collision
        if (checkCollision(podRect, obstacleRect)) {
          takeDamage();
        }

        // Check for near miss (within 10px)
        const distance = Math.sqrt(
          Math.pow(podRect.x + podRect.width/2 - (obstacleRect.x + obstacleRect.width/2), 2) +
          Math.pow(podRect.y + podRect.height/2 - (obstacleRect.y + obstacleRect.height/2), 2)
        );
        
        if (distance < 20 && distance > 12) {
          nearMiss = true;
        }
      });
    });

    if (nearMiss) {
      addNearMissMultiplier();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Enable smooth rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#000011');
    gradient.addColorStop(0.5, '#000022');
    gradient.addColorStop(1, '#000033');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Enhanced starfield with depth layers
    const drawStars = (speed, size, alpha, count) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      for (let i = 0; i < count; i++) {
        const x = (i * 37 + game.worldX * speed) % (canvas.width + 20) - 10;
        const y = (i * 73) % canvas.height;
        ctx.fillRect(x, y, size, size);
      }
    };
    
    drawStars(0.05, 1, 0.3, 30); // Far stars
    drawStars(0.1, 1, 0.6, 20);  // Mid stars
    drawStars(0.2, 2, 0.9, 15);  // Near stars

    // Draw tunnel with glow effect
    const drawTunnelWall = (points, color, glowColor) => {
      // Main line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, points[0]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(i * 16, points[i]);
      }
      ctx.stroke();
      
      // Glow effect
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, points[0]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(i * 16, points[i]);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Calculate tunnel points
    const ceilingPoints = [];
    const floorPoints = [];
    for (let x = 0; x <= canvas.width; x += 16) {
      const tunnel = generateTunnelPoint(game.worldX + x);
      ceilingPoints.push(tunnel.ceiling);
      floorPoints.push(tunnel.floor);
    }
    
    drawTunnelWall(ceilingPoints, game.colors.cyan, game.colors.cyan);
    drawTunnelWall(floorPoints, game.colors.cyan, game.colors.cyan);

    // Draw obstacles with enhanced graphics
    game.chunks.forEach(chunk => {
      if (chunk.startX > game.worldX + canvas.width || chunk.endX < game.worldX) return;

      chunk.obstacles.forEach(obstacle => {
        const x = obstacle.x - game.worldX;
        if (x > -50 && x < canvas.width + 50) {
          ctx.save();
          
          if (obstacle.type === 'crystal') {
            // Diamond crystal with glow
            ctx.shadowColor = game.colors.magenta;
            ctx.shadowBlur = 8;
            ctx.fillStyle = game.colors.magenta;
            ctx.translate(x + obstacle.width/2, obstacle.y + obstacle.height/2);
            ctx.beginPath();
            ctx.moveTo(0, -obstacle.height/2);
            ctx.lineTo(obstacle.width/3, 0);
            ctx.lineTo(0, obstacle.height/2);
            ctx.lineTo(-obstacle.width/3, 0);
            ctx.closePath();
            ctx.fill();
            
          } else if (obstacle.type === 'plasma') {
            // Pulsing plasma orb
            const pulseSize = 1 + Math.sin(obstacle.pulse) * 0.2;
            ctx.shadowColor = game.colors.purple;
            ctx.shadowBlur = 15;
            ctx.fillStyle = game.colors.purple;
            ctx.beginPath();
            ctx.arc(x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                   (obstacle.width/2) * pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
          } else {
            // Rotating debris
            ctx.translate(x + obstacle.width/2, obstacle.y + obstacle.height/2);
            ctx.rotate(obstacle.rotation || 0);
            ctx.shadowColor = game.colors.violet;
            ctx.shadowBlur = 5;
            ctx.fillStyle = game.colors.violet;
            ctx.fillRect(-obstacle.width/2, -obstacle.height/2, obstacle.width, obstacle.height);
          }
          
          ctx.restore();
        }
      });

      // Enhanced comets with trails
      chunk.comets.forEach(comet => {
        const x = comet.x - game.worldX;
        if (x > -50 && x < canvas.width + 50) {
          // Draw trail
          if (comet.trail && comet.trail.length > 1) {
            ctx.strokeStyle = game.colors.cyan;
            ctx.lineWidth = 2;
            for (let i = 1; i < comet.trail.length; i++) {
              const alpha = i / comet.trail.length;
              const trailX = comet.trail[i].x - game.worldX;
              const trailY = comet.trail[i].y;
              ctx.globalAlpha = alpha * 0.7;
              ctx.beginPath();
              ctx.arc(trailX, trailY, 2 * alpha, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }
          
          // Draw comet with glow
          ctx.save();
          ctx.shadowColor = game.colors.cyan;
          ctx.shadowBlur = 12;
          ctx.fillStyle = game.colors.cyan;
          ctx.translate(x + comet.width/2, comet.y + comet.height/2);
          ctx.rotate(comet.angle);
          ctx.beginPath();
          ctx.arc(0, 0, comet.width/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
    });

    // Enhanced player ship design
    const drawPlayerShip = () => {
      ctx.save();
      const shipX = game.pod.x + game.pod.width/2;
      const shipY = game.pod.y + game.pod.height/2;
      
      // Ship glow effect
      const isInvulnerable = game.invulnerabilityTime > 0 && Math.floor(timestamp / 100) % 2;
      const shipColor = isInvulnerable ? game.colors.white : game.colors.cyan;
      
      ctx.shadowColor = shipColor;
      ctx.shadowBlur = 15;
      
      // Main hull
      ctx.fillStyle = shipColor;
      ctx.beginPath();
      ctx.moveTo(shipX + 8, shipY);           // Nose
      ctx.lineTo(shipX - 8, shipY - 4);      // Top back
      ctx.lineTo(shipX - 6, shipY - 2);      // Top wing
      ctx.lineTo(shipX - 8, shipY);          // Center back
      ctx.lineTo(shipX - 6, shipY + 2);      // Bottom wing  
      ctx.lineTo(shipX - 8, shipY + 4);      // Bottom back
      ctx.closePath();
      ctx.fill();
      
      // Engine glow - enhanced when thrusting
      ctx.shadowBlur = game.thrustActive ? 15 : 8;
      ctx.fillStyle = game.thrustActive ? game.colors.cyan : game.colors.magenta;
      const engineSize = game.thrustActive ? 4 : 3;
      const engineHeight = game.thrustActive ? 3 : 2;
      ctx.fillRect(shipX - 8, shipY - engineHeight/2, engineSize, engineHeight);
      
      // Thrust particles when active
      if (game.thrustActive && Math.random() < 0.7) {
        particleManager.addParticle({
          x: shipX - 8 + Math.random() * 4,
          y: shipY + (Math.random() - 0.5) * 4,
          vx: -100 - Math.random() * 50,
          vy: (Math.random() - 0.5) * 30,
          color: game.colors.cyan,
          life: 200 + Math.random() * 200,
          size: 2
        });
      }
      
      // Wing details
      ctx.shadowBlur = 5;
      ctx.fillStyle = game.colors.blue;
      ctx.fillRect(shipX - 6, shipY - 2, 4, 1);
      ctx.fillRect(shipX - 6, shipY + 1, 4, 1);
      
      ctx.restore();
    };
    
    drawPlayerShip();

    // Draw particles with glow
    ctx.save();
    particleManager.getParticleSystem().draw(ctx);
    ctx.restore();

    // Enhanced speed lines with glow
    if (game.scrollSpeed > 150) {
      const intensity = Math.min((game.scrollSpeed - 150) / 100, 1);
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 * intensity})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = game.colors.cyan;
      ctx.shadowBlur = 3;
      
      for (let i = 0; i < 15; i++) {
        const x = (game.worldX * (1 + i * 0.3)) % (canvas.width + 100) - 50;
        const length = 20 + intensity * 30;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - length, canvas.height);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
  }, [gameOver, paused, generateTunnelPoint, generateChunk, checkCollision, takeDamage, addNearMissMultiplier, settings.sound, shields]);

  const handleThrust = useCallback((active) => {
    if (gameOver || paused) return;
    
    const game = gameRef.current;
    game.inputState.thrust = active;
  }, [gameOver, paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      // Use full screen dimensions
      const maxWidth = window.innerWidth - 32; // Just padding
      const maxHeight = window.innerHeight - 120; // Header + controls
      
      // Maintain aspect ratio while fitting screen
      const aspectRatio = 16 / 10;
      let width = maxWidth;
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      gameRef.current.pod.x = width * 0.12; // Proportional position
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleBlur = () => setPaused(true);
    window.addEventListener('blur', handleBlur);

    // Input state is now stored in gameRef
    
    const handleKeyDown = (e) => {
      switch(e.key) {
        case ' ':
          e.preventDefault();
          handleThrust(true);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleThrust(true);
          break;
        case 'Escape':
          e.preventDefault();
          setPaused(prev => !prev);
          break;
      }
    };
    
    const handleKeyUp = (e) => {
      switch(e.key) {
        case ' ':
          e.preventDefault();
          handleThrust(false);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleThrust(false);
          break;
      }
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      handleThrust(true);
    };
    
    const handleTouchEnd = (e) => {
      e.preventDefault();
      handleThrust(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);

    let animationId;
    if (!gameOver && !paused) {
      const animate = (timestamp) => {
        gameLoop(timestamp);
        animationId = requestAnimationFrame(animate);
      };
      animationId = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gameLoop, handleThrust, gameOver, paused]);

  const resetGame = useCallback(() => {
    const game = gameRef.current;
    
    game.pod = { 
      x: 80, 
      y: 200, 
      width: 16, 
      height: 8, 
      invulnerable: 0, 
      velocityY: 0,
      accelerationY: 0
    };
    game.scrollSpeed = 120;
    game.worldX = 0;
    game.chunks = [];
    game.obstacles = [];
    game.comets = [];
    game.invulnerabilityTime = 0;
    game.multiplierDecay = 0;
    game.nearMissMultiplier = 1.0;
    game.wallScrapeTime = 0;
    game.shieldRechargeTimer = 0;
    game.difficultyTimer = 0;
    game.noiseOffset = Math.random() * 1000;
    game.tunnelAmplitude = 60;
    game.thrustActive = false;
    
    setScore(0);
    setDistance(0);
    setShields(3);
    setMultiplier(1.0);
    setGameOver(false);
    setPaused(false);
    
    // Generate initial chunks
    for (let i = 0; i < 3; i++) {
      game.chunks.push(generateChunk(i));
    }
  }, [generateChunk]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  return (
    <div className="flex flex-col items-center space-y-4 text-white">
      <div className="text-center space-y-2">
        <div className="flex justify-center space-x-8 text-sm">
          <div>Distance: <span className="text-cyan-400">{distance}m</span></div>
          <div>Score: <span className={`text-yellow-400 ${scoreFlash ? 'animate-pulse' : ''}`}>{score}</span></div>
          <div>Multiplier: <span className="text-purple-400">{multiplier.toFixed(1)}x</span></div>
        </div>
        
        <div className="flex justify-center space-x-2">
          {[...Array(3)].map((_, i) => (
            <Shield 
              key={i} 
              className={`w-6 h-6 ${i < shields ? 'text-blue-400' : 'text-gray-600'}`} 
            />
          ))}
        </div>
      </div>

      <div className="relative">
        <FadingCanvas ref={canvasRef} />
        {gameOver && (
          <GameOverBanner
            score={score}
            onRestart={resetGame}
            message={`Survived ${distance}m!`}
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
        <p>Hold SPACE, ↑, or W to thrust upward. Touch and hold screen to thrust.</p>
        <p>Gravity constantly pulls you down. Scrape walls to recharge shields!</p>
      </div>
    </div>
  );
};