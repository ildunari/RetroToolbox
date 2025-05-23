# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based retro arcade game collection featuring multiple classic games with modern enhancements. The entire application is contained in a single TypeScript React component file (`retro-game-toolbox-improved.tsx`).

## Architecture

**Current State: Monolithic Implementation**

The application currently uses a monolithic React component structure in `src/RetroGameToolbox.jsx`:
- **Game Manager**: Main component (`RetroGameToolbox`) handles game selection, settings, and statistics
- **Audio System**: Custom `SoundManager` class using Web Audio API for sound effects
- **Input System**: Unified `InputManager` class supporting keyboard, mouse, touch, and gamepad inputs
- **Particle System**: Visual effects engine for game feedback
- **Game Components**: All working games are implemented as internal components within the main file

**Modular Structure (In Progress)**

The `src/components/games/` folder contains placeholder component files that are intended for future modularization:
- Individual game files exist but contain minimal placeholder implementations
- The working games (Snake, Pong, Breakout) need to be extracted from the monolithic file
- Core systems (`SoundManager`, `InputManager`, `Particle`) should be moved to `src/core/`

## Key Technical Details

### State Management
- Uses React hooks (useState, useEffect, useRef, useCallback, useMemo)
- Game state persisted to localStorage (settings and high scores)
- Game loop implemented with requestAnimationFrame

### Canvas Rendering
- Each game uses HTML5 Canvas for rendering
- Responsive canvas sizing with window resize handlers
- Custom particle effects and visual feedback

### Implemented Games

**Working Games (in monolithic file):**
1. **Snake++**: Fully implemented with power-ups, lives system, and particle effects
2. **Neon Pong**: Fully implemented AI opponent with difficulty settings and visual effects  
3. **Brick Breaker**: Fully implemented breakout clone with multi-hit bricks and power-ups

**Placeholder Games (need implementation):**
4. **Tetris Remix**: Placeholder only - shows "coming soon" message
5. **Space Defense**: Placeholder only - shows "coming soon" message

## Development Notes

### Current Development Status

**Immediate Priority: Complete Missing Games**
1. Implement Tetris game logic to replace placeholder
2. Implement Space Invaders game logic to replace placeholder
3. Both games should follow the pattern of Snake/Pong/Breakout implementations

**Future Refactoring: Modular Architecture**
1. Extract working games from monolithic file to individual components
2. Move core systems (`SoundManager`, `InputManager`, `Particle`) to `src/core/`
3. Update imports and ensure games work with extracted dependencies
4. Create shared utilities for common game functionality

### Adding New Games (Current Process)
Since games are currently in the monolithic file:
1. Add new game component function inside `RetroGameToolbox.jsx`
2. Add the game to the `games` array with proper metadata
3. Add the component to the `gameComponents` object
4. Implement canvas-based rendering and game logic following existing patterns

### Sound System
- Sound effects are generated programmatically using Web Audio API
- Methods: `playTone()`, `playCollect()`, `playHit()`, `playGameOver()`, `playPowerUp()`
- Volume and enabled state controlled through settings

### Performance Considerations
- Particle systems are pruned when life <= 0
- Canvas operations are optimized with minimal redraws
- Game loops use deltaTime for consistent gameplay across frame rates