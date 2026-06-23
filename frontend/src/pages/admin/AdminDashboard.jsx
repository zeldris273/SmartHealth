import { useState, useEffect, useRef, useCallback } from "react";
import {
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronRight,
  Home,
  Send,
  FileText,
  Trash2,
  RotateCcw,
  Activity,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Target,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";
import ChatBubble from "../../components/chatbot/ChatBubble";
import Modal from "../../components/common/Modal";

const getSupportWsUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  return `${apiUrl.replace(/^http/, "ws")}/support/ws`;
};

const statusLabels = {
  all: "Tất cả",
  open: "Mới",
  in_progress: "Đang xử lý",
  closed: "Xong",
};

const isNotificationSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

const AdminDashboard = () => {
  const [activeItem, setActiveItem] = useState("cskh");
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasNewTicketNotification, setHasNewTicketNotification] =
    useState(false);
  const [ticketFilter, setTicketFilter] = useState("all");
  const [documents, setDocuments] = useState([]);
  const [documentLoading, setDocumentLoading] = useState(true);
  const [documentFilter, setDocumentFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const selectedTicketRef = useRef(null);
  const lastNotifiedTicketIdRef = useRef(null);
  const lastNotifiedMessageIdRef = useRef(null);
  const previousTicketsCountRef = useRef(0);

  const sidebarItems = [
    { id: "cskh", label: "Chăm sóc khách hàng", icon: <Users /> },
    { id: "documents", label: "Quản lý tài liệu", icon: <FileText /> },
    { id: "stats", label: "Thống kê", icon: <BarChart3 /> },
    { id: "settings", label: "Cài đặt", icon: <Settings /> },
  ];

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showAdminNotification = useCallback((title, body) => {
    if (!isNotificationSupported() || Notification.permission !== "granted")
      return;

    if (window.adminNotification) {
      window.adminNotification.close();
    }

    window.adminNotification = new Notification(title, {
      body,
      icon: "https://cdn-icons-png.flaticon.com/512/633/633611.png",
    });

    setTimeout(() => {
      if (window.adminNotification) {
        window.adminNotification.close();
      }
    }, 5000);
  }, []);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/support/admin/tickets");
      const newTickets = response.data;

      if (
        newTickets.length > previousTicketsCountRef.current &&
        previousTicketsCountRef.current > 0
      ) {
        const latestTicket = newTickets[0];

        if (latestTicket.id !== lastNotifiedTicketIdRef.current) {
          setHasNewTicketNotification(true);
          lastNotifiedTicketIdRef.current = latestTicket.id;
          showAdminNotification(
            "Ticket mới từ khách hàng",
            `Có ticket mới: ${latestTicket.subject}`,
          );
        }
      }

      setTickets(newTickets);
      previousTicketsCountRef.current = newTickets.length;
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [showAdminNotification]);

  const loadDocuments = useCallback(async () => {
    try {
      setDocumentLoading(true);
      const response = await api.get("/health/documents/admin");
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast.error("Không thể tải danh sách tài liệu.");
    } finally {
      setDocumentLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await api.get("/health/admin/stats/");
      setStatsData(response.data);
    } catch (error) {
      console.error("Failed to load statistics:", error);
      toast.error("Không thể tải dữ liệu thống kê.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleDeleteDocument = useCallback(async () => {
    if (!documentToDelete) return;
    try {
      await api.delete(`/health/documents/${documentToDelete.id}`);
      toast.success(`Tài liệu "${documentToDelete.filename}" đã được xóa mềm.`);
      loadDocuments();
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Không thể xóa tài liệu.");
    }
  }, [documentToDelete, loadDocuments]);

  const handleRestoreDocument = useCallback(
    async (documentId) => {
      try {
        await api.post(`/health/documents/${documentId}/restore`);
        toast.success("Tài liệu đã được khôi phục.");
        loadDocuments();
      } catch (error) {
        console.error("Failed to restore document:", error);
        toast.error("Không thể khôi phục tài liệu.");
      }
    },
    [loadDocuments],
  );

  const loadTicketDetail = useCallback(
    async (ticketId) => {
      try {
        const response = await api.get(`/support/admin/tickets/${ticketId}`);
        const newTicket = response.data;

        // Check if there are new user messages
        if (
          selectedTicketRef.current?.id === ticketId &&
          newTicket.messages.length > 0
        ) {
          const latestMessage =
            newTicket.messages[newTicket.messages.length - 1];

          if (
            latestMessage.sender_id === newTicket.user_id &&
            latestMessage.id !== lastNotifiedMessageIdRef.current
          ) {
            lastNotifiedMessageIdRef.current = latestMessage.id;
            showAdminNotification(
              `Tin nhắn mới từ ${newTicket.user?.full_name || "Khách hàng"}`,
              latestMessage.content,
            );
          }
        }

        // Format messages for ChatBubble
        const formattedMessages = newTicket.messages.map((msg) => {
          let from = "admin";
          if (msg.sender_id === newTicket.user_id) {
            from = "user";
          } else if (msg.sender && msg.sender.role === "user") {
            from = "user";
          }
          return {
            id: msg.id,
            from: from,
            text: msg.content,
            createdAt: msg.created_at,
          };
        });

        setSelectedTicket(newTicket);
        setMessages(formattedMessages || []);
      } catch (error) {
        console.error("Failed to load ticket detail:", error);
      }
    },
    [showAdminNotification],
  );

  useEffect(() => {
    if (activeItem === "cskh") {
      queueMicrotask(loadTickets);
    } else if (activeItem === "documents") {
      queueMicrotask(loadDocuments);
    } else if (activeItem === "stats") {
      queueMicrotask(loadStats);
    }
  }, [activeItem, loadTickets, loadDocuments, loadStats]);

  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  useEffect(() => {
    if (activeItem !== "cskh") return;

    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    if (!token) return;

    let socket;
    let reconnectTimer;
    let shouldReconnect = true;

    const connect = () => {
      socket = new WebSocket(
        `${getSupportWsUrl()}?token=${encodeURIComponent(token)}`,
      );

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (
          ![
            "ticket_created",
            "message_created",
            "ticket_status_updated",
          ].includes(payload.type)
        ) {
          return;
        }

        loadTickets();
        if (selectedTicketRef.current?.id === payload.ticket_id) {
          loadTicketDetail(payload.ticket_id);
        }
      };

      socket.onerror = (error) => {
        console.error("Support websocket error:", error);
      };

      socket.onclose = () => {
        if (shouldReconnect) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [activeItem, loadTickets, loadTicketDetail]);

  useEffect(() => {
    if (!isNotificationSupported()) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const response = await api.post(
        `/support/admin/tickets/${selectedTicket.id}/messages`,
        {
          content: newMessage,
        },
      );
      // Format the new message properly for ChatBubble
      const formattedNewMessage = {
        id: response.data.id,
        from: "admin",
        text: response.data.content,
        createdAt: response.data.created_at,
      };
      setMessages((prev) => [...prev, formattedNewMessage]);
      setNewMessage("");
      loadTickets();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const updateStatus = async (ticketId, status) => {
    try {
      await api.patch(`/support/admin/tickets/${ticketId}/status`, { status });
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => ({ ...prev, status }));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const activeTicketsCount = tickets.filter(
    (ticket) => ticket.status !== "closed",
  ).length;
  const filteredTickets = tickets.filter((ticket) =>
    ticketFilter === "all"
      ? ticket.status !== "closed"
      : ticket.status === ticketFilter,
  );
  const filteredDocuments = documents.filter((doc) => {
    if (documentFilter === "active") return !doc.is_deleted;
    if (documentFilter === "deleted") return doc.is_deleted;
    return true;
  });
  const activeDocumentCount = documents.filter((doc) => !doc.is_deleted).length;
  const deletedDocumentCount = documents.filter((doc) => doc.is_deleted).length;

  return (
    <div className="w-full h-[calc(100dvh-69px)] overflow-hidden flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">    
        <nav className="mt-6 space-y-2 px-4 flex-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveItem(item.id);
                if (item.id === "cskh") {
                  setHasNewTicketNotification(false);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeItem === item.id
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.icon}
              <span className="flex-1 whitespace-nowrap">{item.label}</span>
              {item.id === "cskh" && hasNewTicketNotification && (
                <span className="flex h-3 w-3 rounded-full bg-red-500"></span>
              )}
              {activeItem === item.id && <ChevronRight className="w-4 h-4" />}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg text-sm font-medium transition-all"
          >
            <Home size={16} />
            <span>Quay lại bảng điều khiển</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        <div className="w-full h-full mx-auto flex flex-col p-4 md:p-6 overflow-hidden min-h-0">
          <header className="mb-4 flex-shrink-0">
            <h1 className="text-2xl font-bold text-slate-900">
              Trang quản trị
            </h1>
            <p className="text-gray-600">
              {activeItem === "cskh"
                ? "Quản lý và chăm sóc khách hàng"
                : activeItem === "documents"
                  ? "Quản lý tài liệu RAG"
                  : activeItem === "stats"
                    ? "Thống kê doanh nghiệp"
                    : "Cài đặt hệ thống"}
            </p>
          </header>

          {activeItem === "documents" && (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full min-h-0">
              <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                      <FileText className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Danh sách tài liệu
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activeDocumentCount} hoạt động · {deletedDocumentCount}{" "}
                        đã xóa
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "all", label: "Tất cả" },
                      { id: "active", label: "Hoạt động" },
                      { id: "deleted", label: "Đã xóa" },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setDocumentFilter(filter.id)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          documentFilter === filter.id
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {documentLoading ? (
                  <div className="p-6 text-center text-gray-500">
                    Đang tải tài liệu...
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    {documents.length === 0
                      ? "Không có tài liệu nào."
                      : "Không có tài liệu phù hợp với bộ lọc."}
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Tên tài liệu
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Trạng thái
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Ngày tải lên
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDocuments.map((doc) => (
                        <tr
                          key={doc.id}
                          className={
                            doc.is_deleted ? "bg-red-50 opacity-70" : ""
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {doc.filename}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.is_deleted ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Đã xóa
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Hoạt động
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(doc.created_at).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {doc.is_deleted ? (
                              <button
                                onClick={() => handleRestoreDocument(doc.id)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                                title="Khôi phục tài liệu"
                              >
                                <RotateCcw size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setDocumentToDelete(doc);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900 mr-3"
                                title="Xóa tài liệu"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeItem === "cskh" && (
            <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0 h-full">
              {/* Tickets List */}
              <div className="col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <MessageSquare className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Danh sách yêu cầu
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activeTicketsCount} ticket hiện tại
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {["all", "open", "in_progress", "closed"].map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setTicketFilter(filter)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          ticketFilter === filter
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {statusLabels[filter]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="p-6 text-center text-gray-500">
                      Đang tải...
                    </div>
                  ) : filteredTickets.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Không có ticket phù hợp
                    </div>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => {
                          loadTicketDetail(ticket.id);
                          setHasNewTicketNotification(false);
                        }}
                        className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${
                          selectedTicket?.id === ticket.id
                            ? "bg-blue-50 border-l-4 border-blue-500"
                            : ""
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900 truncate">
                              {ticket.subject}
                            </h4>
                            {/* New message indicator */}
                            {selectedTicket?.id !== ticket.id &&
                              ticket.messages &&
                              ticket.messages.length > 0 &&
                              (selectedTicket?.messages?.length || 0) <
                                ticket.messages.length && (
                                <span className="flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
                              )}
                          </div>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              ticket.status === "open"
                                ? "bg-yellow-100 text-yellow-800"
                                : ticket.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {ticket.status === "open"
                              ? "Mới"
                              : ticket.status === "in_progress"
                                ? "Đang xử lý"
                                : "Xong"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {ticket.user?.full_name || "Khách"} •{" "}
                          {new Date(ticket.updated_at).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {!selectedTicket ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    Chọn một ticket để xem chi tiết và trò chuyện
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {selectedTicket.subject}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Khách hàng:{" "}
                          {selectedTicket.user?.full_name || "Khách"}
                        </p>
                      </div>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) =>
                          updateStatus(selectedTicket.id, e.target.value)
                        }
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="open">Mới</option>
                        <option value="in_progress">Đang xử lý</option>
                        <option value="closed">Xong</option>
                      </select>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto scrollbar-none p-6 space-y-4 bg-gray-50">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500">
                          Chưa có tin nhắn nào
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <ChatBubble
                            key={msg.id}
                            message={msg}
                            isAdminView={true}
                          />
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form
                      onSubmit={sendMessage}
                      className="p-6 border-t border-gray-100 flex-shrink-0"
                    >
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Nhập tin nhắn..."
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={20} />
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

           {activeItem === "stats" && (
             <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pb-6">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* BMI Distribution Pie Chart */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                       <PieChartIcon className="text-blue-600" size={20} />
                     </div>
                     <h3 className="text-lg font-semibold text-slate-900">Phân bố BMI toàn hệ thống</h3>
                   </div>
                   <div className="h-[300px] w-full">
                     {statsLoading || !statsData ? (
                       <div className="h-full flex items-center justify-center text-gray-400">Đang tải dữ liệu...</div>
                     ) : (
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={[
                               { name: 'Thiếu cân', value: statsData.bmi_distribution.underweight },
                               { name: 'Bình thường', value: statsData.bmi_distribution.normal },
                               { name: 'Thừa cân', value: statsData.bmi_distribution.overweight },
                               { name: 'Béo phì', value: statsData.bmi_distribution.obese },
                             ]}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={100}
                             paddingAngle={5}
                             dataKey="value"
                           >
                             <Cell fill="#60a5fa" />
                             <Cell fill="#34d399" />
                             <Cell fill="#fbbf24" />
                             <Cell fill="#f87171" />
                           </Pie>
                           <Tooltip />
                           <Legend verticalAlign="bottom" height={36} />
                         </PieChart>
                       </ResponsiveContainer>
                     )}
                   </div>
                 </div>

                 {/* Popular Goals Bar Chart */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                       <Target className="text-green-600" size={20} />
                     </div>
                     <h3 className="text-lg font-semibold text-slate-900">Mục tiêu sức khỏe phổ biến</h3>
                   </div>
                   <div className="h-[300px] w-full">
                     {statsLoading || !statsData ? (
                       <div className="h-full flex items-center justify-center text-gray-400">Đang tải dữ liệu...</div>
                     ) : (
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart
                           data={Object.entries(statsData.popular_goals.goals).map(([name, value]) => ({ name, value }))}
                           layout="vertical"
                           margin={{ left: 20 }}
                         >
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                           <Tooltip />
                           <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                         </BarChart>
                       </ResponsiveContainer>
                     )}
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Age Distribution */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 col-span-2">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                       <BarChartIcon className="text-purple-600" size={20} />
                     </div>
                     <h3 className="text-lg font-semibold text-slate-900">Phân bố độ tuổi</h3>
                   </div>
                   <div className="h-[250px] w-full">
                     {statsLoading || !statsData ? (
                       <div className="h-full flex items-center justify-center text-gray-400">Đang tải dữ liệu...</div>
                     ) : (
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart
                           data={Object.entries(statsData.demographics.age_groups).map(([name, value]) => ({ name, value }))}
                         >
                           <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                           <YAxis tick={{ fontSize: 12 }} />
                           <Tooltip />
                           <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                         </BarChart>
                       </ResponsiveContainer>
                     )}
                   </div>
                 </div>

                 {/* Calorie Averages */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                       <Activity className="text-orange-600" size={20} />
                     </div>
                     <h3 className="text-lg font-semibold text-slate-900">TDEE Trung bình</h3>
                   </div>
                   <div className="space-y-6">
                     {statsLoading || !statsData ? (
                       <div className="py-10 text-center text-gray-400">Đang tải dữ liệu...</div>
                     ) : (
                       Object.entries(statsData.calorie_averages.average_tdee).map(([gender, avg]) => (
                         <div key={gender} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                           <span className="text-gray-600 capitalize font-medium">{gender === 'male' ? 'Nam' : 'Nữ'}</span>
                           <span className="text-xl font-bold text-slate-900">{avg} <span className="text-sm font-normal text-gray-500">kcal</span></span>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               </div>

               {/* Gender Distribution Simple Cards */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                 <h3 className="text-lg font-semibold text-slate-900 mb-4">Phân bố Giới tính</h3>
                 <div className="flex flex-wrap gap-4">
                   {statsLoading || !statsData ? (
                     <div className="py-4 text-gray-400">Đang tải dữ liệu...</div>
                   ) : (
                     Object.entries(statsData.demographics.gender).map(([gender, count]) => (
                       <div key={gender} className="px-6 py-3 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100">
                         <span className="capitalize">{gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : gender}:</span> {count} người
                       </div>
                     ))
                   )}
                 </div>
               </div>
             </div>
           )}

          {activeItem === "settings" && (
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">
                  Cài đặt hệ thống
                </h3>
                <p className="text-gray-500">
                  Phần cài đặt sẽ được cập nhật sau.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa tài liệu"
      >
        <p className="text-gray-700 mb-4">
          Bạn có chắc chắn muốn xóa tài liệu "{documentToDelete?.filename}"?
          Thao tác này sẽ xóa mềm tài liệu và tất cả các chunk liên quan.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleDeleteDocument}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Xóa
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
