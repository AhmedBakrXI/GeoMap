import type { LegendConfig } from '../types/legend';

const CONFIG_STORAGE_KEY = 'geomap-legend-config';

/** Save legend config as JSON in localStorage. */
export function saveLegendConfig(config: LegendConfig): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

/** Load legend config from localStorage, or return a default empty config. */
export function loadLegendConfig(): LegendConfig {
  const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (!raw) return { legends: [] };
  try {
    const parsed = JSON.parse(raw) as LegendConfig;
    if (!parsed || !Array.isArray(parsed.legends)) return { legends: [] };
    return parsed;
  } catch {
    return { legends: [] };
  }
}

/** Clear stored legend config. */
export function clearLegendConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}
