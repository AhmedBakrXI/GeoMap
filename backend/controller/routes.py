from fastapi import APIRouter, WebSocket, Query
from typing import Optional
from sqlalchemy import select, func
from models.database import async_session
from models.measurement import Measurement
from schemas.measurement_schema import MapPointResponse, PaginatedResponse

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "healthy"}


@router.get("/history", response_model=PaginatedResponse)
async def get_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=500, description="Items per page"),
    before_id: Optional[int] = Query(None, description="Only return records with id <= this value. Use the max_id from the first page response for stable pagination."),
):
    async with async_session() as session:
        # If no before_id provided, snapshot the current max id
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
        data=[MapPointResponse.model_validate(m) for m in measurements],
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
            await websocket.receive_text()  
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)
