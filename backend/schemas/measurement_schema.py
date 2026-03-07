from pydantic import BaseModel
from typing import Optional, List


# Fields that are always returned regardless of user selection
MANDATORY_FIELDS = {"id", "time", "latitude", "longitude"}

# All optional fields the user may request
OPTIONAL_FIELDS = [
    "eq",
    "direction",
    "event",
    "mr_dc_cell_pci",
    "serving_cell_bandwidth_dl",
    "serving_cell_cqi",
    "serving_cell_pci",
    "pdsch_mcs_cw0",
    "pdsch_mcs_cw1",
    "pdsch_modulation_cw0",
    "pdsch_modulation_cw1",
    "strongest_ssb_beam_pci",
    "strongest_ssb_beam_type",
    "pdsch_avg_rb_per_carrier",
    "pusch_avg_rb_per_carrier",
    "serving_cell_ssb_rsrp",
    "serving_cell_ssb_rsrq",
    "serving_cell_ssb_snr",
    "serving_cell_sinr_rx1",
    "serving_cell_sinr_rx2",
    "serving_cell_sinr_rx3",
    "serving_cell_sinr_rx4",
    "serving_cell_snr",
    "phy_throughput_dl",
    "phy_throughput_ul",
    "pusch_mcs",
    "pdsch_phy_throughput",
    "pusch_phy_throughput",
    "pdsch_phy_throughput_2",
    "pdsch_throughput_carrier_1",
    "pdsch_throughput_carrier_2",
    "pdsch_throughput_carrier_3",
    "pdsch_throughput_carrier_4",
    "all_pusch_phy_throughput",
    "multi_rat_connectivity_mode",
]

OPTIONAL_FIELDS_SET = set(OPTIONAL_FIELDS)
ALL_FIELDS = MANDATORY_FIELDS | OPTIONAL_FIELDS_SET


class MapPointResponse(BaseModel):
    """Response model with every possible measurement field (all optional)."""
    # Mandatory
    id: int
    time: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # Optional – base
    eq: Optional[str] = None
    direction: Optional[str] = None
    event: Optional[str] = None
    # Optional – cell info
    mr_dc_cell_pci: Optional[str] = None
    serving_cell_bandwidth_dl: Optional[str] = None
    serving_cell_cqi: Optional[float] = None
    serving_cell_pci: Optional[str] = None
    # Optional – PDSCH MCS / Modulation
    pdsch_mcs_cw0: Optional[float] = None
    pdsch_mcs_cw1: Optional[float] = None
    pdsch_modulation_cw0: Optional[str] = None
    pdsch_modulation_cw1: Optional[str] = None
    # Optional – SSB Beam
    strongest_ssb_beam_pci: Optional[str] = None
    strongest_ssb_beam_type: Optional[str] = None
    # Optional – RB / Carrier
    pdsch_avg_rb_per_carrier: Optional[float] = None
    pusch_avg_rb_per_carrier: Optional[float] = None
    # Optional – Signal quality
    serving_cell_ssb_rsrp: Optional[float] = None
    serving_cell_ssb_rsrq: Optional[float] = None
    serving_cell_ssb_snr: Optional[float] = None
    serving_cell_sinr_rx1: Optional[float] = None
    serving_cell_sinr_rx2: Optional[float] = None
    serving_cell_sinr_rx3: Optional[float] = None
    serving_cell_sinr_rx4: Optional[float] = None
    serving_cell_snr: Optional[float] = None
    # Optional – Throughput
    phy_throughput_dl: Optional[float] = None
    phy_throughput_ul: Optional[float] = None
    pusch_mcs: Optional[float] = None
    pdsch_phy_throughput: Optional[float] = None
    pusch_phy_throughput: Optional[float] = None
    pdsch_phy_throughput_2: Optional[float] = None
    pdsch_throughput_carrier_1: Optional[float] = None
    pdsch_throughput_carrier_2: Optional[float] = None
    pdsch_throughput_carrier_3: Optional[float] = None
    pdsch_throughput_carrier_4: Optional[float] = None
    all_pusch_phy_throughput: Optional[float] = None
    # Optional – Connectivity
    multi_rat_connectivity_mode: Optional[str] = None

    class Config:
        from_attributes = True


def filter_record(record: dict, fields: set) -> dict:
    """Keep only keys present in *fields*."""
    return {k: v for k, v in record.items() if k in fields}


class PaginatedResponse(BaseModel):
    data: list
    page: int
    page_size: int
    total: int
    total_pages: int
    max_id: int