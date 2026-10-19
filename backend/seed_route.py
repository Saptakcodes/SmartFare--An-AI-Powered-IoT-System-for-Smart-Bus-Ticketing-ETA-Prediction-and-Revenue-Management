import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

NEON_URL = "postgresql://neondb_owner:npg_WNkjT1FuC5cv@ep-red-math-aoohywa2.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# fare_from_origin now correctly reflects the capped fare:
#   min((sequence - 1) * 5, 25)
# Fields fare_from_previous_stop / fare_from_origin are COSMETIC here —
# the actual fare matrix is computed below from `sequence` alone.
route_data = [
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST01", "stop_name": "Madhyamgram", "latitude": 22.692438, "longitude": 88.465414, "fare_from_previous_stop": 0, "fare_from_origin": 0, "sequence": 1},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST02", "stop_name": "New Barrackpore", "latitude": 22.753990, "longitude": 88.369530, "fare_from_previous_stop": 5, "fare_from_origin": 5, "sequence": 2},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST03", "stop_name": "Doltala", "latitude": 22.685650, "longitude": 88.463280, "fare_from_previous_stop": 5, "fare_from_origin": 10, "sequence": 3},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST04", "stop_name": "BT College", "latitude": 22.680700, "longitude": 88.446100, "fare_from_previous_stop": 5, "fare_from_origin": 15, "sequence": 4},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST05", "stop_name": "Sukantanagar", "latitude": 22.670000, "longitude": 88.440000, "fare_from_previous_stop": 5, "fare_from_origin": 20, "sequence": 5},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST06", "stop_name": "Michaelnagar", "latitude": 22.675031, "longitude": 88.444745, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 6},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST07", "stop_name": "Bankra", "latitude": 22.669000, "longitude": 88.438000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 7},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST08", "stop_name": "Gouripur", "latitude": 22.666000, "longitude": 88.436000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 8},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST09", "stop_name": "Birati", "latitude": 22.663212, "longitude": 88.427127, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 9},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST10", "stop_name": "Sarat Colony", "latitude": 22.659565, "longitude": 88.437742, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 10},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST11", "stop_name": "Airport 3 no. gate", "latitude": 22.652900, "longitude": 88.438400, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 11},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST12", "stop_name": "Airport 2.5 no.", "latitude": 22.649000, "longitude": 88.436000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 12},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST13", "stop_name": "Airport 2", "latitude": 22.646145, "longitude": 88.433859, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 13},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST14", "stop_name": "Airport 1", "latitude": 22.642600, "longitude": 88.429800, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 14},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST15", "stop_name": "Kaikhali", "latitude": 22.635175, "longitude": 88.439236, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 15},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST16", "stop_name": "Haldiram", "latitude": 22.626600, "longitude": 88.431400, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 16},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST17", "stop_name": "Chinarpark", "latitude": 22.623600, "longitude": 88.441000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 17},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST18", "stop_name": "City Center 2", "latitude": 22.622850, "longitude": 88.450360, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 18},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST19", "stop_name": "Akansha More", "latitude": 22.618889, "longitude": 88.465556, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 19},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST20", "stop_name": "Nawabpur", "latitude": 22.610000, "longitude": 88.470000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 20},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST21", "stop_name": "Nababpur Eco park gate 4", "latitude": 22.606000, "longitude": 88.471000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 21},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST22", "stop_name": "Pechar more", "latitude": 22.605000, "longitude": 88.473000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 22},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST23", "stop_name": "Ecopark gate 3 Mistihub", "latitude": 22.608000, "longitude": 88.470000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 23},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST24", "stop_name": "Ecopark gate 2 MWM", "latitude": 22.600330, "longitude": 88.470610, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 24},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST25", "stop_name": "Ecopark gate 1 police fari", "latitude": 22.593000, "longitude": 88.476000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 25},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST26", "stop_name": "Westin More", "latitude": 22.595000, "longitude": 88.480000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 26},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST27", "stop_name": "Jatragachi", "latitude": 22.587000, "longitude": 88.479000, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 27},
  {"bus_id": "WBTC001", "trip_id": "ROUTE_MADHYAMGRAM_NARKELBAGAN", "stop_id": "ST28", "stop_name": "Narkelbagan", "latitude": 22.578610, "longitude": 88.471670, "fare_from_previous_stop": 5, "fare_from_origin": 25, "sequence": 28},
]

FARE_PER_STOP = 5
MAX_FARE = 25


def compute_fare(seq_from: int, seq_to: int) -> int:
    """Real bus fare: ₹5 per hop, capped at ₹25. Works both directions."""
    return min(abs(seq_to - seq_from) * FARE_PER_STOP, MAX_FARE)


async def main():
    print("Connecting to Neon Database...")
    conn = await asyncpg.connect(NEON_URL)

    try:
        async with conn.transaction():
            # ---------- 1. Bus ----------
            bus_id = route_data[0]["bus_id"]
            await conn.execute(
                """INSERT INTO buses (bus_id, capacity, is_active)
                   VALUES ($1, 50, true) ON CONFLICT DO NOTHING;""",
                bus_id,
            )

            # ---------- 2. Route ----------
            route_id = route_data[0]["trip_id"]
            await conn.execute(
                """INSERT INTO routes (route_id, name, is_active)
                   VALUES ($1, $2, true) ON CONFLICT DO NOTHING;""",
                route_id, "Madhyamgram - Narkelbagan",
            )

            print("Inserted Bus and Route. Inserting 28 stops...")

            # ---------- 3. Stops + route_stops ----------
            for row in route_data:
                await conn.execute(
                    """INSERT INTO stops (stop_id, name, geog)
                       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3,$4),4326)::geography)
                       ON CONFLICT (stop_id) DO UPDATE SET name = EXCLUDED.name;""",
                    row["stop_id"], row["stop_name"],
                    row["longitude"], row["latitude"],
                )
                # Idempotent: update seq if the route already exists
                await conn.execute(
                    """INSERT INTO route_stops (route_id, stop_id, seq)
                       VALUES ($1, $2, $3)
                       ON CONFLICT (route_id, stop_id)
                       DO UPDATE SET seq = EXCLUDED.seq;""",
                    route_id, row["stop_id"], row["sequence"],
                )

            print("Stops inserted. Now generating bidirectional fare matrix...")

            # ---------- 4. Fares: BOTH directions ----------
            # 28 stops → 28*27 = 756 ordered pairs, all populated.
            fare_inserts = []
            for i in range(len(route_data)):
                for j in range(i + 1, len(route_data)):
                    a, b = route_data[i], route_data[j]
                    amount = compute_fare(a["sequence"], b["sequence"])

                    # forward
                    fare_inserts.append(
                        (route_id, a["stop_id"], b["stop_id"], amount))
                    # reverse (same price, real-bus behaviour)
                    fare_inserts.append(
                        (route_id, b["stop_id"], a["stop_id"], amount))

            await conn.executemany(
                """INSERT INTO fares (route_id, from_stop_id, to_stop_id, amount)
                   VALUES ($1, $2, $3, $4)
                   ON CONFLICT (route_id, from_stop_id, to_stop_id)
                   DO UPDATE SET amount = EXCLUDED.amount;""",
                fare_inserts,
            )

            print(f"Success! Upserted {len(fare_inserts)} fare combinations "
                  f"(378 forward + 378 reverse).")
            print(f"Fare rule: +₹{FARE_PER_STOP} per stop, max ₹{MAX_FARE}")

            # ---------- 5. Real verification (queries the DB) ----------
            total = await conn.fetchval(
                "SELECT COUNT(*) FROM fares WHERE route_id = $1", route_id)
            max_amt = await conn.fetchval(
                "SELECT MAX(amount) FROM fares WHERE route_id = $1", route_id)
            bad = await conn.fetchval(
                "SELECT COUNT(*) FROM fares WHERE route_id=$1 AND amount > $2",
                route_id, MAX_FARE)
            print(f"\nDB state: {total} fare rows, max = ₹{max_amt}, "
                  f"rows > ₹{MAX_FARE} = {bad}")

            samples = [
                ("ST01", "ST02", 5),
                ("ST01", "ST05", 20),
                ("ST01", "ST06", 25),
                ("ST01", "ST28", 25),
                ("ST05", "ST28", 25),
                ("ST28", "ST05", 25),   # ← reverse — used to fail
                ("ST28", "ST01", 25),   # ← reverse — used to fail
                ("ST27", "ST28", 5),
                ("ST28", "ST27", 5),    # ← reverse
            ]
            print("\nVerified fares from DB:")
            all_ok = True
            for f, t, expected in samples:
                amt = await conn.fetchval(
                    """SELECT amount FROM fares
                       WHERE route_id=$1 AND from_stop_id=$2 AND to_stop_id=$3""",
                    route_id, f, t,
                )
                got = float(amt) if amt is not None else None
                ok = got == expected
                all_ok = all_ok and ok
                print(f"  {f} -> {t} : ₹{got}  [{'OK' if ok else 'WRONG'}]")

            if all_ok and bad == 0 and total == 756:
                print("\n✅ All checks passed. Fare matrix is correct in both directions.")
            else:
                print("\n❌ Something is still off — see values above.")

    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())