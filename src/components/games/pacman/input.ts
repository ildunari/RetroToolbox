import { GameState, Direction } from './types';
import { soundManager } from '../../../core/SoundManager';
import { MutableRefObject } from 'react';

export function setupInput(
  canvas: HTMLCanvasElement | null,
  gameRef: MutableRefObject<GameState>,
  togglePause: () => void,
  soundEnabledRef: MutableRefObject<boolean>,
  setGamePhase?: (phase: 'ready' | 'playing' | 'dying' | 'levelComplete') => void
) {
  const handleKey = (e: KeyboardEvent) => {
    const game = gameRef.current;
    
    if (e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      togglePause();
      return;
    }
    let dir: Direction = 'none';
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        dir = 'up';
        break;
      case 'ArrowDown':
      case 's':
        dir = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
        dir = 'left';
        break;
      case 'ArrowRight':
      case 'd':
        dir = 'right';
        break;
    }
    
    if (dir !== 'none') {
      if (!game) {
        return;
      }
      
      game.pacman.nextDirection = dir;
      
      if (game.gamePhase === 'ready') {
        game.gamePhase = 'playing';
        // Update React state to trigger re-render
        if (setGamePhase) {
          setGamePhase('playing');
        }
        // Set lastUpdate to current time to start the game loop properly
        game.lastUpdate = performance.now();
        if (soundEnabledRef.current) {
          soundManager.startGhostSiren('normal');
        }
      }
    }
  };

  let startX = 0;
  let startY = 0;
  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX;
    const dy = endY - startY;
    const game = gameRef.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      game.pacman.nextDirection = dx > 0 ? 'right' : 'left';
    } else {
      game.pacman.nextDirection = dy > 0 ? 'down' : 'up';
    }
    if (game.gamePhase === 'ready') {
      game.gamePhase = 'playing';
      // Set lastUpdate to current time to start the game loop properly
      game.lastUpdate = performance.now();
      if (soundEnabledRef.current) {
        soundManager.startGhostSiren('normal');
      }
    }
  };

  window.addEventListener('keydown', handleKey);
  if (canvas) {
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
  }

  return () => {
    window.removeEventListener('keydown', handleKey);
    if (canvas) {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    }
  };
}

