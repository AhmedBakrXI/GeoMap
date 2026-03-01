import pandas as pd
import asyncio
import math
from websocket.websocket_manager import manager
from models.database import async_session
from models.measurement import Measurement, COLUMN_MAPPING


def sanitize_record(record: dict) -> dict:
    """Replace NaN/inf values with None for JSON compatibility."""
    return {
        k: (None if isinstance(v, float) and (math.isnan(v) or math.isinf(v)) else v)
        for k, v in record.items()
    }


class DataStreamer:
    def __init__(self, file_path, chunk_size=100):
        self.file_path = file_path
        self.chunk_size = chunk_size

    async def stream_data(self):
        def read_chunks():
            return pd.read_csv(
                self.file_path,
                delimiter="\t",
                chunksize=self.chunk_size,
                low_memory=False
            )

        reader = await asyncio.to_thread(read_chunks)

        for chunk in reader:
            chunk = chunk.where(pd.notnull(chunk), None)

            # Rename columns to model field names
            chunk_renamed = chunk.rename(columns=COLUMN_MAPPING)
            model_fields = set(COLUMN_MAPPING.values())
            chunk_renamed = chunk_renamed[[c for c in chunk_renamed.columns if c in model_fields]]

            records = [sanitize_record(r) for r in chunk_renamed.to_dict(orient="records")]

            # Store in database
            async with async_session() as session:
                async with session.begin():
                    measurements = [Measurement(**record) for record in records]
                    session.add_all(measurements)

            print(f"Stored and streaming chunk with {len(records)} records")

            # Broadcast via websocket
            await manager.broadcast({
                "type": "chunk",
                "data": records
            })

            await asyncio.sleep(1)

        print("Finished streaming all data.")


streamer = DataStreamer("data/dataset.fmt")