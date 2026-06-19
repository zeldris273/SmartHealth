"""Merge conflicting head migrations

Revision ID: bec237f46475
Revises: 53581556eb6f, b7c2d9a41f03
Create Date: 2026-05-29 20:31:15.020576

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bec237f46475'
down_revision: Union[str, Sequence[str], None] = ('53581556eb6f', 'b7c2d9a41f03')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
