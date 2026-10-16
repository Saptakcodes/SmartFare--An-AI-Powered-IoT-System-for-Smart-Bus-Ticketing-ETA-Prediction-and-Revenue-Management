import asyncio

from sqlalchemy import text

from app.db.session import engine


async def main():
    async with engine.connect() as conn:
        version = await conn.execute(text("SELECT version();"))
        print("PostgreSQL:", version.scalar())

        postgis = await conn.execute(text("SELECT PostGIS_Version();"))
        print("PostGIS:", postgis.scalar())

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())