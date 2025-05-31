import { chromium } from 'playwright';

(async () => {
  console.log('Starting multiplayer start flow test...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });

    const multiButton = await page.locator('text=Multiplayer').first();
    if (await multiButton.isVisible()) {
      console.log('Found Multiplayer button, clicking...');
      await multiButton.click();

      // Check for lobby or waiting screen
      const lobbyText = await page.locator('text=Lobby, text=Waiting for players').first();
      if (await lobbyText.isVisible()) {
        console.log('Multiplayer lobby visible.');
      } else {
        console.log('ERROR: Lobby screen not visible after starting multiplayer.');
      }
    } else {
      console.log('ERROR: Multiplayer button not found.');
    }
  } catch (error) {
    console.log('ERROR:', error.message);
  }

  await browser.close();
})();
