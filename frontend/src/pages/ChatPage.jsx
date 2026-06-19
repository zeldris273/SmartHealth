import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/context/AuthContext";
import api from "../services/api";
import ChatSidebar from "../components/chatbot/ChatSidebar";
import ChatArea from "../components/chatbot/ChatArea";
import { incrementNotificationCount } from "../utils/notificationUtils";

const STORAGE_PREFIX = "smarthealth_chatbot_conversations";
const ACTIVE_SESSION_PREFIX = "chat_session_id";

const getStorageKey = (userKey) => `${STORAGE_PREFIX}_${userKey}`;
const getActiveSessionKey = (userKey) => `${ACTIVE_SESSION_PREFIX}_${userKey}`;

const createWelcomeMessage = () => ({
  id: "welcome",
  from: "bot",
  text: "Xin chào, tôi là Baymax. Bạn có thể hỏi tôi bất cứ điều gì về sức khỏe, dinh dưỡng, luyện tập hoặc gửi các file PDF/DOCX/TXT để tôi tư vấn.",
});

const createConversation = () => ({
  sessionId: crypto.randomUUID
    ? crypto.randomUUID().replaceAll("-", "")
    : `session-${Date.now()}`,
  title: "Cuộc trò chuyện mới",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [createWelcomeMessage()],
});

const loadConversationsFromStorage = (userKey) => {
  try {
    const raw = localStorage.getItem(getStorageKey(userKey));
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (error) {
    console.warn("Không đọc được lịch sử chat local:", error);
  }
  return [createConversation()];
};

const saveConversationsToStorage = (userKey, conversations) => {
  localStorage.setItem(
    getStorageKey(userKey),
    JSON.stringify(conversations.slice(0, 20)),
  );
};

const mapBackendConversation = (conversation) => ({
  sessionId: conversation.session_id,
  title: conversation.title,
  createdAt: conversation.created_at,
  updatedAt: conversation.updated_at,
  messages: [
    createWelcomeMessage(),
    ...conversation.messages.map((message) => ({
      id: `db-${message.id}`,
      from: message.role === "user" ? "user" : "bot",
      text: message.content,
    })),
  ],
});

const toHistory = (messages) =>
  messages
    .filter(
      (m) => !m.isError && m.text && (m.from === "user" || m.from === "bot"),
    )
    .filter((m) => m.id !== "welcome")
    .slice(-10)
    .map((m) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    }));

const getConversationTitle = (text) => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "Tài liệu đã tải lên";
  return clean.length > 34 ? `${clean.slice(0, 34)}...` : clean;
};

const ChatPage = () => {
  const { user, isAuthenticated } = useAuth();
  const userKey = isAuthenticated && user?.id ? String(user.id) : "guest";

  const [conversations, setConversations] = useState(() =>
    loadConversationsFromStorage("guest"),
  );
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const loaded = loadConversationsFromStorage("guest");
    return (
      localStorage.getItem(getActiveSessionKey("guest")) || loaded[0]?.sessionId
    );
  });
  const [isTyping, setIsTyping] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const activeConversation = useMemo(() => {
    return (
      conversations.find((c) => c.sessionId === activeSessionId) ||
      conversations[0]
    );
  }, [activeSessionId, conversations]);

  const messages = activeConversation?.messages || [createWelcomeMessage()];

  const filteredConversations = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(keyword));
  }, [conversations, searchText]);

  const loadUserConversations = useCallback(async () => {
    if (isAuthenticated && user?.id) {
      setIsLoadingHistory(true);
      try {
        const response = await api.get("/health/chat/conversations");
        const mapped = (response.data || []).map(mapBackendConversation);
        const next = mapped.length ? mapped : [createConversation()];
        setConversations(next);
        const saved = localStorage.getItem(getActiveSessionKey(userKey));
        const has = next.some((c) => c.sessionId === saved);
        setActiveSessionId(has ? saved : next[0].sessionId);
      } catch {
        const fallback = loadConversationsFromStorage(userKey);
        setConversations(fallback);
        setActiveSessionId(
          localStorage.getItem(getActiveSessionKey(userKey)) ||
            fallback[0]?.sessionId,
        );
      } finally {
        setIsLoadingHistory(false);
      }
      return;
    }
    const guest = loadConversationsFromStorage("guest");
    setConversations(guest);
    setActiveSessionId(
      localStorage.getItem(getActiveSessionKey("guest")) || guest[0]?.sessionId,
    );
  }, [isAuthenticated, user?.id, userKey]);

  useEffect(() => {
    loadUserConversations();
  }, [loadUserConversations]);

  useEffect(() => {
    if (!isAuthenticated) saveConversationsToStorage("guest", conversations);
  }, [conversations, isAuthenticated]);

  useEffect(() => {
    if (activeSessionId)
      localStorage.setItem(getActiveSessionKey(userKey), activeSessionId);
  }, [activeSessionId, userKey]);

  const updateConversation = (sessionId, updater) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.sessionId === sessionId
          ? { ...updater(c), updatedAt: new Date().toISOString() }
          : c,
      ),
    );
  };

  const handleNewChat = () => {
    const next = createConversation();
    setConversations((prev) => [next, ...prev]);
    setActiveSessionId(next.sessionId);
    setSearchText("");
    setEditingSessionId(null);
  };

  const handleDeleteConversation = async (sessionId) => {
    if (isAuthenticated) {
      try {
        await api.delete(`/health/chat/sessions/${sessionId}`);
      } catch {}
    }
    setConversations((prev) => {
      const next = prev.filter((c) => c.sessionId !== sessionId);
      if (activeSessionId === sessionId) {
        const fb = next[0] || createConversation();
        if (!next.length) next.push(fb);
        setActiveSessionId(fb.sessionId);
      }
      return next.length ? next : [createConversation()];
    });
    if (editingSessionId === sessionId) {
      setEditingSessionId(null);
      setEditTitle("");
    }
  };

  const startRename = (c) => {
    setEditingSessionId(c.sessionId);
    setEditTitle(c.title);
  };
  const cancelRename = () => {
    setEditingSessionId(null);
    setEditTitle("");
  };

  const submitRename = async (sessionId) => {
    const title = editTitle.trim();
    if (!title) {
      cancelRename();
      return;
    }
    updateConversation(sessionId, (c) => ({ ...c, title }));
    if (isAuthenticated) {
      try {
        await api.patch(`/health/chat/sessions/${sessionId}`, { title });
      } catch {}
    }
    cancelRename();
  };

  const uploadDocuments = async (files) => {
    const uploaded = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file.rawFile);
      const res = await api.post("/health/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      uploaded.push(res.data);
    }
    return uploaded;
  };

  const handleSend = async (text, files = []) => {
    const sessionId = activeConversation?.sessionId || activeSessionId;
    const userMessage = {
      id: `user-${Date.now()}`,
      from: "user",
      text,
      attachments: files.map(({ name, size, sizeLabel, type }) => ({
        name,
        size,
        sizeLabel,
        type,
        status: "uploading",
      })),
    };
    const msgBefore = messages;
    const firstUser = !msgBefore.some((m) => m.from === "user");
    updateConversation(sessionId, (c) => ({
      ...c,
      title: firstUser ? getConversationTitle(text) : c.title,
      messages: [...c.messages, userMessage],
    }));
    setIsTyping(true);
    try {
      if (files.length > 0) {
        const docs = await uploadDocuments(files);
        updateConversation(sessionId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === userMessage.id
              ? {
                  ...m,
                  attachments: m.attachments.map((a) => {
                    const u = docs.find((d) => d.filename === a.name);
                    return u
                      ? { ...a, status: "processed", chunkCount: u.chunk_count }
                      : a;
                  }),
                }
              : m,
          ),
        }));
      }
      const response = await api.post("/health/chat", {
        message: text,
        session_id: sessionId,
        history: toHistory(msgBefore),
        use_saved_bmi: true,
        save_history: isAuthenticated,
        use_rag: true,
      });
      const botMessage = {
        id: `bot-${Date.now()}`,
        from: "bot",
        text: response.data?.reply || "Baymax chưa nhận được phản hồi phù hợp.",
        sources: response.data?.sources || [],
      };
      updateConversation(sessionId, (c) => ({
        ...c,
        messages: [...c.messages, botMessage],
      }));
      // Increment notification count when bot responds
      incrementNotificationCount(1, user?.id);
    } catch (error) {
      const detail = error.response?.data?.detail;
      updateConversation(sessionId, (c) => ({
        ...c,
        messages: [
          ...c.messages,
          {
            id: `error-${Date.now()}`,
            from: "bot",
            isError: true,
            text:
              typeof detail === "string"
                ? detail
                : "Hiện chưa xử lý được yêu cầu. Vui lòng thử lại.",
          },
        ],
      }));
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    // Lock body scroll to prevent page-level scrolling while in ChatPage
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    // Fixed container to occupy exactly the remaining viewport height
    <div className="flex h-[calc(100dvh-69px)] w-full overflow-hidden bg-white">
      <ChatSidebar
        conversations={filteredConversations}
        activeSessionId={activeSessionId}
        onSelect={(id) => setActiveSessionId(id)}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        onStartRename={startRename}
        onCancelRename={cancelRename}
        onSubmitRename={submitRename}
        editingSessionId={editingSessionId}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        searchText={searchText}
        setSearchText={setSearchText}
        isLoadingHistory={isLoadingHistory}
        user={user}
        isAuthenticated={isAuthenticated}
      />
      <ChatArea
        messages={messages}
        isTyping={isTyping}
        onSend={handleSend}
        activeTitle={activeConversation?.title}
        user={user}
      />
    </div>
  );
};

export default ChatPage;
