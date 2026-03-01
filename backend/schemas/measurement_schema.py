from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MapPointBase(BaseModel):
    id: int
    eq: Optional[str]
    direction: Optional[str]
    time: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]


class MapPointResponse(MapPointBase):
    serving_cell_ssb_rsrp: Optional[float]
    serving_cell_ssb_snr: Optional[float]
    multi_rat_connectivity_mode: Optional[str]

    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel):
    data: List[MapPointResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
    max_id: int