from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.health.core.dependencies import get_current_user
from app.health.models import KnowledgeDocument, User
from app.health.schemas.document import DocumentResponse, DocumentUploadResponse
from app.health.services.rag_service import ingest_upload
from database import get_db


router = APIRouter(prefix="/health/documents", tags=["Health - RAG Documents"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    summary="Upload tài liệu kiến thức cho chatbot RAG",
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentUploadResponse:
    document = await ingest_upload(db=db, user_id=current_user.id, file=file)
    return DocumentUploadResponse(
        id=document.id,
        filename=document.filename,
        status=document.status,
        chunk_count=document.chunk_count,
        message="Đã trích xuất, chia chunk, tạo embedding và lưu vào pgvector.",
    )


@router.get(
    "",
    response_model=list[DocumentResponse],
    summary="Danh sách tài liệu đã upload của user hiện tại",
)
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[KnowledgeDocument]:
    return (
        db.query(KnowledgeDocument)
        .filter(KnowledgeDocument.user_id == current_user.id)
        .order_by(KnowledgeDocument.created_at.desc(), KnowledgeDocument.id.desc())
        .all()
    )
