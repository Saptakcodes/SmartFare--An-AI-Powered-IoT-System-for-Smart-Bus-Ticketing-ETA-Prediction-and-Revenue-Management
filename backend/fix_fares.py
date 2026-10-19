import asyncio
import asyncpg

NEON_URL = "postgresql://neondb_owner:npg_WNkjT1FuC5cv@ep-red-math-aoohywa2.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
ROUTE_ID = "ROUTE_MADHYAMGRAM_NARKELBAGAN"
FARE_PER_STOP = 5
MAX_FARE = 25


async def main():
    conn = await asyncpg.connect(NEON_URL)
    try:
        async with conn.transaction():
            print("Deleting existing fares for this route...")
            result = await conn.execute(
                "DELETE FROM fares WHERE route_id = $1", ROUTE_ID
            )
            print(f"  {result}")

            print("Reading stop sequences from DB...")
            stops = await conn.fetch(
                """
                SELECT stop_id, seq FROM route_stops
                WHERE route_id = $1
                ORDER BY seq
                """,
                ROUTE_ID,
            )
            print(f"  {len(stops)} stops")

            fare_inserts = []
            for i in range(len(stops)):
                for j in range(i + 1, len(stops)):
                    hops = stops[j]["seq"] - stops[i]["seq"]
                    amount = min(hops * FARE_PER_STOP, MAX_FARE)
                    fare_inserts.append(
                        (ROUTE_ID, stops[i]["stop_id"], stops[j]["stop_id"], amount)
                    )

            await conn.executemany(
                """
                INSERT INTO fares (route_id, from_stop_id, to_stop_id, amount)
                VALUES ($1, $2, $3, $4)
                """,
                fare_inserts,
            )
            print(f"Re-inserted {len(fare_inserts)} fare rows.")

            # Verify
            max_amt = await conn.fetchval(
                "SELECT MAX(amount) FROM fares WHERE route_id = $1", ROUTE_ID
            )
            cnt = await conn.fetchval(
                "SELECT COUNT(*) FROM fares WHERE route_id = $1", ROUTE_ID
            )
            bad = await conn.fetchval(
                "SELECT COUNT(*) FROM fares WHERE route_id = $1 AND amount > 25",
                ROUTE_ID,
            )
            print(f"\nVerify: {cnt} rows, max = ₹{max_amt}, rows > 25 = {bad}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())