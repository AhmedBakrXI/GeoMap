import type { MapPoint, PaginatedResponse, WebSocketChunkMessage } from '../types/measurement';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/api/ws/data';

export async function fetchHistoryPage(
  page: number,
  pageSize = 100,
  beforeId?: number,
): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (beforeId !== undefined) {
    params.set('before_id', String(beforeId));
  }

  const res = await fetch(`${API}/history?${params}`);
  if (!res.ok) throw new Error(`History request failed: ${res.status}`);
  return res.json();
}

export async function fetchAllHistory(
  pageSize = 100,
  onPageLoaded?: (points: MapPoint[], progress: { page: number; totalPages: number }) => void,
): Promise<MapPoint[]> {
  // First call – snapshot max_id
  const first = await fetchHistoryPage(1, pageSize);
  const allPoints: MapPoint[] = [...first.data];
  onPageLoaded?.(first.data, { page: 1, totalPages: first.total_pages });

  const maxId = first.max_id;

  // Fetch remaining pages using the snapshot
  for (let page = 2; page <= first.total_pages; page++) {
    const result = await fetchHistoryPage(page, pageSize, maxId);
    allPoints.push(...result.data);
    onPageLoaded?.(result.data, { page, totalPages: first.total_pages });
  }

  return allPoints;
}


export function connectWebSocket(options: {
  onMessage: (points: MapPoint[]) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}): { close: () => void } {
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[WS] Connected');
    options.onOpen?.();
  };

  ws.onmessage = (event) => {
    try {
      const message: WebSocketChunkMessage = JSON.parse(event.data);
      if (message.type === 'chunk' && Array.isArray(message.data)) {
        options.onMessage(message.data);
      }
    } catch (err) {
      console.error('[WS] Failed to parse message:', err);
    }
  };

  ws.onclose = () => {
    console.log('[WS] Disconnected');
    options.onClose?.();
  };

  ws.onerror = (err) => {
    console.error('[WS] Error:', err);
    options.onError?.(err);
  };

  return {
    close: () => ws.close(),
  };
}
