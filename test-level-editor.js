import { chromium } from 'playwright';

(async () => {
  console.log('Starting level editor save/load test...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });

    const neonJumpButton = await page.locator('text=NEON JUMP').first();
    if (await neonJumpButton.isVisible()) {
      await neonJumpButton.click();
      await page.waitForTimeout(1000);

      const editorButton = await page.locator('text=Level Editor').first();
      if (await editorButton.isVisible()) {
        await editorButton.click();

        // Attempt save/load cycle
        const saveButton = await page.locator('text=Save Level').first();
        const loadButton = await page.locator('text=Load Level').first();
        if (await saveButton.isVisible() && await loadButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(500);
          await loadButton.click();
          console.log('Save and load actions triggered.');
        } else {
          console.log('ERROR: Save/Load buttons not visible in level editor.');
        }
      } else {
        console.log('ERROR: Level Editor button not found.');
      }
    } else {
      console.log('ERROR: NEON JUMP button not found.');
    }
  } catch (error) {
    console.log('ERROR:', error.message);
  }

  await browser.close();
})();
