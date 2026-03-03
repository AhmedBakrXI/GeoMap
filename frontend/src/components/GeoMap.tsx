import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapPoint } from '../types/measurement';
import type { LegendEntry } from '../types/legend';
import { getPointColorMulti } from '../types/legend';

export interface ActiveLegendItem {
  entry: LegendEntry;
  visible: boolean[];
}

interface GeoMapProps {
  points: MapPoint[];
  activeLegends: ActiveLegendItem[];
  visibleIds: Set<number> | null; // null = show all
}

const DOT_RADIUS = 5;
const DEFAULT_COLOR = '#14a800';
const HIDDEN_COLOR = '#cccccc';
const DOT_FILL_OPACITY = 0.8;

// all circle markers paint on a single canvas
const canvasRenderer = L.canvas({ padding: 0.5 });

function resolveColor(
  point: MapPoint,
  activeLegends: ActiveLegendItem[],
): { color: string; opacity: number } {
  if (activeLegends.length === 0) return { color: DEFAULT_COLOR, opacity: DOT_FILL_OPACITY };
  const legendColor = getPointColorMulti(point, activeLegends);
  if (legendColor) return { color: legendColor, opacity: DOT_FILL_OPACITY };
  return { color: HIDDEN_COLOR, opacity: 0.2 };
}

export default function GeoMap({ points, activeLegends, visibleIds }: GeoMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawnCountRef = useRef(0);
  const markersRef = useRef<{ marker: L.CircleMarker; point: MapPoint }[]>([]);
  const hasFittedRef = useRef(false);

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

  const activLegendsRef = useRef(activeLegends);
  activLegendsRef.current = activeLegends;
  const visibleIdsRef = useRef(visibleIds);
  visibleIdsRef.current = visibleIds;

  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    const start = drawnCountRef.current;
    if (start >= points.length) return;

    const curLegends = activLegendsRef.current;
    const curVisible = visibleIdsRef.current;

    for (let i = start; i < points.length; i++) {
      const point = points[i];
      if (point.latitude == null || point.longitude == null) continue;

      const isVisible = curVisible === null || curVisible.has(point.id);
      const { color, opacity } = resolveColor(point, curLegends);

      const marker = L.circleMarker([point.latitude, point.longitude], {
        renderer: canvasRenderer,
        radius: DOT_RADIUS,
        color: isVisible ? color : 'transparent',
        fillColor: isVisible ? color : 'transparent',
        fillOpacity: isVisible ? opacity : 0,
        weight: isVisible ? 1 : 0,
      })
        .bindPopup(
          `<b>Time:</b> ${point.time ?? '—'}<br/>
           <b>RSRP:</b> ${point.serving_cell_ssb_rsrp ?? '—'} dBm<br/>
           <b>SNR:</b> ${point.serving_cell_sinr_rx1 ?? '—'} dB<br/>
           <b>Mode:</b> ${point.multi_rat_connectivity_mode ?? '—'}`,
        )
        .addTo(layer);

      markersRef.current.push({ marker, point });
    }

    drawnCountRef.current = points.length;

    // Fit bounds once
    if (!hasFittedRef.current && markersRef.current.length > 0) {
      const coords = markersRef.current
        .filter((m) => m.point.latitude != null && m.point.longitude != null)
        .map((m) => [m.point.latitude!, m.point.longitude!] as L.LatLngTuple);
      if (coords.length > 0) {
        map.fitBounds(L.latLngBounds(coords), { padding: [20, 20] });
        hasFittedRef.current = true;
      }
    }
  }, [points]); // only fires when new points are appended

  // Restyle All markers when legend or time-filter changes
  useEffect(() => {
    for (const { marker, point } of markersRef.current) {
      const isVisible = visibleIds === null || visibleIds.has(point.id);
      if (isVisible) {
        const { color, opacity } = resolveColor(point, activeLegends);
        marker.setStyle({ color, fillColor: color, fillOpacity: opacity, weight: 1 });
      } else {
        marker.setStyle({ color: 'transparent', fillColor: 'transparent', fillOpacity: 0, weight: 0 });
      }
    }
  }, [activeLegends, visibleIds]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  );
}
