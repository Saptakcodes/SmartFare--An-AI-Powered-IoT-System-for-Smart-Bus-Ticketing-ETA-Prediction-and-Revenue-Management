import asyncio

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models import User


async def main():
    async with AsyncSessionLocal() as session:
        user = User(
            email="test@smartfare.local",
            full_name="Test User",
            password_hash="dummy_hash",
            role="passenger",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        print("Created user:", user.user_id, user.email, user.balance)

        result = await session.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"  - {u.email} | role={u.role} | balance={u.balance}")


if __name__ == "__main__":
    asyncio.run(main())