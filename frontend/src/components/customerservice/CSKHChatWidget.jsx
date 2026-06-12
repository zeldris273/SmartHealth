
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Minus, X } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
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

const CSKHChatWidget = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastAdminMessageIdRef = useRef(null); // Dùng useRef để cập nhật ngay lập tức
  const [hasAskedPermission, setHasAskedPermission] = useState(false);
  const [showOfflineAutoMessage, setShowOfflineAutoMessage] = useState(false);
  const [, forceUpdate] = useState(0); // Để trigger re-render
  const bottomRef = useRef(null);

  // Polling để kiểm tra trạng thái admin online mỗi 5 giây
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await api.get("/auth/admin/online-status");
        setIsAdminOnline(response.data.is_admin_online);
      } catch (error) {
        console.error("Failed to check admin status:", error);
        setIsAdminOnline(false);
      }
    };

    checkAdminStatus();
    const intervalId = setInterval(checkAdminStatus, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Hide auto-message immediately when admin comes online
  useEffect(() => {
    if (isAdminOnline) {
      setShowOfflineAutoMessage(false);
    }
  }, [isAdminOnline]);

  // Load user's tickets and check for new messages - pause when chat is closed
  useEffect(() => {
    if (isAuthenticated) {
      loadUserTickets();
      // Only poll every 3 seconds when chat is open; poll every 10 seconds when closed
      const pollInterval = isOpen ? 3000 : 10000;
      const interval = setInterval(loadUserTickets, pollInterval);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isOpen]);

  // Ask for notification permission once
  useEffect(() => {
    if (!hasAskedPermission && Notification.permission === 'default') {
      Notification.requestPermission();
      setHasAskedPermission(true);
    }
  }, [hasAskedPermission]);

  const loadUserTickets = async () => {
    try {
      // Always get the FRESHEST admin status directly from API
      let latestIsAdminOnline = false;
      try {
        const statusResponse = await api.get("/auth/admin/online-status");
        latestIsAdminOnline = statusResponse.data.is_admin_online;
        // Also update the state so the UI indicator is correct
        setIsAdminOnline(latestIsAdminOnline);
      } catch (error) {
        console.error("Failed to check admin status in loadUserTickets:", error);
        // Fallback to current state if API fails
        latestIsAdminOnline = isAdminOnline;
      }
      
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
            if (!isOpen) {
              setUnreadCount(prev => prev + 1);
              
              if (Notification.permission === 'granted') {
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
          const lastUserMsg = userMessages[userMessages.length - 1];
          if (adminMessages.length === 0) {
            // No admin messages at all - show auto message
            shouldShowAutoMessage = true;
          } else {
            const lastAdminMsg = adminMessages[adminMessages.length - 1];
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
  };

  const handleSend = async (text) => {
    const userMessage = { id: `user-${Date.now()}`, from: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    if (!isAuthenticated) {
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
        // Recheck admin status to get the latest value
        try {
          const response = await api.get("/auth/admin/online-status");
          const latestIsAdminOnline = response.data.is_admin_online;
          if (!latestIsAdminOnline) {
            setShowOfflineAutoMessage(true);
          } else {
            setShowOfflineAutoMessage(false);
          }
        } catch (error) {
          console.error("Failed to check admin status in timeout:", error);
          // Fallback to current state if API fails
          if (!isAdminOnline) {
            setShowOfflineAutoMessage(true);
          }
        }
      }, 800);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    }
  };

  const openChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
    
    if (Notification.permission === 'default' && !hasAskedPermission) {
      Notification.requestPermission();
      setHasAskedPermission(true);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={openChat}
          aria-label="Mở chat CSKH"
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-xl shadow-blue-200 transition hover:scale-105 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          <MessageCircle size={26} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <section className="fixed bottom-5 right-5 z-40 flex h-[560px] max-h-[calc(100vh-6rem)] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-lg border border-blue-100 bg-white shadow-2xl shadow-slate-200">
      <div className="flex items-center justify-between bg-blue-500 px-4 py-3 text-white">
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
            className="flex h-8 w-8 items-center justify-center rounded-full text-blue-50 transition hover:bg-white/15"
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
            className="flex h-8 w-8 items-center justify-center rounded-full text-blue-50 transition hover:bg-white/15"
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
              <div className="flex gap-1 rounded-2xl rounded-tl-none bg-blue-50 px-4 py-2 text-sm text-blue-400">
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

export default CSKHChatWidget;
