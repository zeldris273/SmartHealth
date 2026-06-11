import { useRef, useState } from 'react';
import { Upload, FileText, Trash2, ChevronRight, Info } from 'lucide-react';

const getFileIcon = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📕';
  if (ext === 'docx' || ext === 'doc') return '📘';
  if (ext === 'txt') return '📄';
  return '📎';
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExt = (filename) => (filename?.split('.').pop()?.toUpperCase() || '');

const RagPanel = ({ documents, isLoading, onUpload, onDelete, suggestions, onSuggestionClick, isAuthenticated }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  return (
    <aside className="rag-panel">
      {/* RAG Header */}
      <div className="rag-header">
        <h3 className="rag-title">
          Kho tài liệu (RAG) <Info size={14} className="rag-info-icon" />
        </h3>
      </div>

      {/* Upload Area */}
      <div className="rag-upload-section">
        <div className={`rag-dropzone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
          <div className="rag-dropzone-icon"><Upload size={28} /></div>
          <p className="rag-dropzone-text">Kéo & thả tài liệu vào đây</p>
          <p className="rag-dropzone-sub">Hỗ trợ PDF, DOCX, TXT</p>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.txt" className="hidden"
            onChange={(e) => { if (e.target.files.length) onUpload(e.target.files); e.target.value = ''; }} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="rag-choose-btn">
            Chọn file từ máy
          </button>
        </div>
      </div>

      {/* Document List */}
      <div className="rag-docs-section">
        <h4 className="rag-docs-title">Tài liệu đã tải lên</h4>
        {isLoading && <div className="rag-loading">Đang tải...</div>}
        {!isLoading && documents.length === 0 && (
          <div className="rag-empty">
            {isAuthenticated ? 'Chưa có tài liệu nào' : 'Đăng nhập để upload tài liệu'}
          </div>
        )}
        <div className="rag-docs-list">
          {documents.map((doc) => (
            <div key={doc.id} className="rag-doc-item">
              <span className="rag-doc-icon">{getFileIcon(doc.filename)}</span>
              <div className="rag-doc-info">
                <div className="rag-doc-name">{doc.filename}</div>
                <div className="rag-doc-meta">
                  {doc.chunk_count} chunks • {getFileExt(doc.filename)}
                </div>
              </div>
              <button type="button" onClick={() => onDelete(doc.id)} className="rag-doc-delete" aria-label="Xóa">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="rag-suggestions">
        <h4 className="rag-suggestions-title">Gợi ý cho bạn</h4>
        <div className="rag-suggestions-list">
          {suggestions.map((s, i) => (
            <button key={i} type="button" onClick={() => onSuggestionClick(s)} className="rag-suggestion-item">
              <span>{s}</span>
              <ChevronRight size={16} className="rag-suggestion-arrow" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RagPanel;
