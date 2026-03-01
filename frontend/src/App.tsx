import { useCallback, useEffect, useRef, useState } from 'react';
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

  // ── Connecting ──
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

  // ── Error ──
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

  // ── Loading history ──
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

  // ── Map ──
  return (
    <div className="h-screen w-screen">
      <GeoMap points={points} />
    </div>
  );
}

export default App;
