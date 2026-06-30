import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/context/AuthContext";
import api from "../services/api";
import ChatSidebar from "../components/chatbot/ChatSidebar";
import ChatArea from "../components/chatbot/ChatArea";
import RightChatSidebar from "../components/chatbot/RightChatSidebar";
import { incrementNotificationCount } from "../utils/notificationUtils";
import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";

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
      ...(message.role === "assistant" && message.sources?.length
        ? { sources: message.sources }
        : {}),
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
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [chatLimit, setChatLimit] = useState({ count: 0, limit: 10, resetAt: null });



  const fetchDocuments = useCallback(async () => {
    try {
      const res = await api.get("/health/documents");
      setUploadedDocs(res.data || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [ fetchDocuments]);

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
      const res = await api.post("/health/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      uploaded.push(res.data);
    }
    fetchDocuments();
    return uploaded;
  };

  const handleSuggestClick = (text) => {
    handleSend(text);
  };

  const handleExportChat = async (format) => {
    if (!activeConversation) return;

    const chatMessages = activeConversation.messages.filter(m => m.id !== "welcome");
    if (chatMessages.length === 0) {
      alert("Không có nội dung trò chuyện để xuất.");
      return;
    }

    const filename = `chat_history_${activeConversation.sessionId}.${format === "pdf" ? "pdf" : "docx"}`;
    const chatTitle = activeConversation.title || "Lịch sử trò chuyện";

    try {
      if (format === "pdf") {
        // Use html2pdf to ensure Vietnamese font support.
        // To avoid 'oklch' color errors and avoid empty PDFs, we use a hidden iframe.
        // This provides a completely clean document context without Tailwind's global CSS.
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.width = "800px"; // Give it a fixed width for consistent rendering
        iframe.style.height = "1000px";
        iframe.style.left = "-10000px";
        iframe.style.top = "0";
        document.body.appendChild(iframe);

        const frameDoc = iframe.contentWindow.document;
        frameDoc.open();
        
        let htmlContent = `
          <html>
            <head>
              <style>
                body { 
                  background-color: white; 
                  color: #1e293b; 
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
                  padding: 30px; 
                  line-height: 1.6; 
                }
                h1 { 
                  text-align: center; 
                  color: #0f172a; 
                  margin-bottom: 24px; 
                  font-size: 22px; 
                  border-bottom: 2px solid #e2e8f0; 
                  padding-bottom: 12px; 
                }
                .message { 
                  margin-bottom: 16px; 
                  border-bottom: 1px solid #f1f5f9; 
                  padding-bottom: 12px; 
                }
                .sender { 
                  font-weight: 700; 
                  font-size: 13px; 
                  text-transform: uppercase; 
                  letter-spacing: 0.5px; 
                  display: block; 
                  margin-bottom: 4px; 
                }
                .text-content { 
                  white-space: pre-wrap; 
                  font-size: 14px; 
                  color: #334155;
                }
              </style>
            </head>
            <body>
              <h1>${chatTitle}</h1>
        `;
        
        chatMessages.forEach((msg) => {
          const sender = msg.from === "user" ? "Người dùng" : "Baymax";
          const senderColor = msg.from === "user" ? "#e11d48" : "#0284c7";
          htmlContent += `
            <div class="message">
              <span class="sender" style="color: ${senderColor}">${sender}</span> 
              <div class="text-content">${msg.text}</div>
            </div>
          `;
        });

        htmlContent += `</body></html>`;
        frameDoc.write(htmlContent);
        frameDoc.close();

        const opt = {
          margin: [10, 10, 10, 10],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
            // Use the iframe's body as the target
            onclone: (document) => {
              // No extra modifications needed as iframe is already clean
            }
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
          // Capture the body of the iframe
          await html2pdf().set(opt).from(frameDoc.body).save();
        } finally {
          document.body.removeChild(iframe);
        }
      }
    } catch (error) {
      console.error("Export Error:", error);
      alert("Đã xảy ra lỗi khi xuất file.");
    }
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

    let botMsgId = null;

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

      botMsgId = `bot-${Date.now()}`;
      const botPlaceholder = {
        id: botMsgId,
        from: "bot",
        text: "",
        sources: [],
        isStreaming: true,
      };

      updateConversation(sessionId, (c) => ({
        ...c,
        messages: [...c.messages, botPlaceholder],
      }));

      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/health/chat`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          history: toHistory(msgBefore),
          use_saved_bmi: true,
          save_history: isAuthenticated,
          use_rag: true,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let receivedSources = [];
      let sseBuffer = "";

      const applyBotUpdate = (patch) => {
        updateConversation(sessionId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === botMsgId ? { ...m, ...patch } : m
          ),
        }));
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          let data;
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          if (data.error) {
            throw new Error(data.error);
          }

          if (Array.isArray(data.sources)) {
            receivedSources = data.sources;
            applyBotUpdate({ sources: receivedSources });
          }

          if (data.token) {
            accumulatedText += data.token;
            applyBotUpdate({
              text: accumulatedText,
              sources: receivedSources,
            });
          }

          if (data.done) {
            if (Array.isArray(data.sources)) {
              receivedSources = data.sources;
            }
            applyBotUpdate({
              sources: receivedSources,
              isStreaming: false,
            });
          }
        }
      }

      if (sseBuffer.startsWith("data: ")) {
        try {
          const data = JSON.parse(sseBuffer.slice(6));
          if (Array.isArray(data.sources)) {
            receivedSources = data.sources;
            applyBotUpdate({ sources: receivedSources });
          }
          if (data.token) {
            accumulatedText += data.token;
            applyBotUpdate({
              text: accumulatedText,
              sources: receivedSources,
            });
          }
          if (data.done) {
            if (Array.isArray(data.sources)) {
              receivedSources = data.sources;
            }
            applyBotUpdate({
              sources: receivedSources,
              isStreaming: false,
            });
          }
        } catch {
          // ignore trailing partial frame
        }
      }

      if (!accumulatedText) {
        throw new Error("Không nhận được phản hồi từ chatbot.");
      }

      applyBotUpdate({ isStreaming: false });

      incrementNotificationCount(1, user?.id);
    } catch (error) {
      console.error("Chat Error:", error);
      updateConversation(sessionId, (c) => ({
        ...c,
        messages: [
          ...c.messages.filter(
            (m) => !(botMsgId && m.id === botMsgId && !m.text),
          ),
          {
            id: `error-${Date.now()}`,
            from: "bot",
            isError: true,
            text: error.message || "Hiện chưa xử lý được yêu cầu. Vui lòng thử lại.",
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
        onExportChat={handleExportChat}
      />
      <ChatArea
        messages={messages}
        isTyping={isTyping}
        onSend={handleSend}
        activeTitle={activeConversation?.title}
        user={user}
        chatLimit={chatLimit}
      />
      <RightChatSidebar 
        documents={uploadedDocs} 
        onSuggestClick={handleSuggestClick} 
      />
    </div>
  );
};

export default ChatPage;
