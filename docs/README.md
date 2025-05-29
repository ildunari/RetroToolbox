# RetroToolbox Documentation

## Project Overview

RetroToolbox is a React-based retro arcade game collection featuring multiple classic games with modern enhancements. The application uses a fully modular architecture with individual game components and optimized core systems.

### Architecture

**✅ Fully Modular Implementation Complete**

The application uses a complete modular React architecture with extracted components:
- **Main App**: `src/App.tsx` handles game routing, settings, and statistics
- **Game Components**: Individual games in `src/components/games/` with full implementations
- **Core Systems**: Optimized shared systems in `src/core/` for audio, input, and particles
- **UI Components**: Reusable UI elements in `src/components/ui/` for menus and effects

### Extracted Core Systems

All core systems have been optimized and extracted to `src/core/`:
- **SoundManager.ts**: Web Audio API sound engine with programmatic effects
- **InputManager.ts**: Unified input handling for keyboard, mouse, touch, and gamepad
- **ParticleSystem.ts**: High-performance visual effects system
- **GameTypes.ts**: TypeScript interfaces and type definitions

## Game Collection

### Implemented Games

**✅ All Games Fully Implemented in Modular Components:**

1. **Snake++** (`SnakeGame.tsx`): Complete with power-ups, lives system, and particle effects
2. **Neon Pong** (`PongGame.tsx`): Complete AI opponent with difficulty scaling and visual effects  
3. **Brick Breaker** (`BreakoutGame.tsx`): Complete breakout clone with multi-hit bricks and power-ups
4. **Tetris Remix** (`TetrisGame.tsx`): Complete with enhanced mechanics and animations
5. **Space Defense** (`SpaceInvadersGame.tsx`): Complete with progressive enemy waves and upgrades
6. **Pac-Man** (`PacManGame.tsx`): Complete with maze navigation and mobile touch controls
7. **Neon Jump** (`NeonJumpGame.tsx`): Vertical platformer with cyberpunk aesthetics - [Full Documentation](./NeonJump.md)

## Development

### Key Technical Details

#### State Management
- Uses React hooks (useState, useEffect, useRef, useCallback, useMemo)
- Game state persisted to localStorage (settings and high scores)
- Game loop implemented with requestAnimationFrame

#### Canvas Rendering
- Each game uses HTML5 Canvas for rendering
- Responsive canvas sizing with window resize handlers
- Custom particle effects and visual feedback

#### Sound System
- Sound effects are generated programmatically using Web Audio API
- Methods: `playTone()`, `playCollect()`, `playHit()`, `playGameOver()`, `playPowerUp()`
- Volume and enabled state controlled through settings

#### Performance Considerations
- Particle systems are pruned when life <= 0
- Canvas operations are optimized with minimal redraws
- Game loops use deltaTime for consistent gameplay across frame rates

### Adding New Games

With the modular architecture in place:
1. Create new game component in `src/components/games/`
2. Follow the established pattern from existing game components
3. Import and add to `gameComponents` object in `src/App.tsx`
4. Add game metadata to `games` array in `src/App.tsx`
5. Integrate with core systems (SoundManager, ParticleSystem, InputManager)
6. Test thoroughly on desktop and mobile devices

### Enhancement Opportunities

1. Add multiplayer functionality to existing games
2. Implement achievement and progression systems
3. Add new game variants or difficulty modes
4. Enhance mobile touch controls and responsiveness
5. Add background music and enhanced sound effects

## Game-Specific Documentation

- **Neon Jump**: [Complete Guide](./NeonJump.md) - Comprehensive documentation covering gameplay, technical implementation, and development APIs

## Settings and Features

### Global Settings
- **Sound Effects**: Toggle game audio
- **Music**: Background music control
- **Difficulty**: Global difficulty scaling
- **Controls**: Input method preferences

### Statistics Tracking
- High scores per game
- Total play time
- Games completed
- Performance metrics

### Responsive Design
- Works on desktop, tablet, and mobile
- Touch controls for mobile gameplay
- Adaptive UI scaling
- Cross-browser compatibility

---

*RetroToolbox - A collection of modern retro games*
*Built with React, TypeScript, and HTML5 Canvas*