import { useEffect, useRef, useState } from "react";
import { MessageCircle, Minus, X } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import api from "../../services/api";
import ChatBubble from "../chatbot/ChatBubble";
import ChatInput from "./ChatInput";

const initialMessages = [
  {
    id: "welcome",
    from: "bot",
    text: "Xin chào, tôi là Baymax. Bạn cần tư vấn sức khỏe điều gì hôm nay?",
  },
];

const toHistory = (messages) =>
  messages
    .filter(
      (message) =>
        !message.isError &&
        message.text &&
        (message.from === "user" || message.from === "bot"),
    )
    .slice(-10)
    .map((message) => ({
      role: message.from === "user" ? "user" : "assistant",
      content: message.text,
    }));

const ChatbotWidget = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem("chat_session_id") || "",
  );
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener("open-chatbot", openChat);
    return () => window.removeEventListener("open-chatbot", openChat);
  }, []);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = async (text) => {
    const userMessage = { id: `user-${Date.now()}`, from: "user", text };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await api.post("/health/chat", {
        message: text,
        session_id: sessionId || undefined,
        history: toHistory(messages),
        use_saved_bmi: true,
        save_history: isAuthenticated,
      });

      const nextSessionId = response.data?.session_id;
      if (nextSessionId) {
        setSessionId(nextSessionId);
        localStorage.setItem("chat_session_id", nextSessionId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          from: "bot",
          text:
            response.data?.reply ||
            "Baymax chưa nhận được phản hồi phù hợp. Bạn thử hỏi lại nhé.",
        },
      ]);
    } catch (error) {
      const detail = error.response?.data?.detail;
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          from: "bot",
          isError: true,
          text:
            typeof detail === "string"
              ? detail
              : "Hiện chưa kết nối được chatbot backend. Vui lòng kiểm tra server API rồi thử lại.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Mở chatbot Baymax"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-xl shadow-red-200 transition hover:scale-105 hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200"
      >
        <MessageCircle size={26} />
      </button>
    );
  }

  return (
    <section className="fixed bottom-5 right-5 z-40 flex h-[560px] max-h-[calc(100vh-6rem)] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-lg border border-red-100 bg-white shadow-2xl shadow-slate-200">
      <div className="flex items-center justify-between bg-red-500 px-4 py-3 text-white">
        <div>
          <h2 className="text-sm font-semibold">Baymax Chat</h2>
          <p className="text-xs text-red-50">
            {isAuthenticated ? "Đã kết nối tài khoản" : "Tư vấn nhanh"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Thu nhỏ chatbot"
            className="flex h-8 w-8 items-center justify-center rounded-full text-red-50 transition hover:bg-white/15"
          >
            <Minus size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setMessages(initialMessages);
            }}
            aria-label="Đóng chatbot"
            className="flex h-8 w-8 items-center justify-center rounded-full text-red-50 transition hover:bg-white/15"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1 rounded-2xl rounded-tl-none bg-red-50 px-4 py-2 text-sm text-red-400">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput onSend={handleSend} disabled={isTyping} />
    </section>
  );
};

export default ChatbotWidget;
