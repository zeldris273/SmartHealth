import { useState, useRef, useEffect } from 'react';
import ChatBubble from '../../components/chatbot/ChatBubble';
import ChatInput from '../../components/chatbot/ChatInput';

const mockMessages = [
  { 
    id: 1, from: 'bot', 
    text: 'Hello. I am Baymax, your personal healthcare companion.',
    textVi: 'Xin chào. Tôi là Baymax, người bạn đồng hành chăm sóc sức khỏe của bạn.'
  },
  { 
    id: 2, from: 'bot', 
    text: 'On a scale of 1 to 10, how would you rate your pain?',
    textVi: 'Trên thang điểm 1 đến 10, bạn đánh giá cơn đau của mình ở mức nào?'
  },
];

const botReplies = [
  {
    text: 'I cannot deactivate until you are satisfied with your care. 💊',
    textVi: 'Tôi sẽ không tắt cho đến khi bạn được chăm sóc đầy đủ. 💊'
  },
  {
    text: 'Your health is my top concern.',
    textVi: 'Sức khỏe của bạn là mối quan tâm hàng đầu của tôi.'
  },
  {
    text: 'I suggest rest and hydration.',
    textVi: 'Tôi khuyên bạn nên nghỉ ngơi và uống nhiều nước.'
  },
  {
    text: 'I am satisfied with your care. ✓',
    textVi: 'Tôi hài lòng với việc chăm sóc của bạn. ✓'
  },
];

const Chatbot = () => {
  const [messages, setMessages] = useState(mockMessages);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text) => {
    const userMsg = { id: Date.now(), from: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const reply = botReplies[Math.floor(Math.random() * botReplies.length)];
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: 'bot', ...reply },
      ]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <div className="p-6 border-b border-gray-100 bg-white">
        <h1 className="text-2xl font-semibold text-[#1e293b]">Chatbot Baymax</h1>
        <p className="text-xs text-gray-400 italic">
          "I am satisfied with your care." — Tôi hài lòng với việc chăm sóc của bạn.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="bg-red-50 text-red-400 rounded-2xl px-4 py-2 text-sm flex gap-1">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce delay-100">●</span>
              <span className="animate-bounce delay-200">●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default Chatbot;