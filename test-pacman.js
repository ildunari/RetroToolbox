import { chromium } from 'playwright';

(async () => {
  console.log('Starting browser test...');
  
  // Launch browser with mobile viewport
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone viewport
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  
  const page = await context.newPage();
  
  // Listen for console logs and errors
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  try {
    console.log('Navigating to localhost:3004...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    
    console.log('Taking screenshot of main page...');
    await page.screenshot({ path: 'main-page.png', fullPage: true });
    
    console.log('Looking for Pac-Man game...');
    // Find and click Pac-Man game
    const pacmanButton = await page.locator('text=PAC-MAN NEON').first();
    if (await pacmanButton.isVisible()) {
      console.log('Found Pac-Man button, clicking...');
      await pacmanButton.click();
      
      // Wait for game to load
      await page.waitForTimeout(2000);
      
      console.log('Taking screenshot of Pac-Man game...');
      await page.screenshot({ path: 'pacman-game.png', fullPage: true });
      
      // Check if canvas is present and has dimensions
      const canvas = await page.locator('canvas').first();
      if (await canvas.isVisible()) {
        const canvasInfo = await canvas.evaluate(el => ({
          width: el.width,
          height: el.height,
          styleWidth: el.style.width,
          styleHeight: el.style.height,
          clientWidth: el.clientWidth,
          clientHeight: el.clientHeight
        }));
        console.log('Canvas info:', canvasInfo);
        
        // Check for debug info
        const debugText = await page.locator('text=Debug:').textContent().catch(() => 'Not found');
        console.log('Debug info:', debugText);
        
      } else {
        console.log('ERROR: Canvas not visible!');
      }
    } else {
      console.log('ERROR: Pac-Man button not found!');
    }
    
  } catch (error) {
    console.log('ERROR:', error.message);
  }
  
  console.log('Test complete. Check screenshots: main-page.png and pacman-game.png');
  console.log('Browser will stay open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();