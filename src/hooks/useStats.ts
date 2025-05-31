import { useState, useEffect, useCallback } from 'react';

export type GameType = 'snake' | 'pong' | 'breakout' | 'tetris' | 'spaceInvaders' | 'pacman';

export interface HighScores {
  snake: number;
  pong: number;
  breakout: number;
  tetris: number;
  spaceInvaders: number;
  pacman?: number; // Optional for backward compatibility
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: Date;
  gameType?: GameType;
}

export interface GameStats {
  highScores: HighScores;
  gamesPlayed: number;
  totalScore: number;
  achievements: Achievement[];
  pacmanProgress: {
    unlockedLevels: number;
  };
}

interface UseStatsReturn {
  stats: GameStats;
  updateHighScore: (game: GameType, score: number, pacmanLevel?: number) => void;
  incrementGamesPlayed: () => void;
}

const DEFAULT_STATS: GameStats = {
  highScores: {
    snake: 0,
    pong: 0,
    breakout: 0,
    tetris: 0,
    spaceInvaders: 0,
    pacman: 0
  },
  gamesPlayed: 0,
  totalScore: 0,
  achievements: [],
  pacmanProgress: {
    unlockedLevels: 1
  }
};

const STORAGE_KEY = 'retroGameStats';
const MAX_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB limit for stats
const MAX_ACHIEVEMENTS = 1000; // Prevent unlimited growth

const VALID_GAME_TYPES: GameType[] = ['snake', 'pong', 'breakout', 'tetris', 'spaceInvaders', 'pacman'];

// Validation function to ensure stats object has correct shape and types
const validateStats = (data: unknown): GameStats | null => {
  try {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const stats = data as Record<string, unknown>;

    // Validate highScores
    if (!stats.highScores || typeof stats.highScores !== 'object') {
      return null;
    }

    const highScores = stats.highScores as Record<string, unknown>;
    const validatedHighScores: HighScores = {
      snake: 0,
      pong: 0,
      breakout: 0,
      tetris: 0,
      spaceInvaders: 0,
      pacman: 0
    };

    // Validate each game score
    for (const game of VALID_GAME_TYPES) {
      const score = highScores[game];
      if (typeof score === 'number' && score >= 0 && Number.isFinite(score)) {
        validatedHighScores[game] = Math.floor(score); // Ensure integer
      }
    }

    // Validate gamesPlayed
    const gamesPlayed = stats.gamesPlayed;
    if (typeof gamesPlayed !== 'number' || gamesPlayed < 0 || !Number.isFinite(gamesPlayed)) {
      return null;
    }

    // Validate totalScore
    const totalScore = stats.totalScore;
    if (typeof totalScore !== 'number' || totalScore < 0 || !Number.isFinite(totalScore)) {
      return null;
    }    // Validate achievements array
    let validatedAchievements: Achievement[] = [];
    if (Array.isArray(stats.achievements)) {
      validatedAchievements = stats.achievements
        .filter((ach): ach is Achievement => {
          return (
            ach &&
            typeof ach === 'object' &&
            typeof ach.id === 'string' &&
            typeof ach.name === 'string' &&
            typeof ach.description === 'string' &&
            (ach.unlockedAt instanceof Date || typeof ach.unlockedAt === 'string') &&
            (!ach.gameType || VALID_GAME_TYPES.includes(ach.gameType))
          );
        })
        .slice(0, MAX_ACHIEVEMENTS) // Limit achievements count
        .map(ach => ({
          ...ach,
          unlockedAt: new Date(ach.unlockedAt) // Ensure Date object
        }));
    }

    let validatedProgress = { unlockedLevels: 1 };
    if (stats.pacmanProgress && typeof stats.pacmanProgress === 'object') {
      const lvl = (stats.pacmanProgress as Record<string, unknown>).unlockedLevels;
      if (typeof lvl === 'number' && lvl >= 1 && Number.isFinite(lvl)) {
        validatedProgress.unlockedLevels = Math.floor(lvl);
      }
    }

    return {
      highScores: validatedHighScores,
      gamesPlayed: Math.floor(gamesPlayed),
      totalScore: Math.floor(totalScore),
      achievements: validatedAchievements,
      pacmanProgress: validatedProgress
    };
  } catch (error) {
    console.error('Stats validation error:', error);
    return null;
  }
};

// Safe localStorage read with validation
const loadStats = (): GameStats => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return DEFAULT_STATS;
    }

    // Check size to prevent processing huge strings
    if (saved.length > MAX_STORAGE_SIZE) {
      console.warn('Stats data exceeds size limit, using defaults');
      localStorage.removeItem(STORAGE_KEY);
      return DEFAULT_STATS;
    }    const parsed = JSON.parse(saved);
    const validated = validateStats(parsed);

    if (!validated) {
      console.warn('Invalid stats format, using defaults');
      localStorage.removeItem(STORAGE_KEY);
      return DEFAULT_STATS;
    }

    return validated;
  } catch (error) {
    console.error('Failed to load stats:', error);
    // Clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (clearError) {
      console.error('Failed to clear corrupted stats:', clearError);
    }
    return DEFAULT_STATS;
  }
};

// Safe localStorage write with error handling
const saveStats = (stats: GameStats): void => {
  try {
    const data = JSON.stringify(stats);
    
    // Check if data is too large
    if (data.length > MAX_STORAGE_SIZE) {
      console.error('Stats data too large to save');
      // Try to trim achievements if they're causing the issue
      if (stats.achievements.length > 100) {
        const trimmedStats = {
          ...stats,
          achievements: stats.achievements.slice(-100) // Keep last 100
        };
        const trimmedData = JSON.stringify(trimmedStats);
        if (trimmedData.length <= MAX_STORAGE_SIZE) {
          localStorage.setItem(STORAGE_KEY, trimmedData);
          return;
        }
      }
      return;
    }

    localStorage.setItem(STORAGE_KEY, data);
  } catch (error) {    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
        // Try to clear old data and retry
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
        } catch (retryError) {
          console.error('Failed to save stats after clearing:', retryError);
        }
      } else {
        console.error('Failed to save stats:', error);
      }
    }
  }
};

export const useStats = (): UseStatsReturn => {
  const [stats, setStats] = useState<GameStats>(loadStats);

  useEffect(() => {
    // Validate stats before saving
    const validated = validateStats(stats);
    if (validated) {
      saveStats(validated);
    } else {
      console.error('Invalid stats state, not saving');
    }
  }, [stats]);

  const updateHighScore = useCallback((game: GameType, score: number, pacmanLevel?: number) => {
    // Validate inputs
    if (!VALID_GAME_TYPES.includes(game)) {
      console.error(`Invalid game type: ${game}`);
      return;
    }

    if (typeof score !== 'number' || score < 0 || !Number.isFinite(score)) {
      console.error(`Invalid score: ${score}`);
      return;
    }

    setStats((prev) => {
      const isNewHighScore = score > (prev.highScores[game] || 0);
      const newStats = {
        ...prev,
        highScores: {
          ...prev.highScores,
          [game]: isNewHighScore ? Math.floor(score) : (prev.highScores[game] || 0)
        },
        totalScore: prev.totalScore + Math.floor(score),
        pacmanProgress: pacmanLevel && game === 'pacman'
          ? {
              unlockedLevels: Math.max(prev.pacmanProgress.unlockedLevels, Math.floor(pacmanLevel))
            }
          : prev.pacmanProgress
      };

      const validated = validateStats(newStats);
      if (validated) {
        saveStats(validated);
        return validated;
      }
      return prev;
    });
  }, []);

  const incrementGamesPlayed = useCallback(() => {
    setStats((prev) => {
      const newStats = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1
      };

      // Check for overflow
      if (newStats.gamesPlayed > Number.MAX_SAFE_INTEGER) {
        console.warn('Games played count overflow, resetting to safe value');
        newStats.gamesPlayed = Number.MAX_SAFE_INTEGER;
      }

      const validated = validateStats(newStats);
      if (validated) {
        saveStats(validated);
        return validated;
      }
      return prev;
    });
  }, []);

  return { stats, updateHighScore, incrementGamesPlayed };
};
