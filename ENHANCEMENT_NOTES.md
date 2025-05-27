# RetroToolbox Enhancement Notes

## Features Extracted from Codex Branches

### Visual Effects (Easy to Implement)

#### 1. Ball Trail Effect (Pong)
```javascript
// Add to PongGame.tsx in state
const [ballTrail, setBallTrail] = useState([]);

// In update loop
setBallTrail(prev => [...prev.slice(-14), { x: ball.x, y: ball.y }]);

// In render
ballTrail.forEach((pos, i) => {
  ctx.globalAlpha = i / 15;
  ctx.fillRect(pos.x - ball.size/2, pos.y - ball.size/2, ball.size, ball.size);
});
```

#### 2. Enhanced Shadows/Glow
```javascript
// Add to any game element rendering
ctx.shadowBlur = 30;
ctx.shadowColor = color;
// Draw element
ctx.shadowBlur = 0;
```

#### 3. Smooth Snake Movement
```javascript
// Add interpolation state
const [moveProgress, setMoveProgress] = useState(0);

// Smooth position calculation
const interpolatedX = prevX + (nextX - prevX) * moveProgress;
const interpolatedY = prevY + (nextY - prevY) * moveProgress;
```

### UI Components (Medium Complexity)

#### 1. Power-up Display Component
```javascript
// New component: src/components/ui/PowerUpDisplay.tsx
interface PowerUp {
  type: string;
  timeRemaining: number;
  icon?: string;
}

const PowerUpDisplay: React.FC<{ powerUps: PowerUp[] }> = ({ powerUps }) => {
  return (
    <div className="power-up-display">
      {powerUps.map(powerUp => (
        <div key={powerUp.type} className="power-up-indicator">
          <span>{powerUp.type}</span>
          <div className="timer-bar" style={{width: `${(powerUp.timeRemaining/10)*100}%`}} />
        </div>
      ))}
    </div>
  );
};
```

#### 2. Transition Wrapper
```javascript
// New component: src/components/ui/TransitionWrapper.tsx
const TransitionWrapper: React.FC<{ transitioning: boolean, children: ReactNode }> = ({ transitioning, children }) => {
  return (
    <div className={`transition-wrapper ${transitioning ? 'transitioning' : ''}`}>
      {children}
    </div>
  );
};
// CSS: opacity and transform transitions
```

### Game Systems (Complex)

#### 1. Shop System
```javascript
// New file: src/core/ShopSystem.ts
interface ShopItem {
  id: string;
  name: string;
  cost: number;
  effect: () => void;
}

class ShopSystem {
  items: ShopItem[] = [
    { id: 'wider-paddle', name: 'Wider Paddle', cost: 50, effect: () => { /* modify game state */ } },
    { id: 'extra-life', name: 'Extra Life', cost: 100, effect: () => { /* add life */ } }
  ];
  
  purchase(itemId: string, coins: number): boolean {
    const item = this.items.find(i => i.id === itemId);
    if (item && coins >= item.cost) {
      item.effect();
      return true;
    }
    return false;
  }
}
```

#### 2. Save/Load System
```javascript
// Add to src/hooks/useGameState.ts
const saveGameState = (gameId: string, state: any) => {
  localStorage.setItem(`${gameId}-state`, JSON.stringify({
    level: state.level,
    score: state.score,
    lives: state.lives,
    powerUps: state.powerUps,
    timestamp: Date.now()
  }));
};

const loadGameState = (gameId: string) => {
  const saved = localStorage.getItem(`${gameId}-state`);
  return saved ? JSON.parse(saved) : null;
};
```

#### 3. Theme System
```javascript
// New file: src/core/ThemeManager.ts
const themes = {
  space: { bg: '#000033', primary: '#0099ff', secondary: '#ff6600' },
  neon: { bg: '#1a1a1a', primary: '#ff00ff', secondary: '#00ffff' },
  retro: { bg: '#2d2d2d', primary: '#00ff00', secondary: '#ff0000' }
};

const getThemeForLevel = (level: number) => {
  const themeNames = Object.keys(themes);
  return themes[themeNames[level % themeNames.length]];
};
```

## Implementation Priority

### Phase 1 - Easy Visual Enhancements (Parallel Tasks)
1. Ball trail effect for Pong
2. Enhanced shadows/glow for all games
3. Power-up display UI component
4. Transition wrapper component

### Phase 2 - Medium Complexity Features
1. Save/load system (universal hook)
2. Theme system integration
3. Shop modal component

### Phase 3 - Complex Game Systems
1. Smooth interpolation for Snake
2. Level patterns for Breakout
3. Full shop system integration

## Notes
- All visual effects are additive and won't break existing code
- UI components should be in src/components/ui/
- Game systems should extend existing core modules
- Use existing hooks pattern for state management
- Maintain TypeScript interfaces throughout
- Canvas sizing is centralized in `src/core/CanvasConfig.ts` and used with `ResponsiveCanvas`
