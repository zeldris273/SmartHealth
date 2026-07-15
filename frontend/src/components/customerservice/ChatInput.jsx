import { useState } from "react";
import { Send } from "lucide-react";

const ChatInput = ({ onSend, disabled = false }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 border-t border-gray-100 bg-white p-3">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Nhập tin nhắn..."
        className="min-w-0 flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm text-slate-800 placeholder:text-gray-400 focus:border-red-400 focus:outline-none disabled:bg-gray-50"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        aria-label="Gửi tin nhắn"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        <Send size={18} />
      </button>
    </div>
  );
};

export default ChatInput;
