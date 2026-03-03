import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import GeoMap from './components/GeoMap';
import LegendPanel from './components/LegendPanel';
import RangeSlider from './components/RangeSlider';
import { connectWebSocket, fetchAllHistory } from './api/measurements';
import { fetchLegendConfig } from './api/legend';
import type { MapPoint } from './types/measurement';
import type { LegendConfig, LegendState } from './types/legend';
import { buildDefaultState, loadLegendState, saveLegendState } from './types/legend';

type AppState = 'connecting' | 'error' | 'loading-history' | 'ready';

function App() {
  const [state, setState] = useState<AppState>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [progress, setProgress] = useState({ page: 0, totalPages: 0 });
  const [sliderStart, setSliderStart] = useState(0);   // percentage 0–100
  const [sliderEnd, setSliderEnd] = useState(100);     // percentage 0–100
  const [legendConfig, setLegendConfig] = useState<LegendConfig | null>(null);
  const [legendState, setLegendState] = useState<LegendState | null>(null);
  const wsRef = useRef<{ close: () => void } | null>(null);

  // Load legend config on mount
  useEffect(() => {
    fetchLegendConfig().then((config) => {
      setLegendConfig(config);
      const saved = loadLegendState();
      setLegendState(saved ?? buildDefaultState(config));
    }).catch((err) => console.error('Failed to load legend config:', err));
  }, []);

  const handleLegendStateChange = useCallback((state: LegendState) => {
    setLegendState(state);
    saveLegendState(state);
  }, []);

  const startLoadingHistory = useCallback(async () => {
    setState('loading-history');
    try {
      const history = await fetchAllHistory(500, (_pagePoints, prog) => {
        setProgress(prog);
      });
      // Merge: history first, then any WS points that arrived during loading
      setPoints((prev) => {
        const seenIds = new Set(history.map((p) => p.id));
        const wsOnly = prev.filter((p) => !seenIds.has(p.id));
        return [...history, ...wsOnly];
      });
      setState('ready');
    } catch {
      setState('error');
      setErrorMsg('Failed to load history data.');
    }
  }, []);

  useEffect(() => {
    const ws = connectWebSocket({
      onMessage: (newPoints) => {
        console.log(`[App] Received ${newPoints.length} new points from WebSocket`);
        setPoints((prev) => [...prev, ...newPoints]);
      },
      onOpen: () => {
        startLoadingHistory();
      },
      onError: () => {
        setState('error');
        setErrorMsg('Failed to connect to WebSocket. Please check the server and try again.');
      },
      onClose: () => {
        console.log('[App] WebSocket closed');
      },
    });

    wsRef.current = ws;
    return () => ws.close();
  }, [startLoadingHistory]);

  const sortedIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < points.length; i++) {
      if (points[i].time != null) indices.push(i);
    }
    indices.sort((a, b) => points[a].time!.localeCompare(points[b].time!));
    return indices;
  }, [points]);

  // Build a Set of visible point IDs based on slider range
  const visibleIds = useMemo(() => {
    if (sortedIndices.length === 0) return null;
    if (sliderStart === 0 && sliderEnd === 100) return null; // all visible
    const startIdx = Math.round((sliderStart / 100) * (sortedIndices.length - 1));
    const endIdx = Math.round((sliderEnd / 100) * (sortedIndices.length - 1));
    const ids = new Set<number>();
    for (let i = startIdx; i <= endIdx; i++) {
      ids.add(points[sortedIndices[i]].id);
    }
    return ids;
  }, [points, sortedIndices, sliderStart, sliderEnd]);

  const lastPointTime = points.length > 0
    ? points[points.length - 1].time ?? '—'
    : null;

  // Slider range labels
  const sliderStartTime = sortedIndices.length > 0
    ? points[sortedIndices[Math.round((sliderStart / 100) * (sortedIndices.length - 1))]]?.time
    : null;
  const sliderEndTime = sortedIndices.length > 0
    ? points[sortedIndices[Math.round((sliderEnd / 100) * (sortedIndices.length - 1))]]?.time
    : null;

  // All active legend entries for GeoMap coloring
  const activeLegends = useMemo(() => {
    if (!legendConfig || !legendState) return [];
    const indices = legendState.activeIndices ?? [];
    return indices
      .filter((idx) => legendConfig.legends[idx] != null)
      .map((idx) => ({
        entry: legendConfig.legends[idx],
        visible: legendState.visibleThresholds[idx] ?? [],
      }));
  }, [legendConfig, legendState]);

  if (state === 'connecting') {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent mb-4" />
          <p className="text-text-secondary">Connecting to server…</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="bg-card rounded-lg shadow-soft p-8 max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠</div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Connection Failed</h2>
          <p className="text-text-secondary mb-6">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (state === 'loading-history') {
    const pct = progress.totalPages > 0
      ? Math.round((progress.page / progress.totalPages) * 100)
      : 0;

    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="w-80 text-center">
          <p className="text-text-primary font-medium mb-3">Loading history…</p>
          <div className="w-full bg-border rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-text-secondary text-sm mt-2">
            Page {progress.page} / {progress.totalPages} ({pct}%)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Map fills all available space */}
      <div className="flex-1 relative">
        <GeoMap
          points={points}
          activeLegends={activeLegends}
          visibleIds={visibleIds}
        />
        {legendConfig && legendState && (
          <LegendPanel
            config={legendConfig}
            legendState={legendState}
            onStateChange={handleLegendStateChange}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="h-14 bg-card border-t border-border flex items-center px-4 shrink-0">
        {/* Left: last point time */}
        <div className="text-sm text-text-secondary whitespace-nowrap">
          <span className="font-medium text-text-primary">Last:</span>{' '}
          {lastPointTime ?? '—'}
          {/* Display last point data */} 
            {lastPointTime && points.length > 0 && (
                <> - RSRP: {points[points.length - 1].serving_cell_ssb_rsrp ?? '—'} dBm, SNR: {points[points.length - 1].serving_cell_ssb_snr ?? '—'} dB, Mode: {points[points.length - 1].multi_rat_connectivity_mode ?? '—'}
                </>
            )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-text-secondary whitespace-nowrap min-w-24">
            {sliderStartTime ?? '—'}
          </span>
          <div className="w-56">
            <RangeSlider
              start={sliderStart}
              end={sliderEnd}
              onChange={(s, e) => {
                setSliderStart(s);
                setSliderEnd(e);
              }}
            />
          </div>
          <span className="text-xs text-text-secondary whitespace-nowrap min-w-24">
            {sliderEndTime ?? '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
