from sqlalchemy import Column, Integer, String, Float
from models.database import Base


# Mapping from FMT column names to model field names
COLUMN_MAPPING = {
    "Time": "time",
    "EQ": "eq",
    "Direction": "direction",
    "Event": "event",
    "EQ1-MR-DC Cell PCI[1]": "mr_dc_cell_pci",
    "EQ1-Serving Cell Bandwidth DL (text)[1]": "serving_cell_bandwidth_dl",
    "EQ1-Serving Cell 1 CQI[1]": "serving_cell_cqi",
    "EQ1-PDSCH MCS (CW0)[1]": "pdsch_mcs_cw0",
    "EQ1-PDSCH MCS (CW1)[1]": "pdsch_mcs_cw1",
    "EQ1-PDSCH Modulation (CW0)[1]": "pdsch_modulation_cw0",
    "EQ1-PDSCH Modulation (CW1)[1]": "pdsch_modulation_cw1",
    "EQ1-Strongest SSB Beam PCI[1]": "strongest_ssb_beam_pci",
    "EQ1-Strongest SSB Beam Type[1]": "strongest_ssb_beam_type",
    "EQ1-PDSCH Avg RB/Allocated Slot Per Carrier[1]": "pdsch_avg_rb_per_carrier",
    "EQ1-Serving Cell 1 Detected SSB RSRP[1]": "serving_cell_ssb_rsrp",
    "EQ1-Serving Cell 1 Detected SSB RSRQ[1]": "serving_cell_ssb_rsrq",
    "EQ1-Serving Cell 1 Detected SSB SNR[1]": "serving_cell_ssb_snr",
    "EQ1-Serving Cell PCI[1]": "serving_cell_pci",
    "EQ1-Serving Cell SINR Rx1[1]": "serving_cell_sinr_rx1",
    "EQ1-Serving Cell SINR Rx2[1]": "serving_cell_sinr_rx2",
    "EQ1-Serving Cell SINR Rx3[1]": "serving_cell_sinr_rx3",
    "EQ1-Serving Cell SINR Rx4[1]": "serving_cell_sinr_rx4",
    "EQ1-Serving Cell SNR[1]": "serving_cell_snr",
    "EQ1-Phy Throughput Multi-RAT DL (Mbit/s)": "phy_throughput_dl",
    "EQ1-Phy Throughput Multi-RAT UL (Mbit/s)": "phy_throughput_ul",
    "EQ1-PUSCH Avg RB/Allocated Slot Per Carrier[1]": "pusch_avg_rb_per_carrier",
    "EQ1-PUSCH MCS[1]": "pusch_mcs",
    "EQ1-PDSCH Phy Throughput (Mbit/s)": "pdsch_phy_throughput",
    "EQ1-PUSCH Phy Throughput (Mbit/s)": "pusch_phy_throughput",
    "EQ1-PDSCH Phy Throughput (Mbit/s).1": "pdsch_phy_throughput_2",
    "All-PDSCH Phy Throughput Per Carrier (Mbit/s)[1]": "pdsch_throughput_carrier_1",
    "All-PDSCH Phy Throughput Per Carrier (Mbit/s)[2]": "pdsch_throughput_carrier_2",
    "All-PDSCH Phy Throughput Per Carrier (Mbit/s)[3]": "pdsch_throughput_carrier_3",
    "All-PDSCH Phy Throughput Per Carrier (Mbit/s)[4]": "pdsch_throughput_carrier_4",
    "All-PUSCH Phy Throughput (Mbit/s)": "all_pusch_phy_throughput",
    "All-Multi RAT Connectivity Mode": "multi_rat_connectivity_mode",
    "All-Latitude": "latitude",
    "All-Longitude": "longitude",
}


class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Base fields
    time = Column(String, nullable=True)
    eq = Column(String, nullable=True)
    direction = Column(String, nullable=True)
    event = Column(String, nullable=True)

    # Cell info
    mr_dc_cell_pci = Column(String, nullable=True)
    serving_cell_bandwidth_dl = Column(String, nullable=True)
    serving_cell_cqi = Column(Float, nullable=True)
    serving_cell_pci = Column(String, nullable=True)

    # PDSCH MCS / Modulation
    pdsch_mcs_cw0 = Column(Float, nullable=True)
    pdsch_mcs_cw1 = Column(Float, nullable=True)
    pdsch_modulation_cw0 = Column(String, nullable=True)
    pdsch_modulation_cw1 = Column(String, nullable=True)

    # SSB Beam
    strongest_ssb_beam_pci = Column(String, nullable=True)
    strongest_ssb_beam_type = Column(String, nullable=True)

    # RB / Carrier
    pdsch_avg_rb_per_carrier = Column(Float, nullable=True)
    pusch_avg_rb_per_carrier = Column(Float, nullable=True)

    # SSB signal quality
    serving_cell_ssb_rsrp = Column(Float, nullable=True)
    serving_cell_ssb_rsrq = Column(Float, nullable=True)
    serving_cell_ssb_snr = Column(Float, nullable=True)

    # SINR per Rx
    serving_cell_sinr_rx1 = Column(Float, nullable=True)
    serving_cell_sinr_rx2 = Column(Float, nullable=True)
    serving_cell_sinr_rx3 = Column(Float, nullable=True)
    serving_cell_sinr_rx4 = Column(Float, nullable=True)
    serving_cell_snr = Column(Float, nullable=True)

    # Throughput
    phy_throughput_dl = Column(Float, nullable=True)
    phy_throughput_ul = Column(Float, nullable=True)
    pusch_mcs = Column(Float, nullable=True)
    pdsch_phy_throughput = Column(Float, nullable=True)
    pusch_phy_throughput = Column(Float, nullable=True)
    pdsch_phy_throughput_2 = Column(Float, nullable=True)

    # Per-carrier throughput
    pdsch_throughput_carrier_1 = Column(Float, nullable=True)
    pdsch_throughput_carrier_2 = Column(Float, nullable=True)
    pdsch_throughput_carrier_3 = Column(Float, nullable=True)
    pdsch_throughput_carrier_4 = Column(Float, nullable=True)
    all_pusch_phy_throughput = Column(Float, nullable=True)

    # Connectivity & Location
    multi_rat_connectivity_mode = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
