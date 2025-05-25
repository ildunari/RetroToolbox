# AGENTS.md - OpenAI Codex Configuration

**🤖 CODEX READS THIS FILE AUTOMATICALLY AT SESSION START**

This file provides comprehensive guidance to OpenAI Codex agents when working on the RetroToolbox project. Keep this file updated as the primary source of truth for AI assistance.

## Project Overview

RetroToolbox is a React-based retro arcade game collection featuring multiple classic games with modern enhancements. The project uses a **fully modular architecture** with TypeScript, Vite, and Tailwind CSS. All games have been successfully migrated from a monolithic `RetroGameToolbox.jsx` structure into individual components with optimized core systems in `src/core/`.

## Development Environment Setup

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Modern web browser for testing

### Installation & Setup

**For Codex Environment:**
```bash
./codex-setup.sh
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
├── App.tsx                  # Main modular application component
├── main.tsx                 # Application entry point
├── components/
│   ├── games/               # Fully implemented game components
│   │   ├── SnakeGame.jsx    # Snake++ with power-ups and lives
│   │   ├── PongGame.jsx     # Neon Pong with AI opponent
│   │   ├── BreakoutGame.jsx # Brick Breaker with multi-hit bricks
│   │   ├── TetrisGame.jsx   # Tetris Remix with enhanced mechanics
│   │   ├── SpaceInvadersGame.jsx # Space Defense with waves
│   │   └── PacManGame.jsx   # Pac-Man with touch controls
│   └── ui/                  # UI components
│       ├── GameMenu.jsx     # Game selection interface
│       ├── SettingsModal.jsx # Settings management
│       ├── FadingCanvas.jsx # Visual transition effects
│       └── GameOverBanner.jsx # Game over animations
├── core/                    # Optimized core systems
│   ├── SoundManager.ts      # Web Audio API sound engine
│   ├── InputManager.ts      # Unified input handling system
│   ├── ParticleSystem.ts    # High-performance visual effects
│   └── GameTypes.ts         # TypeScript interfaces
└── hooks/                   # React hooks
    ├── useSettings.js       # Persistent settings management
    └── useStats.js          # Statistics and high score tracking
```

## Current Implementation State

**✅ MODULAR ARCHITECTURE COMPLETE**: The project has been fully migrated from a monolithic structure to a modular architecture where all games have been successfully extracted from `RetroGameToolbox.jsx` into individual components in `src/components/games/`. The core systems have been optimized and moved to `src/core/` and all games are fully functional.

### Fully Implemented Games
1. **Snake++** - Complete with power-ups, lives system, and particle effects
2. **Neon Pong** - Complete with AI opponent and difficulty scaling
3. **Brick Breaker** - Complete breakout clone with multi-hit bricks and power-ups
4. **Tetris Remix** - Complete with enhanced mechanics and animations
5. **Space Defense** - Complete Space Invaders with progressive waves
6. **Pac-Man** - Complete with maze navigation and touch controls

### Architecture Benefits (Post-Migration)
- **Modular Components**: Each game is independently maintainable (vs. single monolithic file)
- **Optimized Core Systems**: Shared systems in `src/core/` eliminate code duplication
- **Enhanced Performance**: Better code organization and component lazy loading
- **Easier Testing**: Individual components can be tested in isolation
- **Cleaner Imports**: No more massive single-file dependencies
- **TypeScript Integration**: Proper type safety with migrated hooks in `src/hooks/`

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
With the modular architecture in place (post-migration):
1. Create new game component in `src/components/games/` (following existing pattern)
2. Follow the established pattern from existing game components (NOT the old monolithic structure)
3. Import and add to `gameComponents` object in `src/App.tsx`
4. Add game metadata to `games` array in `src/App.tsx`
5. Integrate with optimized core systems from `src/core/`:
   - `SoundManager.ts` for audio
   - `ParticleSystem.ts` for visual effects
   - `InputManager.ts` for controls
   - `GameTypes.ts` for TypeScript interfaces

### Enhancing Existing Games
All games are complete but can be enhanced with:
- **Additional levels or difficulty modes**
- **New power-ups or special effects**
- **Enhanced mobile touch controls**
- **Multiplayer functionality**
- **Achievement system**

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

### High Priority Files (Post-Migration)
- `src/App.tsx` - Main application component with game routing (clean modular structure)
- `src/core/` - Optimized core systems used by all games (extracted from monolithic code)
- `src/components/games/` - Individual game implementations (migrated from `RetroGameToolbox.jsx`)
- `src/hooks/` - TypeScript state management hooks (migrated from JavaScript)
- `package.json` - Dependencies and scripts

### Files to Avoid Editing
- ❌ **`RetroGameToolbox.jsx`**: Now only contains menu/navigation logic - games removed
- ❌ **Old monolithic patterns**: Don't add game logic to this file anymore

### Safe to Modify
- `src/components/ui/` - UI components and visual effects
- `src/hooks/` - React hooks for state management
- Individual game components for enhancements
- Documentation files (README.md, this file)
- Build and deployment scripts

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
1. **Check the modular structure in `src/App.tsx` and individual game components**
2. **Understand the fully modular architecture with extracted core systems**
3. **Test changes thoroughly in browser (dev and production builds)**
4. **Follow existing patterns from implemented games for consistency**
5. **Use the optimized core systems (SoundManager, InputManager, ParticleSystem) properly**
6. **Maintain responsive design principles for mobile/desktop**
7. **Ensure cross-browser compatibility and performance**

## Codex-Specific Instructions

### Task Execution Guidelines
- **Commit directly to main branch** - avoid creating PRs that may fail
- **Be specific and focused** - work on one clear task at a time
- **Test thoroughly** - run build and verify functionality
- **Follow existing code patterns** - maintain consistency with current implementation

### Common Issues & Solutions
- **Setup Script**: Always use `./codex-setup.sh` in Codex environment
- **Working Directory**: Codex clones to `/workspace/RetroToolbox` 
- **Dependencies**: Use `npm ci` for faster, reliable installs
- **Build Process**: Always run `npm run build` to verify changes work

### Preferred Task Format Examples (Modular Architecture)
- "Add multiplayer support to the PongGame.jsx component"
- "Enhance the TetrisGame.jsx component with new piece types and special effects"
- "Optimize the ParticleSystem.ts core module for mobile devices"
- "Add achievement system using the useStats.ts hook across all game components"
- "Create new game component in src/components/games/ based on existing patterns"
- "Improve touch controls in the InputManager.ts core system"
- "Add sound effect variations to the SoundManager.ts core system"
- "Migrate any remaining monolithic code to modular components"

This project is designed to be easily extensible while maintaining high performance and user experience across different devices and input methods.