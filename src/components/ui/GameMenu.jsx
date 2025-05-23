import React from 'react';
import { Trophy, Settings } from 'lucide-react';

const games = [
  { id: 'snake', name: 'SNAKE++', icon: '🐍', color: 'from-green-400 to-green-600', description: 'Classic snake with power-ups' },
  { id: 'pong', name: 'NEON PONG', icon: '🏓', color: 'from-blue-400 to-blue-600', description: 'Enhanced pong with AI' },
  { id: 'breakout', name: 'BRICK BREAKER', icon: '🧱', color: 'from-red-400 to-red-600', description: 'Destroy all bricks!' },
  { id: 'tetris', name: 'TETRIS REMIX', icon: '🔲', color: 'from-purple-400 to-purple-600', description: 'Fall block puzzle' },
  { id: 'spaceInvaders', name: 'SPACE DEFENSE', icon: '👾', color: 'from-yellow-400 to-yellow-600', description: 'Defend Earth!' }
];

export const GameMenu = ({ stats, onGameSelect, onShowSettings }) => (
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
          onClick={() => onGameSelect(game.id)}
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
    </div>
    
    <div className="relative z-10 flex gap-4">
      <button
        onClick={onShowSettings}
        className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
      >
        <Settings size={20} />
        Settings
      </button>
    </div>
  </div>
);