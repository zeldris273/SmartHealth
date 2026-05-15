import { useState } from 'react';

const ChatInput = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100 flex gap-3 items-center">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập tin nhắn..."
        className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-red-400"
      />
      <button
        onClick={handleSend}
        className="bg-red-500 text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-red-600 transition"
      >
        Gửi
      </button>
    </div>
  );
};

export default ChatInput;