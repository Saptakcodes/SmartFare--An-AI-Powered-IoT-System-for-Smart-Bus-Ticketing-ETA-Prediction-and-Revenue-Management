from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Cleaned up the duplicate imports
from app.api import admin_auth, admin_dashboard, auth, notifications, passenger, sync, trips, tickets
from app.core.config import settings
from app.services.cron_service import cleanup_stale_trips # <-- Import the cron job

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the background cron job
    print("🔄 Starting background cron jobs...")
    cron_task = asyncio.create_task(cleanup_stale_trips())
    
    yield
    
    # Shutdown: Cancel the background task cleanly
    print("🛑 Shutting down background cron jobs...")
    cron_task.cancel()

# Pass the lifespan to FastAPI
app = FastAPI(
    title=settings.APP_NAME, 
    version="0.1.0",
    lifespan=lifespan 
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin_auth.router)
app.include_router(trips.router)
app.include_router(sync.router)
app.include_router(passenger.router)
app.include_router(admin_dashboard.router)
app.include_router(notifications.router)
app.include_router(tickets.router)

@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.ENV}