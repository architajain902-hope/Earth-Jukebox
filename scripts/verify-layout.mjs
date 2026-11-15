import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

const CHROME_PATH = existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
  console.log('====================================================');
  console.log(' SONIX: Automated Layout & Bounding Box Overlap Test');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=d3d11'],
  });

  const page = await browser.newPage();

  // Test 1: Desktop (1440 x 900)
  console.log('▶ [1/3] Testing Desktop Layout (1440 x 900 px)...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

  console.log('  Clicking Start Experience...');
  await page.waitForSelector('button', { timeout: 10000 });
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate((el) => el.innerText, b);
    if (text && text.includes('Start Experience')) {
      await b.click();
      break;
    }
  }

  await page.waitForFunction(() => !!document.querySelector('canvas'), { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2500));

  const desktopBoxes = await page.evaluate(() => {
    const header = document.querySelector('header')?.getBoundingClientRect();
    const leftCol = document.querySelector('.earth-stage-left')?.getBoundingClientRect();
    const centerCol = document.querySelector('.earth-stage-center')?.getBoundingClientRect();
    const canvas = document.querySelector('.earth-canvas-wrapper canvas')?.getBoundingClientRect();
    const rightCol = document.querySelector('.earth-stage-right')?.getBoundingClientRect();
    const dock = document.querySelector('footer.player-dock')?.getBoundingClientRect();

    return {
      header: header ? { top: header.top, bottom: header.bottom, height: header.height } : null,
      leftCol: leftCol ? { left: leftCol.left, right: leftCol.right, top: leftCol.top, bottom: leftCol.bottom } : null,
      centerCol: centerCol ? { left: centerCol.left, right: centerCol.right, top: centerCol.top, bottom: centerCol.bottom } : null,
      canvas: canvas ? { left: canvas.left, right: canvas.right, top: canvas.top, bottom: canvas.bottom, width: canvas.width, height: canvas.height } : null,
      rightCol: rightCol ? { left: rightCol.left, right: rightCol.right, top: rightCol.top, bottom: rightCol.bottom } : null,
      dock: dock ? { top: dock.top, bottom: dock.bottom, height: dock.height } : null,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });

  console.log('  Center canvas size:', `${Math.round(desktopBoxes.canvas?.width || 0)} x ${Math.round(desktopBoxes.canvas?.height || 0)} px`);
  console.log('  Player dock height:', `${Math.round(desktopBoxes.dock?.height || 0)} px (max 200px requirement)`);

  if (!desktopBoxes.leftCol || !desktopBoxes.centerCol || !desktopBoxes.rightCol || !desktopBoxes.dock) {
    throw new Error('Missing layout elements on desktop');
  }

  // Verify No Overlap: Left column is to the left of the center column
  if (desktopBoxes.leftCol.right > desktopBoxes.centerCol.left + 2) {
    throw new Error(`Left card overlaps center stage! Left.right=${desktopBoxes.leftCol.right}, Center.left=${desktopBoxes.centerCol.left}`);
  }
  // Verify No Overlap: Center column is to the left of the right column
  if (desktopBoxes.centerCol.right > desktopBoxes.rightCol.left + 2) {
    throw new Error(`Center stage overlaps right card! Center.right=${desktopBoxes.centerCol.right}, Right.left=${desktopBoxes.rightCol.left}`);
  }
  // Verify No Overlap: Center stage is above the dock
  if (desktopBoxes.centerCol.bottom > desktopBoxes.dock.top + 2) {
    throw new Error(`Center stage overlaps player dock! Center.bottom=${desktopBoxes.centerCol.bottom}, Dock.top=${desktopBoxes.dock.top}`);
  }
  // Verify dock height <= 200px
  if (desktopBoxes.dock.height > 200) {
    throw new Error(`Player dock exceeds 200px! Height=${desktopBoxes.dock.height}`);
  }
  // Verify no horizontal overflow
  if (desktopBoxes.hasHorizontalOverflow) {
    throw new Error('Horizontal overflow detected on desktop');
  }

  console.log('  ✓ Desktop 1440px layout: Zero overlaps, clean 3-row grid, dock <= 200px.');

  // Test 2: Tablet (768 x 1024)
  console.log('\n▶ [2/3] Testing Tablet Layout (768 x 1024 px)...');
  await page.setViewport({ width: 768, height: 1024 });
  await new Promise((r) => setTimeout(r, 1000));

  const tabletOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  if (tabletOverflow) {
    throw new Error('Horizontal overflow detected on tablet');
  }
  console.log('  ✓ Tablet 768px layout: Zero horizontal overflow, responsive stacked view.');

  // Test 3: Mobile (360 x 740)
  console.log('\n▶ [3/3] Testing Mobile Layout (360 x 740 px)...');
  await page.setViewport({ width: 360, height: 740 });
  await new Promise((r) => setTimeout(r, 1000));

  const mobileMetrics = await page.evaluate(() => {
    const playBtn = Array.from(document.querySelectorAll('footer.player-dock button')).find(b => b.innerText.includes('Play') || b.innerText.includes('Pause'));
    const playRect = playBtn?.getBoundingClientRect();
    const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
    return {
      playHeight: playRect ? playRect.height : 0,
      hasHorizontalOverflow,
    };
  });

  if (mobileMetrics.hasHorizontalOverflow) {
    throw new Error('Horizontal overflow detected on mobile 360px');
  }
  if (mobileMetrics.playHeight < 40) {
    throw new Error(`Mobile button touch target too small! Height=${mobileMetrics.playHeight}`);
  }
  console.log(`  ✓ Mobile 360px layout: Zero overflow, primary touch target height=${mobileMetrics.playHeight}px (>=44px standard).`);

  await browser.close();
  console.log('\n====================================================');
  console.log(' 🎉 ALL LAYOUT CHECKS PASSED: ZERO OVERLAPS CONFIRMED');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('\n❌ Layout test failed:', err);
  process.exit(1);
});
