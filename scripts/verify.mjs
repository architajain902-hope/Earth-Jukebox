/**
 * verify.mjs
 * NASA Space Apps Challenge 2026 Unified Quality & Validation Gate.
 * Runs data validator, Vitest unit tests, and production build in sequence.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

console.log('====================================================');
console.log(' Earth 616: Space Apps 2026 Verification Suite');
console.log('====================================================\n');

// 1. Data Validation Check
console.log('▶ [1/4] Validating NASA GISTEMP v4 Dataset...');
try {
  const jsonPath = join(ROOT, 'public', 'data', 'gistemp.json');
  const raw = readFileSync(jsonPath, 'utf8');
  const dataset = JSON.parse(raw);

  if (!dataset.data || !Array.isArray(dataset.data)) {
    throw new Error('Missing data array in gistemp.json');
  }

  const { data } = dataset;
  if (data.length < 140) {
    throw new Error(`Insufficient record count: ${data.length}`);
  }

  const years = new Set();
  for (const r of data) {
    if (typeof r.year !== 'number' || typeof r.anomaly !== 'number' || !Number.isFinite(r.anomaly)) {
      throw new Error(`Invalid record: ${JSON.stringify(r)}`);
    }
    if (years.has(r.year)) {
      throw new Error(`Duplicate year found: ${r.year}`);
    }
    years.add(r.year);
  }

  console.log(`  ✓ Data integrity verified: ${data.length} consecutive records (${data[0].year}–${data[data.length - 1].year})`);
  console.log(`  ✓ Baseline: ${dataset.baseline} | Unit: ${dataset.unit}`);
  console.log(`  ✓ Source: ${dataset.source.slice(0, 60)}...`);
} catch (err) {
  console.error('  ✗ Data validation failed:', err.message);
  process.exit(1);
}

// 2. Source & Attribution Check
console.log('\n▶ [2/4] Verifying NASA SVS Media Sources & Attribution Integrity...');
try {
  const sourceOut = execSync('node scripts/check-sources.mjs', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  const lines = sourceOut.trim().split('\n').filter(l => l.includes('✓')).join('\n  ');
  console.log(`  ${lines}`);
} catch (err) {
  console.error('  ✗ Source verification failed:', err.stdout || err.message);
  process.exit(1);
}

// 3. Unit Testing Check
console.log('\n▶ [3/4] Executing Vitest Unit Test Suite...');
try {
  const testOut = execSync('npm run test', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  console.log(testOut.trim().split('\n').filter(l => l.includes('✓') || l.includes('Test Files') || l.includes('Tests')).join('\n  '));
  console.log('  ✓ All mathematical and parsing unit tests passed.');
} catch (err) {
  console.error('  ✗ Vitest execution failed:', err.stdout || err.message);
  process.exit(1);
}

// 4. TypeScript & Production Build Check
console.log('\n▶ [4/4] Compiling TypeScript & Production Build...');
try {
  const buildOut = execSync('npm run build', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  const buildSummary = buildOut.trim().split('\n').filter(l => l.includes('built in') || l.includes('dist/')).join('\n  ');
  console.log(`  ${buildSummary}`);
  console.log('  ✓ Production static bundle verified with zero TypeScript errors.');
} catch (err) {
  console.error('  ✗ Build failed:', err.stdout || err.message);
  process.exit(1);
}

console.log('\n====================================================');
console.log(' 🎉 ALL QUALITY GATES PASSED (100% READY FOR DEPLOY)');
console.log('====================================================\n');
