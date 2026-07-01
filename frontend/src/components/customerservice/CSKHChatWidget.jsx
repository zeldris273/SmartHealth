
import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Minus, X } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";
import ChatBubble from "../chatbot/ChatBubble";
import ChatInput from "./ChatInput";

const initialMessages = [
  {
    id: "welcome",
    from: "admin",
    text: "Xin chào! Đây là bộ phận CSKH SmartHealth. Bạn cần hỗ trợ điều gì hôm nay?",
  },
];

const getSupportWsUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  return `${apiUrl.replace(/^http/, 'ws')}/support/ws`;
};

const isNotificationSupported = () => typeof window !== 'undefined' && 'Notification' in window;

const CSKHChatWidget = () => {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastAdminMessageIdRef = useRef(null); // Dùng useRef để cập nhật ngay lập tức
  const [showOfflineAutoMessage, setShowOfflineAutoMessage] = useState(false);
  const bottomRef = useRef(null);
  const isOpenRef = useRef(false);
  const isAdminOnlineRef = useRef(false);
  const hasAskedPermissionRef = useRef(false);

  const loadUserTickets = useCallback(async () => {
    try {
      const latestIsAdminOnline = isAdminOnlineRef.current;
      
      const response = await api.get('/support/tickets/me');
      const tickets = response.data;
      if (tickets.length > 0) {
        const recentTicket = tickets.find(t => t.status !== 'closed') || tickets[0];
        const detailResponse = await api.get(`/support/tickets/me/${recentTicket.id}`);
        const newTicket = detailResponse.data;
        
        const ticketMessages = newTicket.messages.map(msg => ({
          id: msg.id,
          from: msg.sender_id === newTicket.user_id ? 'user' : 'admin',
          text: msg.content,
          createdAt: msg.created_at
        }));
        
        const adminMessages = ticketMessages.filter(m => m.from === 'admin');
        const userMessages = ticketMessages.filter(m => m.from === 'user');
        
        if (adminMessages.length > 0) {
          const latestAdminMsg = adminMessages[adminMessages.length - 1];
          
          // First time - just save the last ID
          if (lastAdminMessageIdRef.current === null) {
            lastAdminMessageIdRef.current = latestAdminMsg.id;
          } 
          // New message received (so sánh dưới dạng String)
          else if (String(latestAdminMsg.id) !== String(lastAdminMessageIdRef.current)) {
            lastAdminMessageIdRef.current = latestAdminMsg.id;
            // Hide auto message when new admin message arrives
            setShowOfflineAutoMessage(false);
            
            // Only update unread count and show notification if chat is closed
            if (!isOpenRef.current) {
              setUnreadCount(prev => prev + 1);
              
              if (isNotificationSupported() && Notification.permission === 'granted') {
                if (window.currentNotification) {
                  window.currentNotification.close();
                }
                
                window.currentNotification = new Notification('Tin nhắn mới từ CSKH', {
                  body: latestAdminMsg.text,
                  icon: 'https://cdn-icons-png.flaticon.com/512/633/633611.png'
                });
                
                setTimeout(() => {
                  if (window.currentNotification) {
                    window.currentNotification.close();
                  }
                }, 5000);
              }
            }
          }
        }
        
        // Determine if we should show the offline auto message
        let shouldShowAutoMessage = false;
        if (!latestIsAdminOnline && userMessages.length > 0) {
          if (adminMessages.length === 0) {
            // No admin messages at all - show auto message
            shouldShowAutoMessage = true;
          } else {
            // Check if last user message is newer than last admin message (simplified check)
            // Since messages are in order, just check if last message is user message
            const lastMessage = ticketMessages[ticketMessages.length - 1];
            if (lastMessage && lastMessage.from === 'user') {
              shouldShowAutoMessage = true;
            }
          }
        }
        
        // If admin is online, hide auto message
        if (latestIsAdminOnline) {
          shouldShowAutoMessage = false;
        }
        
        setShowOfflineAutoMessage(shouldShowAutoMessage);
        setCurrentTicket(newTicket);
        // Just show welcome + ticket messages, no auto messages array
        setMessages([initialMessages[0], ...ticketMessages]);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  }, []);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    isAdminOnlineRef.current = isAdminOnline;
  }, [isAdminOnline]);

  useEffect(() => {
    if (isAuthenticated) {
      queueMicrotask(loadUserTickets);
    }
  }, [isAuthenticated, loadUserTickets]);

  useEffect(() => {
    const handleExternalOpen = () => {
      openChat();
    };

    window.addEventListener('open-cskh-chat', handleExternalOpen);
    return () => window.removeEventListener('open-cskh-chat', handleExternalOpen);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) return;

    let socket;
    let reconnectTimer;
    let shouldReconnect = true;

    const connect = () => {
      socket = new WebSocket(`${getSupportWsUrl()}?token=${encodeURIComponent(token)}`);

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);

        if (payload.type === 'admin_status') {
          setIsAdminOnline(payload.is_admin_online);
          if (payload.is_admin_online) {
            setShowOfflineAutoMessage(false);
          }
          return;
        }

        if (['ticket_created', 'message_created', 'ticket_status_updated'].includes(payload.type)) {
          loadUserTickets();
        }
      };

      socket.onerror = (error) => {
        console.error('Support websocket error:', error);
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
  }, [isAuthenticated, loadUserTickets]);

  // Ask for notification permission once
  useEffect(() => {
    if (!isNotificationSupported()) return;
    if (!hasAskedPermissionRef.current && Notification.permission === 'default') {
      hasAskedPermissionRef.current = true;
      Notification.requestPermission();
    }
  }, []);

  const handleSend = async (text) => {
    const userMessage = { id: `user-${Date.now()}`, from: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng chat chăm sóc khách hàng!");
      setTimeout(() => {
        setIsTyping(false);
      }, 800);
      return;
    }

    try {
      let ticket = currentTicket;
      if (!ticket) {
        const createResponse = await api.post('/support/tickets', {
          subject: 'Yêu cầu hỗ trợ từ người dùng'
        });
        ticket = createResponse.data;
        setCurrentTicket(ticket);
      }

      await api.post(`/support/tickets/me/${ticket.id}/messages`, {
        content: text
      });

      setTimeout(async () => {
        setIsTyping(false);
        if (!isAdminOnlineRef.current) {
          setShowOfflineAutoMessage(true);
        } else {
          setShowOfflineAutoMessage(false);
        }
      }, 800);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    }
  };

  const openChat = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      toast.info("Vui lòng đăng nhập để sử dụng tính năng chat chăm sóc khách hàng!");
      return;
    }
    
    setIsOpen(true);
    setUnreadCount(0);
    
    if (isNotificationSupported() && Notification.permission === 'default' && !hasAskedPermissionRef.current) {
      hasAskedPermissionRef.current = true;
      Notification.requestPermission();
    }
  };

  if (isAuthenticated && user?.role === 'admin') {
    return null;
  }

  if (!isOpen) {
  return (
    <div className="fixed bottom-5 right-5 z-40">
      <div className="relative">
         <div className="cskh-pulse-ring" />
        <button
          type="button"
          onClick={openChat}
          aria-label="Mở chat CSKH"
          className="
            group flex items-center gap-0 overflow-hidden
            rounded-full bg-[#dc2626] px-[13px] py-[13px]
            text-white shadow-lg shadow-[#dc2626]/30
            transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            hover:gap-2 hover:px-[18px] hover:py-[13px] hover:pl-[14px]
            focus:outline-none focus:ring-2 focus:ring-[#dc2626]/50
          "
        >
          <Headphones size={20} className="flex-shrink-0" />
          <span
            className="
              max-w-0 overflow-hidden whitespace-nowrap
              text-sm font-medium opacity-0
              transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              group-hover:max-w-[160px] group-hover:opacity-100
            "
          >
            Hỗ trợ khách hàng
          </span>
        </button>

        {isAuthenticated && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[11px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}

  return (
    <section className="fixed bottom-5 right-5 z-40 flex h-[560px] max-h-[calc(100vh-6rem)] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-lg border border-red-600/20 bg-white shadow-2xl shadow-slate-200">
      <div className="flex items-center justify-between bg-[#dc2626] px-4 py-3 text-white">
        <div>
          <h2 className="text-sm font-semibold">CSKH - Hỗ trợ khách hàng</h2>
          <p className="text-xs flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-full ${isAdminOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
            {isAdminOnline ? 'Đang online' : 'Đang offline'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Thu nhỏ chat"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/15"
          >
            <Minus size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setMessages(initialMessages);
              setShowOfflineAutoMessage(false);
            }}
            aria-label="Đóng chat"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/15"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
          <div className="rounded-full bg-red-50 p-4 text-red-600">
            <Headphones size={40} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Đăng nhập để chat</h3>
            <p className="mt-1 text-sm text-slate-600">
              Vui lòng đăng nhập để sử dụng tính năng chat chăm sóc khách hàng!
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              openAuthModal('login');
            }}
            className="rounded-lg bg-[#dc2626] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            Đăng nhập ngay
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 scrollbar-none">
            <div className="flex flex-col gap-3">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {showOfflineAutoMessage && (
                <ChatBubble 
                  message={{ 
                    id: "auto-offline", 
                    from: "admin", 
                    text: `Chào ${user?.full_name || "bạn"}, cảm ơn bạn đã liên hệ và ban quản trị sẽ phản hồi bạn sớm nhất.` 
                  }} 
                />
              )}
              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 rounded-2xl rounded-tl-none bg-red-50 px-4 py-2 text-sm text-red-600">
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
        </>
      )}
    </section>
  );
};

export default CSKHChatWidget;
