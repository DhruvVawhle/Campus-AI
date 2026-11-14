const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const takeScreenshot = async (url, file, width, height) => {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(2000); // wait for 3D render
    await page.screenshot({ path: file });
    await context.close();
  };

  const screenshotsDir = path.join(__dirname, 'screenshots');
  console.log(`Saving screenshots to ${screenshotsDir}`);

  // Base URL
  const baseUrl = 'http://127.0.0.1:3001';

  // Take screenshots
  await takeScreenshot(`${baseUrl}/`, path.join(screenshotsDir, 'landing_1920x1080.png'), 1920, 1080);
  await takeScreenshot(`${baseUrl}/`, path.join(screenshotsDir, 'landing_1366x768.png'), 1366, 768);
  await takeScreenshot(`${baseUrl}/kiosk?demo=1`, path.join(screenshotsDir, 'kiosk_backend_off_1920x1080.png'), 1920, 1080); // using demo=1 for backend off mock
  await takeScreenshot(`${baseUrl}/kiosk?demo=1`, path.join(screenshotsDir, 'kiosk_backend_off_1366x768.png'), 1366, 768);
  await takeScreenshot(`${baseUrl}/kiosk`, path.join(screenshotsDir, 'kiosk_backend_on_1920x1080.png'), 1920, 1080);
  await takeScreenshot(`${baseUrl}/kiosk`, path.join(screenshotsDir, 'kiosk_backend_on_1366x768.png'), 1366, 768);

  await browser.close();
  console.log('Screenshots done.');
})();
