import { useRef, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MessageSquare,
  MoreHorizontal,
  User,
  FileDown,
  Crown,
} from "lucide-react";

const groupConversations = (conversations) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const groups = { today: [], yesterday: [], older: [] };
  conversations.forEach((c) => {
    const d = new Date(c.updatedAt);
    if (d >= today) groups.today.push(c);
    else if (d >= yesterday) groups.yesterday.push(c);
    else groups.older.push(c);
  });
  return groups;
};

const ChatSidebar = ({
  conversations,
  activeSessionId,
  onSelect,
  onNewChat,
  onDelete,
  onStartRename,
  onCancelRename,
  onSubmitRename,
  editingSessionId,
  editTitle,
  setEditTitle,
  searchText,
  setSearchText,
  isLoadingHistory,
  user,
  isAuthenticated,
  onExportChat,
}) => {
  const renameRef = useRef(null);
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (editingSessionId) {
      renameRef.current?.focus();
      renameRef.current?.select();
    }
  }, [editingSessionId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const groups = groupConversations(conversations);

  const renderGroup = (label, items) => {
    if (!items.length) return null;
    return (
      <div className="mb-2">
        <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          {label}
        </div>
        {items.map((c) => {
          const isActive = c.sessionId === activeSessionId;
          const isEditing = editingSessionId === c.sessionId;
          return (
            <div
              key={c.sessionId}
              className={`group relative flex items-center rounded-lg mx-1 mb-0.5 ${
                isActive
                  ? "bg-red-500 text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {isEditing ? (
                <form
                  className="flex-1 px-2 py-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSubmitRename(c.sessionId);
                  }}
                >
                  <input
                    ref={renameRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => onSubmitRename(c.sessionId)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") onCancelRename();
                    }}
                    maxLength={120}
                    className="w-full bg-white border border-red-300 rounded px-2 py-0.5 text-sm text-gray-800 outline-none"
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(c.sessionId)}
                  className="flex-1 flex items-center gap-2 px-3 py-2 text-left min-w-0"
                  title={c.title}
                >
                  <MessageSquare
                    size={14}
                    className="flex-shrink-0 opacity-60"
                  />
                  <span className="flex-1 truncate text-sm">{c.title}</span>
                  <span
                    className={`text-[11px] flex-shrink-0 ${isActive ? "text-red-200" : "text-gray-400"}`}
                  >
                    {new Date(c.updatedAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </button>
              )}

              {!isEditing && (
                <div className="absolute right-1 hidden group-hover:flex items-center gap-0.5 bg-inherit pr-1">
                  <button
                    type="button"
                    onClick={() => onStartRename(c)}
                    className={`p-1 rounded hover:bg-black/10 ${isActive ? "text-red-100" : "text-gray-400"}`}
                    aria-label="Đổi tên"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(c.sessionId)}
                    className={`p-1 rounded hover:bg-black/10 ${isActive ? "text-red-100 hover:text-white" : "text-gray-400 hover:text-red-500"}`}
                    aria-label="Xóa"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="flex flex-col w-60 flex-shrink-0 h-full bg-gray-50 border-r border-gray-200">
      {/* New chat button */}
      <div className="flex-shrink-0 p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-red-300 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <Plus size={17} />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-3 pb-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm kiếm cuộc trò chuyện..."
            className="flex-1 bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none"
          />
        </div>
      </div>

      {/* Conversations list — scrollable */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoadingHistory && (
          <div className="px-4 py-3 text-xs text-gray-400">
            Đang tải lịch sử...
          </div>
        )}
        {renderGroup("Hôm nay", groups.today)}
        {renderGroup("Hôm qua", groups.yesterday)}
        {renderGroup("Trước đó", groups.older)}
      </div>

      {/* User footer */}
      <div className="flex-shrink-0 border-t border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {(user?.avatar || user?.avatar_url) ? (
              <img
                src={user.avatar || user.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={16} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">
              {isAuthenticated
                ? user?.full_name || user?.email || "User"
                : "Khách"}
            </div>
            {isAuthenticated && user?.email && (
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <MoreHorizontal size={16} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    onExportChat("pdf");
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FileDown size={14} />
                  <span>Xuất file PDF</span>
                </button>
                <div className="border-t border-gray-100 my-1"></div>
               
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;