"""
Run once to create the first super admin:

    python -m app.scripts.create_super_admin

You will be prompted for email, name, and password.
"""
import asyncio
import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models import Admin


async def main():
    email = input("Super admin email: ").strip()
    full_name = input("Full name: ").strip()
    password = getpass.getpass("Password: ")

    async with AsyncSessionLocal() as db:
        existing = (
            await db.execute(select(Admin).where(Admin.email == email))
        ).scalar_one_or_none()
        if existing:
            print("Admin with this email already exists.")
            return

        admin = Admin(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role="super_admin",
        )
        db.add(admin)
        await db.commit()
        await db.refresh(admin)
        print(f"Super admin created: {admin.admin_id} / {admin.email}")


if __name__ == "__main__":
    asyncio.run(main())