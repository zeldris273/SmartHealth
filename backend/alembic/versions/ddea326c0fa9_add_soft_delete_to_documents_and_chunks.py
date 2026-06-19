"""Add soft delete to documents and chunks

Revision ID: ddea326c0fa9
Revises: 784a91fb8a3b
Create Date: 2026-06-19 04:32:03.382121

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ddea326c0fa9'
down_revision: Union[str, Sequence[str], None] = '784a91fb8a3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to knowledge_documents
    op.add_column('knowledge_documents', sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('knowledge_documents', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('knowledge_documents', sa.Column('deleted_by', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_knowledge_documents_deleted_by_users_id', 'knowledge_documents', 'users', ['deleted_by'], ['id'])

    # Add columns to knowledge_chunks
    op.add_column('knowledge_chunks', sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('knowledge_chunks', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove columns from knowledge_chunks
    op.drop_column('knowledge_chunks', 'deleted_at')
    op.drop_column('knowledge_chunks', 'is_deleted')

    # Remove columns from knowledge_documents
    op.drop_column('knowledge_documents', 'deleted_by')
    op.drop_column('knowledge_documents', 'deleted_at')
    op.drop_column('knowledge_documents', 'is_deleted')