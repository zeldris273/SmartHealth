"""add profile fields to user table

Revision ID: a691777aaacb
Revises: 
Create Date: 2026-05-20 21:30:41.771651

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a691777aaacb'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns("users")}

    if "phone_number" not in existing_columns:
        op.add_column("users", sa.Column("phone_number", sa.String(length=15), nullable=True))
    if "gender" not in existing_columns:
        op.add_column("users", sa.Column("gender", sa.String(length=10), nullable=True))
    if "date_of_birth" not in existing_columns:
        op.add_column("users", sa.Column("date_of_birth", sa.Date(), nullable=True))
    if "national_id" not in existing_columns:
        op.add_column("users", sa.Column("national_id", sa.String(length=20), nullable=True))
    if "address" not in existing_columns:
        op.add_column("users", sa.Column("address", sa.String(length=255), nullable=True))

    unique_constraints = {
        constraint["name"]
        for constraint in inspector.get_unique_constraints("users")
    }
    if "uq_users_national_id" not in unique_constraints:
        op.create_unique_constraint("uq_users_national_id", "users", ["national_id"])


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    unique_constraints = {
        constraint["name"]
        for constraint in inspector.get_unique_constraints("users")
    }

    if "uq_users_national_id" in unique_constraints:
        op.drop_constraint("uq_users_national_id", "users", type_="unique")
    for column_name in ("address", "national_id", "date_of_birth", "gender", "phone_number"):
        if column_name in existing_columns:
            op.drop_column("users", column_name)
