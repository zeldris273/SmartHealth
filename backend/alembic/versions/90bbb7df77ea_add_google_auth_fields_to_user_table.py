"""add google auth fields to user table

Revision ID: 90bbb7df77ea
Revises: bec237f46475
Create Date: 2026-05-30 10:45:20.722796

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90bbb7df77ea'
down_revision: Union[str, Sequence[str], None] = 'bec237f46475'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Thêm cột auth_provider nhưng tạm thời cho phép NULL (nullable=True) trước
    op.add_column('users', sa.Column('auth_provider', sa.String(length=50), nullable=True, comment='Nguồn đăng nhập: local, google, facebook...'))
    
    # 2. Chạy lệnh SQL cập nhật tất cả các user cũ hiện tại thành giá trị 'local'
    op.execute("UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL")
    
    # 3. Bây giờ dữ liệu đã sạch, ép ràng buộc NOT NULL vào cột auth_provider một cách an toàn
    op.alter_column('users', 'auth_provider', nullable=False)
    
    # 4. Thêm 2 cột còn lại bình thường vì tụi mình đã để nullable=True sẵn từ đầu
    op.add_column('users', sa.Column('google_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.String(length=500), nullable=True))
    op.create_unique_constraint(None, 'users', ['google_id'])


def downgrade() -> None:
    op.drop_constraint(None, 'users', type_='unique')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'google_id')
    op.drop_column('users', 'auth_provider')
