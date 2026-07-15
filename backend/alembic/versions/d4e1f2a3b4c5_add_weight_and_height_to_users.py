"""add weight and height to users

Revision ID: d4e1f2a3b4c5
Revises: bec237f46475
Create Date: 2026-05-31 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e1f2a3b4c5'
down_revision: Union[str, Sequence[str], None] = '90bbb7df77ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('weight', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('height', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'height')
    op.drop_column('users', 'weight')
