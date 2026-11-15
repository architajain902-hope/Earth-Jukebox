import puppeteer from 'puppeteer-core';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCREENSHOT_DIR = join(ROOT, 'docs', 'screenshots');

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const CHROME_PATH = existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
  console.log('Launching browser with:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=d3d11'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const consoleLogs = [];
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      console.error('Browser console error:', msg.text());
    }
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

  // Click "Start Experience" button on startup screen
  console.log('Clicking Start Experience...');
  await page.waitForSelector('button', { timeout: 10000 });
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate((el) => el.innerText, b);
    if (text && text.includes('Start Experience')) {
      await b.click();
      break;
    }
  }

  // Wait for 3D Earth canvas & HUD to render
  await page.waitForFunction(() => !!document.querySelector('canvas'), { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2500));

  // 1. Earth Tab Screenshot (Desktop 1440px)
  console.log('Capturing 01-earth-tab.png...');
  await page.screenshot({ path: join(SCREENSHOT_DIR, '01-earth-tab.png') });

  // 2. Accessibility Dropdown
  console.log('Capturing 05-accessibility-menu.png...');
  const a11yBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find((b) =>
      b.innerText.includes('Accessibility')
    );
  });
  if (a11yBtn && a11yBtn.asElement()) {
    await a11yBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SCREENSHOT_DIR, '05-accessibility-menu.png') });
    // Close it
    await a11yBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 300));
  }

  // 3. More Drawer
  console.log('Capturing 04-more-drawer.png...');
  const moreBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find((b) =>
      b.innerText.includes('More')
    );
  });
  if (moreBtn && moreBtn.asElement()) {
    await moreBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: join(SCREENSHOT_DIR, '04-more-drawer.png') });
    // Close drawer
    const closeBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find((b) =>
        b.getAttribute('aria-label') === 'Close menu'
      );
    });
    if (closeBtn && closeBtn.asElement()) {
      await closeBtn.asElement().click();
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  // 4. NASA Frames Tab
  console.log('Capturing 02-nasa-frames-tab.png...');
  const framesBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find((b) =>
      b.innerText.includes('NASA Frames')
    );
  });
  if (framesBtn && framesBtn.asElement()) {
    await framesBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: join(SCREENSHOT_DIR, '02-nasa-frames-tab.png') });
  }

  // 5. Learn Tab
  console.log('Capturing 03-learn-tab.png...');
  const learnBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find((b) =>
      b.innerText.includes('Learn')
    );
  });
  if (learnBtn && learnBtn.asElement()) {
    await learnBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: join(SCREENSHOT_DIR, '03-learn-tab.png') });
  }

  // 6. Light Theme (Daylight)
  console.log('Capturing 06-light-theme.png...');
  // Go back to Earth tab
  const earthBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find((b) =>
      b.innerText.includes('Earth')
    );
  });
  if (earthBtn && earthBtn.asElement()) {
    await earthBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 600));
  }
  // Toggle theme
  const themeBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find((b) =>
      b.getAttribute('aria-label') === 'Toggle visual theme'
    );
  });
  if (themeBtn && themeBtn.asElement()) {
    await themeBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SCREENSHOT_DIR, '06-light-theme.png') });
  }

  // 7. Mobile View (360px viewport)
  console.log('Capturing 07-mobile-360px.png...');
  await page.setViewport({ width: 360, height: 740, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: join(SCREENSHOT_DIR, '07-mobile-360px.png') });

  await browser.close();
  console.log('All screenshots captured successfully in docs/screenshots/!');
}

run().catch((err) => {
  console.error('Screenshot run failed:', err);
  process.exit(1);
});
