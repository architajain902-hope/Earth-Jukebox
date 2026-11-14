/**
 * Real NASA GISTEMP temperature anomaly data types
 */

export interface AnomalyRecord {
  year: number;
  anomaly: number; // °C relative to 1951-1980 baseline (J-D annual mean)
}

export interface GistempDataset {
  source: string;
  citation: string;
  url: string;
  fetchedAt: string;
  baseline: string;
  unit: string;
  data: AnomalyRecord[];
}
