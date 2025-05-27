# PacMan Implementation Tasks

## Parallel Execution Strategy
These tasks are designed to be executed in parallel by multiple agents or developers. Each task is self-contained with clear inputs/outputs.

---

## PHASE 1: CRITICAL FIXES (Execute in Parallel)

### Task 1.1: Type System Fixes
**File**: `src/components/games/PacManGame.tsx`
**Dependencies**: None
**Estimated Time**: 30 minutes

```typescript
// Add to Ghost interface (line ~32)
interface Ghost {
  // ... existing properties
  mode: 'chase' | 'scatter' | 'frightened' | 'eaten' | 'in_house' | 'exiting';
  exitTimer: number;
}

// Update GameState interface (line ~57)
interface GameState {
  // ... existing properties
  waveTimer: number;
  waveMode: 'scatter' | 'chase';
  globalDotCounter: number;
  pelletsEaten: number;
  // Update gamePhase type
  gamePhase: 'ready' | 'playing' | 'levelComplete' | 'gameOver' | 'dying';
  // ... rest
}

// Add to pacman object in GameState
pacman: {
  // ... existing properties
  invincibleTimer: number;
}
```

### Task 1.2: Initialize Missing Properties
**File**: `src/components/games/PacManGame.tsx`
**Dependencies**: Task 1.1
**Estimated Time**: 20 minutes

Initialize in `gameRef.current` (line ~218) and `initializeGame()`:
- Set `waveTimer: 0`
- Set `waveMode: 'scatter'`
- Set `globalDotCounter: 0`
- Set `pelletsEaten: 0`
- Set `invincibleTimer: 0` in pacman object
- Set `exitTimer: 0` for each ghost

### Task 1.3: Implement A* Pathfinding
**File**: `src/components/games/PacManGame.tsx`
**Dependencies**: None
**Estimated Time**: 1 hour

Add before the component definition (around line ~150):

```typescript
interface PathNode {
  position: GridPosition;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

const findPath = (start: GridPosition, goal: GridPosition, maze: number[][]): GridPosition[] => {
  const openSet: PathNode[] = [];
  const closedSet: Set<string> = new Set();
  
  const heuristic = (a: GridPosition, b: GridPosition): number => {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
  };
  
  // ... implement A* algorithm
  // Return array of GridPositions representing path
}
```

### Task 1.4: Performance Optimization
**File**: `src/components/games/PacManGame.tsx`
**Dependencies**: None
**Estimated Time**: 45 minutes

1. Create pellet cache canvas (similar to maze cache)
2. Remove `ctx.shadowBlur` from pellet rendering (line ~1000)
3. Reduce shadow effects to only:
   - Pac-Man (when powered up)
   - Ghosts (frightened mode)
   - UI text
4. Implement quality settings based on device

---

## PHASE 2: CORE GAMEPLAY (Execute After Phase 1)

### Task 2.1: Ghost AI Behaviors
**File**: `src/components/games/PacManGame.tsx`
**Dependencies**: Task 1.3 (pathfinding)
**Estimated Time**: 1.5 hours

Implement in `updateGhostAI()` function:

```typescript
const updateGhostAI = (ghost: Ghost) => {
  const game = gameRef.current;
  
  // Set target based on ghost type and mode
  switch (ghost.aiType) {
    case 'blinky':
      // Direct chase - target Pac-Man's current position
      if (ghost.mode === 'chase') {
        ghost.targetGridPos = game.pacman.gridPos;
      }
      break;
    case 'pinky':
      // Ambush - target 4 tiles ahead of Pac-Man
      if (ghost.mode === 'chase') {
        // Calculate position 4 tiles in Pac-Man's direction
      }
      break;
    case 'inky':
      // Flanking - complex targeting using Blinky's position
      break;
    case 'clyde':
      // Shy - chase when far, scatter when within 8 tiles
      break;
  }
  
  // Handle scatter mode targets
  if (ghost.mode === 'scatter') {
    ghost.targetGridPos = ghost.scatterTarget;
  }
}
```

### Task 2.2: Ghost Tunnel Logic
**File**: `src/components/games/PacManGame.tsx`
**Dependencies**: None
**Estimated Time**: 30 minutes

Add tunnel handling in `updateGhosts()` (similar to Pac-Man's):
- Check for x position < 0 or > MAZE_WIDTH * CELL_SIZE
- Wrap ghost position
- Reduce ghost speed in tunnels to 40% normal speed

### Task 2.3: Game State Transitions
**File**: `src/components/games/PacManGame.tsx`
**Dependencies**: Task 1.1, 1.2
**Estimated Time**: 1 hour

Implement:
1. Death sequence:
   - Set `gamePhase` to 'dying'
   - Play death animation for 1.5 seconds
   - Reset positions
   - Add 2-second invincibility

2. Level complete:
   - Set `gamePhase` to 'levelComplete'
   - Display bonus (level × 1000)
   - Wait 3 seconds
   - Call `initializeGame(false)` to keep score

### Task 2.4: Ghost Scoring System
**File**: `src/components/games/PacManGame.tsx`
**Dependencies**: None
**Estimated Time**: 30 minutes

Add to GameState:
```typescript
ghostScoreMultiplier: number; // Resets to 1 when power pellet eaten
```

In collision detection:
```typescript
if (ghost.mode === 'frightened') {
  const points = 200 * Math.pow(2, game.ghostScoreMultiplier - 1);
  game.score += points;
  game.ghostScoreMultiplier++;
  // Show points at ghost position
}
```

---

## PHASE 3: QUALITY OF LIFE (Execute After Phase 2)

### Task 3.1: Power-Up Implementations
**File**: `src/components/games/PacManGame.tsx`
**Dependencies**: None
**Estimated Time**: 1 hour

1. Magnet power-up:
   - Auto-collect pellets within 2-tile radius
   - Add magnetic particle effect

2. Shield fix:
   - Add `shieldHits: number` to pacman
   - Set to 1 when collected
   - Decrement on ghost collision

### Task 3.2: Visual Feedback
**File**: `src/components/games/PacManGame.tsx`
**Dependencies**: None
**Estimated Time**: 45 minutes

1. Combo timer bar
2. Ghost point value display
3. Frozen ghost effect (blue tint + particles)
4. Power-up countdown timer

### Task 3.3: Mobile Optimization
**File**: `src/components/games/PacManGame.tsx`
**Dependencies**: Task 1.4
**Estimated Time**: 1 hour

1. Detect device performance
2. Implement quality levels:
   - High: All effects
   - Medium: Reduced particles, some shadows
   - Low: No shadows, minimal particles
3. Add virtual D-pad option

---

## PHASE 4: POLISH (Execute After Phase 3)

### Task 4.1: Audio System
**File**: `src/components/games/PacManGame.tsx`
**Dependencies**: None
**Estimated Time**: 30 minutes

Add sound effects:
- Level complete jingle
- Ghost siren (changes with mode)
- Death sequence sound
- Power-up spawn sound

### Task 4.2: Final Testing
**Dependencies**: All previous tasks
**Estimated Time**: 1 hour

1. Full playthrough testing
2. Performance profiling
3. Mobile device testing
4. Bug fixes

---

## Parallel Execution Guide

### Team A: Type System & Performance
- Task 1.1: Type System Fixes
- Task 1.2: Initialize Properties
- Task 1.4: Performance Optimization

### Team B: Core Algorithms
- Task 1.3: A* Pathfinding
- Task 2.1: Ghost AI Behaviors

### Team C: Game Mechanics
- Task 2.2: Ghost Tunnel Logic
- Task 2.3: Game State Transitions
- Task 2.4: Ghost Scoring

### Team D: Features & Polish
- Task 3.1: Power-Ups
- Task 3.2: Visual Feedback
- Task 3.3: Mobile Optimization

Each team can work independently on their assigned tasks in Phase 1. Phase 2-4 tasks should be started only after their dependencies are complete.