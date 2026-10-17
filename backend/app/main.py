from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin_auth, auth, passenger, sync, trips
from app.core.config import settings
from app.api import admin_auth, admin_dashboard, auth, passenger, sync, trips
from app.api import admin_auth, admin_dashboard, auth, notifications, passenger, sync, trips
from app.api import admin_auth, admin_dashboard, auth, notifications, passenger, sync, trips, tickets

app = FastAPI(title=settings.APP_NAME, version="0.1.0")

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