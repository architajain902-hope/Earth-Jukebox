/**
 * capture-screenshots.mjs
 * Captures 1200x630 social cover and 4 high-res screenshots from the running app
 * using puppeteer-core with the system's Microsoft Edge installation.
 */

import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS_DIR = join(ROOT, 'docs');
const SHOTS_DIR = join(DOCS_DIR, 'screenshots');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!existsSync(SHOTS_DIR)) mkdirSync(SHOTS_DIR, { recursive: true });

  console.log('[capture] Launching Edge headless browser...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // 1. Social Cover (1200x630)
  console.log('[capture] Capturing docs/cover.png (1200x630)...');
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle2' });
  await wait(2000);
  await page.screenshot({ path: join(DOCS_DIR, 'cover.png') });
  console.log('  ✓ Saved docs/cover.png');

  // Click "Start Experience" button
  console.log('[capture] Entering main experience...');
  const startBtn = await page.$('button');
  if (startBtn) {
    await startBtn.click();
    await wait(2500);
  }

  // 2. Main Experience & 3D Globe
  console.log('[capture] Capturing 01-hero-globe.png...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await wait(1500);
  await page.screenshot({ path: join(SHOTS_DIR, '01-hero-globe.png') });
  console.log('  ✓ Saved docs/screenshots/01-hero-globe.png');

  // 3. Mission Control Close-up
  console.log('[capture] Capturing 02-mission-control.png...');
  await page.screenshot({ path: join(SHOTS_DIR, '02-mission-control.png') });
  console.log('  ✓ Saved docs/screenshots/02-mission-control.png');

  // 4. "What Am I Hearing?" Explainer Modal
  console.log('[capture] Opening Explainer Modal...');
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('What am I hearing')) {
      await b.click();
      await wait(1000);
      break;
    }
  }
  await page.screenshot({ path: join(SHOTS_DIR, '03-explainer-bilingual.png') });
  console.log('  ✓ Saved docs/screenshots/03-explainer-bilingual.png');

  // Close Explainer & Open Classroom Mode
  const closeBtn = await page.$('button[aria-label="Close explainer"]');
  if (closeBtn) await closeBtn.click();
  await wait(500);

  console.log('[capture] Opening Classroom Mode...');
  const buttons2 = await page.$$('button');
  for (const b of buttons2) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Classroom')) {
      await b.click();
      await wait(1000);
      break;
    }
  }
  await page.screenshot({ path: join(SHOTS_DIR, '04-classroom-guided.png') });
  console.log('  ✓ Saved docs/screenshots/04-classroom-guided.png');

  await browser.close();
  console.log('[capture] All screenshots captured successfully!');
}

main().catch(err => {
  console.error('[capture] Error:', err.message);
  process.exit(1);
});
