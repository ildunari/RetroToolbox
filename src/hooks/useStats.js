import { useState, useEffect, useCallback } from 'react';

export const useStats = () => {
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('retroGameStats');
    return saved ? JSON.parse(saved) : {
      highScores: {
        snake: 0,
        pong: 0,
        breakout: 0,
        tetris: 0,
        spaceInvaders: 0
      },
      gamesPlayed: 0,
      totalScore: 0,
      achievements: []
    };
  });

  useEffect(() => {
    localStorage.setItem('retroGameStats', JSON.stringify(stats));
  }, [stats]);

  const updateHighScore = useCallback((game, score) => {
    setStats(prev => {
      const isNewHighScore = score > prev.highScores[game];
      return {
        ...prev,
        highScores: { 
          ...prev.highScores, 
          [game]: isNewHighScore ? score : prev.highScores[game] 
        },
        totalScore: prev.totalScore + score
      };
    });
  }, []);

  const incrementGamesPlayed = useCallback(() => {
    setStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));
  }, []);

  return { stats, updateHighScore, incrementGamesPlayed };
};