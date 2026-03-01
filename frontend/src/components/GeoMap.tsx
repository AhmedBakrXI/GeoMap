import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapPoint } from '../types/measurement';

interface GeoMapProps {
  points: MapPoint[];
}

const DOT_RADIUS = 5;
const DOT_COLOR = '#14a800';
const DOT_FILL_OPACITY = 0.8;

export default function GeoMap({ points }: GeoMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([28.0, 34.4], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when points change
  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();

    const validPoints = points.filter(
      (p) => p.latitude != null && p.longitude != null,
    );

    for (const point of validPoints) {
      L.circleMarker([point.latitude!, point.longitude!], {
        radius: DOT_RADIUS,
        color: DOT_COLOR,
        fillColor: DOT_COLOR,
        fillOpacity: DOT_FILL_OPACITY,
        weight: 1,
      })
        .bindPopup(
          `<b>Time:</b> ${point.time ?? '—'}<br/>
           <b>RSRP:</b> ${point.serving_cell_ssb_rsrp ?? '—'} dBm<br/>
           <b>SNR:</b> ${point.serving_cell_ssb_snr ?? '—'} dB<br/>
           <b>Mode:</b> ${point.multi_rat_connectivity_mode ?? '—'}`,
        )
        .addTo(layer);
    }

    // Fit map bounds to the points
    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(
        validPoints.map((p) => [p.latitude!, p.longitude!] as L.LatLngTuple),
      );
      map.fitBounds(bounds, { padding: [0, 0] });
    }
  }, [points]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  );
}
