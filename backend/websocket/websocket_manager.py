
from typing import Any, Dict, Optional, Set

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        # Per-connection field filter.  None → send all fields.
        self.connection_fields: dict[WebSocket, Optional[Set[str]]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_fields[websocket] = None  # default: all fields

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        self.connection_fields.pop(websocket, None)

    def set_fields(self, websocket: WebSocket, fields: list[str]):
        """Store the set of fields this connection wants to receive."""
        from schemas.measurement_schema import MANDATORY_FIELDS, OPTIONAL_FIELDS_SET
        valid = {f for f in fields if f in OPTIONAL_FIELDS_SET}
        self.connection_fields[websocket] = MANDATORY_FIELDS | valid

    async def broadcast(self, message: Dict[str, Any]):
        disconnected: list[WebSocket] = []

        for connection in self.active_connections:
            try:
                conn_fields = self.connection_fields.get(connection)
                # Filter per-connection when the message carries data records
                if conn_fields is not None and isinstance(message, dict) and message.get("type") == "chunk":
                    filtered = {
                        "type": "chunk",
                        "data": [
                            {k: v for k, v in rec.items() if k in conn_fields}
                            for rec in message["data"]
                        ],
                    }
                    await connection.send_json(filtered)
                else:
                    await connection.send_json(message)
            except Exception as e:
                print(f"Error sending message: {e}")
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(connection)


manager = ConnectionManager()
