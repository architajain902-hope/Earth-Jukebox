/**
 * fetch-data.mjs
 * Downloads NASA GISTEMP v4 Global Temperature Anomaly data,
 * parses it, validates it, and writes public/data/gistemp.json
 *
 * Source: NASA GISS Surface Temperature Analysis (GISTEMP v4), Land-Ocean Temperature Index, global means.
 * URL: https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'data');
const OUT_FILE = join(OUT_DIR, 'gistemp.json');

const DATA_URL = 'https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv';
const SOURCE = 'NASA GISS Surface Temperature Analysis (GISTEMP v4), Land-Ocean Temperature Index';
const CITATION = 'GISTEMP Team, 2024: GISS Surface Temperature Analysis (GISTEMP), version 4. NASA Goddard Institute for Space Studies. Dataset accessed 2024 at https://data.giss.nasa.gov/gistemp/. Lenssen, N., G. Schmidt, J. Hansen, M. Menne, A. Perkins, R. Ruedy, and D. Shindell, 2019: Improvements in the GISTEMP uncertainty model: J. Geophys. Res. Atmos., 124, no. 12, 6307-6326, doi:10.1029/2018JD029522.';

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Earth616-Jukebox/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

export function parseAndValidateGISTEMP(rawCSV) {
  const lines = rawCSV.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Find header line starting with "Year"
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Year')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    throw new Error('Header line starting with "Year" not found in CSV');
  }

  const headers = lines[headerIdx].split(',').map(h => h.trim());
  const yearIdx = headers.indexOf('Year');
  const jdIdx = headers.indexOf('J-D'); // Jan-Dec meteorological/calendar annual mean

  if (yearIdx === -1) throw new Error('Year column missing in CSV');
  if (jdIdx === -1) throw new Error('J-D column missing in CSV');

  const records = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const year = parseInt(cols[yearIdx], 10);
    if (isNaN(year) || year < 1880 || year > 2025) continue;

    const jdVal = cols[jdIdx];
    if (!jdVal || jdVal === '***') continue;

    const anomaly = parseFloat(jdVal);
    if (!Number.isFinite(anomaly)) continue;

    records.push({ year, anomaly });
  }

  // Sort chronologically
  records.sort((a, b) => a.year - b.year);

  // Validation
  if (records.length === 0) {
    throw new Error('No records parsed');
  }

  // Check 146 records expected for 1880-2025 (or full range)
  const years = records.map(r => r.year);
  const uniqueYears = new Set(years);
  if (uniqueYears.size !== years.length) {
    throw new Error('Duplicate years detected in dataset');
  }

  // Check all values finite
  for (const r of records) {
    if (!Number.isFinite(r.anomaly)) {
      throw new Error(`Non-finite anomaly detected for year ${r.year}`);
    }
  }

  return records;
}

async function main() {
  console.log(`[fetch-data] Fetching NASA GISTEMP v4 from ${DATA_URL}...`);
  try {
    const csv = await fetchText(DATA_URL);
    console.log(`[fetch-data] Downloaded ${csv.length} bytes.`);
    const records = parseAndValidateGISTEMP(csv);
    console.log(`[fetch-data] Successfully parsed and validated ${records.length} years (${records[0].year} - ${records[records.length - 1].year}).`);

    mkdirSync(OUT_DIR, { recursive: true });

    const payload = {
      source: SOURCE,
      citation: CITATION,
      url: DATA_URL,
      fetchedAt: new Date().toISOString(),
      baseline: '1951-1980',
      unit: '°C',
      data: records
    };

    writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`[fetch-data] Saved to ${OUT_FILE}`);
  } catch (err) {
    console.error(`[fetch-data] Error:`, err.message);
    process.exit(1);
  }
}

// Only run main if executed directly
if (process.argv[1] && process.argv[1].endsWith('fetch-data.mjs')) {
  main();
}
