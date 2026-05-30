from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class OAuthToken(Base):
    __tablename__ = "oauth_tokens"
    __table_args__ = (UniqueConstraint('user_id', 'provider', name='uq_user_provider'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    provider = Column(String, nullable=False)  # e.g., "google"
    refresh_token = Column(String, nullable=False)  # store raw token; consider encrypting in production

    user = relationship("User", back_populates="oauth_tokens")
