from datetime import datetime

from pydantic import BaseModel, Field


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

    model_config = {"from_attributes": True}


class RetrievedChunkResponse(BaseModel):
    document_id: int
    filename: str
    chunk_index: int
    content: str = Field(..., description="Relevant chunk content")
    score: float = Field(..., description="Cosine similarity score")
