import { useRef, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';

const formatFileSize = (size) => {
  if (!size) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const ChatInput = ({ onSend, disabled = false }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    const mappedFiles = selectedFiles
      .filter((file) => /\.(pdf|docx|txt)$/i.test(file.name))
      .slice(0, 5)
      .map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        size: file.size,
        sizeLabel: formatFileSize(file.size),
        type: file.type || 'unknown',
        rawFile: file,
      }));

    setFiles((prev) => [...prev, ...mappedFiles].slice(0, 5));
    event.target.value = '';
  };

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const handleSend = () => {
    const cleanText = text.trim();
    if ((!cleanText && files.length === 0) || disabled) return;

    onSend(cleanText || 'Tôi đã tải tài liệu lên, hãy dùng nội dung đó để tư vấn cho tôi.', files);
    setText('');
    setFiles([]);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((file) => (
            <div key={file.id} className="flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              <Paperclip size={13} />
              <span className="max-w-[170px] truncate">{file.name}</span>
              <span className="text-slate-400">{file.sizeLabel}</span>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                aria-label={`Xóa file ${file.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 focus-within:border-red-300 focus-within:bg-white">
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
          disabled={disabled}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Tải tài liệu lên"
        >
          <Paperclip size={18} />
        </button>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder="Nhắn tin cho Baymax..."
          className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && files.length === 0)}
          aria-label="Gửi tin nhắn"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Send size={17} />
        </button>
      </div>

      <p className="mt-2 px-2 text-[11px] text-slate-400">
        Hỗ trợ PDF, DOCX, TXT. File sẽ được xử lý bằng RAG và lưu vào kho kiến thức cá nhân.
      </p>
    </div>
  );
};

export default ChatInput;
