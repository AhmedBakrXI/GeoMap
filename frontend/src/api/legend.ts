import yaml from 'js-yaml';
import type { LegendConfig } from '../types/legend';

export async function fetchLegendConfig(): Promise<LegendConfig> {
  const res = await fetch('/legend.yaml');
  if (!res.ok) throw new Error(`Failed to fetch legend.yaml: ${res.status}`);
  const text = await res.text();
  const parsed = yaml.load(text) as LegendConfig;

  for (const entry of parsed.legends) {
    if (entry.type === 'numeric') {
      for (const t of entry.thresholds as { min: any; max: any; color: string }[]) {
        if (t.min == null || t.min === '-Infinity' || t.min === '-.inf') t.min = -Infinity;
        if (t.max == null || t.max === 'Infinity' || t.max === '.inf') t.max = Infinity;
      }
    }
  }

  return parsed;
}
