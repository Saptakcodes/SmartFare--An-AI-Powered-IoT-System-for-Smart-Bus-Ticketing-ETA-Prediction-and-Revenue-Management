import asyncio
import asyncpg

NEON_URL = "postgresql://neondb_owner:npg_WNkjT1FuC5cv@ep-red-math-aoohywa2.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
OLD_ID = "ROUTE_MADHYAMGRAM_NARKELBAGAN"
NEW_ID = "R-001"

async def main():
    print("Connecting to Neon Database...")
    conn = await asyncpg.connect(NEON_URL)
    
    try:
        async with conn.transaction():
            print(f"Migrating {OLD_ID} -> {NEW_ID}...")
            
            # 1. Create the NEW route by copying the old one
            await conn.execute("""
                INSERT INTO routes (route_id, name, is_active, description)
                SELECT $1, name, is_active, description FROM routes WHERE route_id = $2
                ON CONFLICT (route_id) DO NOTHING;
            """, NEW_ID, OLD_ID)
            print("  ✅ New route created.")

            # 2. Update Fares
            res_fares = await conn.execute("UPDATE fares SET route_id = $1 WHERE route_id = $2", NEW_ID, OLD_ID)
            print(f"  ✅ Fares updated: {res_fares}")
            
            # 3. Update Route Stops
            res_stops = await conn.execute("UPDATE route_stops SET route_id = $1 WHERE route_id = $2", NEW_ID, OLD_ID)
            print(f"  ✅ Route stops updated: {res_stops}")
            
            # 4. Update Trips (if you have this table)
            try:
                await conn.execute("UPDATE trips SET route_id = $1 WHERE route_id = $2", NEW_ID, OLD_ID)
            except asyncpg.exceptions.UndefinedTableError:
                pass

            # 5. Delete the old route
            await conn.execute("DELETE FROM routes WHERE route_id = $1", OLD_ID)
            print("  ✅ Old route deleted.")
            
            # Verify
            count = await conn.fetchval("SELECT COUNT(*) FROM fares WHERE route_id = $1", NEW_ID)
            print(f"\nSuccess! Total fares for {NEW_ID}: {count}")
            
    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())