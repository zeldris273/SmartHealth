import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Minus, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import api from '../../services/api';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';

const STORAGE_KEY = 'smarthealth_chatbot_conversations';
const ACTIVE_SESSION_KEY = 'chat_session_id';

const createWelcomeMessage = () => ({
  id: 'welcome',
  from: 'bot',
  text: 'Xin chào, tôi là Baymax. Bạn có thể hỏi về sức khỏe, BMI, dinh dưỡng, luyện tập hoặc tải PDF/DOCX/TXT để tôi tư vấn bằng RAG.',
});

const createConversation = () => ({
  sessionId: crypto.randomUUID ? crypto.randomUUID().replaceAll('-', '') : `session-${Date.now()}`,
  title: 'Cuộc trò chuyện mới',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [createWelcomeMessage()],
});

const loadConversations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (error) {
    console.warn('Không đọc được lịch sử chat local:', error);
  }
  return [createConversation()];
};

const saveConversations = (conversations) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 20)));
};

const toHistory = (messages) =>
  messages
    .filter((message) => !message.isError && message.text && (message.from === 'user' || message.from === 'bot'))
    .filter((message) => message.id !== 'welcome')
    .slice(-10)
    .map((message) => ({
      role: message.from === 'user' ? 'user' : 'assistant',
      content: message.text,
    }));

const getConversationTitle = (text) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return 'Tài liệu đã tải lên';
  return clean.length > 34 ? `${clean.slice(0, 34)}...` : clean;
};

const ChatbotWidget = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState(loadConversations);
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const savedSessionId = localStorage.getItem(ACTIVE_SESSION_KEY);
    const loaded = loadConversations();
    return savedSessionId || loaded[0]?.sessionId || createConversation().sessionId;
  });
  const [isTyping, setIsTyping] = useState(false);
  const [searchText, setSearchText] = useState('');
  const bottomRef = useRef(null);

  const activeConversation = useMemo(() => {
    return conversations.find((item) => item.sessionId === activeSessionId) || conversations[0];
  }, [activeSessionId, conversations]);

  const messages = activeConversation?.messages || [createWelcomeMessage()];

  const filteredConversations = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return conversations;
    return conversations.filter((item) => item.title.toLowerCase().includes(keyword));
  }, [conversations, searchText]);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener('open-chatbot', openChat);
    return () => window.removeEventListener('open-chatbot', openChat);
  }, []);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isTyping]);

  const updateConversation = (sessionId, updater) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.sessionId === sessionId
          ? { ...updater(conversation), updatedAt: new Date().toISOString() }
          : conversation
      )
    );
  };

  const handleNewChat = () => {
    const nextConversation = createConversation();
    setConversations((prev) => [nextConversation, ...prev]);
    setActiveSessionId(nextConversation.sessionId);
    setSearchText('');
  };

  const handleDeleteConversation = (sessionId) => {
    setConversations((prev) => {
      const next = prev.filter((conversation) => conversation.sessionId !== sessionId);
      if (activeSessionId === sessionId) {
        const fallback = next[0] || createConversation();
        if (!next.length) next.push(fallback);
        setActiveSessionId(fallback.sessionId);
      }
      return next.length ? next : [createConversation()];
    });
  };

  const uploadDocuments = async (files) => {
    const uploaded = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file.rawFile);
      const response = await api.post('/health/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      uploaded.push(response.data);
    }
    return uploaded;
  };

  const handleSend = async (text, files = []) => {
    const sessionId = activeConversation?.sessionId || activeSessionId;
    const userMessage = {
      id: `user-${Date.now()}`,
      from: 'user',
      text,
      attachments: files.map(({ name, size, sizeLabel, type }) => ({
        name,
        size,
        sizeLabel,
        type,
        status: 'uploading',
      })),
    };

    const messagesBeforeSend = messages;
    const firstUserMessage = !messagesBeforeSend.some((message) => message.from === 'user');

    updateConversation(sessionId, (conversation) => ({
      ...conversation,
      title: firstUserMessage ? getConversationTitle(text) : conversation.title,
      messages: [...conversation.messages, userMessage],
    }));
    setIsTyping(true);

    try {
      if (files.length > 0) {
        const uploadedDocuments = await uploadDocuments(files);
        updateConversation(sessionId, (conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === userMessage.id
              ? {
                  ...message,
                  attachments: message.attachments.map((attachment) => {
                    const uploaded = uploadedDocuments.find((document) => document.filename === attachment.name);
                    return uploaded
                      ? { ...attachment, status: 'processed', chunkCount: uploaded.chunk_count }
                      : attachment;
                  }),
                }
              : message
          ),
        }));
      }

      const response = await api.post('/health/chat', {
        message: text,
        session_id: sessionId,
        history: toHistory(messagesBeforeSend),
        use_saved_bmi: true,
        save_history: isAuthenticated,
        use_rag: true,
      });

      const botMessage = {
        id: `bot-${Date.now()}`,
        from: 'bot',
        text: response.data?.reply || 'Baymax chưa nhận được phản hồi phù hợp. Bạn thử hỏi lại nhé.',
        sources: response.data?.sources || [],
      };

      updateConversation(sessionId, (conversation) => ({
        ...conversation,
        messages: [...conversation.messages, botMessage],
      }));
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errorMessage = {
        id: `error-${Date.now()}`,
        from: 'bot',
        isError: true,
        text:
          typeof detail === 'string'
            ? detail
            : 'Hiện chưa xử lý được yêu cầu. Vui lòng kiểm tra backend/API key rồi thử lại.',
      };

      updateConversation(sessionId, (conversation) => ({
        ...conversation,
        messages: [...conversation.messages, errorMessage],
      }));
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
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-2xl shadow-red-500/40 transition hover:scale-110 hover:shadow-red-500/60 focus:outline-none focus:ring-4 focus:ring-red-200"
      >
        <MessageCircle size={26} />
      </button>
    );
  }

  return (
    <section className="fixed bottom-5 right-5 z-40 flex h-[640px] max-h-[calc(100vh-2.5rem)] w-[860px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-400/30">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 text-slate-900 md:flex">
        <div className="border-b border-slate-200 p-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            <Plus size={16} />
            Chat mới
          </button>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-600 focus-within:border-red-300">
            <Search size={15} />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Tìm lịch sử..."
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {filteredConversations.map((conversation) => {
            const isActive = conversation.sessionId === activeSessionId;
            return (
              <div key={conversation.sessionId} className="group mb-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveSessionId(conversation.sessionId)}
                  className={`min-w-0 flex-1 rounded-xl px-3 py-2 text-left text-sm transition ${
                    isActive ? 'bg-red-500 text-white shadow-md' : 'text-slate-600 hover:bg-white hover:text-red-500'
                  }`}
                  title={conversation.title}
                >
                  <div className="truncate font-medium">{conversation.title}</div>
                  <div className={`mt-0.5 text-[11px] ${isActive ? 'text-red-100' : 'text-slate-400'}`}>
                    {new Date(conversation.updatedAt).toLocaleDateString('vi-VN')}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteConversation(conversation.sessionId)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  aria-label="Xóa cuộc trò chuyện"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
              <Bot size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-slate-900">Baymax Chat</h2>
              <p className="truncate text-xs text-slate-500">
                {isAuthenticated
                  ? 'Chatbot thông minh hỗ trợ sức khỏe'
                  : 'Đăng nhập để upload tài liệu và lưu lịch sử'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleNewChat}
              aria-label="Tạo chat mới"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:hidden"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Thu nhỏ chatbot"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Minus size={18} />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng chatbot"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
                  <Bot size={17} />
                </div>
                <div className="flex gap-1 rounded-3xl rounded-tl-md bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
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
      </div>
    </section>
  );
};

export default ChatbotWidget;
