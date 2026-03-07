/** Fields always returned by the API regardless of selection. */
export const MANDATORY_FIELDS = ['id', 'time', 'latitude', 'longitude'] as const;

/** All optional fields the user may request. */
export const OPTIONAL_FIELDS = [
  'eq',
  'direction',
  'event',
  'mr_dc_cell_pci',
  'serving_cell_bandwidth_dl',
  'serving_cell_cqi',
  'serving_cell_pci',
  'pdsch_mcs_cw0',
  'pdsch_mcs_cw1',
  'pdsch_modulation_cw0',
  'pdsch_modulation_cw1',
  'strongest_ssb_beam_pci',
  'strongest_ssb_beam_type',
  'pdsch_avg_rb_per_carrier',
  'pusch_avg_rb_per_carrier',
  'serving_cell_ssb_rsrp',
  'serving_cell_ssb_rsrq',
  'serving_cell_ssb_snr',
  'serving_cell_sinr_rx1',
  'serving_cell_sinr_rx2',
  'serving_cell_sinr_rx3',
  'serving_cell_sinr_rx4',
  'serving_cell_snr',
  'phy_throughput_dl',
  'phy_throughput_ul',
  'pusch_mcs',
  'pdsch_phy_throughput',
  'pusch_phy_throughput',
  'pdsch_phy_throughput_2',
  'pdsch_throughput_carrier_1',
  'pdsch_throughput_carrier_2',
  'pdsch_throughput_carrier_3',
  'pdsch_throughput_carrier_4',
  'all_pusch_phy_throughput',
  'multi_rat_connectivity_mode',
] as const;

/** Default fields to request when no saved preference exists. */
export const DEFAULT_OPTIONAL_FIELDS = [
  'eq',
  'direction',
  'serving_cell_ssb_snr',
  'serving_cell_ssb_rsrp',
  'serving_cell_sinr_rx1',
  'pdsch_throughput_carrier_1',
  'multi_rat_connectivity_mode',
];

/**
 * Human-readable labels matching the original FMT COLUMN_MAPPING keys.
 * Used as display names throughout the UI.
 */
export const FIELD_LABELS: Record<string, string> = {
  time: 'Time',
  eq: 'EQ',
  direction: 'Direction',
  event: 'Event',
  mr_dc_cell_pci: 'EQ1-MR-DC Cell PCI[1]',
  serving_cell_bandwidth_dl: 'EQ1-Serving Cell Bandwidth DL (text)[1]',
  serving_cell_cqi: 'EQ1-Serving Cell 1 CQI[1]',
  serving_cell_pci: 'EQ1-Serving Cell PCI[1]',
  pdsch_mcs_cw0: 'EQ1-PDSCH MCS (CW0)[1]',
  pdsch_mcs_cw1: 'EQ1-PDSCH MCS (CW1)[1]',
  pdsch_modulation_cw0: 'EQ1-PDSCH Modulation (CW0)[1]',
  pdsch_modulation_cw1: 'EQ1-PDSCH Modulation (CW1)[1]',
  strongest_ssb_beam_pci: 'EQ1-Strongest SSB Beam PCI[1]',
  strongest_ssb_beam_type: 'EQ1-Strongest SSB Beam Type[1]',
  pdsch_avg_rb_per_carrier: 'EQ1-PDSCH Avg RB/Allocated Slot Per Carrier[1]',
  pusch_avg_rb_per_carrier: 'EQ1-PUSCH Avg RB/Allocated Slot Per Carrier[1]',
  serving_cell_ssb_rsrp: 'EQ1-Serving Cell 1 Detected SSB RSRP[1]',
  serving_cell_ssb_rsrq: 'EQ1-Serving Cell 1 Detected SSB RSRQ[1]',
  serving_cell_ssb_snr: 'EQ1-Serving Cell 1 Detected SSB SNR[1]',
  serving_cell_sinr_rx1: 'EQ1-Serving Cell SINR Rx1[1]',
  serving_cell_sinr_rx2: 'EQ1-Serving Cell SINR Rx2[1]',
  serving_cell_sinr_rx3: 'EQ1-Serving Cell SINR Rx3[1]',
  serving_cell_sinr_rx4: 'EQ1-Serving Cell SINR Rx4[1]',
  serving_cell_snr: 'EQ1-Serving Cell SNR[1]',
  phy_throughput_dl: 'EQ1-Phy Throughput Multi-RAT DL (Mbit/s)',
  phy_throughput_ul: 'EQ1-Phy Throughput Multi-RAT UL (Mbit/s)',
  pusch_mcs: 'EQ1-PUSCH MCS[1]',
  pdsch_phy_throughput: 'EQ1-PDSCH Phy Throughput (Mbit/s)',
  pusch_phy_throughput: 'EQ1-PUSCH Phy Throughput (Mbit/s)',
  pdsch_phy_throughput_2: 'EQ1-PDSCH Phy Throughput (Mbit/s).1',
  pdsch_throughput_carrier_1: 'All-PDSCH Phy Throughput Per Carrier (Mbit/s)[1]',
  pdsch_throughput_carrier_2: 'All-PDSCH Phy Throughput Per Carrier (Mbit/s)[2]',
  pdsch_throughput_carrier_3: 'All-PDSCH Phy Throughput Per Carrier (Mbit/s)[3]',
  pdsch_throughput_carrier_4: 'All-PDSCH Phy Throughput Per Carrier (Mbit/s)[4]',
  all_pusch_phy_throughput: 'All-PUSCH Phy Throughput (Mbit/s)',
  multi_rat_connectivity_mode: 'All-Multi RAT Connectivity Mode',
  latitude: 'All-Latitude',
  longitude: 'All-Longitude',
};

/** Get the display label for a field, falling back to the raw key. */
export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

/** Map each optional field to its data type. */
export const FIELD_TYPES: Record<string, 'numeric' | 'string'> = {
  eq: 'string',
  direction: 'string',
  event: 'string',
  mr_dc_cell_pci: 'string',
  serving_cell_bandwidth_dl: 'string',
  serving_cell_cqi: 'numeric',
  serving_cell_pci: 'string',
  pdsch_mcs_cw0: 'numeric',
  pdsch_mcs_cw1: 'numeric',
  pdsch_modulation_cw0: 'string',
  pdsch_modulation_cw1: 'string',
  strongest_ssb_beam_pci: 'string',
  strongest_ssb_beam_type: 'string',
  pdsch_avg_rb_per_carrier: 'numeric',
  pusch_avg_rb_per_carrier: 'numeric',
  serving_cell_ssb_rsrp: 'numeric',
  serving_cell_ssb_rsrq: 'numeric',
  serving_cell_ssb_snr: 'numeric',
  serving_cell_sinr_rx1: 'numeric',
  serving_cell_sinr_rx2: 'numeric',
  serving_cell_sinr_rx3: 'numeric',
  serving_cell_sinr_rx4: 'numeric',
  serving_cell_snr: 'numeric',
  phy_throughput_dl: 'numeric',
  phy_throughput_ul: 'numeric',
  pusch_mcs: 'numeric',
  pdsch_phy_throughput: 'numeric',
  pusch_phy_throughput: 'numeric',
  pdsch_phy_throughput_2: 'numeric',
  pdsch_throughput_carrier_1: 'numeric',
  pdsch_throughput_carrier_2: 'numeric',
  pdsch_throughput_carrier_3: 'numeric',
  pdsch_throughput_carrier_4: 'numeric',
  all_pusch_phy_throughput: 'numeric',
  multi_rat_connectivity_mode: 'string',
};

/** Human-friendly labels for optional fields, grouped by category. */
export const FIELD_GROUPS: { label: string; fields: string[] }[] = [
  {
    label: 'Base',
    fields: ['eq', 'direction', 'event'],
  },
  {
    label: 'Cell Info',
    fields: [
      'mr_dc_cell_pci',
      'serving_cell_bandwidth_dl',
      'serving_cell_cqi',
      'serving_cell_pci',
    ],
  },
  {
    label: 'PDSCH MCS / Modulation',
    fields: [
      'pdsch_mcs_cw0',
      'pdsch_mcs_cw1',
      'pdsch_modulation_cw0',
      'pdsch_modulation_cw1',
    ],
  },
  {
    label: 'SSB Beam',
    fields: ['strongest_ssb_beam_pci', 'strongest_ssb_beam_type'],
  },
  {
    label: 'RB / Carrier',
    fields: ['pdsch_avg_rb_per_carrier', 'pusch_avg_rb_per_carrier'],
  },
  {
    label: 'Signal Quality',
    fields: [
      'serving_cell_ssb_rsrp',
      'serving_cell_ssb_rsrq',
      'serving_cell_ssb_snr',
      'serving_cell_sinr_rx1',
      'serving_cell_sinr_rx2',
      'serving_cell_sinr_rx3',
      'serving_cell_sinr_rx4',
      'serving_cell_snr',
    ],
  },
  {
    label: 'Throughput',
    fields: [
      'phy_throughput_dl',
      'phy_throughput_ul',
      'pusch_mcs',
      'pdsch_phy_throughput',
      'pusch_phy_throughput',
      'pdsch_phy_throughput_2',
      'pdsch_throughput_carrier_1',
      'pdsch_throughput_carrier_2',
      'pdsch_throughput_carrier_3',
      'pdsch_throughput_carrier_4',
      'all_pusch_phy_throughput',
    ],
  },
  {
    label: 'Connectivity',
    fields: ['multi_rat_connectivity_mode'],
  },
];

export interface MapPoint {
  id: number;
  time: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Any optional field the user requested – accessed dynamically. */
  [key: string]: string | number | null | undefined;
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
