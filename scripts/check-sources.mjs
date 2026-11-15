/**
 * check-sources.mjs
 * NASA Space Apps Challenge 2026 Source & Attribution Integrity Gate.
 * Verifies that:
 * 1. Every frame in public/frames/frames.json has a valid source entry in sources.json.
 * 2. Every sourceUrl in public/frames/sources.json is a valid https URL.
 * 3. Every verified SVS URL in documentation matches sources.json exactly.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

export function checkSourcesIntegrity() {
  const errors = [];
  const sourcesPath = join(ROOT, 'public', 'frames', 'sources.json');
  const framesPath = join(ROOT, 'public', 'frames', 'frames.json');

  if (!existsSync(sourcesPath)) {
    throw new Error(`Missing sources.json at ${sourcesPath}`);
  }
  if (!existsSync(framesPath)) {
    throw new Error(`Missing frames.json at ${framesPath}`);
  }

  const sources = JSON.parse(readFileSync(sourcesPath, 'utf8'));
  const frames = JSON.parse(readFileSync(framesPath, 'utf8'));

  // 1. Verify sources.json entries
  const sourceKeys = Object.keys(sources);
  if (sourceKeys.length === 0) {
    errors.push('sources.json contains no source records');
  }

  for (const [key, src] of Object.entries(sources)) {
    if (!src.id) errors.push(`Source ${key} missing id`);
    if (!src.title) errors.push(`Source ${key} missing title`);
    if (!src.credit) errors.push(`Source ${key} missing credit`);
    if (!src.sourceUrl || !src.sourceUrl.startsWith('https://')) {
      errors.push(`Source ${key} has invalid sourceUrl: ${src.sourceUrl}`);
    }
  }

  // 2. Verify frames.json entries
  for (const frame of frames) {
    if (!frame.id) errors.push(`Frame missing id: ${JSON.stringify(frame)}`);
    if (!frame.sourceId) {
      errors.push(`Frame ${frame.id} missing sourceId`);
    } else if (!sources[frame.sourceId]) {
      errors.push(`Frame ${frame.id} references non-existent sourceId: "${frame.sourceId}"`);
    }

    if (!frame.sourceUrl || !frame.sourceUrl.startsWith('https://')) {
      errors.push(`Frame ${frame.id} has invalid sourceUrl: ${frame.sourceUrl}`);
    }
  }

  // 3. Verify documentation URLs match sources.json exactly
  const verifiedUrls = Object.values(sources).map((s) => s.sourceUrl);
  const docFiles = [
    join(ROOT, 'README.md'),
    join(ROOT, 'REFERENCES.md'),
    join(ROOT, 'REFERENCES_PORTAL.txt'),
    join(ROOT, 'SUBMISSION.md'),
    join(ROOT, 'src', 'ui', 'AboutModal.tsx'),
  ];

  for (const docPath of docFiles) {
    if (!existsSync(docPath)) continue;
    const content = readFileSync(docPath, 'utf8');

    for (const url of verifiedUrls) {
      // If the document references the SVS ID (e.g. 5313, 3912, 5425), it must match the canonical URL
      const svsMatch = url.match(/svs\.gsfc\.nasa\.gov\/(\d+)\//);
      if (svsMatch) {
        const svsId = svsMatch[1];
        if (content.includes(`svs.gsfc.nasa.gov/${svsId}`) && !content.includes(url)) {
          errors.push(`File ${docPath} contains mismatched SVS URL for ID ${svsId} (expected ${url})`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sourceCount: sourceKeys.length,
    frameCount: frames.length,
  };
}

// When executed directly via node scripts/check-sources.mjs
if (process.argv[1] && process.argv[1].endsWith('check-sources.mjs')) {
  console.log('▶ Checking NASA media sources and attribution integrity...');
  try {
    const report = checkSourcesIntegrity();
    if (!report.valid) {
      console.error('  ✗ Source integrity checks failed:');
      report.errors.forEach((e) => console.error(`    - ${e}`));
      process.exit(1);
    }
    console.log(`  ✓ Verified ${report.sourceCount} NASA sources and ${report.frameCount} visual frames.`);
    console.log('  ✓ All source URLs are valid HTTPS endpoints and match documentation.');
  } catch (err) {
    console.error('  ✗ Source check error:', err.message);
    process.exit(1);
  }
}
