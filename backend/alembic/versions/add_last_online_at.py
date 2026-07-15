"""Add last_online_at to users

Revision ID: add_last_online
Revises: c9526f89f76d
Create Date: 2026-06-12 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_last_online'
down_revision = 'c9526f89f76d'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('users', sa.Column('last_online_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))

def downgrade():
    op.drop_column('users', 'last_online_at')
