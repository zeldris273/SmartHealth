"""merge age and chat heads

Revision ID: c63f004b43de
Revises: 3e1b5068f2a7, f1a2b3c4d5e6
Create Date: 2026-06-11 06:15:05.353526

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c63f004b43de'
down_revision: Union[str, Sequence[str], None] = ('3e1b5068f2a7', 'f1a2b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
