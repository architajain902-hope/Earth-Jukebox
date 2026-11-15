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
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1200));

  // Click "Start Experience" button on startup screen
  console.log('Clicking Start Experience...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.innerText.includes('Start Experience')
    );
    if (btn) btn.click();
  });

  // Wait for 3D Earth canvas & HUD to render
  await page.waitForFunction(() => !!document.querySelector('.earth-canvas-wrapper canvas'), { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2500));

  // Dismiss coach-mark if visible
  await page.evaluate(() => {
    const gotItBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Got it'));
    if (gotItBtn) gotItBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // Helper functions for tab switching
  const switchTab = async (tabName) => {
    await page.evaluate((name) => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes(name));
      if (btn) btn.click();
    }, tabName);
    await new Promise((r) => setTimeout(r, 800));
  };

  const toggleTheme = async () => {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Toggle visual theme');
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
  };

  // 1. Earth Tab (Desktop 1440px Dark)
  console.log('Capturing 01-earth-tab.png...');
  await page.screenshot({ path: join(SCREENSHOT_DIR, '01-earth-tab.png') });

  // 2. Accessibility Menu
  console.log('Capturing 05-accessibility-menu.png...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Accessibility'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: join(SCREENSHOT_DIR, '05-accessibility-menu.png') });
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Accessibility'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  // 3. More Drawer
  console.log('Capturing 04-more-drawer.png...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('More'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: join(SCREENSHOT_DIR, '04-more-drawer.png') });
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Close menu');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // 4. NASA Frames Tab (Desktop 1440px Dark)
  console.log('Capturing 02-nasa-frames-tab.png...');
  await switchTab('NASA Frames');
  await page.screenshot({ path: join(SCREENSHOT_DIR, '02-nasa-frames-tab.png') });

  // NASA Frames Tab Light
  console.log('Capturing 02-nasa-frames-tab-light.png...');
  await toggleTheme();
  await page.screenshot({ path: join(SCREENSHOT_DIR, '02-nasa-frames-tab-light.png') });
  await toggleTheme(); // Back to dark

  // 5. Learn Tab (Desktop 1440px Dark)
  console.log('Capturing 03-learn-tab.png...');
  await switchTab('Learn');
  await page.screenshot({ path: join(SCREENSHOT_DIR, '03-learn-tab.png') });

  // Learn Tab Light
  console.log('Capturing 03-learn-tab-light.png...');
  await toggleTheme();
  await page.screenshot({ path: join(SCREENSHOT_DIR, '03-learn-tab-light.png') });
  await toggleTheme(); // Back to dark

  // 6. Earth Light Theme (Daylight)
  console.log('Capturing 06-light-theme.png...');
  await switchTab('Earth');
  await toggleTheme();
  await page.screenshot({ path: join(SCREENSHOT_DIR, '06-light-theme.png') });
  await toggleTheme(); // Back to dark

  // 7. Tablet View (768px)
  console.log('Capturing 08-tablet-768px.png, tablet Learn & Frames...');
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: join(SCREENSHOT_DIR, '08-tablet-768px.png') });

  await switchTab('NASA Frames');
  await page.screenshot({ path: join(SCREENSHOT_DIR, '02-nasa-frames-tab-768px.png') });

  await switchTab('Learn');
  await page.screenshot({ path: join(SCREENSHOT_DIR, '03-learn-tab-768px.png') });

  // 8. Mobile View (360px)
  console.log('Capturing 07-mobile-360px.png, mobile Learn & Frames...');
  await page.setViewport({ width: 360, height: 740, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 800));
  await switchTab('Earth');
  await page.screenshot({ path: join(SCREENSHOT_DIR, '07-mobile-360px.png') });

  await switchTab('NASA Frames');
  await page.screenshot({ path: join(SCREENSHOT_DIR, '02-nasa-frames-tab-360px.png') });

  await switchTab('Learn');
  await page.screenshot({ path: join(SCREENSHOT_DIR, '03-learn-tab-360px.png') });

  await browser.close();
  console.log('All screenshots captured successfully in docs/screenshots/!');
}

run().catch((err) => {
  console.error('Screenshot run failed:', err);
  process.exit(1);
});
