import { useState, useEffect } from 'react';

// TypeScript interfaces
interface GameSettings {
  version: number;
  soundEnabled: boolean;
  volume: number;
  difficulty: 'easy' | 'normal' | 'hard';
  theme: 'neon' | 'retro' | 'dark';
  controls?: {
    enableGamepad: boolean;
    touchSensitivity: number;
  };
}

// Migration logic for legacy settings
const migrateSettings = (saved: any): GameSettings => {
  // Validate and sanitize values
  const sanitizeVolume = (vol: any): number => {
    const num = parseFloat(vol);
    return isNaN(num) ? 0.5 : Math.max(0, Math.min(1, num));
  };

  const sanitizeDifficulty = (diff: any): 'easy' | 'normal' | 'hard' => {
    return ['easy', 'normal', 'hard'].includes(diff) ? diff : 'normal';
  };

  const sanitizeTheme = (theme: any): 'neon' | 'retro' | 'dark' => {
    return ['neon', 'retro', 'dark'].includes(theme) ? theme : 'neon';
  };

  return {
    version: 1,
    soundEnabled: typeof saved.soundEnabled === 'boolean' ? saved.soundEnabled : true,
    volume: sanitizeVolume(saved.volume),
    difficulty: sanitizeDifficulty(saved.difficulty),
    theme: sanitizeTheme(saved.theme),
    controls: {
      enableGamepad: saved.controls?.enableGamepad ?? true,
      touchSensitivity: typeof saved.controls?.touchSensitivity === 'number' 
        ? Math.max(0.1, Math.min(2.0, saved.controls.touchSensitivity))
        : 1.0
    }
  };
};

export const useSettings = (): [GameSettings, (settings: GameSettings) => void] => {  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('retroGameSettings');
      if (!saved) {
        return {
          version: 1,
          soundEnabled: true,
          volume: 0.5,
          difficulty: 'normal',
          theme: 'neon',
          controls: {
            enableGamepad: true,
            touchSensitivity: 1.0
          }
        };
      }

      const parsed = JSON.parse(saved);
      return migrateSettings(parsed);
    } catch (error) {
      console.warn('Failed to parse saved settings, using defaults:', error);
      return {
        version: 1,
        soundEnabled: true,
        volume: 0.5,
        difficulty: 'normal',
        theme: 'neon',
        controls: {
          enableGamepad: true,
          touchSensitivity: 1.0
        }
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('retroGameSettings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  return [settings, setSettings];
};

export type { GameSettings };