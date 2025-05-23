import { useState, useEffect } from 'react';

export const useSettings = () => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('retroGameSettings');
    return saved ? JSON.parse(saved) : {
      soundEnabled: true,
      volume: 0.5,
      difficulty: 'normal',
      theme: 'neon'
    };
  });

  useEffect(() => {
    localStorage.setItem('retroGameSettings', JSON.stringify(settings));
  }, [settings]);

  return [settings, setSettings];
};