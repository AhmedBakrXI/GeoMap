from fastapi import APIRouter, WebSocket

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "healthy"}



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
