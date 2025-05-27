# Neon Jump - Complete Game Blueprint

## Game Overview
A fast-paced vertical platformer where players guide a neon character up an endless cyberpunk tower, bouncing on platforms while avoiding enemies and collecting power-ups. The game features progressive difficulty, multiple platform types, enemy AI, and a robust upgrade system.

## Core Mechanics

### Player Movement
- **Automatic Upward Movement**: Player constantly moves upward after landing on platforms
- **Horizontal Control**: Left/right movement via keyboard (A/D, Arrow Keys), touch swipe, or gamepad
- **Bounce Height**: Determined by platform type and player upgrades
- **Wall Bounce**: Player can bounce off walls with reduced horizontal velocity
- **Gravity**: Constant downward force when not on a platform
- **Max Fall Speed**: Terminal velocity to prevent unfair deaths

### Physics System
```javascript
// Core physics constants
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const HORIZONTAL_SPEED = 5;
const WALL_BOUNCE_DAMPING = 0.7;
const MAX_FALL_SPEED = 15;
const AIR_CONTROL = 0.8;
```

### Camera System
- **Smooth Follow**: Camera follows player with slight lag for smooth movement
- **Look Ahead**: Camera positioned slightly above player to show upcoming platforms
- **Death Zone**: Player dies if falling below camera view
- **Screen Shake**: On impacts and special effects

## Visual Style

### Art Direction
- **Cyberpunk Aesthetic**: Neon colors on dark backgrounds
- **Glow Effects**: All interactive elements have neon glow
- **Particle Systems**: Extensive use of particles for feedback
- **Parallax Backgrounds**: 5-layer scrolling city backdrop
- **Color Palette**: 
  - Primary: Cyan (#00FFFF), Magenta (#FF00FF)
  - Secondary: Electric Blue (#0080FF), Hot Pink (#FF0080)
  - Accent: Lime (#00FF00), Yellow (#FFFF00)
  - Background: Deep Purple (#1A0033) to Black gradient

### Visual Effects
- **Bloom/Glow**: Post-processing for neon elements
- **Trail Effects**: Player and enemies leave motion trails
- **Chromatic Aberration**: On high-speed movements
- **Screen Distortion**: When near dangerous elements

## Platform Types

### 1. Standard Platform
- **Behavior**: Solid, reliable platform
- **Visual**: Cyan neon outline with subtle glow
- **Physics**: Normal bounce force

### 2. Crumbling Platform
- **Behavior**: Breaks 0.5s after player contact
- **Visual**: Flickering red outline, cracks appear on contact
- **Physics**: Normal bounce, then falls with gravity
- **Particles**: Debris particles when breaking

### 3. Moving Platform
- **Behavior**: Moves horizontally or vertically on set path
- **Visual**: Purple neon with directional arrows
- **Physics**: Transfers momentum to player
- **Patterns**: Linear, sine wave, or circular paths

### 4. Bouncy Platform
- **Behavior**: Provides 1.5x jump height
- **Visual**: Green neon with spring coil effect
- **Physics**: Higher bounce force, slight squash/stretch
- **Sound**: Distinctive "boing" sound

### 5. Phase Platform
- **Behavior**: Phases in/out of existence every 2 seconds
- **Visual**: Ghostly white, fades in/out with static effect
- **Physics**: Only solid during visible phase
- **Warning**: Slight glow before phasing

### 6. Ice Platform
- **Behavior**: Slippery surface with reduced friction
- **Visual**: Light blue with crystalline texture
- **Physics**: 0.2x friction, momentum preservation
- **Particles**: Ice crystals when landing

### 7. Conveyor Platform
- **Behavior**: Moves player left or right while standing
- **Visual**: Orange with moving arrow patterns
- **Physics**: Applies constant horizontal force
- **Speed**: Variable based on difficulty

## Enemy Types

### 1. Glitch Slime
- **Movement**: Bounces in place or small hops
- **Threat**: Contact damage
- **Visual**: Pixelated green blob with glitch effects
- **AI**: Simple vertical bounce pattern
- **Health**: 1 hit

### 2. Neon Wasp
- **Movement**: Flies in sine wave pattern
- **Threat**: Contact damage, faster than player
- **Visual**: Bright yellow with trail effect
- **AI**: Pursues player horizontally
- **Health**: 1 hit

### 3. Cyber Spider
- **Movement**: Crawls on platforms, drops on web
- **Threat**: Web trap slows player
- **Visual**: Red mechanical spider with glowing eyes
- **AI**: Drops when player passes underneath
- **Health**: 2 hits

### 4. Plasma Ghost
- **Movement**: Phases through platforms
- **Threat**: Homing behavior
- **Visual**: Translucent purple with particle aura
- **AI**: Slowly follows player position
- **Health**: Cannot be killed, only avoided

### 5. Electric Turret
- **Movement**: Stationary on platforms
- **Threat**: Shoots homing missiles
- **Visual**: Blue mechanical turret with charge-up glow
- **AI**: Tracks player, fires every 3 seconds
- **Health**: 3 hits

### 6. Pixel Knight
- **Movement**: Patrols platform edges
- **Threat**: Charges at player when seen
- **Visual**: Armored enemy with sword
- **AI**: Patrol → Alert → Charge sequence
- **Health**: 2 hits

### 7. Void Orb
- **Movement**: Floats in place, teleports
- **Threat**: Creates gravity well
- **Visual**: Black sphere with purple corona
- **AI**: Teleports near player every 5 seconds
- **Health**: Invincible, temporary hazard

## Power-Up System

### Temporary Power-Ups (15-30 seconds)

1. **Speed Boost**
   - Effect: 1.5x horizontal movement speed
   - Visual: Blue speed lines trail
   - Icon: Lightning bolt

2. **Shield Bubble**
   - Effect: One-hit protection from enemies
   - Visual: Cyan bubble around player
   - Icon: Shield

3. **Magnet Field**
   - Effect: Attracts coins within radius
   - Visual: Purple magnetic field effect
   - Icon: Magnet

4. **Rocket Boost**
   - Effect: Powerful upward thrust for 3 seconds
   - Visual: Fire trail beneath player
   - Icon: Rocket

5. **Platform Freezer**
   - Effect: All moving platforms stop temporarily
   - Visual: Ice crystals on platforms
   - Icon: Snowflake

6. **Ghost Mode**
   - Effect: Phase through enemies (not platforms)
   - Visual: Player becomes translucent
   - Icon: Ghost

7. **Score Multiplier**
   - Effect: 2x points for duration
   - Visual: Golden particle aura
   - Icon: Star

## Upgrade System

### Permanent Upgrades (Buy with collected coins)

1. **Jump Height** (5 levels)
   - Effect: +10% jump force per level
   - Cost: 100, 200, 400, 800, 1600 coins

2. **Air Control** (5 levels)
   - Effect: +15% mid-air maneuverability per level
   - Cost: 50, 100, 200, 400, 800 coins

3. **Coin Magnet** (3 levels)
   - Effect: Increases collection radius
   - Cost: 200, 500, 1000 coins

4. **Starting Height** (5 levels)
   - Effect: Begin game 100m higher per level
   - Cost: 150, 300, 600, 1200, 2400 coins

5. **Power-Up Duration** (3 levels)
   - Effect: +5 seconds to all power-ups per level
   - Cost: 300, 600, 1200 coins

6. **Platform Sight** (1 level)
   - Effect: See platform types from further away
   - Cost: 500 coins

7. **Enemy Radar** (1 level)
   - Effect: Red glow indicates off-screen enemies
   - Cost: 750 coins

## Progression System

### Difficulty Scaling
- **Height-Based**: Every 100m increases difficulty
- **Platform Spacing**: Gradually increases
- **Enemy Density**: More enemies at higher levels
- **Platform Mix**: Dangerous platforms more common
- **Speed Increase**: Overall game speed +5% per 500m

### Level Themes (Visual variety every 500m)
1. **Neon City** (0-500m): Basic cyberpunk cityscape
2. **Data Stream** (500-1000m): Digital/Matrix aesthetic
3. **Cloud Layer** (1000-1500m): Above the clouds, sky platforms
4. **Space Station** (1500-2000m): Sci-fi space theme
5. **Void Realm** (2000m+): Abstract, glitchy environment

### Scoring System
- **Height Points**: 1 point per meter climbed
- **Enemy Defeats**: 50 points each
- **Coin Collection**: 10 points each
- **Perfect Landings**: 25 bonus points for centered landings
- **Combo System**: Consecutive perfect landings multiply score

## Technical Implementation

### Core Architecture
```javascript
class NeonJumpGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameState = 'menu'; // menu, playing, paused, gameOver, shop
    
    // Core systems
    this.physics = new PhysicsSystem();
    this.renderer = new Renderer(this.ctx);
    this.platformManager = new PlatformManager();
    this.enemyManager = new EnemyManager();
    this.particleSystem = new ParticleSystem();
    this.soundManager = new SoundManager();
    this.upgradeManager = new UpgradeManager();
    
    // Game entities
    this.player = new Player();
    this.camera = new Camera();
    
    // Game metrics
    this.height = 0;
    this.score = 0;
    this.coins = 0;
  }
}
```

### Key Algorithms

#### Platform Generation
```javascript
generatePlatforms(currentHeight) {
  const minGap = 100 + (currentHeight / 1000) * 20; // Increases with height
  const maxGap = 150 + (currentHeight / 1000) * 30;
  const platformTypes = this.getPlatformDistribution(currentHeight);
  
  // Generate platforms within view range + buffer
  while (this.highestPlatform < currentHeight + BUFFER) {
    const gap = random(minGap, maxGap);
    const type = weightedRandom(platformTypes);
    const platform = new Platform(type, this.highestPlatform + gap);
    this.platforms.push(platform);
    this.highestPlatform += gap;
  }
}
```

#### Enemy AI State Machine
```javascript
class EnemyAI {
  constructor(type) {
    this.state = 'idle';
    this.stateTimer = 0;
    this.target = null;
  }
  
  update(player, deltaTime) {
    switch(this.state) {
      case 'idle':
        if (this.detectPlayer(player)) {
          this.state = 'alert';
          this.stateTimer = ALERT_DURATION;
        }
        break;
      case 'alert':
        this.stateTimer -= deltaTime;
        if (this.stateTimer <= 0) {
          this.state = 'attack';
        }
        break;
      case 'attack':
        this.executeAttack(player);
        break;
    }
  }
}
```

### Performance Optimizations
- **Object Pooling**: Reuse platform and enemy objects
- **Culling**: Only update/render visible entities
- **Spatial Hashing**: Efficient collision detection
- **Delta Time**: Frame-independent movement
- **Progressive Loading**: Load theme assets as needed

## Sound Design

### Programmatic Audio Generation
```javascript
// Jump sound - rising pitch sweep
playJump() {
  const ctx = this.audioContext;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}
```

### Background Music
- **Dynamic Layers**: Add instruments as height increases
- **Tempo Scaling**: BPM increases with difficulty
- **Seamless Loops**: Per-theme background tracks

## Particle Effects

### Effect Types
1. **Jump Burst**: Radial particle burst on takeoff
2. **Landing Impact**: Directional particles based on velocity
3. **Trail Particles**: Continuous emission while moving
4. **Collection Burst**: Coin/power-up collection feedback
5. **Destruction**: Platform breaking, enemy defeat
6. **Power-Up Aura**: Visual indicator of active effects
7. **Damage Flash**: Screen-edge red flash on hit

### Particle System
```javascript
class Particle {
  constructor(x, y, config) {
    this.x = x;
    this.y = y;
    this.vx = config.vx + (Math.random() - 0.5) * config.spread;
    this.vy = config.vy + (Math.random() - 0.5) * config.spread;
    this.life = config.life;
    this.color = config.color;
    this.size = config.size;
    this.gravity = config.gravity || 0;
  }
  
  update(deltaTime) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vy += this.gravity * deltaTime;
    this.life -= deltaTime;
    this.size *= 0.98; // Gradual shrink
  }
}
```

## Mobile Controls

### Touch Implementation
- **Left Side**: Move left
- **Right Side**: Move right
- **Swipe Up**: Activate power-up (if available)
- **Tap Enemy**: Use ranged attack (if upgrade purchased)

### Responsive Design
- **Auto-Scaling**: UI scales with screen size
- **Button Placement**: Ergonomic positioning for thumbs
- **Visual Feedback**: Touch areas highlight on press

## Balancing Guidelines

### Platform Distribution by Height
- 0-200m: 70% standard, 20% bouncy, 10% moving
- 200-500m: 50% standard, 15% each special type
- 500-1000m: 40% standard, equal distribution others
- 1000m+: 30% standard, weighted toward dangerous types

### Enemy Spawn Rates
- Base rate: 1 enemy per 50m
- Scales to: 1 enemy per 25m at 2000m
- Boss enemies: Every 500m milestone

### Economy Balance
- Average coins per 100m: 15-20
- Power-up spawn rate: 1 per 100-150m
- Upgrade costs scaled to ~30 min full unlock

## Integration with RetroToolbox

### Menu Integration
- Add to game selection menu
- Use consistent UI styling
- Share settings system (sound, controls)

### High Score System
- Local storage persistence
- Track: highest climb, most coins, longest streak

### Achievement Ideas
- "Sky Walker": Reach 1000m
- "Collector": Gather 1000 coins in one run
- "Untouchable": Climb 500m without taking damage
- "Speed Demon": Reach 500m in under 2 minutes
- "Perfectionist": 50 perfect landings in a row