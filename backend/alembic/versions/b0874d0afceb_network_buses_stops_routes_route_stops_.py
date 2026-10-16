"""network: buses, stops, routes, route_stops, fares

Revision ID: b0874d0afceb
Revises: 1e4dba474b05
Create Date: 2026-10-12 20:58:02.225244

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = 'b0874d0afceb'
down_revision: Union[str, Sequence[str], None] = '1e4dba474b05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        'buses',
        sa.Column('bus_id', sa.String(length=32), nullable=False),
        sa.Column('plate_no', sa.String(length=32), nullable=True),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('bus_id', name=op.f('pk_buses')),
        sa.UniqueConstraint('plate_no', name=op.f('uq_buses_plate_no')),
    )

    op.create_table(
        'routes',
        sa.Column('route_id', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('route_id', name=op.f('pk_routes')),
    )

    op.create_table(
        'stops',
        sa.Column('stop_id', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column(
            'geog',
            geoalchemy2.types.Geography(
                geometry_type='POINT',
                srid=4326,
                dimension=2,
                from_text='ST_GeogFromText',
                name='geography',
                nullable=False,
            ),
            nullable=False,
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('stop_id', name=op.f('pk_stops')),
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_stops_name ON stops (name)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_stops_geog "
        "ON stops USING gist (geog)"
    )

    op.create_table(
        'fares',
        sa.Column('route_id', sa.String(length=32), nullable=False),
        sa.Column('from_stop_id', sa.String(length=32), nullable=False),
        sa.Column('to_stop_id', sa.String(length=32), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['from_stop_id'], ['stops.stop_id'], name=op.f('fk_fares_from_stop_id_stops')),
        sa.ForeignKeyConstraint(['route_id'], ['routes.route_id'], name=op.f('fk_fares_route_id_routes'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['to_stop_id'], ['stops.stop_id'], name=op.f('fk_fares_to_stop_id_stops')),
        sa.PrimaryKeyConstraint('route_id', 'from_stop_id', 'to_stop_id', name=op.f('pk_fares')),
    )

    op.create_table(
        'route_stops',
        sa.Column('route_id', sa.String(length=32), nullable=False),
        sa.Column('stop_id', sa.String(length=32), nullable=False),
        sa.Column('seq', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['route_id'], ['routes.route_id'], name=op.f('fk_route_stops_route_id_routes'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['stop_id'], ['stops.stop_id'], name=op.f('fk_route_stops_stop_id_stops'), ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('route_id', 'stop_id', name=op.f('pk_route_stops')),
        sa.UniqueConstraint('route_id', 'seq', name='uq_route_stops_route_seq'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('route_stops')
    op.drop_table('fares')
    op.execute("DROP INDEX IF EXISTS idx_stops_geog")
    op.execute("DROP INDEX IF EXISTS ix_stops_name")
    op.drop_table('stops')
    op.drop_table('routes')
    op.drop_table('buses')