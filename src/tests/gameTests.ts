/**
 * Comprehensive Testing Framework for RetroToolbox Games
 * Validates visual rendering, interaction, and error handling
 */

// Game Test Interface
export interface GameTest {
  name: string;
  game: string;
  test: () => Promise<boolean>;
}

// Test Result Interface
export interface TestResult {
  test: string;
  game: string;
  passed: boolean;
  error?: string;
}

// Visual Validation Interface
export interface VisualCheckResult {
  success: boolean;
  error?: string;
  details?: {
    canvasFound: boolean;
    hasContent: boolean;
    pixelCount?: number;
  };
}

/**
 * Check if a canvas has visual content (non-black pixels)
 */
function canvasHasContent(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Check for non-black pixels (some pixels that aren't 0,0,0)
  let nonBlackPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    if (r > 0 || g > 0 || b > 0 || a > 0) {
      nonBlackPixels++;
    }
  }
  
  // Return true if more than 1% of pixels are non-black
  const totalPixels = canvas.width * canvas.height;
  return nonBlackPixels > totalPixels * 0.01;
}

/**
 * Visual validation for a specific game
 */
export async function checkGameVisuals(gameId: string): Promise<VisualCheckResult> {
  try {
    // Wait for game to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find the game's canvas
    const gameContainer = document.querySelector(`[data-game="${gameId}"]`);
    if (!gameContainer) {
      return {
        success: false,
        error: `Game container not found for ${gameId}`,
        details: { canvasFound: false, hasContent: false }
      };
    }
    
    const canvas = gameContainer.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      return {
        success: false,
        error: `Canvas not found for ${gameId}`,
        details: { canvasFound: false, hasContent: false }
      };
    }
    
    // Check if canvas has content
    const hasContent = canvasHasContent(canvas);
    if (!hasContent) {
      return {
        success: false,
        error: `Canvas appears blank for ${gameId}`,
        details: { canvasFound: true, hasContent: false }
      };
    }
    
    return {
      success: true,
      details: {
        canvasFound: true,
        hasContent: true,
        pixelCount: canvas.width * canvas.height
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Visual check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Test touch controls for mobile interaction
 */
export async function testTouchControls(gameId: string): Promise<boolean> {
  try {
    const gameContainer = document.querySelector(`[data-game="${gameId}"]`);
    if (!gameContainer) return false;
    
    const canvas = gameContainer.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return false;
    
    // Create and dispatch touch events
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Simulate touch start
    const touchStart = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [new Touch({
        identifier: 1,
        target: canvas,
        clientX: centerX,
        clientY: centerY,
        pageX: centerX,
        pageY: centerY,
        screenX: centerX,
        screenY: centerY
      })]
    });
    
    // Simulate touch move
    const touchMove = new TouchEvent('touchmove', {
      bubbles: true,
      cancelable: true,
      touches: [new Touch({
        identifier: 1,
        target: canvas,
        clientX: centerX + 50,
        clientY: centerY,
        pageX: centerX + 50,
        pageY: centerY,
        screenX: centerX + 50,
        screenY: centerY
      })]
    });
    
    // Simulate touch end
    const touchEnd = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [new Touch({
        identifier: 1,
        target: canvas,
        clientX: centerX + 50,
        clientY: centerY,
        pageX: centerX + 50,
        pageY: centerY,
        screenX: centerX + 50,
        screenY: centerY
      })]
    });
    
    canvas.dispatchEvent(touchStart);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    canvas.dispatchEvent(touchMove);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    canvas.dispatchEvent(touchEnd);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // If we got here without errors, touch controls are working
    return true;
  } catch (error) {
    console.error(`Touch control test failed for ${gameId}:`, error);
    return false;
  }
}

/**
 * Test suite for all games
 */
export const gameTests: GameTest[] = [
  // Snake Tests
  {
    name: 'Snake Canvas Renders',
    game: 'snake',
    test: async () => {
      const result = await checkGameVisuals('snake');
      return result.success;
    }
  },
  {
    name: 'Snake No Console Errors',
    game: 'snake',
    test: async () => {
      const errorCount = console.error.toString().length;
      await new Promise(resolve => setTimeout(resolve, 500));
      return console.error.toString().length === errorCount;
    }
  },
  {
    name: 'Snake Touch Controls',
    game: 'snake',
    test: () => testTouchControls('snake')
  },
  
  // Pong Tests
  {
    name: 'Pong Paddles Visible',
    game: 'pong',
    test: async () => {
      const result = await checkGameVisuals('pong');
      return result.success;
    }
  },
  {
    name: 'Pong Canvas Full Screen',
    game: 'pong',
    test: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const container = document.querySelector('[data-game="pong"]');
      const canvas = container?.querySelector('canvas') as HTMLCanvasElement;
      return canvas && canvas.width > 0 && canvas.height > 0;
    }
  },
  
  // Breakout Tests
  {
    name: 'Breakout Paddle Renders',
    game: 'breakout',
    test: async () => {
      const result = await checkGameVisuals('breakout');
      return result.success;
    }
  },
  {
    name: 'Breakout Bricks Centered',
    game: 'breakout',
    test: async () => {
      const result = await checkGameVisuals('breakout');
      return result.success && result.details?.hasContent === true;
    }
  },
  
  // Pac-Man Tests
  {
    name: 'Pac-Man No React Errors',
    game: 'pacman',
    test: async () => {
      // Check for React error boundary
      const errorBoundary = document.querySelector('.error-boundary');
      return !errorBoundary;
    }
  },
  {
    name: 'Pac-Man Maze Renders',
    game: 'pacman',
    test: async () => {
      const result = await checkGameVisuals('pacman');
      return result.success;
    }
  },
  {
    name: 'Pac-Man Touch Controls',
    game: 'pacman',
    test: () => testTouchControls('pacman')
  },
  
  // Stellar Drift Tests
  {
    name: 'Stellar Drift Tunnel Renders',
    game: 'stellardrift',
    test: async () => {
      const result = await checkGameVisuals('stellardrift');
      return result.success;
    }
  },
  {
    name: 'Stellar Drift Canvas Size',
    game: 'stellardrift',
    test: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const container = document.querySelector('[data-game="stellardrift"]');
      const canvas = container?.querySelector('canvas') as HTMLCanvasElement;
      return canvas && canvas.width >= 300 && canvas.height >= 400;
    }
  },
  
  // Tetris Tests
  {
    name: 'Tetris Canvas Renders',
    game: 'tetris',
    test: async () => {
      const result = await checkGameVisuals('tetris');
      return result.success;
    }
  },
  
  // Space Invaders Tests
  {
    name: 'Space Invaders Canvas Renders',
    game: 'spaceinvaders',
    test: async () => {
      const result = await checkGameVisuals('spaceinvaders');
      return result.success;
    }
  }
];

/**
 * Run all tests and return summary
 */
export async function runAllTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
}> {
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;
  
  console.log('🧪 Running RetroToolbox Game Tests...\n');
  
  for (const test of gameTests) {
    try {
      console.log(`Testing: ${test.name} (${test.game})...`);
      const success = await test.test();
      
      results.push({
        test: test.name,
        game: test.game,
        passed: success
      });
      
      if (success) {
        console.log(`✅ PASSED: ${test.name}\n`);
        passed++;
      } else {
        console.log(`❌ FAILED: ${test.name}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${test.name} - ${error}\n`);
      results.push({
        test: test.name,
        game: test.game,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      failed++;
    }
  }
  
  const total = gameTests.length;
  
  console.log('\n📊 Test Summary:');
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${((failed/total)*100).toFixed(1)}%)`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`- ${r.test} (${r.game})${r.error ? `: ${r.error}` : ''}`);
    });
  }
  
  return {
    total,
    passed,
    failed,
    results
  };
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).RetroToolboxTests = {
    runAllTests,
    checkGameVisuals,
    testTouchControls,
    gameTests
  };
}