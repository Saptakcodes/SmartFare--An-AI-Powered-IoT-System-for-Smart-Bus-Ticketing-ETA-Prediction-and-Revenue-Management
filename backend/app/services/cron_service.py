import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models import Trip, DeviceStatus
from app.services.trip_service import end_trip

# Setup logging
logger = logging.getLogger("smartfare.cron")

async def cleanup_stale_trips():
    """
    Background task that runs every 30 minutes.
    It finds trips that have been ACTIVE for too long 
    OR whose device has disconnected, and safely closes them.
    """
    while True:
        try:
            # Wait 30 minutes before running the first check
            await asyncio.sleep(1800) 
            
            logger.info("🧹 Running automated stale trip cleanup...")
            
            async with AsyncSessionLocal() as db:
                now = datetime.now(timezone.utc)
                
                # 1. Find all currently active trips
                trips = (await db.execute(
                    select(Trip).where(Trip.status == "ACTIVE")
                )).scalars().all()

                for trip in trips:
                    # 2. Check the device's last heartbeat
                    device = await db.scalar(
                        select(DeviceStatus).where(DeviceStatus.device_id == trip.device_id)
                    )
                    
                    # Condition A: Device hasn't pinged in 30 minutes (Offline)
                    is_device_stale = False
                    if not device or not device.last_seen_at:
                        is_device_stale = True
                    elif (now - device.last_seen_at) > timedelta(minutes=30):
                        is_device_stale = True
                    
                    # Condition B: Trip has been running for more than 6 hours (Forgot to end)
                    is_trip_too_long = (now - trip.started_at) > timedelta(hours=6)

                    if is_device_stale or is_trip_too_long:
                        logger.warning(f"⚠️ Force ending stale trip {trip.trip_id} (Bus: {trip.bus_id})")
                        try:
                            # Call the existing end_trip service
                            result = await end_trip(db, trip.trip_id)
                            logger.info(f"✅ Successfully closed trip {trip.trip_id}. Journeys closed: {result['journeys_closed']}")
                        except Exception as e:
                            logger.error(f"❌ Failed to end stale trip {trip.trip_id}: {e}")
                            
                logger.info("🧹 Stale trip cleanup complete.")
                
        except asyncio.CancelledError:
            logger.info("Stale trip cleanup task cancelled (Server shutting down).")
            break
        except Exception as e:
            logger.error(f"Error in cleanup_stale_trips loop: {e}")