import asyncio
import asyncpg

# Use the EXACT SAME URL your FastAPI server uses
NEON_URL = "postgresql://neondb_owner:npg_WNkjT1FuC5cv@ep-red-math-aoohywa2.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

async def test():
    conn = await asyncpg.connect(NEON_URL)
    try:
        # This is the exact query your endpoint should be running
        fare = await conn.fetchval("""
            SELECT amount FROM fares 
            WHERE route_id = $1 
              AND from_stop_id = $2 
              AND to_stop_id = $3
        """, "ROUTE_MADHYAMGRAM_NARKELBAGAN", "ST28", "ST05")
        
        print(f"Result from DB: {fare}")
        
    finally:
        await conn.close()

asyncio.run(test())