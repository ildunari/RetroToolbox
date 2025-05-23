import React, { useState, useEffect } from 'react';
import { ChevronLeft, Settings } from 'lucide-react';
import { GameMenu } from './components/ui/GameMenu';
import { SettingsModal } from './components/ui/SettingsModal';
import { SnakeGame } from './components/games/SnakeGame';
import { PongGame } from './components/games/PongGame';
import { BreakoutGame } from './components/games/BreakoutGame';
import { TetrisGame } from './components/games/TetrisGame';
import { SpaceInvadersGame } from './components/games/SpaceInvadersGame';
import { useSettings } from './hooks/useSettings';
import { useStats } from './hooks/useStats';

const gameComponents = {
  snake: SnakeGame,
  pong: PongGame,
  breakout: BreakoutGame,
  tetris: TetrisGame,
  spaceInvaders: SpaceInvadersGame
};

const games = [
  { id: 'snake', name: 'SNAKE++', icon: '🐍' },
  { id: 'pong', name: 'NEON PONG', icon: '🏓' },
  { id: 'breakout', name: 'BRICK BREAKER', icon: '🧱' },
  { id: 'tetris', name: 'TETRIS REMIX', icon: '🔲' },
  { id: 'spaceInvaders', name: 'SPACE DEFENSE', icon: '👾' }
];

function App() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useSettings();
  const { stats, updateHighScore, incrementGamesPlayed } = useStats();

  const handleGameSelect = (gameId) => {
    setSelectedGame(gameId);
    incrementGamesPlayed();
  };

  const GameComponent = selectedGame ? gameComponents[selectedGame] : null;
  const currentGame = games.find(g => g.id === selectedGame);

  // Prevent page scrolling with arrow keys and spacebar
  useEffect(() => {
    const preventScroll = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    const preventScrollWheel = (e) => {
      e.preventDefault();
    };

    const preventTouchMove = (e) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', preventScroll);
    window.addEventListener('wheel', preventScrollWheel, { passive: false });
    window.addEventListener('touchmove', preventTouchMove, { passive: false });

    return () => {
      window.removeEventListener('keydown', preventScroll);
      window.removeEventListener('wheel', preventScrollWheel);
      window.removeEventListener('touchmove', preventTouchMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
      
      {showSettings && (
        <SettingsModal 
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {selectedGame ? (
        <div>
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex items-center justify-between">
            <button
              onClick={() => setSelectedGame(null)}
              className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
            >
              <ChevronLeft size={24} />
              <span className="hidden sm:inline">Back to Menu</span>
            </button>
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <span className="text-2xl">{currentGame?.icon}</span>
              <span className="hidden sm:inline">{currentGame?.name}</span>
            </h2>
            <button
              onClick={() => setShowSettings(true)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <Settings size={24} />
            </button>
          </div>
          {GameComponent && (
            <GameComponent 
              settings={settings} 
              updateHighScore={updateHighScore}
            />
          )}
        </div>
      ) : (
        <GameMenu 
          stats={stats}
          onGameSelect={handleGameSelect}
          onShowSettings={() => setShowSettings(true)}
        />
      )}
    </div>
  );
}

export default App;