import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, Volume2, VolumeX, Settings, Trophy, Gamepad2, Medal, Crown, Star } from 'lucide-react';
import { SnakeGame } from './components/games/SnakeGame';
import { PongGame } from './components/games/PongGame';
import { BreakoutGame } from './components/games/BreakoutGame';
import { TetrisGame } from './components/games/TetrisGame';
import { SpaceInvadersGame } from './components/games/SpaceInvadersGame';

// Type definitions
interface GameSettings {
  soundEnabled: boolean;
  volume: number;
  difficulty: 'easy' | 'normal' | 'hard';
  theme: string;
}

interface GameStats {
  highScores: Record<string, number>;
  gamesPlayed: Record<string, number> & { total?: number };
  totalScore: number;
  lastPlayed: string | null;
  achievements: string[];
}

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface GameComponentProps {
  settings: GameSettings;
  updateHighScore: (game: string, score: number) => void;
}

// Audio Context for sound effects
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
const audioContext = new AudioContext();

// Sound Effects Manager
class SoundManager {
  enabled: boolean;
  volume: number;

  constructor() {
    this.enabled = true;
    this.volume = 0.5;
  }

  playTone(frequency: number, duration: number = 100): void {
    if (!this.enabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    gainNode.gain.value = this.volume * 0.1;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  }

  playCollect(): void { this.playTone(880, 100); }
  playHit(): void { this.playTone(220, 150); }
  playGameOver(): void { this.playTone(110, 500); }
  playPowerUp(): void { this.playTone(1320, 200); }
}

const soundManager = new SoundManager();

// Input Manager for unified controls
class InputManager {
  keys: Record<string, boolean>;
  touches: Touch[];
  mousePos: { x: number; y: number };
  gamepadConnected: boolean;

  constructor() {
    this.keys = {};
    this.touches = [];
    this.mousePos = { x: 0, y: 0 };
    this.gamepadConnected = false;
    
    window.addEventListener('keydown', (e: KeyboardEvent) => this.keys[e.key] = true);
    window.addEventListener('keyup', (e: KeyboardEvent) => this.keys[e.key] = false);
  }

  isKeyPressed(key: string): boolean {
    return this.keys[key] || false;
  }

  getGamepad(): Gamepad | null {
    const gamepads = navigator.getGamepads();
    return gamepads[0] || null;
  }
}

const inputManager = new InputManager();


// Main Game Component
const RetroGameToolbox: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('retroGameSettings');
    return saved ? JSON.parse(saved) : {
      soundEnabled: true,
      volume: 0.5,
      difficulty: 'normal',
      theme: 'neon'
    };
  });
  
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('retroGameStats');
    return saved ? JSON.parse(saved) : {
      highScores: {
        snake: 0,
        pong: 0,
        breakout: 0,
        tetris: 0,
        spaceInvaders: 0
      },
      gamesPlayed: {
        snake: 0,
        pong: 0,
        breakout: 0,
        tetris: 0,
        spaceInvaders: 0,
        total: 0
      },
      totalScore: 0,
      lastPlayed: null,
      achievements: []
    };
  });

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScoreboard, setShowScoreboard] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('retroGameSettings', JSON.stringify(settings));
    soundManager.enabled = settings.soundEnabled;
    soundManager.volume = settings.volume;
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('retroGameStats', JSON.stringify(stats));
  }, [stats]);

  const games: Game[] = [
    { id: 'snake', name: 'SNAKE++', icon: '🐍', color: 'from-green-400 to-green-600', description: 'Classic snake with power-ups' },
    { id: 'pong', name: 'NEON PONG', icon: '🏓', color: 'from-blue-400 to-blue-600', description: 'Enhanced pong with AI' },
    { id: 'breakout', name: 'BRICK BREAKER', icon: '🧱', color: 'from-red-400 to-red-600', description: 'Destroy all bricks!' },
    { id: 'tetris', name: 'TETRIS REMIX', icon: '🔲', color: 'from-purple-400 to-purple-600', description: 'Fall block puzzle' },
    { id: 'spaceInvaders', name: 'SPACE DEFENSE', icon: '👾', color: 'from-yellow-400 to-yellow-600', description: 'Defend Earth!' }
  ];

  const updateHighScore = useCallback((game: string, score: number) => {
    setStats(prev => {
      if (score > prev.highScores[game]) {
        soundManager.playPowerUp();
        return {
          ...prev,
          highScores: { ...prev.highScores, [game]: score },
          totalScore: prev.totalScore + score
        };
      }
      return { ...prev, totalScore: prev.totalScore + score };
    });
  }, []);

  // Game Menu Component
  const GameMenu: React.FC = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 flex flex-col items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="relative z-10 text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 mb-2 animate-pulse">
          RETRO ARCADE
        </h1>
        <p className="text-gray-400 text-sm md:text-base">Choose your game • Total Score: {stats.totalScore}</p>
      </div>
      
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full mb-8">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => {
              setSelectedGame(game.id);
              setStats(prev => ({ 
                ...prev, 
                gamesPlayed: {
                  ...prev.gamesPlayed,
                  [game.id]: (prev.gamesPlayed[game.id] || 0) + 1,
                  total: (prev.gamesPlayed?.total || 0) + 1
                },
                lastPlayed: game.id
              }));
            }}
            className={`relative overflow-hidden rounded-lg p-6 bg-gradient-to-br ${game.color} transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl group`}
          >
            <div className="absolute inset-0 bg-black opacity-20"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">{game.icon}</div>
              <h3 className="text-white font-bold text-lg">{game.name}</h3>
              <p className="text-white/70 text-xs mt-1">{game.description}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Trophy size={16} className="text-yellow-300" />
                <p className="text-white/90 text-sm font-semibold">{stats.highScores[game.id]}</p>
              </div>
            </div>
          </button>
        ))}
        
        {/* Scoreboard Tile */}
        <button
          onClick={() => setShowScoreboard(true)}
          className="relative overflow-hidden rounded-lg p-6 bg-gradient-to-br from-amber-400 to-orange-600 transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl group"
        >
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10">
            <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">🏆</div>
            <h3 className="text-white font-bold text-lg">SCOREBOARD</h3>
            <p className="text-white/70 text-xs mt-1">View high scores</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Crown size={16} className="text-yellow-300" />
              <p className="text-white/90 text-sm font-semibold">{stats.gamesPlayed?.total || 0} games</p>
            </div>
          </div>
        </button>
      </div>
      
      <div className="relative z-10 flex gap-4">
        <button
          onClick={() => setShowSettings(true)}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <Settings size={20} />
          Settings
        </button>
      </div>
    </div>
  );

  // Settings Modal
  const SettingsModal: React.FC = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-white">Sound</label>
            <button
              onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              className={`p-2 rounded ${settings.soundEnabled ? 'bg-green-600' : 'bg-gray-600'}`}
            >
              {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-white">Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => setSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
              className="w-32"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-white">Difficulty</label>
            <select
              value={settings.difficulty}
              onChange={(e) => setSettings(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'normal' | 'hard' }))}
              className="bg-gray-700 text-white rounded px-3 py-1"
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(false)}
          className="mt-6 w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  // Scoreboard Modal
  const ScoreboardModal: React.FC = () => {
    const sortedGames = [...games].sort((a, b) => stats.highScores[b.id] - stats.highScores[a.id]);
    const totalScore = Object.values(stats.highScores).reduce((sum, score) => sum + score, 0);
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-6 max-w-md w-full border-2 border-amber-500/50 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2 font-mono">
              ⚡ HIGH SCORES ⚡
            </h2>
            <div className="flex items-center justify-center gap-2 text-amber-300">
              <Star size={16} />
              <span className="text-sm font-semibold">Total: {totalScore.toLocaleString()}</span>
              <Star size={16} />
            </div>
          </div>
          
          <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
            {sortedGames.map((game, index) => {
              const isTopScore = index === 0 && stats.highScores[game.id] > 0;
              const hasScore = stats.highScores[game.id] > 0;
              
              return (
                <div
                  key={game.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                    isTopScore 
                      ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/50' 
                      : hasScore
                      ? 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 border-gray-500/50'
                      : 'bg-gray-800/50 border-gray-600/30'
                  } transform transition-all duration-200 hover:scale-105`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {isTopScore && (
                        <Crown size={20} className="text-yellow-400 absolute -top-2 -right-2" />
                      )}
                      <span className="text-2xl">{game.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm font-mono">{game.name}</h3>
                      <p className="text-gray-400 text-xs">
                        Played: {stats.gamesPlayed?.[game.id] || 0} times
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold text-lg font-mono ${
                      isTopScore ? 'text-yellow-400' : hasScore ? 'text-white' : 'text-gray-500'
                    }`}>
                      {stats.highScores[game.id].toLocaleString()}
                    </div>
                    {isTopScore && (
                      <div className="text-xs text-yellow-300 font-semibold">CHAMPION!</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="border-t border-gray-600 pt-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                <div className="text-blue-300 text-sm font-semibold">Games Played</div>
                <div className="text-white text-xl font-bold font-mono">{stats.gamesPlayed?.total || 0}</div>
              </div>
              <div className="bg-purple-500/20 rounded-lg p-3 border border-purple-400/30">
                <div className="text-purple-300 text-sm font-semibold">Last Played</div>
                <div className="text-white text-sm font-mono">
                  {stats.lastPlayed ? games.find(g => g.id === stats.lastPlayed)?.icon + ' ' + games.find(g => g.id === stats.lastPlayed)?.name : 'None'}
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowScoreboard(false)}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-200 font-bold text-lg shadow-lg transform hover:scale-105 active:scale-95"
          >
            BACK TO GAMES
          </button>
        </div>
      </div>
    );
  };

  const gameComponents: Record<string, React.ComponentType<GameComponentProps>> = {
    snake: SnakeGame as any,
    pong: PongGame as any,
    breakout: BreakoutGame as any,
    tetris: TetrisGame as any,
    spaceInvaders: SpaceInvadersGame as any
  };

  const GameComponent = selectedGame ? gameComponents[selectedGame] : null;

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
      
      {showSettings && <SettingsModal />}
      {showScoreboard && <ScoreboardModal />}
      
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
              <span className="text-2xl">{games.find(g => g.id === selectedGame)?.icon}</span>
              <span className="hidden sm:inline">{games.find(g => g.id === selectedGame)?.name}</span>
            </h2>
            <button
              onClick={() => setShowSettings(true)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <Settings size={24} />
            </button>
          </div>
          {GameComponent && <GameComponent settings={settings} updateHighScore={updateHighScore} />}
        </div>
      ) : (
        <GameMenu />
      )}
    </div>
  );
};

export default RetroGameToolbox;