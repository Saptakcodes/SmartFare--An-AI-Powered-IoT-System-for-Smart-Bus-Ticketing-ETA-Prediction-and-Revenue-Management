# diagnose_fare.py
import asyncio, asyncpg

NEON_URL = "postgresql://neondb_owner:npg_WNkjT1FuC5cv@ep-red-math-aoohywa2.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
ROUTE_ID = "ROUTE_MADHYAMGRAM_NARKELBAGAN"

# 👇 PUT THE EXACT VALUES YOUR APP IS SENDING HERE
TEST_FROM = "ST28"
TEST_TO   = "ST05"

async def main():
    conn = await asyncpg.connect(NEON_URL)
    try:
        print("1) Does the route exist?")
        r = await conn.fetchrow("SELECT route_id, name FROM routes WHERE route_id=$1", ROUTE_ID)
        print("   ", dict(r) if r else "   ❌ route not found")

        print(f"\n2) Do both stops belong to this route?")
        for sid in [TEST_FROM, TEST_TO]:
            row = await conn.fetchrow(
                "SELECT stop_id, seq FROM route_stops WHERE route_id=$1 AND stop_id=$2",
                ROUTE_ID, sid,
            )
            print(f"   {sid}: {dict(row) if row else '❌ NOT IN ROUTE'}")

        print(f"\n3) Fare forward ({TEST_FROM} → {TEST_TO}):")
        fwd = await conn.fetchval(
            "SELECT amount FROM fares WHERE route_id=$1 AND from_stop_id=$2 AND to_stop_id=$3",
            ROUTE_ID, TEST_FROM, TEST_TO,
        )
        print(f"   {fwd if fwd is not None else '❌ NULL — this is your bug'}")

        print(f"\n4) Fare reverse ({TEST_TO} → {TEST_FROM}):")
        rev = await conn.fetchval(
            "SELECT amount FROM fares WHERE route_id=$1 AND from_stop_id=$2 AND to_stop_id=$3",
            ROUTE_ID, TEST_TO, TEST_FROM,
        )
        print(f"   {rev if rev is not None else '❌ NULL'}")

        print("\n5) Total rows for this route:", await conn.fetchval(
            "SELECT COUNT(*) FROM fares WHERE route_id=$1", ROUTE_ID))

        print("\n6) Distinct from_stop_ids that HAVE fares:")
        rows = await conn.fetch(
            "SELECT DISTINCT from_stop_id FROM fares WHERE route_id=$1 ORDER BY from_stop_id",
            ROUTE_ID)
        print("   ", [r["from_stop_id"] for r in rows])
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())