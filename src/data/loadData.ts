import type { GistempDataset, AnomalyRecord } from './types';
import { validateDataset } from './validate';

let cachedDataset: GistempDataset | null = null;

export async function loadGistempData(): Promise<GistempDataset> {
  if (cachedDataset) return cachedDataset;

  const res = await fetch('/data/gistemp.json');
  if (!res.ok) {
    throw new Error(`Failed to load NASA GISTEMP dataset (HTTP ${res.status}). Make sure public/data/gistemp.json exists.`);
  }

  const json: GistempDataset = await res.json();
  const validation = validateDataset(json);

  if (!validation.valid) {
    throw new Error(`Data validation failed: ${validation.errors.join('; ')}`);
  }

  // Ensure sorted by year
  json.data = [...json.data].sort((a, b) => a.year - b.year);
  cachedDataset = json;
  return json;
}

export function getRecordForYear(data: AnomalyRecord[], year: number): AnomalyRecord | undefined {
  return data.find(r => r.year === year);
}
