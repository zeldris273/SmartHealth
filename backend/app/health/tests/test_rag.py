import io
from fastapi import HTTPException
import pytest
from app.health.services import rag_service
from app.health.services.rag_service import is_document_health_related, extract_docx

def test_is_document_health_related():
    # Related document texts
    assert is_document_health_related("Hồ sơ bệnh án và lịch sử khám bệnh tại bệnh viện Đại học Y.") is True
    assert is_document_health_related("Luyện tập thể dục thể thao giúp tăng cường sức khỏe tim mạch.") is True
    assert is_document_health_related("Cách phòng tránh sốt xuất huyết và sốt siêu vi.") is True
    
    # Short related
    assert is_document_health_related("Đau đầu.") is True
    
    # Unrelated document texts
    assert is_document_health_related("Cách cài đặt và cấu hình máy chủ web Nginx trên Ubuntu Server.") is False
    assert is_document_health_related("Thời tiết hôm nay rất đẹp, trời xanh mây trắng nắng vàng.") is False

def test_extract_docx_success(monkeypatch):
    class MockParagraph:
        def __init__(self, text):
            self.text = text

    class MockCell:
        def __init__(self, text):
            self.paragraphs = [MockParagraph(text)]

    class MockRow:
        def __init__(self, cell_texts):
            self.cells = [MockCell(t) for t in cell_texts]

    class MockTable:
        def __init__(self, row_data):
            self.rows = [MockRow(row) for row in row_data]

    class MockDoc:
        def __init__(self, paragraphs, tables_data):
            self.paragraphs = [MockParagraph(p) for p in paragraphs]
            self.tables = [MockTable(t) for t in tables_data]

    monkeypatch.setattr(rag_service, "DocxDocument", lambda stream: MockDoc(
        ["Đây là đoạn văn 1.", "Đây là đoạn văn 2."],
        [
            [
                ["Hàng 1 Cột 1", "Hàng 1 Cột 2"],
                ["Hàng 2 Cột 1", "Hàng 2 Cột 2"]
            ]
        ]
    ))

    result = extract_docx(b"fake_docx_content")
    assert "Đây là đoạn văn 1." in result
    assert "Đây là đoạn văn 2." in result
    assert "Hàng 1 Cột 1 | Hàng 1 Cột 2" in result
    assert "Hàng 2 Cột 1 | Hàng 2 Cột 2" in result

def test_extract_docx_invalid_content(monkeypatch):
    def mock_docx_fail(stream):
        raise Exception("Zip file invalid")
    
    monkeypatch.setattr(rag_service, "DocxDocument", mock_docx_fail)
    with pytest.raises(HTTPException) as exc:
        extract_docx(b"invalid_content")
    assert exc.value.status_code == 422
    assert "Định dạng file DOCX không hợp lệ" in exc.value.detail
