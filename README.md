# Retro Game Toolbox

A modular collection of retro arcade games with modern enhancements, built with React and deployed on a random port for Tailscale accessibility.

## Features

- 🎮 **Multiple Games**: Snake++, Neon Pong, Brick Breaker, and more
- 🎵 **Sound System**: Web Audio API-powered sound effects  
- 🎯 **Input Support**: Keyboard, mouse, touch, and gamepad controls
- ✨ **Visual Effects**: Particle systems and animations
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🌐 **Network Access**: Random port assignment for Tailscale compatibility

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Deployment
```bash
npm run serve
```

Or use the deployment script:
```bash
./deploy.sh
```

## Architecture

The project follows a modular architecture:

```
/src
  /components
    /games       # Individual game components
    /ui          # UI components (menus, modals)
  /core
    - SoundManager.ts     # Audio system
    - InputManager.ts     # Input handling
    - ParticleSystem.ts   # Visual effects
    - GameTypes.ts        # Type definitions
  /hooks         # React hooks for state management
  - App.tsx      # Main application
  - main.tsx     # Entry point
/server
  - server.js    # Express server with random port
```

## Games

1. **Snake++**: Enhanced snake game with power-ups and lives system
2. **Neon Pong**: AI opponent with visual effects
3. **Brick Breaker**: Breakout clone with multi-hit bricks
4. **Tetris Remix**: Coming soon
5. **Space Defense**: Coming soon

## Network Access

The server automatically:
- Selects a random available port
- Displays local and network URLs
- Shows Tailscale configuration info

Example output:
```
🎮 Retro Game Toolbox Server Started!
🌐 Local: http://localhost:63951
🔗 Network: http://192.168.1.36:63951
📱 Tailscale: Use your Tailscale IP with port 63951
```

## Controls

- **WASD/Arrow Keys**: Movement
- **Space**: Pause/Action
- **Mouse/Touch**: Touch controls supported
- **Gamepad**: Automatic detection and support

## Technologies

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Audio**: Web Audio API
- **Canvas**: HTML5 Canvas for game rendering
- **TypeScript**: Type safety (partial implementation)

## Development

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm start`: Start production server