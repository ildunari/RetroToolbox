import { useState, useEffect, useCallback } from 'react';

// TypeScript interfaces
interface HighScores {
  snake: number;
  pong: number;
  breakout: number;
  tetris: number;
  spaceInvaders: number;
  pacman?: number;
  stellarDrift?: number;
}

interface GameStats {
  version: number;
  highScores: HighScores;
  gamesPlayed: number;
  totalScore: number;
  achievements: string[];
}

type GameId = keyof HighScores;

// Migration logic for legacy stats
const migrateStats = (saved: any): GameStats => {
  // Handle old structure where gamesPlayed was a number at root level
  if (typeof saved.gamesPlayed === 'number' && !saved.version) {
    return {
      version: 1,
      highScores: {
        snake: saved.highScores?.snake || 0,
        pong: saved.highScores?.pong || 0,
        breakout: saved.highScores?.breakout || 0,
        tetris: saved.highScores?.tetris || 0,
        spaceInvaders: saved.highScores?.spaceInvaders || 0,
      },
      gamesPlayed: saved.gamesPlayed || 0,
      totalScore: saved.totalScore || 0,
      achievements: saved.achievements || []
    };
  }

  // Current structure - just add missing games if needed
  return {
    version: 1,
    highScores: {
      snake: 0,
      pong: 0,
      breakout: 0,
      tetris: 0,
      spaceInvaders: 0,
      pacman: 0,
      stellarDrift: 0,
      ...saved.highScores
    },
    gamesPlayed: saved.gamesPlayed || 0,
    totalScore: saved.totalScore || 0,
    achievements: saved.achievements || []
  };
};

export const useStats = () => {
  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem('retroGameStats');
      if (!saved) {
        return {
          version: 1,
          highScores: {
            snake: 0,
            pong: 0,
            breakout: 0,
            tetris: 0,
            spaceInvaders: 0,
            pacman: 0,
            stellarDrift: 0
          },
          gamesPlayed: 0,
          totalScore: 0,
          achievements: []
        };
      }

      const parsed = JSON.parse(saved);
      return migrateStats(parsed);
    } catch (error) {
      console.warn('Failed to parse saved stats, using defaults:', error);
      return {
        version: 1,
        highScores: {
          snake: 0,
          pong: 0,
          breakout: 0,
          tetris: 0,
          spaceInvaders: 0,
          pacman: 0,
          stellarDrift: 0
        },
        gamesPlayed: 0,
        totalScore: 0,
        achievements: []
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('retroGameStats', JSON.stringify(stats));
    } catch (error) {
      console.warn('Failed to save stats to localStorage:', error);
    }
  }, [stats]);

  const updateHighScore = useCallback((game: GameId, score: number) => {
    if (typeof score !== 'number' || isNaN(score) || score < 0) {
      console.warn('Invalid score provided:', score);
      return;
    }

    setStats(prev => {
      const currentHighScore = prev.highScores[game] || 0;
      const isNewHighScore = score > currentHighScore;
      
      return {
        ...prev,
        highScores: { 
          ...prev.highScores, 
          [game]: isNewHighScore ? score : currentHighScore
        },
        totalScore: prev.totalScore + score
      };
    });
  }, []);

  const incrementGamesPlayed = useCallback(() => {
    setStats(prev => ({ 
      ...prev, 
      gamesPlayed: (prev.gamesPlayed || 0) + 1 
    }));
  }, []);

  return { stats, updateHighScore, incrementGamesPlayed };
};

export type { GameStats, GameId, HighScores };