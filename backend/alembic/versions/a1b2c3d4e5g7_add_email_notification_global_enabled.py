"""add email_notification_global_enabled to users

Revision ID: a1b2c3d4e5g7
Revises: f1a2b3c4d5e6
Create Date: 2026-07-02 01:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5g7'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the missing column with a server default of true
    op.add_column('users', sa.Column('email_notification_global_enabled', sa.Boolean(), nullable=True, server_default=sa.text('true')))


def downgrade() -> None:
    op.drop_column('users', 'email_notification_global_enabled')