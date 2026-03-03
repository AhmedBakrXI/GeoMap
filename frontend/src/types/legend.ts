import type { MapPoint } from './measurement';


// YAML Template

export interface NumericThreshold {
  min: number;
  max: number;
  color: string;
}

export interface StringThreshold {
  value: string;
  color: string;
}

export interface LegendEntry {
  name: string;
  field: keyof MapPoint;
  type: 'numeric' | 'string';
  thresholds: NumericThreshold[] | StringThreshold[];
}

export interface LegendConfig {
  legends: LegendEntry[];
}

// Active Legend State

export interface LegendState {
  // Which legend entries are currently active
  activeIndices: number[];
  visibleThresholds: Record<number, boolean[]>;
}


const STORAGE_KEY = 'geomap-legend-state';

export function saveLegendState(state: LegendState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadLegendState(): LegendState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Validate shape
    if (!Array.isArray(parsed.activeIndices)) return null;
    if (typeof parsed.visibleThresholds !== 'object') return null;
    return parsed as LegendState;
  } catch {
    return null;
  }
}

export function buildDefaultState(config: LegendConfig): LegendState {
  const visibleThresholds: Record<number, boolean[]> = {};
  config.legends.forEach((entry, i) => {
    visibleThresholds[i] = entry.thresholds.map(() => true);
  });
  return { activeIndices: [], visibleThresholds };
}

/**
 * Given a point and a single legend entry, return the dot color
 * or null if the point doesn't match any visible threshold.
 */
export function getPointColor(
  point: MapPoint,
  entry: LegendEntry,
  visible: boolean[],
): string | null {
  const val = point[entry.field];
  if (val == null) return null;

  if (entry.type === 'numeric') {
    const num = Number(val);
    if (isNaN(num)) return null;
    const thresholds = entry.thresholds as NumericThreshold[];
    for (let i = 0; i < thresholds.length; i++) {
      if (!visible[i]) continue;
      const t = thresholds[i];
      if (num >= t.min && num < t.max) return t.color;
    }
  } else {
    const str = String(val);
    const thresholds = entry.thresholds as StringThreshold[];
    for (let i = 0; i < thresholds.length; i++) {
      if (!visible[i]) continue;
      if (str.includes(thresholds[i].value)) return thresholds[i].color;
    }
  }

  return null;
}

/**
 * Given a point and ALL ACTIVE legend entries, 
 * return the color from the first legend that matches. 
 * Returns null if none match.
 */
export function getPointColorMulti(
  point: MapPoint,
  activeLegends: { entry: LegendEntry; visible: boolean[] }[],
): string | null {
  for (const { entry, visible } of activeLegends) {
    const color = getPointColor(point, entry, visible);
    if (color) return color;
  }
  return null;
}

/** Format a numeric bound for display */
export function formatBound(n: number): string {
  if (n === -Infinity) return '-Infinity';
  if (n === Infinity) return 'Infinity';
  return String(n);
}
