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
    def __init__(self, file_path, chunk_size=500):
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
                    await session.flush()  # assigns IDs
                    # Attach DB ids to records for broadcast
                    for m, rec in zip(measurements, records):
                        rec["id"] = m.id

            print(f"Stored and streaming chunk with {len(records)} records starting time: {records[0].get('time') if records else 'N/A'}")
            # Broadcast full records – per-connection field filtering happens in the manager
            try:
                await manager.broadcast({
                    "type": "chunk",
                    "data": records
                })
            except Exception as e:
                print(f"Broadcast failed (continuing): {e}")

            await asyncio.sleep(0.5)

        print("Finished streaming all data.")


streamer = DataStreamer("data/dataset.fmt")