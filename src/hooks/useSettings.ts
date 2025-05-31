import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export interface GameSettings {
  soundEnabled: boolean;
  volume: number;
  difficulty: 'easy' | 'normal' | 'hard';
  theme: 'neon' | 'retro' | 'minimal';
  colorPalette: 'default' | 'accessible';
  fontScale: number;
}

export type UseSettingsReturn = [GameSettings, Dispatch<SetStateAction<GameSettings>>];

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  volume: 0.5,
  difficulty: 'normal',
  theme: 'neon',
  colorPalette: 'default',
  fontScale: 1
};

const STORAGE_KEY = 'retroGameSettings';
const MAX_STORAGE_SIZE = 1024 * 1024; // 1MB limit for settings

// Validation function to ensure settings object has correct shape and types
const validateSettings = (data: unknown): GameSettings | null => {
  try {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const settings = data as Record<string, unknown>;

    // Validate required fields and types
    if (typeof settings.soundEnabled !== 'boolean') {
      return null;
    }

    if (typeof settings.volume !== 'number' || 
        settings.volume < 0 || 
        settings.volume > 1) {
      return null;
    }

    if (!['easy', 'normal', 'hard'].includes(settings.difficulty as string)) {
      return null;
    }

    if (!['neon', 'retro', 'minimal'].includes(settings.theme as string)) {
      return null;
    }

    if (!['default', 'accessible'].includes(settings.colorPalette as string)) {
      return null;
    }

    if (typeof settings.fontScale !== 'number' || settings.fontScale < 0.5 || settings.fontScale > 2) {
      return null;
    }

    return {
      soundEnabled: settings.soundEnabled,
      volume: settings.volume,
      difficulty: settings.difficulty as 'easy' | 'normal' | 'hard',
      theme: settings.theme as 'neon' | 'retro' | 'minimal',
      colorPalette: settings.colorPalette as 'default' | 'accessible',
      fontScale: settings.fontScale as number
    };
  } catch (error) {
    console.error('Settings validation error:', error);
    return null;
  }
};

// Safe localStorage read with validation
const loadSettings = (): GameSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return DEFAULT_SETTINGS;
    }

    // Check size to prevent processing huge strings
    if (saved.length > MAX_STORAGE_SIZE) {
      console.warn('Settings data exceeds size limit, using defaults');
      localStorage.removeItem(STORAGE_KEY);
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(saved);
    const validated = validateSettings(parsed);

    if (!validated) {
      console.warn('Invalid settings format, using defaults');
      localStorage.removeItem(STORAGE_KEY);
      return DEFAULT_SETTINGS;
    }

    return validated;
  } catch (error) {
    console.error('Failed to load settings:', error);
    // Clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (clearError) {
      console.error('Failed to clear corrupted settings:', clearError);
    }
    return DEFAULT_SETTINGS;
  }
};

// Safe localStorage write with error handling
const saveSettings = (settings: GameSettings): void => {
  try {
    const data = JSON.stringify(settings);
    
    // Check if data is too large
    if (data.length > MAX_STORAGE_SIZE) {
      console.error('Settings data too large to save');
      return;
    }

    localStorage.setItem(STORAGE_KEY, data);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
        // Try to clear old data and retry
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (retryError) {
          console.error('Failed to save settings after clearing:', retryError);
        }
      } else {
        console.error('Failed to save settings:', error);
      }
    }
  }
};

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  useEffect(() => {
    // Validate settings before saving
    const validated = validateSettings(settings);
    if (validated) {
      saveSettings(validated);
    } else {
      console.error('Invalid settings state, not saving');
    }
  }, [settings]);

  // Wrapped setter that ensures valid state
  const setSafeSettings: Dispatch<SetStateAction<GameSettings>> = (action) => {
    setSettings((prev) => {
      const newSettings = typeof action === 'function' ? action(prev) : action;
      const validated = validateSettings(newSettings);
      return validated || prev; // Keep previous state if validation fails
    });
  };

  return [settings, setSafeSettings];
};