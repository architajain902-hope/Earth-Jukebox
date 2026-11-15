import puppeteer from 'puppeteer-core';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SRC_IMG = 'C:/Users/PUBLIC.SURAJ-TOMAR/.gemini/antigravity/brain/3b2bf052-fdfd-4d43-b6f3-a8705ec0ffa2/.user_uploaded/media_1794709543925_86d2d29d.jpg';
const BRANDING_DIR = join(process.cwd(), 'public', 'branding');
const DOCS_DIR = join(process.cwd(), 'docs');

if (!existsSync(BRANDING_DIR)) {
  mkdirSync(BRANDING_DIR, { recursive: true });
}

// 1. Copy original to public/branding/sonix-logo.png & docs/cover.png
copyFileSync(SRC_IMG, join(BRANDING_DIR, 'sonix-logo.png'));
copyFileSync(SRC_IMG, join(DOCS_DIR, 'cover.png'));
copyFileSync(SRC_IMG, join(BRANDING_DIR, 'og-image.png'));
console.log('✓ Copied sonix-logo.png and cover.png');

// 2. Launch headless browser to render resized favicon 32x32 and 192x192
const CHROME_PATH = existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function resize() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  const fileUrl = 'file:///' + SRC_IMG.replace(/\\/g, '/');

  // Generate 192x192
  await page.setViewport({ width: 192, height: 192 });
  await page.setContent(`
    <body style="margin:0;padding:0;background:transparent;overflow:hidden;">
      <img src="${fileUrl}" style="width:192px;height:192px;object-fit:cover;display:block;" />
    </body>
  `);
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: join(BRANDING_DIR, 'favicon-192x192.png'), omitBackground: true });

  // Generate 32x32
  await page.setViewport({ width: 32, height: 32 });
  await page.setContent(`
    <body style="margin:0;padding:0;background:transparent;overflow:hidden;">
      <img src="${fileUrl}" style="width:32px;height:32px;object-fit:cover;display:block;" />
    </body>
  `);
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: join(BRANDING_DIR, 'favicon-32x32.png'), omitBackground: true });
  await page.screenshot({ path: join(process.cwd(), 'public', 'favicon.png'), omitBackground: true });

  await browser.close();
  console.log('✓ Resized favicons generated (32x32 and 192x192)');
}

resize().catch(console.error);
