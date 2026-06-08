from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from database import Base


class KnowledgeDocument(Base):
    """Uploaded health knowledge document owned by a user."""

    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(120), nullable=True)
    status = Column(String(30), nullable=False, default="processed")
    chunk_count = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    chunks = relationship("KnowledgeChunk", back_populates="document", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    """Searchable document chunk with pgvector embedding."""

    __tablename__ = "knowledge_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("knowledge_documents.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    document = relationship("KnowledgeDocument", back_populates="chunks")
