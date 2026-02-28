import pandas as pd
import asyncio
from websocket.websocket_manager import manager


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
            print(f"Streaming chunk with {len(chunk)} records: {chunk.head(1)}") 

            await manager.broadcast({
                "type": "chunk",
                "data": chunk.to_dict(orient="records")
            })

            await asyncio.sleep(1)

        print("Finished streaming all data.")


streamer = DataStreamer("data/dataset.fmt")