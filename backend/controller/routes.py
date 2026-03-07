from fastapi import APIRouter, WebSocket, Query
from typing import Optional
import json
from sqlalchemy import select, func
from models.database import async_session
from models.measurement import Measurement
from schemas.measurement_schema import (
    MapPointResponse,
    PaginatedResponse,
    MANDATORY_FIELDS,
    OPTIONAL_FIELDS,
    OPTIONAL_FIELDS_SET,
    ALL_FIELDS,
    filter_record,
)

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "healthy"}


@router.get("/fields")
def get_available_fields():
    """Return the list of mandatory and optional data fields."""
    return {
        "mandatory": sorted(MANDATORY_FIELDS),
        "optional": OPTIONAL_FIELDS,
    }


@router.get("/history")
async def get_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(500, ge=1, le=500, description="Items per page"),
    before_id: Optional[int] = Query(None, description="Only return records with id <= this value. Use the max_id from the first page response for stable pagination."),
    fields: Optional[str] = Query(None, description="Comma-separated optional field names to include. Omit to receive all fields."),
):
    # Determine which fields to include
    if fields is not None:
        requested = {f.strip() for f in fields.split(",") if f.strip() in OPTIONAL_FIELDS_SET}
        active_fields = MANDATORY_FIELDS | requested
    else:
        active_fields = ALL_FIELDS  # no filter → return everything

    async with async_session() as session:
        # If no before_id provided then snapshot the current max id
        if before_id is None:
            before_id = await session.scalar(select(func.max(Measurement.id)))
            if before_id is None:
                return PaginatedResponse(
                    data=[], page=page, page_size=page_size,
                    total=0, total_pages=0, max_id=0,
                )

        # Count only rows up to the snapshot
        total = await session.scalar(
            select(func.count(Measurement.id)).where(Measurement.id <= before_id)
        )

        # Get paginated results within the snapshot
        stmt = (
            select(Measurement)
            .where(Measurement.id <= before_id)
            .order_by(Measurement.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await session.execute(stmt)
        measurements = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size if total else 0

    return PaginatedResponse(
        data=[
            filter_record(
                MapPointResponse.model_validate(m).model_dump(),
                active_fields,
            )
            for m in measurements
        ],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
        max_id=before_id,
    )


@router.websocket("/ws/data")
async def websocket_data_stream(websocket: WebSocket):
    from websocket.websocket_manager import manager
    await manager.connect(websocket)
    try:
        while True:
            text = await websocket.receive_text()
            try:
                msg = json.loads(text)
                if msg.get("type") == "set_fields":
                    manager.set_fields(websocket, msg.get("fields", []))
            except (json.JSONDecodeError, ValueError):
                pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)
