# Retro Game Toolbox

A modular collection of retro arcade games with modern enhancements, built with React and deployed on a random port for Tailscale accessibility. Optimized for OpenAI Codex integration and AI-assisted development.

## Recent Fixes (v1.0.1 - 2025-05-25)

### ✅ All Critical Issues Resolved
- **Fixed Pong**: Resolved full screen display and AI paddle initialization issues
- **Fixed Breakout**: Corrected paddle visibility and brick centering problems  
- **Fixed Pac-Man**: Eliminated React hook violations and improved performance
- **Fixed Stellar Drift**: Fixed canvas sizing and tunnel width calculations
- **Added Canvas Utilities**: New responsive design helpers for consistent game scaling
- **Added Testing Framework**: Comprehensive game testing utilities
- **Verified Snake Game**: Confirmed working correctly with all features

All games are now fully functional with proper rendering, controls, and performance.

## Features

- 🎮 **Complete Games**: Snake++, Neon Pong, Brick Breaker, Tetris Remix, Space Defense, Pac-Man, Stellar Drift
- 🎵 **Sound System**: Web Audio API-powered sound effects  
- 🎯 **Input Support**: Keyboard, mouse, touch, and gamepad controls
- ✨ **Visual Effects**: Particle systems and animations
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🌐 **Network Access**: Random port assignment for Tailscale compatibility
- 🤖 **AI Integration**: OpenAI Codex ready with AGENTS.md configuration
- 🏗️ **Modular Architecture**: Individual game components with optimized core systems

## Quick Start

### Development
```bash
npm install
npm run dev   # Runs on port 3004
```

### Production Deployment
```bash
# Full deployment with service management
./deploy.sh

# Quick local development
./startup.sh
```

### Service Management
```bash
# Start/stop/restart service
./toolbox-service.sh start
./toolbox-service.sh stop
./toolbox-service.sh restart

# Monitor service
./toolbox-service.sh status
./toolbox-service.sh logs
./toolbox-service.sh url
```

## Architecture

The project follows a fully modular architecture with extracted game components:

```
/src
  /components
    /games       # Fully implemented individual game components
      - SnakeGame.jsx       # Snake++ with power-ups and lives
      - PongGame.jsx        # Neon Pong with AI opponent
      - BreakoutGame.jsx    # Brick Breaker with multi-hit bricks
      - TetrisGame.jsx      # Tetris Remix with enhanced mechanics
      - SpaceInvadersGame.jsx # Space Defense with waves
      - PacManGame.jsx      # Pac-Man with mobile touch controls
      - StellarDriftGame.jsx # Stellar Drift space adventure
    /ui          # UI components (menus, modals, effects)
      - GameMenu.jsx        # Game selection interface
      - SettingsModal.jsx   # Settings management
      - FadingCanvas.jsx    # Visual transition effects
      - GameOverBanner.jsx  # Game over animations
  /core          # Optimized core systems
    - SoundManager.ts     # Web Audio API sound engine
    - InputManager.ts     # Unified input handling system
    - ParticleSystem.ts   # High-performance visual effects
    - GameTypes.ts        # TypeScript interfaces
  /hooks         # React hooks for state management
    - useSettings.js      # Persistent settings management
    - useStats.js         # Statistics and high score tracking
  - App.tsx      # Main modular application
  - main.tsx     # Entry point
/server
  - server.js    # Express server with random port assignment
```

## Games

All games are fully implemented as modular components with modern enhancements:

1. **Snake++** (`SnakeGame.jsx`): Enhanced snake game with power-ups, lives system, and particle effects
2. **Neon Pong** (`PongGame.jsx`): AI opponent with difficulty scaling and visual effects
3. **Brick Breaker** (`BreakoutGame.jsx`): Breakout clone with multi-hit bricks and power-ups
4. **Tetris Remix** (`TetrisGame.jsx`): Classic Tetris with enhanced mechanics and animations
5. **Space Defense** (`SpaceInvadersGame.jsx`): Space Invaders with progressive waves and upgrades
6. **Pac-Man** (`PacManGame.jsx`): Classic maze game with touch controls and power pellets
7. **Stellar Drift** (`StellarDriftGame.jsx`): Space exploration with asteroids and power-ups

## Network Access

The server runs on port 3004 by default:
- Fixed port for consistent access
- Displays local and network URLs
- Shows Tailscale configuration info

Example output:
```
🎮 Retro Game Toolbox Server Started!
🌐 Local: http://localhost:3004
🔗 Network: http://192.168.1.36:3004
📱 Tailscale: Use your Tailscale IP with port 3004
```

## Controls

### Desktop
- **WASD/Arrow Keys**: Movement
- **Space**: Pause/Action
- **Mouse**: Click and drag supported
- **Gamepad**: Automatic detection and support

### Mobile
- **Touch**: Tap, swipe, and hold gestures
- **Virtual Controls**: On-screen buttons for specific games
- **Swipe Gestures**: Direction-based movement
- **Pinch**: Zoom controls (where applicable)

## Technologies

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Audio**: Web Audio API
- **Canvas**: HTML5 Canvas for game rendering
- **TypeScript**: Type safety (partial implementation)

## OpenAI Codex Integration

This project is configured for OpenAI Codex (cloud-based AI coding agent):

- **AGENTS.md**: Provides Codex with project context and guidelines
- **Auto-service**: Startup script configures production environment
- **GitHub Ready**: Repository configured for Codex collaboration

See [CODEX_INTEGRATION.md](CODEX_INTEGRATION.md) for detailed setup instructions.

### Quick Codex Setup
1. Access Codex in ChatGPT (Pro/Team/Enterprise)
2. Connect repository: `ildunari/RetroToolbox`
3. Setup script: `./codex-setup.sh`
4. Start giving tasks: "Implement the missing Tetris game"

## Development

### Development Commands
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build optimized production bundle
- `npm run preview`: Preview production build locally
- `npm start`: Start production server

### Deployment & Service Management

**Which Script to Use When:**
- **`./deploy.sh`**: Full production deployment with service management (recommended)
- **`./startup.sh`**: Quick local development and testing
- **`./codex-setup.sh`**: Automated setup for OpenAI Codex environment only

**Service Management:**
- `./toolbox-service.sh start|stop|restart`: Service management
- `./toolbox-service.sh status|logs|url`: Service monitoring

### Migration Guide for Existing Users
If upgrading from the old monolithic version (prior to modular architecture):
1. Pull latest changes: `git pull origin main`
2. Install dependencies: `npm install` 
3. Rebuild: `npm run build`
4. Restart service: `./toolbox-service.sh restart`

**Architecture Changes:**
- ❌ **Old**: All games in single `RetroGameToolbox.jsx` file (monolithic)
- ✅ **New**: Individual game components in `src/components/games/` (modular)
- ❌ **Old**: Duplicate core systems in each game
- ✅ **New**: Optimized shared systems in `src/core/`
- ❌ **Old**: Mixed state management
- ✅ **New**: Clean TypeScript hooks in `src/hooks/`

**Note**: Game functionality remains identical but architecture is now modular for better maintainability and performance.

### Troubleshooting Common Issues

**Games not loading:**
- Check browser console for import errors
- Verify all dependencies installed: `npm install`
- Rebuild the project: `npm run build`

**Sound not working:**
- Check browser allows audio (user interaction required)
- Verify SoundManager import in game components
- Check settings modal for audio enable/disable

**Service startup issues:**
- Verify port availability: `./toolbox-service.sh status`
- Check logs: `./toolbox-service.sh logs`
- Restart service: `./toolbox-service.sh restart`

**Touch controls not responsive:**
- Ensure proper viewport meta tag in `index.html`
- Check mobile-specific CSS in individual game components
- Verify touch event handlers in `src/core/InputManager.ts`
- Test on actual mobile device (not just browser dev tools)

**Mobile scaling issues:**
- Verify responsive canvas sizing in game components
- Check Tailwind CSS responsive classes
- Test landscape/portrait orientation changes
- Use ResponsiveCanvas component for consistent scaling
- Check viewport meta tag configuration

**Port conflicts:**
- Default port is 3004, change in vite.config.ts if needed
- Check if port is already in use: `lsof -i :3004`
- Kill process using port: `kill -9 $(lsof -t -i:3004)`

**Deployment issues:**
- Ensure all dependencies installed: `npm ci`
- Clear dist folder: `rm -rf dist && npm run build`
- Check Node.js version compatibility (16+ required)
- Verify file permissions for shell scripts: `chmod +x *.sh`