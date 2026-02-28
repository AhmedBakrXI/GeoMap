from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controller.routes import router
from contextlib import asynccontextmanager
import asyncio
from streaming.data_streamer import streamer
from models.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    streamer_task = asyncio.create_task(streamer.stream_data())
    yield
    streamer_task.cancel()

app = FastAPI(title="Telecom Geo-Visualization Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)

