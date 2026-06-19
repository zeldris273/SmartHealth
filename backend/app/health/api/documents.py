from fastapi import APIRouter, Depends, File, UploadFile, status, HTTPException
from sqlalchemy.orm import Session

from app.health.core.dependencies import get_current_user
from app.health.models import KnowledgeDocument, KnowledgeChunk, User
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


@router.delete(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Soft delete một tài liệu và toàn bộ chunks liên quan",
)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime

    document = (
        db.query(KnowledgeDocument)
        .filter(
            KnowledgeDocument.id == document_id,
            KnowledgeDocument.is_deleted == False,  # noqa: E712
        )
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    # Soft delete document
    document.is_deleted = True
    document.deleted_at = datetime.utcnow()
    document.deleted_by = current_user.id

    # Soft delete related chunks
    db.query(KnowledgeChunk).filter(KnowledgeChunk.document_id == document.id).update(
        {"is_deleted": True, "deleted_at": datetime.utcnow()}, synchronize_session=False
    )
    db.commit()
    db.refresh(document)
    return document

@router.post(
    "/{document_id}/restore",
    response_model=DocumentResponse,
    summary="Khôi phục tài liệu và các chunk đã soft delete",
)
def restore_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = (
        db.query(KnowledgeDocument)
        .filter(
            KnowledgeDocument.id == document_id,
            KnowledgeDocument.is_deleted == True,  # noqa: E712
        )
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    # Restore document
    document.is_deleted = False
    document.deleted_at = None
    document.deleted_by = None

    # Restore related chunks
    db.query(KnowledgeChunk).filter(KnowledgeChunk.document_id == document.id).update(
        {"is_deleted": False, "deleted_at": None}, synchronize_session=False
    )
    db.commit()
    db.refresh(document)
    return document

@router.get(
    "",
    response_model=list[DocumentResponse],
    summary="Danh sách tài liệu đã upload của user hiện tại",
)
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[KnowledgeDocument]:
    # Admin can see all documents including deleted ones
    return (
        db.query(KnowledgeDocument)
        .order_by(KnowledgeDocument.created_at.desc(), KnowledgeDocument.id.desc())
        .all()
    )
