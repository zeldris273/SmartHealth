"""merge heads

Revision ID: merge_heads_email_global
Revises: 9876543210ab, a1b2c3d4e5g7
Create Date: 2026-07-02 01:49:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'merge_heads_email_global'
down_revision: Union[str, Sequence[str], None] = ['9876543210ab', 'a1b2c3d4e5g7']
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass