import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapPoint } from '../types/measurement';
import { MANDATORY_FIELDS, fieldLabel } from '../types/measurement';
import type { LegendEntry } from '../types/legend';
import { getPointColor, getPointColorMulti } from '../types/legend';

export interface ActiveLegendItem {
  entry: LegendEntry;
  visible: boolean[];
}

interface GeoMapProps {
  points: MapPoint[];
  activeLegends: ActiveLegendItem[];
  visibleIds: Set<number> | null; // null = show all
  selectedFields?: string[];
}

const DOT_RADIUS = 5;
const DEFAULT_COLOR = '#14a800';
const HIDDEN_COLOR = '#cccccc';
const DOT_FILL_OPACITY = 0.8;

/** Pixel distance each legend lane is offset from the original path. */
const LEGEND_OFFSET_PX = 20;

// all circle markers paint on a single canvas
const canvasRenderer = L.canvas({ padding: 0.5 });

/* ---------- helpers ---------- */

function resolveColorSingle(
  point: MapPoint,
  activeLegends: ActiveLegendItem[],
): { color: string; opacity: number } {
  if (activeLegends.length === 0) return { color: DEFAULT_COLOR, opacity: DOT_FILL_OPACITY };
  const legendColor = getPointColorMulti(point, activeLegends);
  if (legendColor) return { color: legendColor, opacity: DOT_FILL_OPACITY };
  return { color: HIDDEN_COLOR, opacity: 0.2 };
}

/** Convert a pixel offset to a lat/lng delta at the given zoom & latitude. */
function pxDelta(dx: number, dy: number, lat: number, zoom: number): [number, number] {
  const scale = 256 * Math.pow(2, zoom);
  const dlat = -dy * 360 / scale;
  const dlng = dx * 360 / (scale * Math.cos(lat * Math.PI / 180));
  return [dlat, dlng];
}

/** Compute per-legend [dlat, dlng] offsets evenly spread around the origin. */
function legendOffsets(count: number, lat: number, zoom: number): [number, number][] {
  if (count <= 1) return [[0, 0]];
  const offsets: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const dx = LEGEND_OFFSET_PX * Math.cos(angle);
    const dy = LEGEND_OFFSET_PX * Math.sin(angle);
    offsets.push(pxDelta(dx, dy, lat, zoom));
  }
  return offsets;
}

/* ---------- types for internal marker tracking ---------- */

interface MarkerEntry {
  marker: L.CircleMarker;
  point: MapPoint;
  /** Index into activeLegends; -1 = single/no-legend mode */
  legendIdx: number;
}

/* ---------- component ---------- */

export default function GeoMap({ points, activeLegends, visibleIds, selectedFields }: GeoMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const hasFittedRef = useRef(false);
  /** How many points from `points` have been drawn in the *current* mode */
  const drawnCountRef = useRef(0);
  /** Track the active mode so we know when to rebuild (single vs multi-legend). */
  const legendCountRef = useRef(0);

  // Stable refs for current values (avoid stale closures)
  const activLegendsRef = useRef(activeLegends);
  activLegendsRef.current = activeLegends;
  const visibleIdsRef = useRef(visibleIds);
  visibleIdsRef.current = visibleIds;
  const selectedFieldsRef = useRef(selectedFields);
  selectedFieldsRef.current = selectedFields;

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      preferCanvas: true,
    }).setView([28.0, 34.4], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      drawnCountRef.current = 0;
      markersRef.current = [];
      hasFittedRef.current = false;
    };
  }, []);

  /* ---- helper: add markers for a slice of points ---- */
  const addMarkers = (
    startIdx: number,
    layer: L.LayerGroup,
    map: L.Map,
    curLegends: ActiveLegendItem[],
    curVisible: Set<number> | null,
  ) => {
    const multiMode = curLegends.length > 1;
    const zoom = map.getZoom();

    // Pre-compute offsets once for this batch
    const midLat = points.length > 0 && points[0].latitude != null ? points[0].latitude : 28;
    const offsets = multiMode ? legendOffsets(curLegends.length, midLat as number, zoom) : [[0, 0]] as [number, number][];

    for (let i = startIdx; i < points.length; i++) {
      const point = points[i];
      if (point.latitude == null || point.longitude == null) continue;
      const isVisible = curVisible === null || curVisible.has(point.id);

      if (multiMode) {
        // One marker per legend
        for (let li = 0; li < curLegends.length; li++) {
          const legend = curLegends[li];
          const color = getPointColor(point, legend.entry, legend.visible);
          const show = isVisible && color != null;

          const lat = (point.latitude as number) + offsets[li][0];
          const lng = (point.longitude as number) + offsets[li][1];

          const marker = L.circleMarker([lat, lng], {
            renderer: canvasRenderer,
            radius: DOT_RADIUS,
            color: show ? color! : 'transparent',
            fillColor: show ? color! : 'transparent',
            fillOpacity: show ? DOT_FILL_OPACITY : 0,
            weight: show ? 1 : 0,
          })
            .bindPopup(() => buildPopup(point, legend.entry))
            .addTo(layer);

          markersRef.current.push({ marker, point, legendIdx: li });
        }
      } else {
        // Single / no legend mode – one marker per point
        const { color, opacity } = resolveColorSingle(point, curLegends);
        const marker = L.circleMarker([point.latitude as number, point.longitude as number], {
          renderer: canvasRenderer,
          radius: DOT_RADIUS,
          color: isVisible ? color : 'transparent',
          fillColor: isVisible ? color : 'transparent',
          fillOpacity: isVisible ? opacity : 0,
          weight: isVisible ? 1 : 0,
        })
          .bindPopup(() => buildPopup(point))
          .addTo(layer);

        markersRef.current.push({ marker, point, legendIdx: -1 });
      }
    }
  };

  /** Build HTML popup content for a marker */
  const buildPopup = (point: MapPoint, legendEntry?: LegendEntry): string => {
    const mandatorySet = new Set(MANDATORY_FIELDS);
    const sf = selectedFieldsRef.current ?? [];
    let extras = sf
      .filter(f => !mandatorySet.has(f as typeof MANDATORY_FIELDS[number]) && point[f] != null)
      .map(f => `<b>${fieldLabel(f)}:</b> ${point[f]}`)
      .join('<br/>');
    if (legendEntry) {
      const val = point[legendEntry.field];
      extras = `<b>${fieldLabel(legendEntry.field.toString())}:</b> ${val ?? '—'}<br/>` + extras;
    }
    return `<b>${fieldLabel('time')}:</b> ${point.time ?? '—'}<br/>${extras || ''}`;
  };

  /** Clear all markers and reset counters */
  const clearMarkers = () => {
    const layer = layerRef.current;
    if (layer) layer.clearLayers();
    markersRef.current = [];
    drawnCountRef.current = 0;
  };

  /* ---- Draw new points incrementally ---- */
  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    const curLegends = activLegendsRef.current;
    const curVisible = visibleIdsRef.current;
    const multiMode = curLegends.length > 1;

    // If the legend mode changed, rebuild everything
    const prevCount = legendCountRef.current;
    const newCount = curLegends.length;
    if ((prevCount > 1) !== (newCount > 1) || (multiMode && prevCount !== newCount)) {
      clearMarkers();
      legendCountRef.current = newCount;
    }

    const start = drawnCountRef.current;
    if (start >= points.length) return;

    addMarkers(start, layer, map, curLegends, curVisible);
    drawnCountRef.current = points.length;

    // Fit bounds once
    if (!hasFittedRef.current && markersRef.current.length > 0) {
      const coords = markersRef.current
        .filter(m => m.point.latitude != null && m.point.longitude != null)
        .map(m => [m.point.latitude!, m.point.longitude!] as L.LatLngTuple);
      if (coords.length > 0) {
        map.fitBounds(L.latLngBounds(coords), { padding: [20, 20] });
        hasFittedRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  /* ---- Full rebuild when active legends change ---- */
  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    clearMarkers();
    legendCountRef.current = activeLegends.length;
    addMarkers(0, layer, map, activeLegends, visibleIds);
    drawnCountRef.current = points.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLegends]);

  /* ---- Restyle markers when visibility (time filter) changes ---- */
  useEffect(() => {
    const multiMode = activeLegends.length > 1;
    for (const { marker, point, legendIdx } of markersRef.current) {
      const isVisible = visibleIds === null || visibleIds.has(point.id);
      if (!isVisible) {
        marker.setStyle({ color: 'transparent', fillColor: 'transparent', fillOpacity: 0, weight: 0 });
        continue;
      }
      if (multiMode && legendIdx >= 0) {
        const legend = activeLegends[legendIdx];
        if (!legend) continue;
        const color = getPointColor(point, legend.entry, legend.visible);
        if (color) {
          marker.setStyle({ color, fillColor: color, fillOpacity: DOT_FILL_OPACITY, weight: 1 });
        } else {
          marker.setStyle({ color: 'transparent', fillColor: 'transparent', fillOpacity: 0, weight: 0 });
        }
      } else {
        const { color, opacity } = resolveColorSingle(point, activeLegends);
        marker.setStyle({ color, fillColor: color, fillOpacity: opacity, weight: 1 });
      }
    }
  }, [visibleIds, activeLegends]);

  /* ---- Reposition offset markers on zoom change ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onZoomEnd = () => {
      if (activLegendsRef.current.length <= 1) return; // no offsets in single mode
      const count = activLegendsRef.current.length;
      const zoom = map.getZoom();
      const midLat = markersRef.current.length > 0 && markersRef.current[0].point.latitude != null
        ? markersRef.current[0].point.latitude as number
        : 28;
      const offsets = legendOffsets(count, midLat, zoom);

      for (const entry of markersRef.current) {
        if (entry.legendIdx < 0 || entry.point.latitude == null || entry.point.longitude == null) continue;
        const off = offsets[entry.legendIdx];
        if (!off) continue;
        entry.marker.setLatLng([
          (entry.point.latitude as number) + off[0],
          (entry.point.longitude as number) + off[1],
        ]);
      }
    };

    map.on('zoomend', onZoomEnd);
    return () => { map.off('zoomend', onZoomEnd); };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  );
}
