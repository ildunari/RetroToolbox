import { useState, useEffect, useCallback } from 'react';

interface GameState {
  level?: number;
  score: number;
  lives?: number;
  powerUps?: any[];
  customData?: any;
}

interface SavedGameState extends GameState {
  timestamp: number;
  gameId: string;
}

export const useGameState = (gameId: string, initialState: GameState) => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load game state on mount
  useEffect(() => {
    const savedState = loadGameState(gameId);
    if (savedState && !hasLoaded) {
      // Check if save is less than 24 hours old
      const dayInMs = 24 * 60 * 60 * 1000;
      if (Date.now() - savedState.timestamp < dayInMs) {
        setGameState({
          ...initialState,
          ...savedState,
          // Don't restore power-ups as they're temporary
          powerUps: initialState.powerUps
        });
      }
      setHasLoaded(true);
    }
  }, [gameId, initialState, hasLoaded]);

  // Save game state
  const saveGameState = useCallback((state?: GameState) => {
    const stateToSave = state || gameState;
    const savedState: SavedGameState = {
      ...stateToSave,
      gameId,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(`retro-${gameId}-state`, JSON.stringify(savedState));
      return true;
    } catch (e) {
      console.error('Failed to save game state:', e);
      return false;
    }
  }, [gameId, gameState]);

  // Load game state
  const loadGameState = useCallback((id: string): SavedGameState | null => {
    try {
      const saved = localStorage.getItem(`retro-${id}-state`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load game state:', e);
    }
    return null;
  }, []);

  // Clear saved state
  const clearGameState = useCallback(() => {
    try {
      localStorage.removeItem(`retro-${gameId}-state`);
      setGameState(initialState);
      return true;
    } catch (e) {
      console.error('Failed to clear game state:', e);
      return false;
    }
  }, [gameId, initialState]);

  // Update specific fields
  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => {
      const newState = { ...prev, ...updates };
      // Auto-save on significant changes
      if (updates.level !== undefined || updates.lives !== undefined) {
        setTimeout(() => saveGameState(newState), 100);
      }
      return newState;
    });
  }, [saveGameState]);

  // Check if there's a saved game
  const hasSavedGame = useCallback(() => {
    const saved = loadGameState(gameId);
    if (saved) {
      const dayInMs = 24 * 60 * 60 * 1000;
      return Date.now() - saved.timestamp < dayInMs;
    }
    return false;
  }, [gameId, loadGameState]);

  return {
    gameState,
    setGameState,
    updateGameState,
    saveGameState,
    loadGameState,
    clearGameState,
    hasSavedGame
  };
};