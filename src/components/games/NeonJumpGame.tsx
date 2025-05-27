import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { soundManager } from '../../core/SoundManager';
import { Particle } from '../../core/ParticleSystem';
import { FadingCanvas } from "../ui/FadingCanvas";
import { GameOverBanner } from "../ui/GameOverBanner";
import { ResponsiveCanvas } from "../ui/ResponsiveCanvas";
import { CANVAS_CONFIG } from "../../core/CanvasConfig";

// Types and Interfaces
interface Vector2D {
  x: number;
  y: number;
}

// CHECKPOINT 5: VISUAL EXCELLENCE INTERFACES

// Parallax Background System
interface BackgroundLayer {
  id: number;
  type: 'sky' | 'city' | 'grid' | 'rain' | 'fog';
  scrollSpeed: number;
  offset: Vector2D;
  alpha: number;
  color: string;
  elements: Array<{
    x: number;
    y: number;
    size: number;
    rotation: number;
    speed: number;
    pulse: number;
    color?: string;
  }>;
}

// Enhanced Particle System
interface EnhancedParticle {
  id: number;
  type: 'spark' | 'smoke' | 'glow' | 'trail' | 'burst' | 'dust' | 'impact' | 'spiral' | 'explosion' | 'ambient' | 'platform' | 'projectile' | 'ice' | 'fire' | 'energy';
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  wind: Vector2D;
  turbulence: number;
  blendMode: 'normal' | 'additive' | 'multiply' | 'screen';
  trail: Vector2D[];
  pulseFreq: number;
  pulsePhase: number;
  active: boolean;
}

// Screen Effects System
interface ScreenEffect {
  type: 'shake' | 'flash' | 'chromatic' | 'vignette' | 'speedlines' | 'scanlines';
  intensity: number;
  duration: number;
  timer: number;
  color?: string;
  direction?: Vector2D;
  frequency?: number;
  active: boolean;
}

// Animation System
interface SpriteAnimation {
  id: string;
  frames: number;
  currentFrame: number;
  frameTime: number;
  frameTimer: number;
  loop: boolean;
  speed: number;
  playing: boolean;
  onComplete?: () => void;
}

// Glow Shader Data
interface GlowData {
  intensity: number;
  color: string;
  size: number;
  pulse: number;
  bloom: boolean;
}

interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'standard' | 'crumbling' | 'moving' | 'bouncy' | 'phase' | 'ice' | 'conveyor';
  active: boolean;
  glowIntensity: number;
  glowPhase: number;
  
  // Type-specific properties
  // Standard
  pulseSpeed?: number;
  
  // Crumbling
  crumbleTimer?: number;
  crumbleState?: 'solid' | 'cracking' | 'breaking' | 'falling';
  cracks?: Array<{ x: number; y: number; angle: number; length: number }>;
  fallVelocity?: number;
  debrisParticles?: Array<{ x: number; y: number; vx: number; vy: number; rotation: number; size: number }>;
  
  // Moving
  movementPath?: { 
    type: 'linear' | 'sine' | 'circular';
    start: Vector2D; 
    end: Vector2D; 
    speed: number; 
    direction: 1 | -1;
    phase: number;
    centerX?: number;
    centerY?: number;
    radius?: number;
  };
  velocity?: Vector2D;
  
  // Bouncy
  bounceAnimation?: number;
  squashFactor?: number;
  
  // Phase
  phaseTimer?: number;
  phaseVisible?: boolean;
  phaseWarning?: boolean;
  staticEffect?: number;
  
  // Ice
  friction?: number;
  iceParticles?: Array<{ x: number; y: number; vx: number; vy: number; alpha: number }>;
  
  // Conveyor
  conveyorSpeed?: number;
  conveyorDirection?: 1 | -1;
  arrowOffset?: number;
}

type PlayerState = 'idle' | 'running' | 'jumping' | 'falling' | 'wall-sliding' | 'death';

interface Player {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  width: number;
  height: number;
  state: PlayerState;
  isGrounded: boolean;
  wallContact: 'left' | 'right' | 'none';
  coyoteTime: number;
  jumpBufferTime: number;
  canDoubleJump: boolean;
  lastPlatform: Platform | null;
  health: number;
  maxHealth: number;
  invulnerableTime: number;
  hitFlashTime: number;
  
  // Power-up effects
  speedMultiplier: number;
  hasShield: boolean;
  magnetRadius: number;
  rocketBoostActive: boolean;
  isGhost: boolean;
  
  // Visual effects
  trailParticles: Array<{ x: number; y: number; alpha: number; color: string }>;
  shieldBubbleAlpha: number;
  magnetFieldAlpha: number;
  
  // Visual Enhancement Properties
  afterimageTrail: Array<{ x: number; y: number; alpha: number; size: number }>;
  motionBlur: { enabled: boolean; intensity: number; samples: Vector2D[] };
  glowData: GlowData;
}

// Enemy Types
type EnemyType = 'glitch-slime' | 'neon-wasp' | 'cyber-spider' | 'plasma-ghost' | 
                 'electric-turret' | 'pixel-knight' | 'void-orb';

type EnemyState = 'idle' | 'patrol' | 'alert' | 'attack' | 'charge' | 'web-drop' | 
                  'charging-shot' | 'teleporting' | 'dead';

interface Enemy {
  id: number;
  type: EnemyType;
  position: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  state: EnemyState;
  stateTimer: number;
  facingDirection: 1 | -1;
  targetPlatform: Platform | null;
  active: boolean;
  glowIntensity: number;
  
  // Type-specific properties
  // Glitch Slime
  bouncePhase?: number;
  nextBounceTime?: number;
  
  // Neon Wasp
  sinePhase?: number;
  pursuitSpeed?: number;
  
  // Cyber Spider
  webCooldown?: number;
  isDropping?: boolean;
  webLine?: { startY: number; length: number };
  
  // Plasma Ghost
  phaseAlpha?: number;
  targetPosition?: Vector2D;
  
  // Electric Turret
  chargeTime?: number;
  maxChargeTime?: number;
  alertRadius?: number;
  
  // Pixel Knight
  patrolStart?: number;
  patrolEnd?: number;
  chargeSpeed?: number;
  chargeCooldown?: number;
  shieldUp?: boolean;
  
  // Void Orb
  teleportCooldown?: number;
  gravityRadius?: number;
  gravityStrength?: number;
  portalEffect?: number;
}

interface Projectile {
  id: number;
  type: 'missile' | 'web';
  position: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  damage: number;
  active: boolean;
  
  // Type-specific
  homingStrength?: number; // For missiles
  webStickiness?: number; // For webs
  trailParticles?: Array<{ x: number; y: number; alpha: number }>;
}

// Power-up types
type PowerUpType = 'speed-boost' | 'shield-bubble' | 'magnet-field' | 'rocket-boost' | 
                   'platform-freezer' | 'ghost-mode' | 'score-multiplier';

interface PowerUp {
  id: number;
  type: PowerUpType;
  position: Vector2D;
  width: number;
  height: number;
  collected: boolean;
  active: boolean;
  glowColor: string;
  glowIntensity: number;
  rotationAngle: number;
  floatOffset: number;
}

interface ActivePowerUp {
  type: PowerUpType;
  duration: number;
  maxDuration: number;
  effectStrength: number;
}

// Coin interface
interface Coin {
  id: number;
  position: Vector2D;
  value: number; // 1, 5, or 10
  collected: boolean;
  active: boolean;
  rotationAngle: number;
  floatOffset: number;
  magnetPull?: Vector2D;
}

// Upgrade types
type UpgradeType = 'jump-height' | 'air-control' | 'coin-magnet' | 'starting-height' | 
                   'power-up-duration' | 'platform-sight' | 'enemy-radar';

interface Upgrade {
  type: UpgradeType;
  name: string;
  description: string;
  currentLevel: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  icon: string;
}

interface UpgradeState {
  jumpHeight: number;      // 0-5
  airControl: number;      // 0-5
  coinMagnet: number;      // 0-3
  startingHeight: number;  // 0-5
  powerUpDuration: number; // 0-3
  platformSight: number;   // 0-1
  enemyRadar: number;      // 0-1
}

interface GameState {
  player: Player;
  platforms: Platform[];
  enemies: Enemy[];
  projectiles: Projectile[];
  powerUps: PowerUp[];
  activePowerUps: ActivePowerUp[];
  coins: Coin[];
  particles: Particle[];
  camera: Vector2D;
  score: number;
  sessionCoins: number;
  totalCoins: number;
  level: number;
  gameSpeed: number;
  lastUpdate: number;
  nextPlatformId: number;
  nextEnemyId: number;
  nextProjectileId: number;
  nextPowerUpId: number;
  nextCoinId: number;
  enemySpawnTimer: number;
  powerUpSpawnTimer: number;
  scoreMultiplier: number;
  platformsFrozen: boolean;
  parallaxOffsets: number[];
  upgrades: UpgradeState;
  showShop: boolean;
  
  // CHECKPOINT 5: Visual Excellence Systems
  backgroundLayers: BackgroundLayer[];
  enhancedParticles: EnhancedParticle[];
  screenEffects: ScreenEffect[];
  animations: Map<string, SpriteAnimation>;
  glowIntensity: number;
  atmosphericColorShift: number;
  weatherIntensity: number;
  lightingPoints: Array<{ position: Vector2D; color: string; intensity: number; radius: number }>;
}

interface Settings {
  difficulty: string;
}

interface NeonJumpGameProps {
  settings: Settings;
  updateHighScore: (game: string, score: number) => void;
}

// Physics Constants
const GRAVITY = 0.5;
const BASE_JUMP_FORCE = -12;
const HORIZONTAL_SPEED = 5;
const WALL_SLIDE_GRAVITY = 0.2;
const WALL_BOUNCE_DAMPING = 0.7;
const MAX_FALL_SPEED = 15;
const AIR_CONTROL = 0.8;
const COYOTE_TIME = 6; // frames
const JUMP_BUFFER_TIME = 6; // frames
const CAMERA_SMOOTH = 0.1;
const CAMERA_LOOK_AHEAD = 100;

// Platform Constants
const PLATFORM_WIDTH = 80;
const PLATFORM_HEIGHT = 10;
const PLATFORM_SPAWN_HEIGHT = -50;
const MIN_PLATFORM_GAP = 50;
const MAX_PLATFORM_GAP_X = 120; // Maximum horizontal jump distance
const MAX_PLATFORM_GAP_Y = 80; // Maximum vertical jump distance

// Platform-specific constants
const CRUMBLE_DELAY = 30; // frames (0.5s at 60fps)
const PHASE_CYCLE_TIME = 120; // frames (2s at 60fps)
const PHASE_WARNING_TIME = 20; // frames before phase change
const ICE_FRICTION = 0.98;
const NORMAL_FRICTION = 0.8;
const BOUNCE_FORCE_MULTIPLIER = 1.5;
const CONVEYOR_BASE_SPEED = 2;

// Enemy Constants
const ENEMY_SPAWN_BASE_INTERVAL = 200; // Base height interval for spawning
const MAX_ACTIVE_ENEMIES = 10;
const ENEMY_DESPAWN_DISTANCE = 600; // Distance below camera to despawn
const PLAYER_INVULNERABLE_TIME = 90; // frames (1.5s at 60fps)
const PLAYER_HIT_FLASH_TIME = 6; // frames

// Enemy-specific constants
const SLIME_BOUNCE_HEIGHT = -8;
const WASP_SINE_AMPLITUDE = 50;
const WASP_SINE_SPEED = 0.05;
const SPIDER_DROP_SPEED = 4;
const GHOST_FOLLOW_SPEED = 1.5;
const TURRET_SHOT_INTERVAL = 180; // frames (3s at 60fps)
const TURRET_CHARGE_TIME = 60; // frames (1s at 60fps)
const KNIGHT_PATROL_SPEED = 2;
const KNIGHT_CHARGE_SPEED = 8;
const ORB_TELEPORT_INTERVAL = 300; // frames (5s at 60fps)
const ORB_GRAVITY_RADIUS = 150;
const ORB_GRAVITY_STRENGTH = 0.3;

// Power-up Constants
const POWER_UP_SIZE = 20;
const POWER_UP_SPAWN_INTERVAL = 300; // Height interval for spawning
const POWER_UP_BASE_DURATION = 300; // frames (5s at 60fps)
const SPEED_BOOST_MULTIPLIER = 1.5;
const MAGNET_BASE_RADIUS = 100;
const ROCKET_BOOST_FORCE = -15;
const SCORE_MULTIPLIER_VALUE = 2;
const POWER_UP_FLOAT_SPEED = 0.05;
const POWER_UP_FLOAT_AMPLITUDE = 5;

// Coin Constants
const COIN_SIZE = 15;
const COIN_BASE_VALUE = 1;
const COIN_SPAWN_CHANCE = 0.3; // 30% chance per platform
const COIN_COLLECT_RADIUS = 20;
const COIN_MAGNET_FORCE = 0.5;
const COIN_ROTATION_SPEED = 0.1;

// Upgrade Constants
const UPGRADE_JUMP_HEIGHT_BONUS = 0.1; // 10% per level
const UPGRADE_AIR_CONTROL_BONUS = 0.15; // 15% per level
const UPGRADE_COIN_MAGNET_RADIUS = 50; // Additional radius per level
const UPGRADE_STARTING_HEIGHT = 100; // Meters per level
const UPGRADE_POWER_UP_DURATION = 90; // Additional frames per level (1.5s)
const UPGRADE_BASE_COSTS = {
  'jump-height': 50,
  'air-control': 75,
  'coin-magnet': 100,
  'starting-height': 150,
  'power-up-duration': 200,
  'platform-sight': 300,
  'enemy-radar': 250
};

export const NeonJumpGame: React.FC<NeonJumpGameProps> = ({ settings, updateHighScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [showShop, setShowShop] = useState(false);
  const animationIdRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const touchStartRef = useRef<Vector2D | null>(null);
  const gamepadRef = useRef<Gamepad | null>(null);
  
  // Initialize game state
  const gameRef = useRef<GameState>({
    player: {
      position: { x: 200, y: 300 },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      width: 20,
      height: 30,
      state: 'idle',
      isGrounded: false,
      wallContact: 'none',
      coyoteTime: 0,
      jumpBufferTime: 0,
      canDoubleJump: false,
      lastPlatform: null,
      health: 3,
      maxHealth: 3,
      invulnerableTime: 0,
      hitFlashTime: 0,
      speedMultiplier: 1,
      hasShield: false,
      magnetRadius: 0,
      rocketBoostActive: false,
      isGhost: false,
      trailParticles: [],
      shieldBubbleAlpha: 0,
      magnetFieldAlpha: 0
    },
    platforms: [],
    enemies: [],
    projectiles: [],
    powerUps: [],
    activePowerUps: [],
    coins: [],
    particles: [],
    camera: { x: 0, y: 0 },
    score: 0,
    sessionCoins: 0,
    totalCoins: 0,
    level: 1,
    gameSpeed: 1,
    lastUpdate: 0,
    nextPlatformId: 0,
    nextEnemyId: 0,
    nextProjectileId: 0,
    nextPowerUpId: 0,
    nextCoinId: 0,
    enemySpawnTimer: 0,
    powerUpSpawnTimer: 0,
    scoreMultiplier: 1,
    platformsFrozen: false,
    parallaxOffsets: [0, 0, 0, 0, 0],
    upgrades: {
      jumpHeight: 0,
      airControl: 0,
      coinMagnet: 0,
      startingHeight: 0,
      powerUpDuration: 0,
      platformSight: 0,
      enemyRadar: 0
    },
    showShop: false
  });

  // Initialize platforms
  const initializePlatforms = useCallback(() => {
    const game = gameRef.current;
    game.platforms = [];
    game.nextPlatformId = 0;
    
    // Create initial platform under player
    const initialPlatform = createPlatform(
      game.player.position.x - PLATFORM_WIDTH / 2,
      game.player.position.y + game.player.height + 10,
      'standard'
    );
    game.platforms.push(initialPlatform);
    
    // Generate initial platforms
    for (let i = 0; i < 10; i++) {
      generateNextPlatform();
    }
  }, [createPlatform, generateNextPlatform]);

  // Create platform with full properties
  const createPlatform = useCallback((x: number, y: number, type: Platform['type']): Platform => {
    const game = gameRef.current;
    const platform: Platform = {
      id: game.nextPlatformId++,
      x,
      y,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      type,
      active: true,
      glowIntensity: 1,
      glowPhase: Math.random() * Math.PI * 2
    };
    
    // Add type-specific properties
    switch (type) {
      case 'standard':
        platform.pulseSpeed = 0.05 + Math.random() * 0.02; // Vary pulse speed
        break;
        
      case 'crumbling':
        platform.crumbleState = 'solid';
        platform.crumbleTimer = 0;
        platform.cracks = [];
        platform.debrisParticles = [];
        platform.fallVelocity = 0;
        break;
        
      case 'moving':
        const movementType = ['linear', 'sine', 'circular'][Math.floor(Math.random() * 3)] as 'linear' | 'sine' | 'circular';
        platform.movementPath = {
          type: movementType,
          start: { x: x - 50, y: y },
          end: { x: x + 50, y: y },
          speed: 1 + game.level * 0.1,
          direction: 1,
          phase: 0
        };
        if (movementType === 'circular') {
          platform.movementPath.centerX = x;
          platform.movementPath.centerY = y;
          platform.movementPath.radius = 50;
        }
        platform.velocity = { x: 0, y: 0 };
        break;
        
      case 'bouncy':
        platform.bounceAnimation = 0;
        platform.squashFactor = 1;
        break;
        
      case 'phase':
        platform.phaseTimer = 0;
        platform.phaseVisible = true;
        platform.phaseWarning = false;
        platform.staticEffect = 0;
        break;
        
      case 'ice':
        platform.friction = ICE_FRICTION;
        platform.iceParticles = [];
        break;
        
      case 'conveyor':
        platform.conveyorSpeed = CONVEYOR_BASE_SPEED * (1 + game.level * 0.1);
        platform.conveyorDirection = Math.random() > 0.5 ? 1 : -1;
        platform.arrowOffset = 0;
        break;
    }
    
    return platform;
  }, []);

  // Platform generation with reachability guarantee
  const generateNextPlatform = useCallback(() => {
    const game = gameRef.current;
    
    // Find the highest platform
    let highestPlatform = game.platforms[0];
    for (const platform of game.platforms) {
      if (platform.y < highestPlatform.y) {
        highestPlatform = platform;
      }
    }
    
    // Calculate reachable zone from highest platform
    const minY = highestPlatform.y - MAX_PLATFORM_GAP_Y;
    const maxY = highestPlatform.y - MIN_PLATFORM_GAP;
    const minX = Math.max(50, highestPlatform.x - MAX_PLATFORM_GAP_X);
    const maxX = Math.min(350, highestPlatform.x + MAX_PLATFORM_GAP_X);
    
    // Generate new platform position
    const newX = minX + Math.random() * (maxX - minX);
    const newY = minY + Math.random() * (maxY - minY);
    
    // Choose platform type based on level
    const types: Platform['type'][] = ['standard', 'standard', 'standard']; // More standard platforms
    if (game.level > 2) types.push('moving', 'bouncy');
    if (game.level > 4) types.push('crumbling', 'ice');
    if (game.level > 6) types.push('phase', 'conveyor');
    
    const type = types[Math.floor(Math.random() * types.length)];
    const platform = createPlatform(newX, newY, type);
    
    game.platforms.push(platform);
    
    // Chance to spawn coin on platform
    if (Math.random() < COIN_SPAWN_CHANCE) {
      const coin = createCoin(
        platform.x + platform.width / 2,
        platform.y - 20
      );
      game.coins.push(coin);
    }
  }, [createPlatform]);

  // Enemy creation factory
  const createEnemy = useCallback((type: EnemyType, x: number, y: number, platformY?: number): Enemy => {
    const game = gameRef.current;
    const enemy: Enemy = {
      id: game.nextEnemyId++,
      type,
      position: { x, y },
      velocity: { x: 0, y: 0 },
      width: 30,
      height: 30,
      health: 1,
      maxHealth: 1,
      state: 'idle',
      stateTimer: 0,
      facingDirection: 1,
      targetPlatform: null,
      active: true,
      glowIntensity: 1
    };
    
    // Configure enemy-specific properties
    switch (type) {
      case 'glitch-slime':
        enemy.width = 25;
        enemy.height = 20;
        enemy.bouncePhase = 0;
        enemy.nextBounceTime = 60;
        enemy.state = 'patrol';
        break;
        
      case 'neon-wasp':
        enemy.width = 20;
        enemy.height = 15;
        enemy.sinePhase = Math.random() * Math.PI * 2;
        enemy.pursuitSpeed = 2;
        enemy.state = 'patrol';
        break;
        
      case 'cyber-spider':
        enemy.width = 30;
        enemy.height = 25;
        enemy.health = 2;
        enemy.maxHealth = 2;
        enemy.webCooldown = 0;
        enemy.isDropping = false;
        enemy.state = 'patrol';
        if (platformY !== undefined) {
          enemy.position.y = platformY - enemy.height;
        }
        break;
        
      case 'plasma-ghost':
        enemy.width = 35;
        enemy.height = 35;
        enemy.health = 999; // Cannot be killed
        enemy.maxHealth = 999;
        enemy.phaseAlpha = 0.7;
        enemy.targetPosition = { x, y };
        enemy.state = 'patrol';
        break;
        
      case 'electric-turret':
        enemy.width = 35;
        enemy.height = 30;
        enemy.health = 3;
        enemy.maxHealth = 3;
        enemy.chargeTime = 0;
        enemy.maxChargeTime = TURRET_CHARGE_TIME;
        enemy.alertRadius = 200;
        enemy.state = 'idle';
        if (platformY !== undefined) {
          enemy.position.y = platformY - enemy.height;
        }
        break;
        
      case 'pixel-knight':
        enemy.width = 25;
        enemy.height = 35;
        enemy.health = 2;
        enemy.maxHealth = 2;
        enemy.patrolStart = x - 40;
        enemy.patrolEnd = x + 40;
        enemy.chargeSpeed = KNIGHT_CHARGE_SPEED;
        enemy.chargeCooldown = 0;
        enemy.shieldUp = true;
        enemy.state = 'patrol';
        break;
        
      case 'void-orb':
        enemy.width = 40;
        enemy.height = 40;
        enemy.health = 999; // Invincible
        enemy.maxHealth = 999;
        enemy.teleportCooldown = ORB_TELEPORT_INTERVAL;
        enemy.gravityRadius = ORB_GRAVITY_RADIUS;
        enemy.gravityStrength = ORB_GRAVITY_STRENGTH;
        enemy.portalEffect = 0;
        enemy.state = 'idle';
        break;
    }
    
    return enemy;
  }, []);

  // Create projectile
  const createProjectile = useCallback((type: 'missile' | 'web', x: number, y: number, targetX: number, targetY: number): Projectile => {
    const game = gameRef.current;
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const projectile: Projectile = {
      id: game.nextProjectileId++,
      type,
      position: { x, y },
      velocity: { x: 0, y: 0 },
      width: 8,
      height: 8,
      damage: 1,
      active: true,
      trailParticles: []
    };
    
    if (type === 'missile') {
      projectile.velocity.x = (dx / dist) * 5;
      projectile.velocity.y = (dy / dist) * 5;
      projectile.homingStrength = 0.1;
    } else if (type === 'web') {
      projectile.velocity.x = (dx / dist) * 3;
      projectile.velocity.y = (dy / dist) * 3 + 2; // Add gravity
      projectile.webStickiness = 0.5;
      projectile.width = 12;
      projectile.height = 12;
    }
    
    return projectile;
  }, []);

  // Create power-up
  const createPowerUp = useCallback((type: PowerUpType, x: number, y: number): PowerUp => {
    const game = gameRef.current;
    
    const powerUpColors: Record<PowerUpType, string> = {
      'speed-boost': '#00BFFF',      // Deep Sky Blue
      'shield-bubble': '#00FFFF',     // Cyan
      'magnet-field': '#9370DB',      // Medium Purple
      'rocket-boost': '#FF4500',      // Orange Red
      'platform-freezer': '#87CEEB',  // Sky Blue
      'ghost-mode': '#DDA0DD',        // Plum
      'score-multiplier': '#FFD700'   // Gold
    };
    
    return {
      id: game.nextPowerUpId++,
      type,
      position: { x, y },
      width: POWER_UP_SIZE,
      height: POWER_UP_SIZE,
      collected: false,
      active: true,
      glowColor: powerUpColors[type],
      glowIntensity: 1,
      rotationAngle: Math.random() * Math.PI * 2,
      floatOffset: Math.random() * Math.PI * 2
    };
  }, []);

  // Create coin
  const createCoin = useCallback((x: number, y: number, value?: number): Coin => {
    const game = gameRef.current;
    
    // Determine coin value (rarer coins have higher value)
    let coinValue = value || COIN_BASE_VALUE;
    if (!value) {
      const rand = Math.random();
      if (rand < 0.1) coinValue = 10;      // 10% chance
      else if (rand < 0.3) coinValue = 5;   // 20% chance
      else coinValue = 1;                    // 70% chance
    }
    
    return {
      id: game.nextCoinId++,
      position: { x, y },
      value: coinValue,
      collected: false,
      active: true,
      rotationAngle: Math.random() * Math.PI * 2,
      floatOffset: Math.random() * Math.PI * 2
    };
  }, []);

  // Enemy spawn system
  const spawnEnemies = useCallback(() => {
    const game = gameRef.current;
    
    // Calculate spawn interval based on height
    const spawnInterval = Math.max(
      ENEMY_SPAWN_BASE_INTERVAL - (game.level - 1) * 10,
      100
    );
    
    // Check if we should spawn
    const currentHeight = Math.abs(game.camera.y);
    if (currentHeight - game.enemySpawnTimer < spawnInterval) return;
    if (game.enemies.length >= MAX_ACTIVE_ENEMIES) return;
    
    game.enemySpawnTimer = currentHeight;
    
    // Determine enemy types available at current level
    const availableTypes: Array<{ type: EnemyType; weight: number }> = [
      { type: 'glitch-slime', weight: 30 }
    ];
    
    if (game.level >= 2) {
      availableTypes.push({ type: 'neon-wasp', weight: 25 });
    }
    if (game.level >= 3) {
      availableTypes.push({ type: 'cyber-spider', weight: 20 });
      availableTypes.push({ type: 'electric-turret', weight: 15 });
    }
    if (game.level >= 4) {
      availableTypes.push({ type: 'pixel-knight', weight: 15 });
    }
    if (game.level >= 5) {
      availableTypes.push({ type: 'plasma-ghost', weight: 10 });
    }
    if (game.level >= 6) {
      availableTypes.push({ type: 'void-orb', weight: 5 });
    }
    
    // Select enemy type based on weights
    const totalWeight = availableTypes.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedType: EnemyType = 'glitch-slime';
    
    for (const enemyType of availableTypes) {
      random -= enemyType.weight;
      if (random <= 0) {
        selectedType = enemyType.type;
        break;
      }
    }
    
    // Find a suitable platform for spawning
    const spawnPlatforms = game.platforms.filter(p => 
      p.active && 
      p.y < game.camera.y - 100 && 
      p.y > game.camera.y - 400 &&
      p.type !== 'crumbling' && 
      p.type !== 'phase'
    );
    
    if (spawnPlatforms.length === 0) return;
    
    const spawnPlatform = spawnPlatforms[Math.floor(Math.random() * spawnPlatforms.length)];
    const spawnX = spawnPlatform.x + Math.random() * (spawnPlatform.width - 30);
    const spawnY = spawnPlatform.y - 50;
    
    const enemy = createEnemy(selectedType, spawnX, spawnY, spawnPlatform.y);
    enemy.targetPlatform = spawnPlatform;
    game.enemies.push(enemy);
  }, [createEnemy, spawnCoins]);

  // Power-up spawn system
  const spawnPowerUps = useCallback(() => {
    const game = gameRef.current;
    
    const currentHeight = Math.abs(game.camera.y);
    if (currentHeight - game.powerUpSpawnTimer < POWER_UP_SPAWN_INTERVAL) return;
    
    game.powerUpSpawnTimer = currentHeight;
    
    // Find suitable platform
    const spawnPlatforms = game.platforms.filter(p => 
      p.active && 
      p.y < game.camera.y - 100 && 
      p.y > game.camera.y - 400 &&
      p.type !== 'crumbling'
    );
    
    if (spawnPlatforms.length === 0) return;
    
    const platform = spawnPlatforms[Math.floor(Math.random() * spawnPlatforms.length)];
    
    // Choose random power-up type
    const types: PowerUpType[] = [
      'speed-boost', 'shield-bubble', 'magnet-field', 
      'rocket-boost', 'platform-freezer', 'ghost-mode', 
      'score-multiplier'
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const powerUp = createPowerUp(
      type,
      platform.x + platform.width / 2,
      platform.y - 30
    );
    
    game.powerUps.push(powerUp);
  }, [createPowerUp]);

  // Spawn coins on platforms and from enemies
  const spawnCoins = useCallback((x: number, y: number, count: number = 1, scatter: boolean = false) => {
    const game = gameRef.current;
    
    for (let i = 0; i < count; i++) {
      let coinX = x;
      let coinY = y;
      
      if (scatter) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 20 + Math.random() * 20;
        coinX += Math.cos(angle) * radius;
        coinY += Math.sin(angle) * radius;
      } else {
        coinX += (i - count / 2) * 20;
      }
      
      const coin = createCoin(coinX, coinY);
      game.coins.push(coin);
    }
  }, [createCoin]);

  // Input handling
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    keysRef.current.add(e.key.toLowerCase());
    
    if (!gameStarted && ['arrowleft', 'arrowright', 'arrowup', 'a', 'd', 'w', ' '].includes(e.key.toLowerCase())) {
      setGameStarted(true);
    }
  }, [gameStarted, gameOver]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  // Touch input handling
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      
      if (!gameStarted) {
        setGameStarted(true);
      }
    }
  }, [gameStarted]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (touchStartRef.current && e.touches.length > 0) {
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      
      // Simulate keyboard input based on touch
      keysRef.current.clear();
      if (Math.abs(deltaX) > 10) {
        if (deltaX > 0) {
          keysRef.current.add('arrowright');
        } else {
          keysRef.current.add('arrowleft');
        }
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    keysRef.current.clear();
  }, []);

  // Gamepad handling
  const updateGamepadInput = useCallback(() => {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0];
    
    if (gamepad) {
      gamepadRef.current = gamepad;
      keysRef.current.clear();
      
      // Left stick or D-pad horizontal
      if (gamepad.axes[0] < -0.5 || gamepad.buttons[14]?.pressed) {
        keysRef.current.add('arrowleft');
      } else if (gamepad.axes[0] > 0.5 || gamepad.buttons[15]?.pressed) {
        keysRef.current.add('arrowright');
      }
      
      // Jump button (A on Xbox, X on PlayStation)
      if (gamepad.buttons[0]?.pressed) {
        keysRef.current.add(' ');
      }
      
      if (!gameStarted && (gamepad.buttons[0]?.pressed || Math.abs(gamepad.axes[0]) > 0.5)) {
        setGameStarted(true);
      }
    }
  }, [gameStarted]);

  // Physics update
  const updatePhysics = useCallback((deltaTime: number) => {
    const game = gameRef.current;
    const player = game.player;
    const keys = keysRef.current;
    
    // Update gamepad input
    updateGamepadInput();
    
    // Horizontal movement with speed boost and air control upgrades
    const airControlBonus = game.upgrades.airControl * UPGRADE_AIR_CONTROL_BONUS;
    const airControlFactor = player.isGrounded ? 1 : (AIR_CONTROL + airControlBonus);
    const speedWithBoost = HORIZONTAL_SPEED * player.speedMultiplier;
    
    player.acceleration.x = 0;
    if (keys.has('arrowleft') || keys.has('a')) {
      player.acceleration.x = -speedWithBoost * airControlFactor;
    } else if (keys.has('arrowright') || keys.has('d')) {
      player.acceleration.x = speedWithBoost * airControlFactor;
    }
    
    // Apply friction based on platform type
    if (player.isGrounded && player.acceleration.x === 0) {
      let friction = NORMAL_FRICTION;
      if (player.lastPlatform && player.lastPlatform.type === 'ice') {
        friction = ICE_FRICTION;
      }
      player.velocity.x *= friction;
    }
    
    // Update velocity
    player.velocity.x += player.acceleration.x * deltaTime;
    player.velocity.x = Math.max(-speedWithBoost, Math.min(speedWithBoost, player.velocity.x));
    
    // Gravity and vertical movement
    if (player.rocketBoostActive) {
      // Rocket boost provides upward thrust
      player.velocity.y -= 0.5 * deltaTime;
    } else if (player.wallContact !== 'none' && player.velocity.y > 0) {
      player.velocity.y += WALL_SLIDE_GRAVITY * deltaTime;
    } else {
      player.velocity.y += GRAVITY * deltaTime;
    }
    player.velocity.y = Math.min(player.velocity.y, MAX_FALL_SPEED);
    
    // Jump handling with coyote time and jump buffering
    if (keys.has(' ') || keys.has('arrowup') || keys.has('w')) {
      player.jumpBufferTime = JUMP_BUFFER_TIME;
    } else {
      player.jumpBufferTime = Math.max(0, player.jumpBufferTime - 1);
    }
    
    if (player.jumpBufferTime > 0 && (player.isGrounded || player.coyoteTime > 0)) {
      // Apply jump height upgrade
      const jumpBonus = game.upgrades.jumpHeight * UPGRADE_JUMP_HEIGHT_BONUS;
      const jumpForce = BASE_JUMP_FORCE * (1 + jumpBonus);
      
      player.velocity.y = jumpForce;
      player.jumpBufferTime = 0;
      player.coyoteTime = 0;
      player.canDoubleJump = true;
      soundManager.playTone(440, 0.1, 'square');
      
      // Jump particles
      for (let i = 0; i < 10; i++) {
        game.particles.push({
          x: player.position.x + player.width / 2,
          y: player.position.y + player.height,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * -2,
          life: 1,
          color: '#00FFFF',
          size: 3
        });
      }
    }
    
    // Update position
    player.position.x += player.velocity.x * deltaTime;
    player.position.y += player.velocity.y * deltaTime;
    
    // Screen boundaries
    player.position.x = Math.max(0, Math.min(400 - player.width, player.position.x));
    
    // Wall detection
    player.wallContact = 'none';
    if (player.position.x <= 0) player.wallContact = 'left';
    if (player.position.x >= 400 - player.width) player.wallContact = 'right';
    
    // Update coyote time
    if (!player.isGrounded && player.coyoteTime > 0) {
      player.coyoteTime--;
    }
    
    // Update player state
    if (player.isGrounded) {
      if (Math.abs(player.velocity.x) > 0.5) {
        player.state = 'running';
      } else {
        player.state = 'idle';
      }
    } else if (player.velocity.y < 0) {
      player.state = 'jumping';
    } else if (player.wallContact !== 'none') {
      player.state = 'wall-sliding';
    } else {
      player.state = 'falling';
    }
    
    // Check death condition
    if (player.position.y > game.camera.y + 600) {
      player.state = 'death';
      setGameOver(true);
      soundManager.playGameOver();
    }
  }, [updateGamepadInput]);

  // Platform collision detection
  const checkPlatformCollisions = useCallback(() => {
    const game = gameRef.current;
    const player = game.player;
    
    player.isGrounded = false;
    
    for (const platform of game.platforms) {
      if (!platform.active) continue;
      
      // Check if player is colliding with platform
      if (player.position.x < platform.x + platform.width &&
          player.position.x + player.width > platform.x &&
          player.position.y < platform.y + platform.height &&
          player.position.y + player.height > platform.y) {
        
        // Landing on top of platform
        if (player.velocity.y > 0 && 
            player.position.y < platform.y &&
            player.position.y + player.height - player.velocity.y <= platform.y) {
          
          player.position.y = platform.y - player.height;
          player.velocity.y = 0;
          player.isGrounded = true;
          player.coyoteTime = COYOTE_TIME;
          player.lastPlatform = platform;
          
          // Platform-specific effects
          switch (platform.type) {
            case 'standard':
              // Normal landing - just play sound
              soundManager.playTone(220, 0.05, 'sine');
              break;
              
            case 'bouncy':
              player.velocity.y = BASE_JUMP_FORCE * BOUNCE_FORCE_MULTIPLIER;
              platform.bounceAnimation = 1;
              soundManager.playTone(660, 0.15, 'sine');
              // Bouncy particles
              for (let i = 0; i < 15; i++) {
                game.particles.push({
                  x: platform.x + platform.width / 2,
                  y: platform.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: -Math.random() * 4 - 2,
                  life: 1,
                  color: '#00FF00',
                  size: 4
                });
              }
              break;
              
            case 'crumbling':
              if (platform.crumbleState === 'solid') {
                platform.crumbleState = 'cracking';
                platform.crumbleTimer = CRUMBLE_DELAY;
                // Generate cracks from contact point
                const contactX = player.position.x + player.width / 2 - platform.x;
                for (let i = 0; i < 5; i++) {
                  platform.cracks!.push({
                    x: contactX + (Math.random() - 0.5) * 20,
                    y: Math.random() * platform.height,
                    angle: Math.random() * Math.PI,
                    length: 10 + Math.random() * 15
                  });
                }
                soundManager.playTone(150, 0.1, 'sawtooth');
              }
              break;
              
            case 'ice':
              // Ice particles when landing
              for (let i = 0; i < 8; i++) {
                platform.iceParticles!.push({
                  x: player.position.x + player.width / 2 - platform.x,
                  y: 0,
                  vx: (Math.random() - 0.5) * 4,
                  vy: -Math.random() * 2,
                  alpha: 1
                });
              }
              soundManager.playTone(880, 0.05, 'triangle');
              break;
              
            case 'conveyor':
              soundManager.playTone(330, 0.05, 'square');
              break;
              
            case 'phase':
              soundManager.playTone(440, 0.1, 'sine');
              break;
              
            case 'moving':
              // Transfer momentum
              if (platform.velocity) {
                player.velocity.x += platform.velocity.x * 0.3;
              }
              soundManager.playTone(330, 0.05, 'sine');
              break;
          }
          
          // Score for reaching new platform
          if (platform.y < player.position.y - 100) {
            const points = Math.floor(Math.abs(platform.y - player.position.y) / 10);
            game.score += points;
            setScore(game.score);
          }
        }
      }
    }
  }, []);

  // Check enemy and projectile collisions
  const checkEnemyCollisions = useCallback(() => {
    const game = gameRef.current;
    const player = game.player;
    
    // Skip if player is invulnerable
    if (player.invulnerableTime > 0) return;
    
    // Check enemy collisions
    for (const enemy of game.enemies) {
      if (!enemy.active) continue;
      
      const enemyHit = player.position.x < enemy.position.x + enemy.width &&
                      player.position.x + player.width > enemy.position.x &&
                      player.position.y < enemy.position.y + enemy.height &&
                      player.position.y + player.height > enemy.position.y;
                      
      if (enemyHit) {
        // Ghost mode - phase through enemies
        if (player.isGhost) {
          continue;
        }
        
        // Special case for plasma ghost and void orb (no damage)
        if (enemy.type === 'plasma-ghost' || enemy.type === 'void-orb') {
          continue;
        }
        
        // Check if jumping on enemy
        const jumpingOn = player.velocity.y > 0 && 
                         player.position.y < enemy.position.y &&
                         !['electric-turret', 'pixel-knight'].includes(enemy.type);
                         
        if (jumpingOn) {
          // Bounce off enemy
          player.velocity.y = BASE_JUMP_FORCE * 0.8;
          enemy.health--;
          
          if (enemy.health <= 0) {
            enemy.active = false;
            game.score += 50;
            setScore(game.score);
            
            // Death particles
            for (let i = 0; i < 10; i++) {
              game.particles.push({
                x: enemy.position.x + enemy.width / 2,
                y: enemy.position.y + enemy.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: -Math.random() * 5,
                life: 1,
                size: 3 + Math.random() * 3,
                color: '#FF0000'
              });
            }
            
            // Spawn coins
            const coinCount = 2 + Math.floor(Math.random() * 4); // 2-5 coins
            spawnCoins(
              enemy.position.x + enemy.width / 2,
              enemy.position.y + enemy.height / 2,
              coinCount,
              true // scatter
            );
            
            soundManager.playHit();
          } else {
            soundManager.playTone(300, 0.1, 'square');
          }
        } else {
          // Check for shield
          if (player.hasShield) {
            player.hasShield = false;
            // Find and remove shield power-up
            game.activePowerUps = game.activePowerUps.filter(p => p.type !== 'shield-bubble');
            
            // Shield break effect
            for (let i = 0; i < 15; i++) {
              const angle = (i / 15) * Math.PI * 2;
              game.particles.push({
                x: player.position.x + player.width / 2,
                y: player.position.y + player.height / 2,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                life: 1,
                size: 4,
                color: '#00FFFF'
              });
            }
            soundManager.playTone(600, 0.2, 'sine');
          } else {
            // Take damage
            player.health--;
            player.invulnerableTime = PLAYER_INVULNERABLE_TIME;
            player.hitFlashTime = PLAYER_HIT_FLASH_TIME;
            
            // Knockback
            const knockbackX = player.position.x < enemy.position.x ? -5 : 5;
            const knockbackY = -5;
            player.velocity.x = knockbackX;
            player.velocity.y = knockbackY;
            
            soundManager.playHit();
            
            if (player.health <= 0) {
              player.state = 'death';
              setGameOver(true);
              soundManager.playGameOver();
            }
          }
        }
      }
    }
    
    // Check projectile collisions
    for (const projectile of game.projectiles) {
      if (!projectile.active) continue;
      
      const projectileHit = player.position.x < projectile.position.x + projectile.width &&
                           player.position.x + player.width > projectile.position.x &&
                           player.position.y < projectile.position.y + projectile.height &&
                           player.position.y + player.height > projectile.position.y;
                           
      if (projectileHit) {
        // Ghost mode - phase through projectiles
        if (player.isGhost) {
          continue;
        }
        
        projectile.active = false;
        
        // Check for shield
        if (player.hasShield) {
          player.hasShield = false;
          game.activePowerUps = game.activePowerUps.filter(p => p.type !== 'shield-bubble');
          
          // Shield break effect
          for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            game.particles.push({
              x: player.position.x + player.width / 2,
              y: player.position.y + player.height / 2,
              vx: Math.cos(angle) * 5,
              vy: Math.sin(angle) * 5,
              life: 1,
              size: 4,
              color: '#00FFFF'
            });
          }
          soundManager.playTone(600, 0.2, 'sine');
        } else {
          // Apply projectile effect
          if (projectile.type === 'web') {
            // Slow player
            player.velocity.x *= 0.5;
            player.velocity.y *= 0.5;
          }
          
          // Take damage
          player.health--;
          player.invulnerableTime = PLAYER_INVULNERABLE_TIME;
          player.hitFlashTime = PLAYER_HIT_FLASH_TIME;
        
        soundManager.playHit();
        
        if (player.health <= 0) {
          player.state = 'death';
          setGameOver(true);
          soundManager.playGameOver();
        }
      }
    }
  }, [spawnCoins]);

  // Update platforms
  const updatePlatforms = useCallback((deltaTime: number) => {
    const game = gameRef.current;
    const player = game.player;
    
    for (const platform of game.platforms) {
      // Update glow animation for all platforms
      platform.glowPhase += (platform.pulseSpeed || 0.05) * deltaTime;
      platform.glowIntensity = 0.6 + Math.sin(platform.glowPhase) * 0.4;
      
      // Platform-specific updates
      switch (platform.type) {
        case 'standard':
          // Just glow pulsing, handled above
          break;
          
        case 'crumbling':
          if (platform.crumbleState === 'cracking' && platform.crumbleTimer! > 0) {
            platform.crumbleTimer! -= deltaTime;
            if (platform.crumbleTimer! <= 0) {
              platform.crumbleState = 'breaking';
              platform.active = false;
              // Create debris particles
              for (let i = 0; i < 12; i++) {
                platform.debrisParticles!.push({
                  x: platform.x + Math.random() * platform.width,
                  y: platform.y + Math.random() * platform.height,
                  vx: (Math.random() - 0.5) * 8,
                  vy: -Math.random() * 4,
                  rotation: Math.random() * Math.PI * 2,
                  size: 3 + Math.random() * 5
                });
              }
              soundManager.playTone(100, 0.2, 'sawtooth');
            }
          } else if (platform.crumbleState === 'breaking') {
            platform.crumbleState = 'falling';
          } else if (platform.crumbleState === 'falling') {
            platform.fallVelocity = (platform.fallVelocity || 0) + GRAVITY * deltaTime;
            platform.y += platform.fallVelocity * deltaTime;
            // Update debris
            platform.debrisParticles!.forEach(debris => {
              debris.x += debris.vx * deltaTime;
              debris.y += debris.vy * deltaTime;
              debris.vy += GRAVITY * deltaTime;
              debris.rotation += 0.1 * deltaTime;
            });
          }
          break;
          
        case 'moving':
          if (platform.movementPath && !game.platformsFrozen) {
            const path = platform.movementPath;
            const oldX = platform.x;
            const oldY = platform.y;
            
            switch (path.type) {
              case 'linear':
                platform.x += path.speed * path.direction * deltaTime;
                if (platform.x <= path.start.x || platform.x >= path.end.x) {
                  path.direction *= -1;
                }
                break;
                
              case 'sine':
                path.phase += path.speed * 0.05 * deltaTime;
                const sineOffset = Math.sin(path.phase) * 30;
                platform.x = (path.start.x + path.end.x) / 2 + sineOffset;
                platform.y = path.start.y + Math.cos(path.phase) * 20;
                break;
                
              case 'circular':
                path.phase += path.speed * 0.02 * deltaTime;
                platform.x = path.centerX! + Math.cos(path.phase) * path.radius!;
                platform.y = path.centerY! + Math.sin(path.phase) * path.radius!;
                break;
            }
            
            // Calculate velocity for momentum transfer
            platform.velocity = {
              x: platform.x - oldX,
              y: platform.y - oldY
            };
          }
          break;
          
        case 'bouncy':
          // Update bounce animation
          if (platform.bounceAnimation! > 0) {
            platform.bounceAnimation! -= deltaTime * 0.1;
            platform.squashFactor = 1 - platform.bounceAnimation! * 0.3;
          } else {
            platform.squashFactor = 1;
          }
          break;
          
        case 'phase':
          if (!game.platformsFrozen) {
            platform.phaseTimer = (platform.phaseTimer || 0) + deltaTime;
          }
          platform.staticEffect = Math.random();
          
          // Warning before phase change
          if (platform.phaseTimer > PHASE_CYCLE_TIME - PHASE_WARNING_TIME) {
            platform.phaseWarning = true;
            platform.glowIntensity = 0.3 + Math.sin(platform.phaseTimer * 0.5) * 0.7;
          } else {
            platform.phaseWarning = false;
          }
          
          if (platform.phaseTimer > PHASE_CYCLE_TIME) {
            platform.phaseVisible = !platform.phaseVisible;
            platform.active = platform.phaseVisible;
            platform.phaseTimer = 0;
            soundManager.playTone(platform.phaseVisible ? 880 : 440, 0.1, 'sine');
          }
          break;
          
        case 'ice':
          // Update ice particles
          platform.iceParticles = platform.iceParticles!.filter(particle => {
            particle.y += particle.vy * deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.vy += 0.1 * deltaTime;
            particle.alpha -= 0.02 * deltaTime;
            return particle.alpha > 0;
          });
          
          // Apply friction to player if standing on ice
          if (player.isGrounded && player.lastPlatform === platform) {
            player.velocity.x *= platform.friction!;
          }
          break;
          
        case 'conveyor':
          // Update arrow animation
          platform.arrowOffset = (platform.arrowOffset || 0) + platform.conveyorSpeed! * platform.conveyorDirection! * deltaTime;
          if (Math.abs(platform.arrowOffset) > 20) {
            platform.arrowOffset = 0;
          }
          
          // Apply conveyor force to player (unless frozen)
          if (player.isGrounded && player.lastPlatform === platform && !game.platformsFrozen) {
            player.position.x += platform.conveyorDirection! * platform.conveyorSpeed! * deltaTime;
          }
          break;
      }
    }
    
    // Remove platforms below camera
    game.platforms = game.platforms.filter(p => p.y < game.camera.y + 600);
    
    // Generate new platforms as needed
    while (game.platforms.length < 15) {
      generateNextPlatform();
    }
  }, [generateNextPlatform]);

  // Update enemies
  const updateEnemies = useCallback((deltaTime: number) => {
    const game = gameRef.current;
    const player = game.player;
    
    // Spawn new enemies
    spawnEnemies();
    
    // Update each enemy
    for (const enemy of game.enemies) {
      if (!enemy.active) continue;
      
      // Update glow
      enemy.glowIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
      
      // Enemy-specific behavior
      switch (enemy.type) {
        case 'glitch-slime':
          // Horizontal patrol with bouncing
          if (enemy.state === 'patrol') {
            enemy.velocity.x = enemy.facingDirection * 1.5;
            
            // Bounce timing
            enemy.nextBounceTime = (enemy.nextBounceTime || 60) - deltaTime;
            if (enemy.nextBounceTime <= 0 && enemy.velocity.y === 0) {
              enemy.velocity.y = SLIME_BOUNCE_HEIGHT;
              enemy.nextBounceTime = 60 + Math.random() * 30;
              soundManager.playTone(150, 0.1, 'sine');
            }
            
            // Edge detection
            if (enemy.targetPlatform) {
              const platform = enemy.targetPlatform;
              if (enemy.position.x <= platform.x || 
                  enemy.position.x + enemy.width >= platform.x + platform.width) {
                enemy.facingDirection *= -1;
              }
            }
          }
          
          // Apply gravity
          enemy.velocity.y += GRAVITY * deltaTime;
          break;
          
        case 'neon-wasp':
          // Flying enemy with sine wave pattern
          enemy.sinePhase = (enemy.sinePhase || 0) + WASP_SINE_SPEED * deltaTime;
          
          // Pursue player horizontally
          const waspDx = player.position.x - enemy.position.x;
          enemy.velocity.x = Math.sign(waspDx) * Math.min(enemy.pursuitSpeed!, Math.abs(waspDx) * 0.02);
          enemy.facingDirection = Math.sign(waspDx) || 1;
          
          // Sine wave vertical movement
          enemy.velocity.y = Math.sin(enemy.sinePhase!) * WASP_SINE_AMPLITUDE * 0.05;
          break;
          
        case 'cyber-spider':
          if (enemy.state === 'patrol') {
            // Platform crawling
            enemy.velocity.x = enemy.facingDirection * 2;
            
            // Edge detection
            if (enemy.targetPlatform) {
              const platform = enemy.targetPlatform;
              if (enemy.position.x <= platform.x || 
                  enemy.position.x + enemy.width >= platform.x + platform.width) {
                enemy.facingDirection *= -1;
              }
            }
            
            // Check if player is below
            const spiderDx = Math.abs(player.position.x - enemy.position.x);
            const spiderDy = player.position.y - enemy.position.y;
            if (spiderDx < 50 && spiderDy > 50 && spiderDy < 300 && enemy.webCooldown! <= 0) {
              enemy.state = 'web-drop';
              enemy.isDropping = true;
              enemy.webLine = { startY: enemy.position.y, length: 0 };
              enemy.velocity.x = 0;
            }
          } else if (enemy.state === 'web-drop') {
            // Drop on web
            enemy.velocity.y = SPIDER_DROP_SPEED;
            enemy.webLine!.length = enemy.position.y - enemy.webLine!.startY;
            
            // Shoot web projectile
            if (enemy.webCooldown! <= 0) {
              const projectile = createProjectile('web', 
                enemy.position.x + enemy.width / 2, 
                enemy.position.y + enemy.height,
                player.position.x + player.width / 2,
                player.position.y + player.height / 2
              );
              game.projectiles.push(projectile);
              enemy.webCooldown = 120;
              soundManager.playTone(400, 0.1, 'sawtooth');
            }
            
            // Return to platform
            if (enemy.position.y > enemy.webLine!.startY + 200) {
              enemy.state = 'patrol';
              enemy.isDropping = false;
              enemy.velocity.y = -8;
            }
          }
          
          if (enemy.webCooldown! > 0) {
            enemy.webCooldown! -= deltaTime;
          }
          break;
          
        case 'plasma-ghost':
          // Phase through platforms, follow player
          const ghostDx = player.position.x - enemy.position.x;
          const ghostDy = player.position.y - enemy.position.y;
          const ghostDist = Math.sqrt(ghostDx * ghostDx + ghostDy * ghostDy);
          
          if (ghostDist > 10) {
            enemy.velocity.x = (ghostDx / ghostDist) * GHOST_FOLLOW_SPEED;
            enemy.velocity.y = (ghostDy / ghostDist) * GHOST_FOLLOW_SPEED;
          } else {
            enemy.velocity.x *= 0.9;
            enemy.velocity.y *= 0.9;
          }
          
          // Update phase effect
          enemy.phaseAlpha = 0.3 + Math.sin(Date.now() * 0.003) * 0.2;
          break;
          
        case 'electric-turret':
          // Stationary, shoots at player
          if (enemy.state === 'idle') {
            const turretDx = player.position.x - enemy.position.x;
            const turretDy = player.position.y - enemy.position.y;
            const turretDist = Math.sqrt(turretDx * turretDx + turretDy * turretDy);
            
            if (turretDist < enemy.alertRadius!) {
              enemy.state = 'charging-shot';
              enemy.chargeTime = 0;
            }
          } else if (enemy.state === 'charging-shot') {
            enemy.chargeTime! += deltaTime;
            
            if (enemy.chargeTime! >= enemy.maxChargeTime!) {
              // Fire missile
              const projectile = createProjectile('missile',
                enemy.position.x + enemy.width / 2,
                enemy.position.y,
                player.position.x + player.width / 2,
                player.position.y + player.height / 2
              );
              game.projectiles.push(projectile);
              
              enemy.state = 'idle';
              enemy.stateTimer = TURRET_SHOT_INTERVAL;
              soundManager.playTone(800, 0.2, 'square');
            }
          }
          
          if (enemy.stateTimer > 0) {
            enemy.stateTimer -= deltaTime;
          }
          break;
          
        case 'pixel-knight':
          if (enemy.state === 'patrol') {
            // Patrol between edges
            enemy.velocity.x = enemy.facingDirection * KNIGHT_PATROL_SPEED;
            
            if (enemy.position.x <= enemy.patrolStart! || 
                enemy.position.x >= enemy.patrolEnd!) {
              enemy.facingDirection *= -1;
            }
            
            // Check for player in sight
            const knightDx = player.position.x - enemy.position.x;
            const knightDy = Math.abs(player.position.y - enemy.position.y);
            if (Math.abs(knightDx) < 150 && knightDy < 100 && enemy.chargeCooldown! <= 0) {
              enemy.state = 'charge';
              enemy.facingDirection = Math.sign(knightDx);
              enemy.shieldUp = false;
              soundManager.playTone(300, 0.1, 'square');
            }
          } else if (enemy.state === 'charge') {
            // Charge at player
            enemy.velocity.x = enemy.facingDirection * enemy.chargeSpeed!;
            enemy.stateTimer += deltaTime;
            
            // End charge after time or hit wall
            if (enemy.stateTimer > 60 || 
                enemy.position.x <= enemy.patrolStart! - 50 ||
                enemy.position.x >= enemy.patrolEnd! + 50) {
              enemy.state = 'patrol';
              enemy.stateTimer = 0;
              enemy.chargeCooldown = 180;
              enemy.shieldUp = true;
            }
          }
          
          if (enemy.chargeCooldown! > 0) {
            enemy.chargeCooldown! -= deltaTime;
          }
          
          // Apply gravity
          enemy.velocity.y += GRAVITY * deltaTime;
          break;
          
        case 'void-orb':
          // Teleport near player periodically
          enemy.teleportCooldown! -= deltaTime;
          
          if (enemy.teleportCooldown! <= 0) {
            enemy.state = 'teleporting';
            enemy.portalEffect = 30;
            
            // Teleport to random position near player
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 100;
            enemy.position.x = player.position.x + Math.cos(angle) * distance;
            enemy.position.y = player.position.y + Math.sin(angle) * distance;
            
            enemy.teleportCooldown = ORB_TELEPORT_INTERVAL;
            soundManager.playTone(100, 0.3, 'sine');
          }
          
          // Apply gravity pull to player if close
          const orbDx = enemy.position.x - player.position.x;
          const orbDy = enemy.position.y - player.position.y;
          const orbDist = Math.sqrt(orbDx * orbDx + orbDy * orbDy);
          
          if (orbDist < enemy.gravityRadius! && orbDist > 0) {
            const pullStrength = (1 - orbDist / enemy.gravityRadius!) * enemy.gravityStrength!;
            player.velocity.x += (orbDx / orbDist) * pullStrength * deltaTime;
            player.velocity.y += (orbDy / orbDist) * pullStrength * deltaTime;
          }
          
          if (enemy.portalEffect! > 0) {
            enemy.portalEffect! -= deltaTime;
          }
          break;
      }
      
      // Update position
      enemy.position.x += enemy.velocity.x * deltaTime;
      enemy.position.y += enemy.velocity.y * deltaTime;
      
      // Ground collision for walking enemies
      if (['glitch-slime', 'cyber-spider', 'pixel-knight'].includes(enemy.type)) {
        let isGrounded = false;
        for (const platform of game.platforms) {
          if (!platform.active) continue;
          
          const onPlatform = enemy.position.x < platform.x + platform.width &&
                            enemy.position.x + enemy.width > platform.x &&
                            enemy.position.y + enemy.height >= platform.y &&
                            enemy.position.y + enemy.height <= platform.y + platform.height + 10;
                            
          if (onPlatform) {
            enemy.position.y = platform.y - enemy.height;
            enemy.velocity.y = 0;
            isGrounded = true;
            enemy.targetPlatform = platform;
            break;
          }
        }
        
        if (!isGrounded && enemy.type !== 'cyber-spider' || (enemy.type === 'cyber-spider' && enemy.state !== 'web-drop')) {
          enemy.velocity.y += GRAVITY * deltaTime;
        }
      }
    }
    
    // Update projectiles
    for (const projectile of game.projectiles) {
      if (!projectile.active) continue;
      
      // Update position
      projectile.position.x += projectile.velocity.x * deltaTime;
      projectile.position.y += projectile.velocity.y * deltaTime;
      
      // Missile homing
      if (projectile.type === 'missile' && projectile.homingStrength) {
        const dx = player.position.x - projectile.position.x;
        const dy = player.position.y - projectile.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          projectile.velocity.x += (dx / dist) * projectile.homingStrength * deltaTime;
          projectile.velocity.y += (dy / dist) * projectile.homingStrength * deltaTime;
        }
      }
      
      // Web gravity
      if (projectile.type === 'web') {
        projectile.velocity.y += GRAVITY * 0.5 * deltaTime;
      }
      
      // Add trail particles
      if (Math.random() < 0.3) {
        projectile.trailParticles!.push({
          x: projectile.position.x,
          y: projectile.position.y,
          alpha: 1
        });
      }
      
      // Update trail
      for (const trail of projectile.trailParticles!) {
        trail.alpha -= 0.02 * deltaTime;
      }
      projectile.trailParticles = projectile.trailParticles!.filter(t => t.alpha > 0);
      
      // Remove if out of bounds
      if (projectile.position.y > game.camera.y + 500 || 
          projectile.position.y < game.camera.y - 500 ||
          Math.abs(projectile.position.x - player.position.x) > 500) {
        projectile.active = false;
      }
    }
    
    // Remove inactive enemies and projectiles
    game.enemies = game.enemies.filter(e => e.active && e.position.y < game.camera.y + ENEMY_DESPAWN_DISTANCE);
    game.projectiles = game.projectiles.filter(p => p.active);
  }, [spawnEnemies, createProjectile]);

  // Update power-ups
  const updatePowerUps = useCallback((deltaTime: number) => {
    const game = gameRef.current;
    const player = game.player;
    
    // Spawn power-ups periodically
    spawnPowerUps();
    
    // Update power-up animations
    for (const powerUp of game.powerUps) {
      if (!powerUp.active) continue;
      
      // Floating animation
      powerUp.floatOffset += POWER_UP_FLOAT_SPEED * deltaTime;
      powerUp.rotationAngle += 0.02 * deltaTime;
      
      // Glow pulse
      powerUp.glowIntensity = 0.7 + Math.sin(Date.now() * 0.003) * 0.3;
      
      // Check collection
      const dx = powerUp.position.x - (player.position.x + player.width / 2);
      const dy = powerUp.position.y - (player.position.y + player.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < POWER_UP_SIZE && !powerUp.collected) {
        powerUp.collected = true;
        powerUp.active = false;
        
        // Apply power-up effect
        const duration = POWER_UP_BASE_DURATION + game.upgrades.powerUpDuration * UPGRADE_POWER_UP_DURATION;
        const activePowerUp: ActivePowerUp = {
          type: powerUp.type,
          duration,
          maxDuration: duration,
          effectStrength: 1
        };
        
        // Remove existing power-up of same type
        game.activePowerUps = game.activePowerUps.filter(p => p.type !== powerUp.type);
        game.activePowerUps.push(activePowerUp);
        
        // Apply immediate effects
        switch (powerUp.type) {
          case 'speed-boost':
            player.speedMultiplier = SPEED_BOOST_MULTIPLIER;
            break;
          case 'shield-bubble':
            player.hasShield = true;
            break;
          case 'magnet-field':
            player.magnetRadius = MAGNET_BASE_RADIUS + game.upgrades.coinMagnet * UPGRADE_COIN_MAGNET_RADIUS;
            break;
          case 'rocket-boost':
            player.velocity.y = ROCKET_BOOST_FORCE;
            player.rocketBoostActive = true;
            break;
          case 'platform-freezer':
            game.platformsFrozen = true;
            break;
          case 'ghost-mode':
            player.isGhost = true;
            break;
          case 'score-multiplier':
            game.scoreMultiplier = SCORE_MULTIPLIER_VALUE;
            break;
        }
        
        // Particles and sound
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2;
          game.particles.push({
            x: powerUp.position.x,
            y: powerUp.position.y,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            life: 1,
            color: powerUp.glowColor,
            size: 4
          });
        }
        
        soundManager.playPowerUp();
      }
    }
    
    // Update active power-ups
    for (const activePowerUp of game.activePowerUps) {
      activePowerUp.duration -= deltaTime;
      
      // Remove expired power-ups
      if (activePowerUp.duration <= 0) {
        switch (activePowerUp.type) {
          case 'speed-boost':
            player.speedMultiplier = 1;
            break;
          case 'shield-bubble':
            player.hasShield = false;
            break;
          case 'magnet-field':
            player.magnetRadius = game.upgrades.coinMagnet * UPGRADE_COIN_MAGNET_RADIUS;
            break;
          case 'rocket-boost':
            player.rocketBoostActive = false;
            break;
          case 'platform-freezer':
            game.platformsFrozen = false;
            break;
          case 'ghost-mode':
            player.isGhost = false;
            break;
          case 'score-multiplier':
            game.scoreMultiplier = 1;
            break;
        }
      }
    }
    
    // Remove expired power-ups
    game.activePowerUps = game.activePowerUps.filter(p => p.duration > 0);
    game.powerUps = game.powerUps.filter(p => p.active && p.position.y < game.camera.y + 500);
  }, [spawnPowerUps]);

  // Update coins
  const updateCoins = useCallback((deltaTime: number) => {
    const game = gameRef.current;
    const player = game.player;
    
    // Update coin animations
    for (const coin of game.coins) {
      if (!coin.active) continue;
      
      // Rotation and floating
      coin.rotationAngle += COIN_ROTATION_SPEED * deltaTime;
      coin.floatOffset += POWER_UP_FLOAT_SPEED * deltaTime;
      
      // Magnet effect
      const dx = coin.position.x - (player.position.x + player.width / 2);
      const dy = coin.position.y - (player.position.y + player.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const magnetRadius = player.magnetRadius || 0;
      if (dist < magnetRadius && dist > 0) {
        // Pull coin towards player
        const pullStrength = COIN_MAGNET_FORCE * (1 - dist / magnetRadius);
        coin.magnetPull = {
          x: -(dx / dist) * pullStrength,
          y: -(dy / dist) * pullStrength
        };
        
        coin.position.x += coin.magnetPull.x * deltaTime;
        coin.position.y += coin.magnetPull.y * deltaTime;
      }
      
      // Check collection
      if (dist < COIN_COLLECT_RADIUS && !coin.collected) {
        coin.collected = true;
        coin.active = false;
        
        // Add to score and coins
        const coinValue = coin.value * game.scoreMultiplier;
        game.sessionCoins += coin.value;
        game.totalCoins += coin.value;
        game.score += coinValue * 10;
        
        // Collection particles
        for (let i = 0; i < 10; i++) {
          const angle = Math.random() * Math.PI * 2;
          game.particles.push({
            x: coin.position.x,
            y: coin.position.y,
            vx: Math.cos(angle) * 2,
            vy: Math.sin(angle) * 2 - 1,
            life: 1,
            color: coin.value === 10 ? '#FFD700' : coin.value === 5 ? '#C0C0C0' : '#CD7F32',
            size: 3
          });
        }
        
        soundManager.playCollect();
      }
    }
    
    // Remove inactive coins
    game.coins = game.coins.filter(c => c.active && c.position.y < game.camera.y + 500);
  }, []);

  // Update camera
  const updateCamera = useCallback(() => {
    const game = gameRef.current;
    const targetY = game.player.position.y - CAMERA_LOOK_AHEAD;
    
    // Smooth camera movement
    game.camera.y += (targetY - game.camera.y) * CAMERA_SMOOTH;
    
    // Camera only moves up
    if (game.camera.y > 0) {
      game.camera.y = 0;
    }
  }, []);

  // Update particles
  const updateParticles = useCallback((deltaTime: number) => {
    const game = gameRef.current;
    
    for (const particle of game.particles) {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.vy += 0.2 * deltaTime; // Gravity for particles
      particle.life -= 0.02 * deltaTime;
    }
    
    // Remove dead particles
    game.particles = game.particles.filter(p => p.life > 0);
  }, []);

  // Render background layers
  const renderBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const game = gameRef.current;
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#1A0033');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 400);
    
    // Parallax layers (simplified for now)
    ctx.strokeStyle = '#FF00FF20';
    ctx.lineWidth = 1;
    
    for (let layer = 0; layer < 5; layer++) {
      const parallaxSpeed = 0.2 * (layer + 1);
      const offset = game.camera.y * parallaxSpeed;
      
      // Draw grid lines for cyberpunk effect
      ctx.beginPath();
      for (let y = offset % 50; y < 400; y += 50) {
        ctx.moveTo(0, y);
        ctx.lineTo(400, y);
      }
      ctx.stroke();
    }
  }, []);

  // Render platforms
  const renderPlatforms = useCallback((ctx: CanvasRenderingContext2D) => {
    const game = gameRef.current;
    
    for (const platform of game.platforms) {
      if (!platform.active && platform.type !== 'phase' && platform.type !== 'crumbling') continue;
      
      const y = platform.y - game.camera.y;
      if (y < -platform.height - 100 || y > 500) continue;
      
      ctx.save();
      
      // Apply glow intensity
      ctx.globalAlpha = platform.glowIntensity;
      
      // Platform-specific rendering
      switch (platform.type) {
        case 'standard':
          // Cyan with gradient and pulsing glow
          const standardGradient = ctx.createLinearGradient(platform.x, y, platform.x, y + platform.height);
          standardGradient.addColorStop(0, '#00FFFF');
          standardGradient.addColorStop(1, '#0080FF');
          ctx.fillStyle = standardGradient;
          ctx.shadowColor = '#00FFFF';
          ctx.shadowBlur = 10 + Math.sin(platform.glowPhase) * 5;
          ctx.fillRect(platform.x, y, platform.width, platform.height);
          
          // Subtle outline
          ctx.strokeStyle = '#00FFFF80';
          ctx.lineWidth = 1;
          ctx.strokeRect(platform.x, y, platform.width, platform.height);
          break;
          
        case 'crumbling':
          if (platform.crumbleState === 'solid' || platform.crumbleState === 'cracking') {
            // Red with cracks
            ctx.fillStyle = '#FF0000';
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 10;
            ctx.fillRect(platform.x, y, platform.width, platform.height);
            
            // Draw cracks
            if (platform.cracks && platform.cracks.length > 0) {
              ctx.strokeStyle = '#800000';
              ctx.lineWidth = 2;
              platform.cracks.forEach(crack => {
                ctx.beginPath();
                ctx.moveTo(platform.x + crack.x, y + crack.y);
                ctx.lineTo(
                  platform.x + crack.x + Math.cos(crack.angle) * crack.length,
                  y + crack.y + Math.sin(crack.angle) * crack.length
                );
                ctx.stroke();
              });
            }
          } else if (platform.crumbleState === 'falling') {
            // Draw falling debris
            ctx.fillStyle = '#FF0000';
            platform.debrisParticles!.forEach(debris => {
              ctx.save();
              ctx.translate(debris.x, debris.y - game.camera.y);
              ctx.rotate(debris.rotation);
              ctx.fillRect(-debris.size / 2, -debris.size / 2, debris.size, debris.size);
              ctx.restore();
            });
          }
          break;
          
        case 'moving':
          // Purple with motion trails
          const movingGradient = ctx.createLinearGradient(platform.x, y, platform.x + platform.width, y);
          movingGradient.addColorStop(0, '#FF00FF');
          movingGradient.addColorStop(0.5, '#FF00FF');
          movingGradient.addColorStop(1, '#8000FF');
          ctx.fillStyle = movingGradient;
          ctx.shadowColor = '#FF00FF';
          ctx.shadowBlur = 15;
          ctx.fillRect(platform.x, y, platform.width, platform.height);
          
          // Motion trail
          if (platform.velocity && (Math.abs(platform.velocity.x) > 0.1 || Math.abs(platform.velocity.y) > 0.1)) {
            ctx.globalAlpha = 0.3;
            for (let i = 1; i <= 3; i++) {
              ctx.fillRect(
                platform.x - platform.velocity.x * i * 10,
                y - platform.velocity.y * i * 10,
                platform.width,
                platform.height
              );
              ctx.globalAlpha *= 0.5;
            }
          }
          
          // Direction indicators
          if (platform.movementPath) {
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            if (platform.movementPath.type === 'circular') {
              ctx.fillText('⟲', platform.x + platform.width / 2, y - 5);
            } else {
              ctx.fillText('↔', platform.x + platform.width / 2, y - 5);
            }
          }
          break;
          
        case 'bouncy':
          // Green with spring effect
          ctx.save();
          ctx.translate(platform.x + platform.width / 2, y + platform.height / 2);
          ctx.scale(1, platform.squashFactor || 1);
          ctx.translate(-(platform.x + platform.width / 2), -(y + platform.height / 2));
          
          const bouncyGradient = ctx.createRadialGradient(
            platform.x + platform.width / 2, y + platform.height / 2, 0,
            platform.x + platform.width / 2, y + platform.height / 2, platform.width / 2
          );
          bouncyGradient.addColorStop(0, '#00FF00');
          bouncyGradient.addColorStop(1, '#00AA00');
          ctx.fillStyle = bouncyGradient;
          ctx.shadowColor = '#00FF00';
          ctx.shadowBlur = 20;
          ctx.fillRect(platform.x, y, platform.width, platform.height);
          
          // Spring coils
          ctx.strokeStyle = '#00FF0080';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < 3; i++) {
            const coilY = y + platform.height - 3 - i * 3;
            ctx.moveTo(platform.x + 10, coilY);
            ctx.lineTo(platform.x + platform.width - 10, coilY);
          }
          ctx.stroke();
          ctx.restore();
          break;
          
        case 'phase':
          // White with static effect
          if (platform.phaseVisible || platform.phaseWarning) {
            ctx.globalAlpha = platform.phaseVisible ? 0.8 : 0.3;
            
            // Static noise effect
            if (platform.phaseWarning) {
              const imageData = ctx.createImageData(platform.width, platform.height);
              for (let i = 0; i < imageData.data.length; i += 4) {
                const brightness = Math.random() * 255;
                imageData.data[i] = brightness;     // R
                imageData.data[i + 1] = brightness; // G
                imageData.data[i + 2] = brightness; // B
                imageData.data[i + 3] = 128;        // A
              }
              ctx.putImageData(imageData, platform.x, y);
            }
            
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = platform.phaseWarning ? 30 : 15;
            ctx.fillRect(platform.x, y, platform.width, platform.height);
            
            // Ghost outline
            ctx.strokeStyle = '#FFFFFF40';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(platform.x, y, platform.width, platform.height);
            ctx.setLineDash([]);
          }
          break;
          
        case 'ice':
          // Light blue with crystalline texture
          const iceGradient = ctx.createLinearGradient(platform.x, y, platform.x, y + platform.height);
          iceGradient.addColorStop(0, '#C0E0FF');
          iceGradient.addColorStop(0.5, '#80D0FF');
          iceGradient.addColorStop(1, '#60C0FF');
          ctx.fillStyle = iceGradient;
          ctx.shadowColor = '#80D0FF';
          ctx.shadowBlur = 15;
          ctx.fillRect(platform.x, y, platform.width, platform.height);
          
          // Ice crystal pattern
          ctx.strokeStyle = '#FFFFFF60';
          ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            const crystalX = platform.x + 15 + i * 25;
            ctx.beginPath();
            ctx.moveTo(crystalX, y + 2);
            ctx.lineTo(crystalX - 5, y + platform.height - 2);
            ctx.lineTo(crystalX + 5, y + platform.height - 2);
            ctx.closePath();
            ctx.stroke();
          }
          
          // Ice particles
          if (platform.iceParticles) {
            ctx.fillStyle = '#FFFFFF';
            platform.iceParticles.forEach(particle => {
              ctx.globalAlpha = particle.alpha;
              ctx.fillRect(
                platform.x + particle.x - 1,
                y + particle.y - 1,
                2,
                2
              );
            });
          }
          break;
          
        case 'conveyor':
          // Orange with moving arrows
          const conveyorGradient = ctx.createLinearGradient(platform.x, y, platform.x, y + platform.height);
          conveyorGradient.addColorStop(0, '#FF8000');
          conveyorGradient.addColorStop(1, '#CC6600');
          ctx.fillStyle = conveyorGradient;
          ctx.shadowColor = '#FF8000';
          ctx.shadowBlur = 12;
          ctx.fillRect(platform.x, y, platform.width, platform.height);
          
          // Animated arrows
          ctx.fillStyle = '#FFCC00';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.globalAlpha = 0.8;
          for (let i = 0; i < 3; i++) {
            const arrowX = platform.x + 20 + i * 30 + (platform.arrowOffset || 0);
            if (arrowX > platform.x && arrowX < platform.x + platform.width) {
              ctx.fillText(
                platform.conveyorDirection! > 0 ? '→' : '←',
                arrowX,
                y + platform.height - 2
              );
            }
          }
          break;
      }
      
      ctx.restore();
    }
  }, []);

  // Render enemies
  const renderEnemies = useCallback((ctx: CanvasRenderingContext2D) => {
    const game = gameRef.current;
    
    for (const enemy of game.enemies) {
      if (!enemy.active) continue;
      
      const y = enemy.position.y - game.camera.y;
      
      ctx.save();
      
      // Enemy-specific rendering
      switch (enemy.type) {
        case 'glitch-slime':
          // Green bouncing slime
          ctx.fillStyle = '#00FF00';
          ctx.shadowColor = '#00FF00';
          ctx.shadowBlur = 10 * enemy.glowIntensity;
          
          // Body
          ctx.beginPath();
          const squash = enemy.velocity.y > 0 ? 1.1 : (enemy.velocity.y < 0 ? 0.9 : 1);
          ctx.ellipse(
            enemy.position.x + enemy.width / 2,
            y + enemy.height / 2,
            enemy.width / 2 * squash,
            enemy.height / 2 / squash,
            0, 0, Math.PI * 2
          );
          ctx.fill();
          
          // Eyes
          ctx.fillStyle = '#000000';
          ctx.fillRect(enemy.position.x + 8, y + 5, 3, 3);
          ctx.fillRect(enemy.position.x + 14, y + 5, 3, 3);
          break;
          
        case 'neon-wasp':
          // Yellow flying wasp
          ctx.fillStyle = '#FFFF00';
          ctx.shadowColor = '#FFFF00';
          ctx.shadowBlur = 12 * enemy.glowIntensity;
          
          // Body
          ctx.beginPath();
          ctx.ellipse(
            enemy.position.x + enemy.width / 2,
            y + enemy.height / 2,
            enemy.width / 2,
            enemy.height / 2,
            0, 0, Math.PI * 2
          );
          ctx.fill();
          
          // Wings
          ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.02) * 0.2;
          ctx.fillStyle = '#FFFFFF';
          const wingOffset = Math.sin(Date.now() * 0.03) * 3;
          ctx.fillRect(enemy.position.x - 5, y + 5 + wingOffset, 5, 5);
          ctx.fillRect(enemy.position.x + enemy.width, y + 5 - wingOffset, 5, 5);
          
          // Trail effect
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#FFFF00';
          for (let i = 1; i <= 3; i++) {
            ctx.fillRect(
              enemy.position.x - enemy.velocity.x * i * 3,
              y - enemy.velocity.y * i * 3,
              enemy.width - i * 2,
              enemy.height - i * 2
            );
          }
          break;
          
        case 'cyber-spider':
          // Red mechanical spider
          ctx.fillStyle = '#FF0000';
          ctx.shadowColor = '#FF0000';
          ctx.shadowBlur = 10 * enemy.glowIntensity;
          
          // Web line
          if (enemy.isDropping && enemy.webLine) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(enemy.position.x + enemy.width / 2, enemy.webLine.startY - game.camera.y);
            ctx.lineTo(enemy.position.x + enemy.width / 2, y);
            ctx.stroke();
          }
          
          // Body
          ctx.globalAlpha = 1;
          ctx.fillRect(enemy.position.x + 5, y + 5, enemy.width - 10, enemy.height - 10);
          
          // Legs
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            const legX = enemy.position.x + 5 + i * 6;
            const legY = y + enemy.height / 2;
            ctx.beginPath();
            ctx.moveTo(legX, legY);
            ctx.lineTo(legX - 5, legY + 10);
            ctx.moveTo(legX, legY);
            ctx.lineTo(legX + 5, legY + 10);
            ctx.stroke();
          }
          
          // Eyes
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#FFFFFF';
          ctx.shadowBlur = 5;
          ctx.fillRect(enemy.position.x + 10, y + 8, 3, 3);
          ctx.fillRect(enemy.position.x + 17, y + 8, 3, 3);
          break;
          
        case 'plasma-ghost':
          // Translucent purple ghost
          ctx.globalAlpha = enemy.phaseAlpha || 0.5;
          ctx.fillStyle = '#AA00FF';
          ctx.shadowColor = '#AA00FF';
          ctx.shadowBlur = 20 * enemy.glowIntensity;
          
          // Ghost body
          ctx.beginPath();
          ctx.arc(
            enemy.position.x + enemy.width / 2,
            y + enemy.height / 2,
            enemy.width / 2,
            0, Math.PI * 2
          );
          ctx.fill();
          
          // Wispy tail
          ctx.beginPath();
          for (let i = 0; i < 3; i++) {
            const waveX = enemy.position.x + i * 12;
            const waveY = y + enemy.height - 5 + Math.sin((Date.now() * 0.01 + i) * 2) * 5;
            if (i === 0) ctx.moveTo(waveX, waveY);
            else ctx.lineTo(waveX, waveY);
          }
          ctx.stroke();
          
          // Particle aura
          ctx.fillStyle = '#FFFFFF';
          for (let i = 0; i < 5; i++) {
            const angle = (Date.now() * 0.002 + i * 1.256) % (Math.PI * 2);
            const px = enemy.position.x + enemy.width / 2 + Math.cos(angle) * 25;
            const py = y + enemy.height / 2 + Math.sin(angle) * 25;
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01 + i) * 0.2;
            ctx.fillRect(px - 2, py - 2, 4, 4);
          }
          break;
          
        case 'electric-turret':
          // Blue mechanical turret
          ctx.fillStyle = '#0088FF';
          ctx.shadowColor = '#0088FF';
          ctx.shadowBlur = 15 * enemy.glowIntensity;
          
          // Base
          ctx.fillRect(enemy.position.x, y + enemy.height - 10, enemy.width, 10);
          
          // Barrel
          ctx.save();
          ctx.translate(enemy.position.x + enemy.width / 2, y + enemy.height - 10);
          const angle = Math.atan2(
            game.player.position.y - enemy.position.y,
            game.player.position.x - enemy.position.x
          );
          ctx.rotate(angle);
          ctx.fillRect(0, -5, 20, 10);
          ctx.restore();
          
          // Charge effect
          if (enemy.state === 'charging-shot') {
            const chargeRatio = enemy.chargeTime! / enemy.maxChargeTime!;
            ctx.globalAlpha = chargeRatio;
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 20 * chargeRatio;
            ctx.beginPath();
            ctx.arc(
              enemy.position.x + enemy.width / 2,
              y + enemy.height / 2,
              10 * chargeRatio,
              0, Math.PI * 2
            );
            ctx.fill();
          }
          break;
          
        case 'pixel-knight':
          // Armored enemy with sword
          ctx.fillStyle = '#888888';
          ctx.shadowColor = '#888888';
          ctx.shadowBlur = 8 * enemy.glowIntensity;
          
          // Body
          ctx.fillRect(enemy.position.x + 5, y + 10, enemy.width - 10, enemy.height - 15);
          
          // Helmet
          ctx.fillStyle = '#AAAAAA';
          ctx.fillRect(enemy.position.x + 5, y, enemy.width - 10, 12);
          
          // Shield
          if (enemy.shieldUp) {
            ctx.fillStyle = '#4444FF';
            ctx.shadowColor = '#4444FF';
            const shieldX = enemy.facingDirection > 0 ? enemy.position.x : enemy.position.x + enemy.width - 8;
            ctx.fillRect(shieldX, y + 8, 8, 20);
          }
          
          // Sword
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#FFFFFF';
          ctx.shadowBlur = 5;
          const swordX = enemy.facingDirection > 0 ? enemy.position.x + enemy.width : enemy.position.x;
          ctx.fillRect(swordX - 2, y + 15, 4, 15);
          
          // Charge effect
          if (enemy.state === 'charge') {
            ctx.strokeStyle = '#FF4444';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.moveTo(enemy.position.x - enemy.facingDirection * i * 10, y);
              ctx.lineTo(enemy.position.x - enemy.facingDirection * i * 10, y + enemy.height);
              ctx.stroke();
            }
          }
          break;
          
        case 'void-orb':
          // Black sphere with purple corona
          ctx.globalAlpha = 1;
          
          // Gravity field visualization
          if (player.position.x && player.position.y) {
            const orbDx = enemy.position.x - player.position.x;
            const orbDy = enemy.position.y - player.position.y;
            const orbDist = Math.sqrt(orbDx * orbDx + orbDy * orbDy);
            
            if (orbDist < enemy.gravityRadius!) {
              const gradient = ctx.createRadialGradient(
                enemy.position.x + enemy.width / 2,
                y + enemy.height / 2,
                0,
                enemy.position.x + enemy.width / 2,
                y + enemy.height / 2,
                enemy.gravityRadius!
              );
              gradient.addColorStop(0, 'rgba(128, 0, 255, 0.3)');
              gradient.addColorStop(1, 'rgba(128, 0, 255, 0)');
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(
                enemy.position.x + enemy.width / 2,
                y + enemy.height / 2,
                enemy.gravityRadius!,
                0, Math.PI * 2
              );
              ctx.fill();
            }
          }
          
          // Core orb
          ctx.fillStyle = '#000000';
          ctx.shadowColor = '#8800FF';
          ctx.shadowBlur = 20 * enemy.glowIntensity;
          ctx.beginPath();
          ctx.arc(
            enemy.position.x + enemy.width / 2,
            y + enemy.height / 2,
            enemy.width / 2,
            0, Math.PI * 2
          );
          ctx.fill();
          
          // Purple corona
          ctx.strokeStyle = '#8800FF';
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(
            enemy.position.x + enemy.width / 2,
            y + enemy.height / 2,
            enemy.width / 2 + 5,
            0, Math.PI * 2
          );
          ctx.stroke();
          
          // Portal effect
          if (enemy.portalEffect! > 0) {
            ctx.globalAlpha = enemy.portalEffect! / 30;
            for (let i = 0; i < 8; i++) {
              const angle = (Math.PI * 2 * i) / 8 + Date.now() * 0.01;
              const dist = 30 + enemy.portalEffect!;
              const px = enemy.position.x + enemy.width / 2 + Math.cos(angle) * dist;
              const py = y + enemy.height / 2 + Math.sin(angle) * dist;
              ctx.fillStyle = '#FF00FF';
              ctx.fillRect(px - 3, py - 3, 6, 6);
            }
          }
          break;
      }
      
      ctx.restore();
    }
    
    // Render projectiles
    for (const projectile of game.projectiles) {
      if (!projectile.active) continue;
      
      const py = projectile.position.y - game.camera.y;
      
      ctx.save();
      
      if (projectile.type === 'missile') {
        // Blue homing missile
        ctx.fillStyle = '#00CCFF';
        ctx.shadowColor = '#00CCFF';
        ctx.shadowBlur = 10;
        
        // Missile body
        ctx.fillRect(projectile.position.x, py, projectile.width, projectile.height);
        
        // Trail
        ctx.globalAlpha = 0.5;
        for (const trail of projectile.trailParticles!) {
          ctx.globalAlpha = trail.alpha * 0.5;
          ctx.fillRect(trail.x - 2, trail.y - game.camera.y - 2, 4, 4);
        }
      } else if (projectile.type === 'web') {
        // White sticky web
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 5;
        ctx.globalAlpha = 0.9;
        
        // Web pattern
        ctx.beginPath();
        ctx.arc(
          projectile.position.x + projectile.width / 2,
          py + projectile.height / 2,
          projectile.width / 2,
          0, Math.PI * 2
        );
        ctx.fill();
        
        // Web lines
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8;
          ctx.beginPath();
          ctx.moveTo(
            projectile.position.x + projectile.width / 2,
            py + projectile.height / 2
          );
          ctx.lineTo(
            projectile.position.x + projectile.width / 2 + Math.cos(angle) * 8,
            py + projectile.height / 2 + Math.sin(angle) * 8
          );
          ctx.stroke();
        }
      }
      
      ctx.restore();
    }
  }, []);

  // Render power-ups
  const renderPowerUps = useCallback((ctx: CanvasRenderingContext2D) => {
    const game = gameRef.current;
    
    for (const powerUp of game.powerUps) {
      if (!powerUp.active) continue;
      
      const y = powerUp.position.y - game.camera.y + Math.sin(powerUp.floatOffset) * POWER_UP_FLOAT_AMPLITUDE;
      if (y < -POWER_UP_SIZE || y > 450) continue;
      
      ctx.save();
      ctx.translate(powerUp.position.x, y);
      ctx.rotate(powerUp.rotationAngle);
      
      // Glow effect
      ctx.shadowColor = powerUp.glowColor;
      ctx.shadowBlur = 15 * powerUp.glowIntensity;
      
      // Draw power-up icon based on type
      ctx.fillStyle = powerUp.glowColor;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      
      switch (powerUp.type) {
        case 'speed-boost':
          // Lightning bolt
          ctx.beginPath();
          ctx.moveTo(-8, -10);
          ctx.lineTo(0, -5);
          ctx.lineTo(-4, 0);
          ctx.lineTo(8, 10);
          ctx.lineTo(0, 5);
          ctx.lineTo(4, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
          
        case 'shield-bubble':
          // Circle with inner circle
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.stroke();
          break;
          
        case 'magnet-field':
          // Horseshoe magnet
          ctx.beginPath();
          ctx.arc(0, 0, 8, Math.PI, Math.PI * 2);
          ctx.lineTo(8, 5);
          ctx.lineTo(5, 5);
          ctx.lineTo(5, 0);
          ctx.lineTo(-5, 0);
          ctx.lineTo(-5, 5);
          ctx.lineTo(-8, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
          
        case 'rocket-boost':
          // Rocket shape
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(5, 0);
          ctx.lineTo(5, 5);
          ctx.lineTo(8, 8);
          ctx.lineTo(0, 5);
          ctx.lineTo(-8, 8);
          ctx.lineTo(-5, 5);
          ctx.lineTo(-5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
          
        case 'platform-freezer':
          // Snowflake
          for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI) / 3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -10);
            ctx.moveTo(0, -5);
            ctx.lineTo(-3, -8);
            ctx.moveTo(0, -5);
            ctx.lineTo(3, -8);
            ctx.stroke();
            ctx.restore();
          }
          break;
          
        case 'ghost-mode':
          // Ghost shape
          ctx.beginPath();
          ctx.arc(0, -5, 8, Math.PI, 0);
          ctx.lineTo(8, 5);
          ctx.lineTo(5, 8);
          ctx.lineTo(2, 5);
          ctx.lineTo(0, 8);
          ctx.lineTo(-2, 5);
          ctx.lineTo(-5, 8);
          ctx.lineTo(-8, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
          
        case 'score-multiplier':
          // Star
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const r = i % 2 === 0 ? 10 : 5;
            ctx[i === 0 ? 'moveTo' : 'lineTo'](
              Math.cos(angle) * r,
              Math.sin(angle) * r
            );
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
      }
      
      ctx.restore();
    }
  }, []);

  // Render coins
  const renderCoins = useCallback((ctx: CanvasRenderingContext2D) => {
    const game = gameRef.current;
    
    for (const coin of game.coins) {
      if (!coin.active) continue;
      
      const y = coin.position.y - game.camera.y + Math.sin(coin.floatOffset) * POWER_UP_FLOAT_AMPLITUDE;
      if (y < -COIN_SIZE || y > 450) continue;
      
      ctx.save();
      ctx.translate(coin.position.x, y);
      
      // Coin color based on value
      const coinColor = coin.value === 10 ? '#FFD700' : coin.value === 5 ? '#C0C0C0' : '#CD7F32';
      ctx.fillStyle = coinColor;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      
      // Glow effect
      ctx.shadowColor = coinColor;
      ctx.shadowBlur = 10;
      
      // Draw coin (rotating circle)
      ctx.save();
      ctx.scale(Math.cos(coin.rotationAngle), 1);
      ctx.beginPath();
      ctx.arc(0, 0, COIN_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Coin value text
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(coin.value.toString(), 0, 0);
      ctx.restore();
      
      ctx.restore();
    }
  }, []);

  // Render player
  const renderPlayer = useCallback((ctx: CanvasRenderingContext2D) => {
    const game = gameRef.current;
    const player = game.player;
    const y = player.position.y - game.camera.y;
    
    ctx.save();
    
    // Hit flash effect
    if (player.hitFlashTime > 0 && Math.floor(player.hitFlashTime / 3) % 2 === 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FF0000';
    } else {
      ctx.fillStyle = '#00FF00';
      ctx.shadowColor = '#00FF00';
    }
    ctx.shadowBlur = 15;
    
    // Invulnerability transparency
    if (player.invulnerableTime > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
    }
    
    // Simple rectangle for now, can be enhanced with sprites later
    ctx.fillRect(player.position.x, y, player.width, player.height);
    
    // Motion trail effect
    if (Math.abs(player.velocity.x) > 2 || Math.abs(player.velocity.y) > 2) {
      ctx.globalAlpha = 0.3;
      ctx.fillRect(
        player.position.x - player.velocity.x * 2,
        y - player.velocity.y * 2,
        player.width,
        player.height
      );
    }
    
    ctx.restore();
    
    // Power-up visual effects
    ctx.save();
    
    // Shield bubble
    if (player.hasShield) {
      ctx.strokeStyle = '#00FFFF';
      ctx.fillStyle = '#00FFFF20';
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        player.position.x + player.width / 2,
        y + player.height / 2,
        player.width * 0.8,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
    }
    
    // Speed boost trail
    if (player.speedMultiplier > 1) {
      // Add to trail particles
      if (Math.random() < 0.5) {
        player.trailParticles.push({
          x: player.position.x + player.width / 2,
          y: player.position.y + player.height / 2,
          alpha: 1,
          color: '#00BFFF'
        });
      }
      
      // Update and render trail
      for (const trail of player.trailParticles) {
        trail.alpha -= 0.05;
        ctx.globalAlpha = trail.alpha;
        ctx.fillStyle = trail.color;
        ctx.fillRect(trail.x - 2, trail.y - game.camera.y - 2, 4, 4);
      }
      player.trailParticles = player.trailParticles.filter(t => t.alpha > 0);
    }
    
    // Magnet field
    if (player.magnetRadius > 0) {
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = '#9370DB';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(
        player.position.x + player.width / 2,
        y + player.height / 2,
        player.magnetRadius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Rocket boost effect
    if (player.rocketBoostActive) {
      ctx.globalAlpha = 0.8;
      // Fire particles
      for (let i = 0; i < 3; i++) {
        const offset = Math.random() * player.width;
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(
          player.position.x + offset,
          y + player.height,
          3,
          10 + Math.random() * 10
        );
      }
    }
    
    // Ghost mode transparency
    if (player.isGhost) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#DDA0DD';
      ctx.fillRect(player.position.x, y, player.width, player.height);
    }
    
    ctx.restore();
  }, []);

  // Render particles
  const renderParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    const game = gameRef.current;
    
    for (const particle of game.particles) {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 5;
      
      ctx.fillRect(
        particle.x - particle.size / 2,
        particle.y - game.camera.y - particle.size / 2,
        particle.size,
        particle.size
      );
      ctx.restore();
    }
  }, []);

  // Render UI
  const renderUI = useCallback((ctx: CanvasRenderingContext2D) => {
    const game = gameRef.current;
    
    // Score
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${game.score}`, 10, 30);
    ctx.fillText(`Level: ${game.level}`, 10, 55);
    
    // Health
    ctx.fillText('Health: ', 10, 80);
    ctx.fillStyle = '#FF0000';
    for (let i = 0; i < game.player.maxHealth; i++) {
      if (i < game.player.health) {
        ctx.fillText('♥', 80 + i * 20, 80);
      } else {
        ctx.fillStyle = '#444444';
        ctx.fillText('♥', 80 + i * 20, 80);
        ctx.fillStyle = '#FF0000';
      }
    }
    
    // Coins
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`🪙 ${game.sessionCoins}`, 10, 105);
    
    // Active power-ups
    ctx.textAlign = 'right';
    let powerUpY = 30;
    for (const activePowerUp of game.activePowerUps) {
      const remainingTime = Math.ceil(activePowerUp.duration / 60); // Convert to seconds
      const percentage = activePowerUp.duration / activePowerUp.maxDuration;
      
      // Power-up icon and timer
      let icon = '';
      let color = '#FFFFFF';
      switch (activePowerUp.type) {
        case 'speed-boost': icon = '⚡'; color = '#00BFFF'; break;
        case 'shield-bubble': icon = '🛡️'; color = '#00FFFF'; break;
        case 'magnet-field': icon = '🧲'; color = '#9370DB'; break;
        case 'rocket-boost': icon = '🚀'; color = '#FF4500'; break;
        case 'platform-freezer': icon = '❄️'; color = '#87CEEB'; break;
        case 'ghost-mode': icon = '👻'; color = '#DDA0DD'; break;
        case 'score-multiplier': icon = '⭐'; color = '#FFD700'; break;
      }
      
      ctx.fillStyle = color;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(icon, 380, powerUpY);
      
      // Timer bar
      ctx.fillStyle = '#333333';
      ctx.fillRect(320, powerUpY - 15, 50, 5);
      ctx.fillStyle = color;
      ctx.fillRect(320, powerUpY - 15, 50 * percentage, 5);
      
      // Time text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px monospace';
      ctx.fillText(`${remainingTime}s`, 310, powerUpY - 5);
      
      powerUpY += 30;
    }
    
    // Score multiplier indicator
    if (game.scoreMultiplier > 1) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`x${game.scoreMultiplier}`, 200, 30);
    }
    
    ctx.restore();
  }, []);

  // Main game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!gameStarted || paused || gameOver) return;
    
    const game = gameRef.current;
    const deltaTime = Math.min((timestamp - game.lastUpdate) / 16.67, 2); // Cap at 2x speed
    game.lastUpdate = timestamp;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    // Update game systems
    updatePhysics(deltaTime);
    checkPlatformCollisions();
    updatePlatforms(deltaTime);
    updateEnemies(deltaTime);
    updatePowerUps(deltaTime);
    updateCoins(deltaTime);
    checkEnemyCollisions();
    updateCamera();
    updateParticles(deltaTime);
    
    // Update player invulnerability
    if (game.player.invulnerableTime > 0) {
      game.player.invulnerableTime -= deltaTime;
    }
    if (game.player.hitFlashTime > 0) {
      game.player.hitFlashTime -= deltaTime;
    }
    
    // Update level
    const newLevel = Math.floor(Math.abs(game.camera.y) / 1000) + 1;
    if (newLevel > game.level) {
      game.level = newLevel;
      game.gameSpeed = 1 + (newLevel - 1) * 0.1;
    }
    
    // Clear and render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderBackground(ctx);
    renderPlatforms(ctx);
    renderCoins(ctx);
    renderPowerUps(ctx);
    renderEnemies(ctx);
    renderPlayer(ctx);
    renderParticles(ctx);
    renderUI(ctx);
    
    animationIdRef.current = requestAnimationFrame(gameLoop);
  }, [gameStarted, paused, gameOver, updatePhysics, checkPlatformCollisions, 
      checkEnemyCollisions, updatePlatforms, updateEnemies, updatePowerUps,
      updateCoins, updateCamera, updateParticles, renderBackground, 
      renderPlatforms, renderEnemies, renderPowerUps, renderCoins,
      renderPlayer, renderParticles, renderUI]);

  // Reset game
  const resetGame = useCallback(() => {
    const game = gameRef.current;
    game.player = {
      position: { x: 200, y: 300 },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      width: 20,
      height: 30,
      state: 'idle',
      isGrounded: false,
      wallContact: 'none',
      coyoteTime: 0,
      jumpBufferTime: 0,
      canDoubleJump: false,
      lastPlatform: null,
      health: 3,
      maxHealth: 3,
      invulnerableTime: 0,
      hitFlashTime: 0,
      speedMultiplier: 1,
      hasShield: false,
      magnetRadius: 0,
      rocketBoostActive: false,
      isGhost: false,
      trailParticles: [],
      shieldBubbleAlpha: 0,
      magnetFieldAlpha: 0
    };
    game.camera = { x: 0, y: 0 };
    game.score = 0;
    game.level = 1;
    game.gameSpeed = 1;
    game.enemies = [];
    game.projectiles = [];
    game.powerUps = [];
    game.activePowerUps = [];
    game.coins = [];
    game.particles = [];
    game.sessionCoins = 0;
    game.enemySpawnTimer = 0;
    game.powerUpSpawnTimer = 0;
    game.scoreMultiplier = 1;
    game.platformsFrozen = false;
    game.parallaxOffsets = [0, 0, 0, 0, 0];
    
    initializePlatforms();
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    setPaused(false);
  }, [initializePlatforms]);

  // Save/Load system
  const saveGameData = useCallback(() => {
    const game = gameRef.current;
    const saveData = {
      totalCoins: game.totalCoins,
      upgrades: game.upgrades,
      highScore: highScore
    };
    localStorage.setItem('neonJump_saveData', JSON.stringify(saveData));
  }, [highScore]);

  const loadGameData = useCallback(() => {
    const game = gameRef.current;
    const savedData = localStorage.getItem('neonJump_saveData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        game.totalCoins = data.totalCoins || 0;
        game.upgrades = data.upgrades || {
          jumpHeight: 0,
          airControl: 0,
          coinMagnet: 0,
          startingHeight: 0,
          powerUpDuration: 0,
          platformSight: 0,
          enemyRadar: 0
        };
        setHighScore(data.highScore || 0);
        
        // Apply starting height upgrade
        if (game.upgrades.startingHeight > 0) {
          const startingHeight = game.upgrades.startingHeight * UPGRADE_STARTING_HEIGHT;
          game.player.position.y -= startingHeight;
          game.camera.y = -startingHeight + CAMERA_LOOK_AHEAD;
        }
      } catch (e) {
        console.error('Failed to load save data:', e);
      }
    }
  }, []);

  // Purchase upgrade
  const purchaseUpgrade = useCallback((type: UpgradeType) => {
    const game = gameRef.current;
    const upgradeKey = type.replace(/-/g, '') as keyof UpgradeState;
    const currentLevel = game.upgrades[upgradeKey];
    
    // Check max level
    const maxLevels: Record<string, number> = {
      jumpHeight: 5,
      airControl: 5,
      coinMagnet: 3,
      startingHeight: 5,
      powerUpDuration: 3,
      platformSight: 1,
      enemyRadar: 1
    };
    
    if (currentLevel >= maxLevels[upgradeKey]) return;
    
    // Calculate cost
    const baseCost = UPGRADE_BASE_COSTS[type];
    const cost = Math.floor(baseCost * Math.pow(1.5, currentLevel));
    
    // Check if can afford
    if (game.totalCoins < cost) return;
    
    // Purchase upgrade
    game.totalCoins -= cost;
    game.upgrades[upgradeKey]++;
    
    // Apply immediate effects
    if (upgradeKey === 'coinMagnet') {
      game.player.magnetRadius = game.upgrades.coinMagnet * UPGRADE_COIN_MAGNET_RADIUS;
    }
    
    // Save data
    saveGameData();
    
    // Force re-render
    setShowShop(false);
    setShowShop(true);
  }, [saveGameData]);

  // Render upgrades for shop
  const renderUpgrades = useCallback(() => {
    const game = gameRef.current;
    
    const upgrades = [
      {
        type: 'jump-height' as UpgradeType,
        name: 'Jump Height',
        description: '+10% jump force per level',
        icon: '🦘',
        key: 'jumpHeight' as keyof UpgradeState,
        maxLevel: 5
      },
      {
        type: 'air-control' as UpgradeType,
        name: 'Air Control',
        description: '+15% mid-air maneuverability',
        icon: '🌬️',
        key: 'airControl' as keyof UpgradeState,
        maxLevel: 5
      },
      {
        type: 'coin-magnet' as UpgradeType,
        name: 'Coin Magnet',
        description: 'Increases coin collection radius',
        icon: '🧲',
        key: 'coinMagnet' as keyof UpgradeState,
        maxLevel: 3
      },
      {
        type: 'starting-height' as UpgradeType,
        name: 'Starting Height',
        description: 'Begin 100m higher per level',
        icon: '🏔️',
        key: 'startingHeight' as keyof UpgradeState,
        maxLevel: 5
      },
      {
        type: 'power-up-duration' as UpgradeType,
        name: 'Power-Up Duration',
        description: '+1.5s to all power-ups',
        icon: '⏰',
        key: 'powerUpDuration' as keyof UpgradeState,
        maxLevel: 3
      },
      {
        type: 'platform-sight' as UpgradeType,
        name: 'Platform Sight',
        description: 'See platform types from further',
        icon: '👁️',
        key: 'platformSight' as keyof UpgradeState,
        maxLevel: 1
      },
      {
        type: 'enemy-radar' as UpgradeType,
        name: 'Enemy Radar',
        description: 'Red glow for off-screen enemies',
        icon: '📡',
        key: 'enemyRadar' as keyof UpgradeState,
        maxLevel: 1
      }
    ];
    
    return upgrades.map(upgrade => {
      const currentLevel = game.upgrades[upgrade.key];
      const isMaxed = currentLevel >= upgrade.maxLevel;
      const cost = isMaxed ? 0 : Math.floor(UPGRADE_BASE_COSTS[upgrade.type] * Math.pow(1.5, currentLevel));
      const canAfford = game.totalCoins >= cost;
      
      return (
        <div key={upgrade.type} className="bg-gray-700 rounded p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{upgrade.icon}</span>
            <div>
              <h3 className="font-bold text-white">{upgrade.name}</h3>
              <p className="text-sm text-gray-400">{upgrade.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-2 ${
                  i < currentLevel ? 'bg-cyan-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          {!isMaxed && (
            <button
              onClick={() => purchaseUpgrade(upgrade.type)}
              disabled={!canAfford}
              className={`w-full py-2 rounded font-bold ${
                canAfford
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {cost} 🪙
            </button>
          )}
          {isMaxed && (
            <div className="text-center text-cyan-400 font-bold">MAX</div>
          )}
        </div>
      );
    });
  }, [purchaseUpgrade]);

  // Setup and cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = 400;
    canvas.height = 400;
    
    // Initialize game
    initializePlatforms();
    loadGameData();
    
    // Event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart as any);
    canvas.addEventListener('touchmove', handleTouchMove as any);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad);
    });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart as any);
      canvas.removeEventListener('touchmove', handleTouchMove as any);
      canvas.removeEventListener('touchend', handleTouchEnd);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [initializePlatforms, handleKeyDown, handleKeyUp, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Start game loop when game starts
  useEffect(() => {
    if (gameStarted && !paused && !gameOver) {
      gameRef.current.lastUpdate = performance.now();
      animationIdRef.current = requestAnimationFrame(gameLoop);
    } else if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [gameStarted, paused, gameOver, gameLoop]);

  // Update high score and save game data
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      updateHighScore('neonJump', score);
    }
    
    // Save game data when game ends
    if (gameOver) {
      saveGameData();
    }
  }, [score, highScore, updateHighScore, gameOver, saveGameData]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border-2 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.5)]"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75">
            <h2 className="text-4xl font-bold text-cyan-400 mb-4 animate-pulse">NEON JUMP</h2>
            <p className="text-white mb-8">Press Arrow Keys to Start</p>
            <div className="text-gray-400 text-sm">
              <p>← → Move</p>
              <p>↑ or SPACE Jump</p>
            </div>
          </div>
        )}
        
        {gameOver && (
          <GameOverBanner score={score} highScore={highScore} onRestart={resetGame} />
        )}
        
        {paused && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center">
              <Pause className="w-16 h-16 text-white mb-4 mx-auto" />
              <p className="text-2xl text-white">PAUSED</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex gap-4">
        <button
          onClick={() => setPaused(!paused)}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 flex items-center gap-2"
          disabled={!gameStarted || gameOver}
        >
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {paused ? 'Resume' : 'Pause'}
        </button>
        
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        
        <button
          onClick={() => setShowShop(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Shop ({gameRef.current.totalCoins} 🪙)
        </button>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-cyan-400">Score: {score}</p>
        <p className="text-gray-400 text-sm">High Score: {highScore}</p>
      </div>
      
      {/* Shop Modal */}
      {showShop && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Upgrade Shop</h2>
            <p className="text-yellow-400 mb-6">Total Coins: {gameRef.current.totalCoins} 🪙</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upgrades will be rendered here */}
              {renderUpgrades()}
            </div>
            
            <button
              onClick={() => setShowShop(false)}
              className="mt-6 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};