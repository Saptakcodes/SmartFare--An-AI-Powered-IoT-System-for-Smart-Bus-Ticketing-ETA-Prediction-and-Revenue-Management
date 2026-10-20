import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

# PASTE YOUR NEON DATABASE URL HERE
NEON_URL = "postgresql://neondb_owner:npg_WNkjT1FuC5cv@ep-red-math-aoohywa2.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Notice: trip_id is now "R-001" and fare_from_origin is capped at 25
route_data = [
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST01", "stop_name": "Madhyamgram", "latitude": 22.692438, "longitude": 88.465414, "fare_from_previous_stop": 0, "fare_from_origin": 0, "sequence": 1},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST02", "stop_name": "New Barrackpore", "latitude": 22.753990, "longitude": 88.369530, "fare_from_previous_stop": 5, "fare_from_origin": 5, "sequence": 2},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST03", "stop_name": "Doltala", "latitude": 22.685650, "longitude": 88.463280, "fare_from_previous_stop": 5, "fare_from_origin": 10, "sequence": 3},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST04", "stop_name": "BT College", "latitude": 22.680700, "longitude": 88.446100, "fare_from_previous_stop": 5, "fare_from_origin": 15, "sequence": 4},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST05", "stop_name": "Sukantanagar", "latitude": 22.670000, "longitude": 88.440000, "fare_from_previous_stop": 5, "fare_from_origin": 20, "sequence": 5},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST06", "stop_name": "Michaelnagar", "latitude": 22.675031, "longitude": 88.444745, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 6},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST07", "stop_name": "Bankra", "latitude": 22.669000, "longitude": 88.438000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 7},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST08", "stop_name": "Gouripur", "latitude": 22.666000, "longitude": 88.436000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 8},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST09", "stop_name": "Birati", "latitude": 22.663212, "longitude": 88.427127, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 9},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST10", "stop_name": "Sarat Colony", "latitude": 22.659565, "longitude": 88.437742, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 10},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST11", "stop_name": "Airport 3 no. gate", "latitude": 22.652900, "longitude": 88.438400, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 11},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST12", "stop_name": "Airport 2.5 no.", "latitude": 22.649000, "longitude": 88.436000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 12},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST13", "stop_name": "Airport 2", "latitude": 22.646145, "longitude": 88.433859, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 13},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST14", "stop_name": "Airport 1", "latitude": 22.642600, "longitude": 88.429800, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 14},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST15", "stop_name": "Kaikhali", "latitude": 22.635175, "longitude": 88.439236, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 15},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST16", "stop_name": "Haldiram", "latitude": 22.626600, "longitude": 88.431400, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 16},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST17", "stop_name": "Chinarpark", "latitude": 22.623600, "longitude": 88.441000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 17},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST18", "stop_name": "City Center 2", "latitude": 22.622850, "longitude": 88.450360, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 18},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST19", "stop_name": "Akansha More", "latitude": 22.618889, "longitude": 88.465556, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 19},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST20", "stop_name": "Nawabpur", "latitude": 22.610000, "longitude": 88.470000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 20},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST21", "stop_name": "Nababpur Eco park gate 4", "latitude": 22.606000, "longitude": 88.471000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 21},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST22", "stop_name": "Pechar more", "latitude": 22.605000, "longitude": 88.473000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 22},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST23", "stop_name": "Ecopark gate 3 Mistihub", "latitude": 22.608000, "longitude": 88.470000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 23},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST24", "stop_name": "Ecopark gate 2 MWM", "latitude": 22.600330, "longitude": 88.470610, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 24},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST25", "stop_name": "Ecopark gate 1 police fari", "latitude": 22.593000, "longitude": 88.476000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 25},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST26", "stop_name": "Westin More", "latitude": 22.595000, "longitude": 88.480000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 26},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST27", "stop_name": "Jatragachi", "latitude": 22.587000, "longitude": 88.479000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 27},
  {"bus_id": "WBTC001", "trip_id": "R-001", "stop_id": "ST28", "stop_name": "Narkelbagan", "latitude": 22.578610, "longitude": 88.471670, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 28}
]

async def main():
    print("Connecting to Neon Database...")
    conn = await asyncpg.connect(NEON_URL)
    
    try:
        async with conn.transaction():
            # 1. Insert Bus
            bus_id = route_data[0]["bus_id"]
            await conn.execute("""
                INSERT INTO buses (bus_id, capacity, is_active) 
                VALUES ($1, 50, true) ON CONFLICT DO NOTHING;
            """, bus_id)

            # 2. Insert Route (Route ID is now R-001)
            route_id = route_data[0]["trip_id"]
            await conn.execute("""
                INSERT INTO routes (route_id, name, is_active) 
                VALUES ($1, $2, true) 
                ON CONFLICT (route_id) DO UPDATE SET name = EXCLUDED.name;
            """, route_id, "Madhyamgram - Narkelbagan")

            print("Inserted Bus and Route. Inserting 28 stops...")

            # 3. Insert Stops and Route Stops
            for row in route_data:
                await conn.execute("""
                    INSERT INTO stops (stop_id, name, geog) 
                    VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography)
                    ON CONFLICT (stop_id) DO UPDATE SET name = EXCLUDED.name;
                """, row["stop_id"], row["stop_name"], row["longitude"], row["latitude"])

                await conn.execute("""
                    INSERT INTO route_stops (route_id, stop_id, seq) 
                    VALUES ($1, $2, $3) 
                    ON CONFLICT (route_id, stop_id) DO UPDATE SET seq = EXCLUDED.seq;
                """, route_id, row["stop_id"], row["sequence"])

            print("Stops inserted. Now generating bidrectional fare matrix...")

            # 4. Generate Fares Matrix (Forward and Reverse, Max 25)
            fare_inserts = []
            for i in range(len(route_data)):
                for j in range(i + 1, len(route_data)):
                    from_stop = route_data[i]
                    to_stop = route_data[j]
                    
                    hops = to_stop["sequence"] - from_stop["sequence"]
                    amount = min(hops * 5, 25) # +5 per stop, capped at 25
                    
                    # Forward
                    fare_inserts.append((route_id, from_stop["stop_id"], to_stop["stop_id"], amount))
                    # Reverse
                    fare_inserts.append((route_id, to_stop["stop_id"], from_stop["stop_id"], amount))

            # Bulk insert/update fares
            await conn.executemany("""
                INSERT INTO fares (route_id, from_stop_id, to_stop_id, amount) 
                VALUES ($1, $2, $3, $4) 
                ON CONFLICT (route_id, from_stop_id, to_stop_id) 
                DO UPDATE SET amount = EXCLUDED.amount;
            """, fare_inserts)

            print(f"Success! Upserted {len(fare_inserts)} fare combinations (756 total).")
            
            # Verify DB state
            total = await conn.fetchval("SELECT COUNT(*) FROM fares WHERE route_id = $1", route_id)
            print(f"Total fares in DB for {route_id}: {total}")

    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())