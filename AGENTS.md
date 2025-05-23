# AGENTS.md - OpenAI Codex Configuration

This file provides guidance to OpenAI Codex agents when working on the RetroToolbox project.

## Project Overview

RetroToolbox is a React-based retro arcade game collection featuring multiple classic games with modern enhancements. The project uses TypeScript, Vite, and Tailwind CSS.

## Development Environment Setup

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Modern web browser for testing

### Installation & Setup

**For Codex Environment:**
```bash
# Codex setup (automated)
./codex-setup.sh

# Or manual setup:
npm ci
npm run build
```

**For Local Development:**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Key Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)
- `npm run test` - Run tests (if configured)

## Project Structure

```
src/
├── RetroGameToolbox.jsx     # Main monolithic component (current implementation)
├── components/
│   ├── games/               # Individual game components (future modular structure)
│   │   ├── SnakeGame.jsx    # Snake game placeholder
│   │   ├── PongGame.jsx     # Pong game placeholder
│   │   ├── BreakoutGame.jsx # Breakout game placeholder
│   │   ├── TetrisGame.jsx   # Tetris game placeholder
│   │   └── SpaceInvadersGame.jsx # Space Invaders placeholder
│   └── ui/                  # UI components
│       ├── GameMenu.jsx     # Game selection menu
│       └── SettingsModal.jsx # Settings modal
├── core/                    # Core game systems
│   ├── SoundManager.ts      # Audio system using Web Audio API
│   ├── InputManager.ts      # Unified input handling
│   ├── ParticleSystem.ts    # Visual effects system
│   └── GameTypes.ts         # TypeScript type definitions
└── hooks/                   # React hooks
    ├── useSettings.js       # Settings management
    └── useStats.js          # Statistics tracking
```

## Current Implementation State

**IMPORTANT**: The project currently uses a monolithic architecture where all working games are implemented inside `src/RetroGameToolbox.jsx`. The individual component files in `src/components/games/` are placeholders for future modularization.

### Working Games (in RetroGameToolbox.jsx)
1. **Snake++** - Fully implemented with power-ups and particle effects
2. **Neon Pong** - Fully implemented with AI opponent
3. **Brick Breaker** - Fully implemented breakout clone

### Placeholder Games (need implementation)
4. **Tetris Remix** - Shows "coming soon" message
5. **Space Defense** - Shows "coming soon" message

## Development Guidelines

### Code Style
- Use React hooks (useState, useEffect, useRef, useCallback, useMemo)
- Follow existing TypeScript patterns
- Use Tailwind CSS for styling
- Implement responsive design for mobile/desktop
- Use HTML5 Canvas for game rendering

### Game Implementation Pattern
Each game should follow this structure:
1. **State Management**: Use React hooks for game state
2. **Game Loop**: Implement with requestAnimationFrame
3. **Canvas Rendering**: Use 2D context for drawing
4. **Input Handling**: Integrate with existing InputManager
5. **Audio**: Use SoundManager for effects
6. **Particles**: Use ParticleSystem for visual feedback

### Testing Approach
- Test games in both development and production builds
- Verify responsive behavior on different screen sizes
- Test input methods (keyboard, mouse, touch, gamepad)
- Ensure performance is smooth (60fps target)

## Common Tasks

### Adding a New Game
1. If working with current monolithic structure:
   - Add game component function inside `RetroGameToolbox.jsx`
   - Add to `games` array with metadata
   - Add to `gameComponents` object
   - Follow existing Canvas/React pattern

2. For future modular structure:
   - Create game component in `src/components/games/`
   - Import and integrate into main component
   - Ensure proper dependency injection for core systems

### Implementing Missing Games
- **Tetris**: Implement classic Tetris with piece rotation, line clearing, scoring
- **Space Invaders**: Implement with shooting mechanics, enemy waves, power-ups

### Performance Optimization
- Use `useMemo` and `useCallback` for expensive operations
- Implement proper cleanup in `useEffect` hooks
- Optimize particle system performance
- Use requestAnimationFrame for smooth animations

### Debugging
- Check browser console for errors
- Use React Developer Tools for component debugging
- Monitor Canvas performance with browser dev tools
- Test sound system in different browsers

## File Modification Guidelines

### High Priority Files
- `src/RetroGameToolbox.jsx` - Main implementation (handle with care)
- `src/core/` - Core systems used by all games
- `package.json` - Dependencies and scripts

### Safe to Modify
- `src/components/games/` - Individual game placeholders
- `src/components/ui/` - UI components
- `src/hooks/` - React hooks
- Documentation files (README.md, this file)

### Build Configuration
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration  
- `tsconfig.json` - TypeScript configuration

## Deployment

The project includes a deployment script (`deploy.sh`) and service script (`toolbox-service.sh`) for production deployment.

### Production Considerations
- Build optimizes for performance
- Assets are bundled and minified
- Static files served efficiently
- Canvas performance optimized for various devices

## Integration Notes for AI Agents

When working on this project:
1. **Always check the current implementation in `RetroGameToolbox.jsx` first**
2. **Understand the monolithic vs modular architecture distinction**
3. **Test changes thoroughly in browser**
4. **Follow existing patterns for consistency**
5. **Use the core systems (SoundManager, InputManager, etc.) properly**
6. **Maintain responsive design principles**
7. **Ensure cross-browser compatibility**

This project is designed to be easily extensible while maintaining high performance and user experience across different devices and input methods.