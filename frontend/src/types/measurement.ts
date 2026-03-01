export interface MapPoint {
  id: number;
  eq: string | null;
  direction: string | null;
  time: string | null;
  latitude: number | null;
  longitude: number | null;
  serving_cell_ssb_rsrp: number | null;
  serving_cell_ssb_snr: number | null;
  multi_rat_connectivity_mode: string | null;
}

export interface PaginatedResponse {
  data: MapPoint[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  max_id: number;
}

export interface WebSocketChunkMessage {
  type: 'chunk';
  data: MapPoint[];
}
