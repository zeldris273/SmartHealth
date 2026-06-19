from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from database import get_db
from app.health.models import KnowledgeDocument, KnowledgeChunk, User
from app.health.core.dependencies import get_current_user, require_role
from app.health.schemas.document import DocumentResponse, DocumentUploadResponse
from app.health.services.rag_service import ingest_upload

router = APIRouter(prefix="/health", tags=["Health - Documents"])


@router.get(
    "/documents",
    response_model=list[DocumentResponse],
    summary="Lấy danh sách tài liệu đang hoạt động",
    status_code=status.HTTP_200_OK,
)
def list_documents(db: Session = Depends(get_db)):
    docs = (
        db.query(KnowledgeDocument)
        .filter(KnowledgeDocument.is_deleted == False)  # noqa: E712
        .order_by(KnowledgeDocument.created_at.desc())
        .all()
    )
    return [DocumentResponse.from_orm(doc) for doc in docs]


@router.get(
    "/documents/admin",
    response_model=list[DocumentResponse],
    summary="[Admin] Lấy toàn bộ tài liệu (bao gồm đã xóa mềm)",
    status_code=status.HTTP_200_OK,
)
def list_all_documents(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    docs = (
        db.query(KnowledgeDocument)
        .order_by(KnowledgeDocument.created_at.desc())
        .all()
    )
    return [DocumentResponse.from_orm(doc) for doc in docs]


@router.post(
    "/documents",
    response_model=DocumentUploadResponse,
    summary="Upload tài liệu kiến thức cho chatbot RAG",
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Forward to service that handles ingestion and chunk creation
    document = await ingest_upload(db, current_user, file)
    return DocumentUploadResponse.from_orm(document)


@router.post(
    "/documents/{document_id}/restore",
    response_model=DocumentResponse,
    summary="Khôi phục tài liệu đã xóa mềm",
    status_code=status.HTTP_200_OK,
)
def restore_document(
    document_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if not doc.is_deleted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document is not deleted")
    doc.is_deleted = False
    doc.deleted_at = None
    doc.deleted_by = None

    db.query(KnowledgeChunk).filter(KnowledgeChunk.document_id == document_id).update(
        {"is_deleted": False, "deleted_at": None}
    )

    db.commit()
    db.refresh(doc)
    return DocumentResponse.from_orm(doc)


@router.delete(
    "/documents/{document_id}",
    summary="Xóa mềm tài liệu và các chunk liên quan",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role("admin")),
):
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.is_deleted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document already deleted")
    doc.is_deleted = True
    doc.deleted_at = func.now()
    doc.deleted_by = current_admin.id

    db.query(KnowledgeChunk).filter(KnowledgeChunk.document_id == document_id).update(
        {"is_deleted": True, "deleted_at": func.now()}
    )

    db.commit()
    return None