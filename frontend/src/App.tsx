import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import GeoMap from './components/GeoMap';
import { connectWebSocket, fetchAllHistory } from './api/measurements';
import type { MapPoint } from './types/measurement';

type AppState = 'connecting' | 'error' | 'loading-history' | 'ready';

function App() {
  const [state, setState] = useState<AppState>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [progress, setProgress] = useState({ page: 0, totalPages: 0 });
  const [sliderStart, setSliderStart] = useState(0);   // percentage 0–100
  const [sliderEnd, setSliderEnd] = useState(100);     // percentage 0–100
  const wsRef = useRef<{ close: () => void } | null>(null);

  const startLoadingHistory = useCallback(async () => {
    setState('loading-history');
    try {
      const history = await fetchAllHistory(100, (_pagePoints, prog) => {
        setProgress(prog);
      });
      setPoints(history);
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

  // Sort points by time for slider filtering
  const sortedPoints = useMemo(() => {
    return [...points].filter((p) => p.time != null).sort((a, b) => a.time!.localeCompare(b.time!));
  }, [points]);

  // Filter points based on slider range
  const filteredPoints = useMemo(() => {
    if (sortedPoints.length === 0) return sortedPoints;
    const startIdx = Math.round((sliderStart / 100) * (sortedPoints.length - 1));
    const endIdx = Math.round((sliderEnd / 100) * (sortedPoints.length - 1));
    return sortedPoints.slice(startIdx, endIdx + 1);
  }, [sortedPoints, sliderStart, sliderEnd]);

  // Last point time — always the latest point received (including WS)
  const lastPointTime = points.length > 0
    ? points.reduce((latest, p) =>
        p.time && (!latest || p.time.localeCompare(latest) > 0) ? p.time : latest,
      null as string | null)
    : null;

  // Slider range labels
  const sliderStartTime = filteredPoints.length > 0 ? filteredPoints[0].time : null;
  const sliderEndTime = filteredPoints.length > 0 ? filteredPoints[filteredPoints.length - 1].time : null;

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
        <GeoMap points={filteredPoints} />
      </div>

      {/* Status bar */}
      <div className="h-14 bg-card border-t border-border flex items-center px-4 shrink-0">
        {/* Left: last point time */}
        <div className="text-sm text-text-secondary whitespace-nowrap">
          <span className="font-medium text-text-primary">Last:</span>{' '}
          {lastPointTime ?? '—'}
        </div>

        {/* Right: dual time range sliders */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-text-secondary whitespace-nowrap min-w-[85px]">
            {sliderStartTime ?? '—'}
          </span>
          <div className="flex flex-col gap-0.5 w-48">
            <input
              type="range"
              min={0}
              max={100}
              value={sliderStart}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSliderStart(Math.min(v, sliderEnd));
              }}
              className="w-full accent-primary"
              title="Start time"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={sliderEnd}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSliderEnd(Math.max(v, sliderStart));
              }}
              className="w-full accent-primary"
              title="End time"
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
