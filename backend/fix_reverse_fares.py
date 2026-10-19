import asyncio
import asyncpg

NEON_URL = "postgresql://neondb_owner:npg_WNkjT1FuC5cv@ep-red-math-aoohywa2.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
ROUTE_ID = "ROUTE_MADHYAMGRAM_NARKELBAGAN"


async def main():
    conn = await asyncpg.connect(NEON_URL)
    try:
        async with conn.transaction():
            existing = await conn.fetch(
                """SELECT from_stop_id, to_stop_id, amount FROM fares
                   WHERE route_id = $1""",
                ROUTE_ID,
            )
            print(f"Existing rows: {len(existing)}")

            reverses = [
                (ROUTE_ID, r["to_stop_id"], r["from_stop_id"], r["amount"])
                for r in existing
            ]

            await conn.executemany(
                """INSERT INTO fares (route_id, from_stop_id, to_stop_id, amount)
                   VALUES ($1, $2, $3, $4)
                   ON CONFLICT (route_id, from_stop_id, to_stop_id)
                   DO UPDATE SET amount = EXCLUDED.amount""",
                reverses,
            )

            total = await conn.fetchval(
                "SELECT COUNT(*) FROM fares WHERE route_id = $1", ROUTE_ID
            )
            max_amt = await conn.fetchval(
                "SELECT MAX(amount) FROM fares WHERE route_id = $1", ROUTE_ID
            )
            print(f"Total rows now: {total} (should be 756)")
            print(f"Max fare: ₹{max_amt}")

            # Sanity checks on the previously-broken direction
            for f, t in [("ST28", "ST05"), ("ST28", "ST01"), ("ST27", "ST28")]:
                amt = await conn.fetchval(
                    """SELECT amount FROM fares
                       WHERE route_id=$1 AND from_stop_id=$2 AND to_stop_id=$3""",
                    ROUTE_ID, f, t,
                )
                print(f"  {f} -> {t}: {amt}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())