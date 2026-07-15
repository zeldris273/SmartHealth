import { useRef, useState, useEffect } from "react";
import { Bot, Paperclip, Send } from "lucide-react";
import ChatBubble from "./ChatBubble";

const formatFileSize = (size) => {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const ChatArea = ({ messages, isTyping, onSend, activeTitle, user }) => {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
        type: f.type || "unknown",
        rawFile: f,
      }));
    setFiles((p) => [...p, ...selected].slice(0, 5));
    e.target.value = "";
  };

  const removeFile = (id) => setFiles((p) => p.filter((f) => f.id !== id));

  const handleSend = () => {
    const clean = text.trim();
    if (!clean && !files.length) return;
    onSend(
      clean ||
        "Tôi đã tải tài liệu lên, hãy dùng nội dung đó để tư vấn cho tôi.",
      files,
    );
    setText("");
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e) => {
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  return (
    <main className="flex flex-col flex-1 h-full overflow-hidden bg-white">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-3 border-b border-gray-100 bg-white">
        <h2 className="text-base font-semibold text-gray-800 truncate">
          {activeTitle || "Tư vấn dinh dưỡng"}
        </h2>
        <span className="text-xs text-gray-400">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "numeric",
            year: "numeric",
          })}
        </span>
      </header>

      {/* Messages — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          {isTyping &&
            !messages.some(
              (m) => m.from === "bot" && m.id !== "welcome" && m.isStreaming,
            ) && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0">
                  <Bot size={17} />
                </div>
                <div className="flex gap-1 px-3 py-2 bg-red-50 rounded-2xl">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input — always at bottom */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-100 rounded-full text-xs text-red-700"
                >
                  <Paperclip size={11} />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <span className="text-red-400">{f.sizeLabel}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    className="ml-0.5 text-red-400 hover:text-red-600 font-bold leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition-all">
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
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors"
              aria-label="Đính kèm file"
            >
              <Paperclip size={20} />
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
              className="flex-1 bg-transparent resize-none text-sm text-gray-800 placeholder-gray-400 outline-none leading-5 py-1 max-h-[120px]"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={isTyping || (!text.trim() && !files.length)}
              aria-label="Gửi"
              className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center disabled:opacity-40 hover:bg-red-600 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ChatArea;
