"""operations: trips, journeys, transactions, rfid_events, gps_records, sync

Revision ID: f21b6f1cca40
Revises: b0874d0afceb
Create Date: 2026-10-12 21:27:43.177462

"""
from typing import Sequence, Union

import geoalchemy2
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f21b6f1cca40'
down_revision: Union[str, Sequence[str], None] = 'b0874d0afceb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        'eta_predictions',
        sa.Column('prediction_id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('trip_id', sa.String(length=64), nullable=False),
        sa.Column('stop_id', sa.String(length=32), nullable=False),
        sa.Column('predicted_eta', sa.DateTime(timezone=True), nullable=False),
        sa.Column('model_version', sa.String(length=32), nullable=False),
        sa.Column('features', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('prediction_id', name=op.f('pk_eta_predictions')),
    )
    op.create_index(op.f('ix_eta_predictions_trip_id'), 'eta_predictions', ['trip_id'], unique=False)

    op.create_table(
        'gps_records',
        sa.Column('gps_id', sa.UUID(), nullable=False),
        sa.Column('device_id', sa.String(length=64), nullable=False),
        sa.Column('bus_id', sa.String(length=32), nullable=False),
        sa.Column('trip_id', sa.String(length=64), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
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
        sa.Column('speed_kmph', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('gps_utc_time', sa.String(length=16), nullable=True),
        sa.Column('gps_date', sa.String(length=16), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('synced_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('gps_id', name=op.f('pk_gps_records')),
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_gps_records_geog "
        "ON gps_records USING gist (geog)"
    )
    op.create_index(op.f('ix_gps_records_trip_id'), 'gps_records', ['trip_id'], unique=False)

    op.create_table(
        'sync_log',
        sa.Column('sync_id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('device_id', sa.String(length=64), nullable=False),
        sa.Column('event_id', sa.UUID(), nullable=False),
        sa.Column('event_type', sa.String(length=32), nullable=False),
        sa.Column('status', sa.String(length=16), server_default='OK', nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('received_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('sync_id', name=op.f('pk_sync_log')),
        sa.UniqueConstraint('event_id', name=op.f('uq_sync_log_event_id')),
    )
    op.create_index(op.f('ix_sync_log_device_id'), 'sync_log', ['device_id'], unique=False)

    op.create_table(
        'device_status',
        sa.Column('device_id', sa.String(length=64), nullable=False),
        sa.Column('bus_id', sa.String(length=32), nullable=True),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('gps_ok', sa.Boolean(), nullable=True),
        sa.Column('rfid_ok', sa.Boolean(), nullable=True),
        sa.Column('network_ok', sa.Boolean(), nullable=True),
        sa.Column('app_version', sa.String(length=32), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['bus_id'], ['buses.bus_id'], name=op.f('fk_device_status_bus_id_buses')),
        sa.PrimaryKeyConstraint('device_id', name=op.f('pk_device_status')),
    )

    op.create_table(
        'trips',
        sa.Column('trip_id', sa.String(length=64), nullable=False),
        sa.Column('bus_id', sa.String(length=32), nullable=False),
        sa.Column('device_id', sa.String(length=64), nullable=False),
        sa.Column('route_id', sa.String(length=32), nullable=False),
        sa.Column('direction', sa.String(length=32), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=16), server_default='ACTIVE', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['bus_id'], ['buses.bus_id'], name=op.f('fk_trips_bus_id_buses')),
        sa.ForeignKeyConstraint(['route_id'], ['routes.route_id'], name=op.f('fk_trips_route_id_routes')),
        sa.PrimaryKeyConstraint('trip_id', name=op.f('pk_trips')),
    )
    op.create_index(op.f('ix_trips_bus_id'), 'trips', ['bus_id'], unique=False)

    op.create_table(
        'journeys',
        sa.Column('journey_id', sa.UUID(), nullable=False),
        sa.Column('rfid_id', sa.String(length=64), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('bus_id', sa.String(length=32), nullable=False),
        sa.Column('trip_id', sa.String(length=64), nullable=False),
        sa.Column('route_id', sa.String(length=32), nullable=False),
        sa.Column('boarding_stop_id', sa.String(length=32), nullable=True),
        sa.Column('latest_exit_stop_id', sa.String(length=32), nullable=True),
        sa.Column('boarding_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('latest_exit_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_fare', sa.Numeric(precision=10, scale=2), server_default='0', nullable=False),
        sa.Column('amount_collected', sa.Numeric(precision=10, scale=2), server_default='0', nullable=False),
        sa.Column('outstanding_amount', sa.Numeric(precision=10, scale=2), server_default='0', nullable=False),
        sa.Column('financial_state', sa.String(length=16), server_default='PENDING', nullable=False),
        sa.Column('journey_state', sa.String(length=16), server_default='ACTIVE', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['boarding_stop_id'], ['stops.stop_id'], name=op.f('fk_journeys_boarding_stop_id_stops')),
        sa.ForeignKeyConstraint(['bus_id'], ['buses.bus_id'], name=op.f('fk_journeys_bus_id_buses')),
        sa.ForeignKeyConstraint(['latest_exit_stop_id'], ['stops.stop_id'], name=op.f('fk_journeys_latest_exit_stop_id_stops')),
        sa.ForeignKeyConstraint(['rfid_id'], ['rfid_cards.rfid_id'], name=op.f('fk_journeys_rfid_id_rfid_cards')),
        sa.ForeignKeyConstraint(['route_id'], ['routes.route_id'], name=op.f('fk_journeys_route_id_routes')),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.trip_id'], name=op.f('fk_journeys_trip_id_trips')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name=op.f('fk_journeys_user_id_users')),
        sa.PrimaryKeyConstraint('journey_id', name=op.f('pk_journeys')),
    )
    op.create_index(op.f('ix_journeys_trip_id'), 'journeys', ['trip_id'], unique=False)

    op.create_table(
        'journey_events',
        sa.Column('event_id', sa.UUID(), nullable=False),
        sa.Column('journey_id', sa.UUID(), nullable=False),
        sa.Column('event_type', sa.String(length=32), nullable=False),
        sa.Column('from_stop_id', sa.String(length=32), nullable=True),
        sa.Column('to_stop_id', sa.String(length=32), nullable=True),
        sa.Column('amount_delta', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['from_stop_id'], ['stops.stop_id'], name=op.f('fk_journey_events_from_stop_id_stops')),
        sa.ForeignKeyConstraint(['journey_id'], ['journeys.journey_id'], name=op.f('fk_journey_events_journey_id_journeys'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['to_stop_id'], ['stops.stop_id'], name=op.f('fk_journey_events_to_stop_id_stops')),
        sa.PrimaryKeyConstraint('event_id', name=op.f('pk_journey_events')),
    )
    op.create_index(op.f('ix_journey_events_journey_id'), 'journey_events', ['journey_id'], unique=False)

    op.create_table(
        'rfid_events',
        sa.Column('event_id', sa.UUID(), nullable=False),
        sa.Column('device_id', sa.String(length=64), nullable=False),
        sa.Column('epc', sa.String(length=64), nullable=False),
        sa.Column('rfid_id', sa.String(length=64), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('bus_id', sa.String(length=32), nullable=False),
        sa.Column('trip_id', sa.String(length=64), nullable=True),
        sa.Column('journey_id', sa.UUID(), nullable=True),
        sa.Column('event_type', sa.String(length=16), nullable=False),
        sa.Column('stop_id', sa.String(length=32), nullable=True),
        sa.Column('stop_verified', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column(
            'geog',
            geoalchemy2.types.Geography(
                geometry_type='POINT',
                srid=4326,
                dimension=2,
                from_text='ST_GeogFromText',
                name='geography',
            ),
            nullable=True,
        ),
        sa.Column('speed_kmph', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('gps_utc_time', sa.String(length=16), nullable=True),
        sa.Column('gps_date', sa.String(length=16), nullable=True),
        sa.Column('session_started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('session_ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('synced_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['journey_id'], ['journeys.journey_id'], name=op.f('fk_rfid_events_journey_id_journeys')),
        sa.ForeignKeyConstraint(['rfid_id'], ['rfid_cards.rfid_id'], name=op.f('fk_rfid_events_rfid_id_rfid_cards')),
        sa.ForeignKeyConstraint(['stop_id'], ['stops.stop_id'], name=op.f('fk_rfid_events_stop_id_stops')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name=op.f('fk_rfid_events_user_id_users')),
        sa.PrimaryKeyConstraint('event_id', name=op.f('pk_rfid_events')),
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_rfid_events_geog "
        "ON rfid_events USING gist (geog)"
    )
    op.create_index(op.f('ix_rfid_events_epc'), 'rfid_events', ['epc'], unique=False)
    op.create_index(op.f('ix_rfid_events_trip_id'), 'rfid_events', ['trip_id'], unique=False)

    op.create_table(
        'transactions',
        sa.Column('transaction_id', sa.UUID(), nullable=False),
        sa.Column('journey_id', sa.UUID(), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('type', sa.String(length=32), nullable=False),
        sa.Column('balance_after', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['journey_id'], ['journeys.journey_id'], name=op.f('fk_transactions_journey_id_journeys')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name=op.f('fk_transactions_user_id_users')),
        sa.PrimaryKeyConstraint('transaction_id', name=op.f('pk_transactions')),
    )
    op.create_index(op.f('ix_transactions_journey_id'), 'transactions', ['journey_id'], unique=False)
    op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_transactions_user_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_journey_id'), table_name='transactions')
    op.drop_table('transactions')

    op.drop_index(op.f('ix_rfid_events_trip_id'), table_name='rfid_events')
    op.drop_index(op.f('ix_rfid_events_epc'), table_name='rfid_events')
    op.execute("DROP INDEX IF EXISTS idx_rfid_events_geog")
    op.drop_table('rfid_events')

    op.drop_index(op.f('ix_journey_events_journey_id'), table_name='journey_events')
    op.drop_table('journey_events')

    op.drop_index(op.f('ix_journeys_trip_id'), table_name='journeys')
    op.drop_table('journeys')

    op.drop_index(op.f('ix_trips_bus_id'), table_name='trips')
    op.drop_table('trips')

    op.drop_table('device_status')

    op.drop_index(op.f('ix_sync_log_device_id'), table_name='sync_log')
    op.drop_table('sync_log')

    op.drop_index(op.f('ix_gps_records_trip_id'), table_name='gps_records')
    op.execute("DROP INDEX IF EXISTS idx_gps_records_geog")
    op.drop_table('gps_records')

    op.drop_index(op.f('ix_eta_predictions_trip_id'), table_name='eta_predictions')
    op.drop_table('eta_predictions')