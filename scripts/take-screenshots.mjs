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

  // 1. Earth Tab Screenshot (Desktop 1440px)
  console.log('Capturing 01-earth-tab.png...');
  await page.screenshot({ path: join(SCREENSHOT_DIR, '01-earth-tab.png') });

  // 2. Accessibility Dropdown
  console.log('Capturing 05-accessibility-menu.png...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Accessibility'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: join(SCREENSHOT_DIR, '05-accessibility-menu.png') });
  // Close it
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
  // Close drawer
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Close menu');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // 4. NASA Frames Tab
  console.log('Capturing 02-nasa-frames-tab.png...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('NASA Frames'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: join(SCREENSHOT_DIR, '02-nasa-frames-tab.png') });

  // 5. Learn Tab
  console.log('Capturing 03-learn-tab.png...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Learn'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: join(SCREENSHOT_DIR, '03-learn-tab.png') });

  // 6. Light Theme (Daylight)
  console.log('Capturing 06-light-theme.png...');
  // Go back to Earth tab
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Earth'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  // Toggle theme
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Toggle visual theme');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: join(SCREENSHOT_DIR, '06-light-theme.png') });

  // Toggle theme back to dark
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Toggle visual theme');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // 7. Tablet View (768px viewport)
  console.log('Capturing 08-tablet-768px.png...');
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: join(SCREENSHOT_DIR, '08-tablet-768px.png') });

  // 8. Mobile View (360px viewport)
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
