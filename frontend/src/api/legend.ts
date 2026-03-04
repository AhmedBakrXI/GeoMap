import yaml from 'js-yaml';
import type { LegendConfig } from '../types/legend';

const YAML_STORAGE_KEY = 'geomap-legend-yaml';

export function parseLegendYaml(text: string): LegendConfig {
  const parsed = yaml.load(text) as LegendConfig;

  if (!parsed || !Array.isArray(parsed.legends)) {
    throw new Error("YAML must contain a top-level 'legends' array");
  }

  for (const entry of parsed.legends) {
    if (entry.type === 'numeric') {
      for (const t of entry.thresholds as { min: number | string | null; max: number | string | null; color: string }[]) {
        if (t.min == null || t.min === '-Infinity' || t.min === '-.inf') t.min = -Infinity;
        if (t.max == null || t.max === 'Infinity' || t.max === '.inf') t.max = Infinity;
      }
    }
  }

  return parsed;
}

export async function fetchDefaultLegendYaml(): Promise<string> {
  const res = await fetch('/legend.yaml');
  if (!res.ok) throw new Error(`Failed to fetch legend.yaml: ${res.status}`);
  return res.text();
}

export async function fetchLegendConfig(): Promise<LegendConfig> {
  const saved = loadLegendYaml();
  if (saved) return parseLegendYaml(saved);
  const text = await fetchDefaultLegendYaml();
  return parseLegendYaml(text);
}

export function saveLegendYaml(yamlText: string): void {
  localStorage.setItem(YAML_STORAGE_KEY, yamlText);
}

export function loadLegendYaml(): string | null {
  return localStorage.getItem(YAML_STORAGE_KEY);
}

export function clearLegendYaml(): void {
  localStorage.removeItem(YAML_STORAGE_KEY);
}
