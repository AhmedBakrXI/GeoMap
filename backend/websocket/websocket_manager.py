
from typing import Any, Dict

from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket):
        self.active_connections.remove(websocket)
            
    async def broadcast(self, message: Dict[str, Any]):
        disconnected = []   

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending message: {e}")
                disconnected.append(connection)
            
        for connection in disconnected:
            self.disconnect(connection)
            
            
manager = ConnectionManager()
        
