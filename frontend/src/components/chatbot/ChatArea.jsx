import { useRef, useState, useEffect } from 'react';
import { Bot, MoreVertical, Paperclip, Send, Mic, Grid3X3, Star, FileText, Minus, X } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import ChatBubble from './ChatBubble';

const formatFileSize = (size) => {
  if (!size) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const ChatArea = ({
  messages,
  isTyping,
  onSend,
  activeTitle,
  user,
  showRagToggle,
  showRagPanel,
  onToggleRagPanel,
  onClose,
}) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || [])
      .filter((f) => /\.(pdf|docx|txt)$/i.test(f.name))
      .slice(0, 5)
      .map((f) => ({
        id: `${f.name}-${f.size}-${f.lastModified}`,
        name: f.name,
        size: f.size,
        sizeLabel: formatFileSize(f.size),
        type: f.type || 'unknown',
        rawFile: f,
      }));
    setFiles((p) => [...p, ...selected].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (id) => setFiles((p) => p.filter((f) => f.id !== id));

  const handleSend = () => {
    const clean = text.trim();
    if (!clean && !files.length) return;
    onSend(
      clean || 'Tôi đã tải tài liệu lên, hãy dùng nội dung đó để tư vấn cho tôi.',
      files
    );
    setText('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e) => {
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  return (
    <main className="chat-main">
      <header className="chat-main-header">
        <div className="chat-main-header-left">
          <h2 className="chat-main-title">
            {activeTitle || 'Tư vấn dinh dưỡng'}
          </h2>
          <span className="chat-main-subtitle">
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="chat-main-header-actions">
          {showRagToggle && (
            <button
              type="button"
              onClick={onToggleRagPanel}
              className="chat-header-btn"
              aria-label="Bật/tắt panel tài liệu"
              title={showRagPanel ? 'Ẩn tài liệu' : 'Hiện tài liệu'}
            >
              <FileText size={18} />
            </button>
          )}
          <button type="button" className="chat-header-btn" aria-label="Yêu thích">
            <Star size={18} />
          </button>
          <button type="button" className="chat-header-btn" aria-label="Tùy chọn">
            <MoreVertical size={18} />
          </button>
          {onClose && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="chat-header-btn"
                aria-label="Thu nhỏ"
                title="Thu nhỏ"
              >
                <Minus size={18} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="chat-header-btn"
                aria-label="Đóng chatbot"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="chat-messages">
        <div className="chat-messages-inner">
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          {isTyping && (
            <div className="chat-typing">
              <div className="chat-typing-avatar">
                <Bot size={17} />
              </div>
              <div className="chat-typing-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="chat-input-area">
        {files.length > 0 && (
          <div className="chat-input-files">
            {files.map((f) => (
              <div key={f.id} className="chat-input-file-chip">
                <Paperclip size={13} />
                <span className="chat-input-file-name">{f.name}</span>
                <span className="chat-input-file-size">{f.sizeLabel}</span>
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="chat-input-file-remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="chat-input-bar">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isTyping}
            className="chat-input-action-btn"
            aria-label="Đính kèm file"
          >
            <Paperclip size={20} />
          </button>
          <button
            type="button"
            className="chat-input-action-btn"
            aria-label="Ghi âm"
          >
            <Mic size={20} />
          </button>
          <button
            type="button"
            className="chat-input-action-btn"
            aria-label="Menu"
          >
            <Grid3X3 size={20} />
          </button>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              autoResize(e);
            }}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            rows={1}
            placeholder="Nhắn tin cho Baymax..."
            className="chat-input-textarea"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isTyping || (!text.trim() && !files.length)}
            aria-label="Gửi"
            className="chat-send-btn"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </main>
  );
};

export default ChatArea;
