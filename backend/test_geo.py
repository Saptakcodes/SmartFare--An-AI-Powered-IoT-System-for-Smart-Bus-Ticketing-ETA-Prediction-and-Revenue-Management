import asyncio

from sqlalchemy import text

from app.db.session import AsyncSessionLocal, engine


async def main():
    async with AsyncSessionLocal() as db:
        await db.execute(text("DELETE FROM stops WHERE stop_id LIKE 'TEST_%'"))
        await db.commit()

        await db.execute(
            text(
                """
                INSERT INTO stops (stop_id, name, geog) VALUES
                ('TEST_A', 'Test Stop A', 'SRID=4326;POINT(88.3639 22.5726)'),
                ('TEST_B', 'Test Stop B', 'SRID=4326;POINT(88.3794 22.5871)')
                """
            )
        )
        await db.commit()

        result = await db.execute(
            text(
                """
                SELECT a.stop_id, b.stop_id,
                       ST_Distance(a.geog, b.geog) AS meters
                FROM stops a, stops b
                WHERE a.stop_id = 'TEST_A' AND b.stop_id = 'TEST_B'
                """
            )
        )
        row = result.first()
        print(f"Distance {row[0]} -> {row[1]}: {row[2]:.1f} m")

        result = await db.execute(
            text(
                """
                SELECT stop_id, name,
                       ST_Distance(
                           geog,
                           ST_SetSRID(ST_MakePoint(88.3650, 22.5730), 4326)::geography
                       ) AS meters
                FROM stops
                WHERE stop_id LIKE 'TEST_%'
                ORDER BY meters
                LIMIT 1
                """
            )
        )
        row = result.first()
        print(f"Nearest to (88.3650, 22.5730): {row[0]} ({row[1]}) at {row[2]:.1f} m")

        await db.execute(text("DELETE FROM stops WHERE stop_id LIKE 'TEST_%'"))
        await db.commit()

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())