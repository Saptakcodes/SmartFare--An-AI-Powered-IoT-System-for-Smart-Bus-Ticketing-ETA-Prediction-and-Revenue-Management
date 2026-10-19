import asyncio
import asyncpg

NEON_URL = "postgresql://neondb_owner:npg_WNkjT1FuC5cv@ep-red-math-aoohywa2.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
ROUTE_ID = "ROUTE_MADHYAMGRAM_NARKELBAGAN"

async def main():
    conn = await asyncpg.connect(NEON_URL)
    try:
        print("--- Row counts ---")
        for t in ["buses", "routes", "stops", "route_stops", "fares"]:
            c = await conn.fetchval(f"SELECT COUNT(*) FROM {t}")
            print(f"  {t:12s}: {c}")

        print("\n--- Fares > ₹25 (should be 0) ---")
        bad = await conn.fetchval(
            "SELECT COUNT(*) FROM fares WHERE route_id = $1 AND amount > 25",
            ROUTE_ID,
        )
        print(f"  rows with amount > 25: {bad}")

        print("\n--- Sample fares (expected on the right) ---")
        expected = {
            ("ST01", "ST02"): 5,
            ("ST01", "ST05"): 20,
            ("ST01", "ST06"): 25,
            ("ST01", "ST28"): 25,   # <-- was 30 before the fix
            ("ST06", "ST07"): 5,    # <-- was missing before
            ("ST07", "ST08"): 5,    # <-- was missing before
            ("ST27", "ST28"): 5,
        }
        for (f, t), exp in expected.items():
            amt = await conn.fetchval(
                "SELECT amount FROM fares WHERE route_id=$1 AND from_stop_id=$2 AND to_stop_id=$3",
                ROUTE_ID, f, t,
            )
            status = "OK" if amt == exp else "WRONG"
            print(f"  {f} -> {t}: got {amt}, expected {exp}  [{status}]")

        print("\n--- Expected total pairs ---")
        print(f"  28 * 27 / 2 = {28 * 27 // 2}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())