import type { MapPoint, PaginatedResponse, WebSocketChunkMessage } from '../types/measurement';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/api/ws/data';

export async function fetchHistoryPage(
  page: number,
  pageSize = 500,
  beforeId?: number,
  fields?: string[],
): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (beforeId !== undefined) {
    params.set('before_id', String(beforeId));
  }
  if (fields && fields.length > 0) {
    params.set('fields', fields.join(','));
  }

  const res = await fetch(`${API}/history?${params}`);
  if (!res.ok) throw new Error(`History request failed: ${res.status}`);
  return res.json();
}

export async function fetchAllHistory(
  pageSize = 500,
  onPageLoaded?: (points: MapPoint[], progress: { page: number; totalPages: number }) => void,
  fields?: string[],
): Promise<MapPoint[]> {
  // First call – snapshot max_id
  const first = await fetchHistoryPage(1, pageSize, undefined, fields);
  const allPoints: MapPoint[] = [...first.data];
  onPageLoaded?.(first.data, { page: 1, totalPages: first.total_pages });
  console.log(first)
  const maxId = first.max_id;

  // Fetch remaining pages using the snapshot
  for (let page = 2; page <= first.total_pages; page++) {
    const result = await fetchHistoryPage(page, pageSize, maxId, fields);
    console.log(result);
    allPoints.push(...result.data);
    onPageLoaded?.(result.data, { page, totalPages: first.total_pages });
  }

  return allPoints;
}

/** Fetch the list of available optional fields from the backend. */
export async function fetchAvailableFields(): Promise<{
  mandatory: string[];
  optional: string[];
}> {
  const res = await fetch(`${API}/fields`);
  if (!res.ok) throw new Error(`Fields request failed: ${res.status}`);
  return res.json();
}

export function connectWebSocket(options: {
  onMessage: (points: MapPoint[]) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  retries?: number;
  retryDelay?: number;
  fields?: string[];
}): { close: () => void; setFields: (fields: string[]) => void } {
  const maxRetries = options.retries ?? 3;
  const retryDelay = options.retryDelay ?? 1000;
  let attempt = 0;
  let ws: WebSocket | null = null;
  let closed = false;

  function sendFieldPrefs() {
    if (ws && ws.readyState === WebSocket.OPEN && options.fields && options.fields.length > 0) {
      ws.send(JSON.stringify({ type: 'set_fields', fields: options.fields }));
    }
  }

  function connect() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      attempt = 0;
      console.log('[WS] Connected');
      sendFieldPrefs();
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
      console.error(`[WS] Error (attempt ${attempt + 1}/${maxRetries + 1}):`, err);
      if (!closed && attempt < maxRetries) {
        attempt++;
        console.log(`[WS] Retrying in ${retryDelay}ms…`);
        setTimeout(connect, retryDelay);
      } else if (!closed) {
        options.onError?.(err);
      }
    };
  }

  connect();

  return {
    close: () => {
      closed = true;
      ws?.close();
    },
    setFields: (fields: string[]) => {
      options.fields = fields;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'set_fields', fields }));
      }
    },
  };
}
