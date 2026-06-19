from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


class DocumentUploadResponse(BaseModel):
    id: int
    filename: str
    status: str
    chunk_count: int
    message: str


class DocumentResponse(BaseModel):
    id: int
    filename: str
    content_type: str | None = None
    status: str
    chunk_count: int
    created_at: datetime
    is_deleted: bool
    deleted_at: datetime | None = None
    deleted_by: int | None = None

    model_config = ConfigDict(from_attributes=True)


class RetrievedChunkResponse(BaseModel):
    document_id: int
    filename: str
    chunk_index: int
    content: str = Field(..., description="Relevant chunk content")
    score: float = Field(..., description="Cosine similarity score")
