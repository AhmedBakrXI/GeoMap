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
