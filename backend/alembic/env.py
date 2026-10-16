import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

from app.core.config import settings
from app.db.base import Base

# Import models so Alembic can see them
import app.models  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


# ---------------------------------------------------------------------------
# PostGIS and system schemas we do NOT want Alembic to touch.
# ---------------------------------------------------------------------------
POSTGIS_TABLE_PREFIXES = (
    "spatial_ref_sys",
    "geocode_settings",
    "geocode_settings_default",
    "topology",
    "layer",
    "loader_lookuptables",
    "loader_platform",
    "loader_variables",
    "tiger",
    "tiger_data",
    "county",
    "county_lookup",
    "cousub",
    "cousub_lookup",
    "place",
    "place_lookup",
    "state",
    "state_lookup",
    "zip_lookup",
    "zip_lookup_all",
    "zip_lookup_base",
    "zip_state",
    "zip_state_loc",
    "addr",
    "addrfeat",
    "bg",
    "edge",
    "face",
    "featnames",
    "tabblock",
    "tabblock20",
    "tract",
    "zcta5",
    "pagc_gaz",
    "pagc_lex",
    "pagc_rules",
    "direction_lookup",
    "secondary_unit_lookup",
    "street_type_lookup",
)


def include_object(obj, name, type_, reflected, compare_to):
    """
    Return False to tell Alembic to ignore this object.
    """
    if type_ == "table":
        if name in POSTGIS_TABLE_PREFIXES:
            return False
        if name.startswith("spatial_ref_sys"):
            return False
        if name.startswith("geocode_"):
            return False
        if name.startswith("tiger"):
            return False
        if name.startswith("topology"):
            return False
        # Ignore anything in the topology schema
        schema = getattr(obj, "schema", None)
        if schema in ("topology", "tiger", "tiger_data"):
            return False

    return True


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        include_object=include_object,
        include_schemas=False,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        include_object=include_object,
        include_schemas=False,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()