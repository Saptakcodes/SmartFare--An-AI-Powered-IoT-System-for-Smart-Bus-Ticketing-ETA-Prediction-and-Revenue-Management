import xgboost as xgb
import numpy as np
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Load the model ONCE when the server boots up
try:
    model = xgb.Booster()
    model.load_model("bus_eta_model.json")
except Exception as e:
    print(f"⚠️ Warning: Could not load bus_eta_model.json. Make sure it's in the backend/ folder. Error: {e}")
    model = None

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))

async def predict_bus_eta(db: AsyncSession, bus_id: str, route_id: str, target_stop_id: str) -> float:
    if model is None:
        return 0.0

    # 1. Get the latest GPS ping from the Pi
    latest_gps = (await db.execute(
        text("SELECT latitude, longitude, speed_kmph FROM gps_records WHERE bus_id = :bus ORDER BY recorded_at DESC LIMIT 1"),
        {"bus": bus_id}
    )).first()

    if not latest_gps:
        return 0.0 # No GPS data yet

    # 2. Get the target stop's sequence and coordinates
    target_stop = (await db.execute(
        text("""
            SELECT rs.seq, ST_Y(s.geog::geometry) as lat, ST_X(s.geog::geometry) as lon
            FROM route_stops rs
            JOIN stops s ON s.stop_id = rs.stop_id
            WHERE rs.route_id = :route AND rs.stop_id = :stop
        """),
        {"route": route_id, "stop": target_stop_id}
    )).first()

    if not target_stop:
        return 0.0

    # 3. Find the bus's current nearest stop sequence
    current_stop = (await db.execute(
        text("""
            SELECT rs.seq
            FROM route_stops rs
            JOIN stops s ON s.stop_id = rs.stop_id
            WHERE rs.route_id = :route
            ORDER BY ST_Distance(s.geog, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography)
            LIMIT 1
        """),
        {"route": route_id, "lat": latest_gps[0], "lon": latest_gps[1]}
    )).first()

    current_seq = current_stop[0] if current_stop else 1
    target_seq = target_stop[0]
    stops_remaining = max(0, target_seq - current_seq)

    # 4. Calculate real-world features
    now = datetime.now()
    hour = now.hour
    day_of_week = now.isoweekday() # 1=Mon, 7=Sun
    is_weekend = 1 if day_of_week >= 6 else 0
    is_peak = 1 if (8 <= hour <= 10) or (17 <= hour <= 19) else 0
    
    distance_km = haversine_km(latest_gps[0], latest_gps[1], target_stop[1], target_stop[2])
    speed = latest_gps[2] if latest_gps[2] is not None else 15.0
    
    # Historical baselines (matching the synthetic generation)
    hist_segment = 3.0 * (1.5 if is_peak else 1.0)
    hist_dwell = 1.0

    # 5. Format for XGBoost
    feature_order = [
        'hour_of_day', 'day_of_week', 'is_weekend', 'is_peak_hour',
        'distance_to_target_km', 'stops_remaining', 
        'historical_segment_time', 'historical_dwell_time', 'current_speed'
    ]
    
    feature_vector = np.array([
        hour, day_of_week, is_weekend, is_peak,
        distance_km, stops_remaining, hist_segment, hist_dwell, speed
    ]).reshape(1, -1)

    # 6. Predict
    dmatrix = xgb.DMatrix(feature_vector, feature_names=feature_order)
    prediction = model.predict(dmatrix)[0]
    
    return round(float(prediction), 1)