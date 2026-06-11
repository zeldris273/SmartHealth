import { useRef, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, MessageSquare, MoreHorizontal, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import BaymaxLogo from '../BaymaxLogo';

const groupConversations = (conversations) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
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
  conversations, activeSessionId, onSelect, onNewChat, onDelete,
  onStartRename, onCancelRename, onSubmitRename, editingSessionId,
  editTitle, setEditTitle, searchText, setSearchText, isLoadingHistory,
  user, isAuthenticated,
}) => {
  const renameRef = useRef(null);
  useEffect(() => {
    if (editingSessionId) { renameRef.current?.focus(); renameRef.current?.select(); }
  }, [editingSessionId]);

  const groups = groupConversations(conversations);

  const renderGroup = (label, items) => {
    if (!items.length) return null;
    return (
      <div className="sidebar-group">
        <div className="sidebar-group-label">{label}</div>
        {items.map((c) => {
          const isActive = c.sessionId === activeSessionId;
          const isEditing = editingSessionId === c.sessionId;
          return (
            <div key={c.sessionId} className={`sidebar-item ${isActive ? 'active' : ''}`}>
              {isEditing ? (
                <form className="sidebar-rename-form" onSubmit={(e) => { e.preventDefault(); onSubmitRename(c.sessionId); }}>
                  <input ref={renameRef} value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => onSubmitRename(c.sessionId)}
                    onKeyDown={(e) => { if (e.key === 'Escape') onCancelRename(); }}
                    maxLength={120} className="sidebar-rename-input" />
                </form>
              ) : (
                <button type="button" onClick={() => onSelect(c.sessionId)} className="sidebar-item-btn" title={c.title}>
                  <MessageSquare size={15} className="sidebar-item-icon" />
                  <span className="sidebar-item-title">{c.title}</span>
                  <span className="sidebar-item-time">
                    {new Date(c.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              )}
              {!isEditing && (
                <div className="sidebar-item-actions">
                  <button type="button" onClick={() => onStartRename(c)} className="sidebar-action-btn" aria-label="Đổi tên"><Pencil size={13} /></button>
                  <button type="button" onClick={() => onDelete(c.sessionId)} className="sidebar-action-btn delete" aria-label="Xóa"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="chat-sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-brand">
          <BaymaxLogo size={36} />
          <div>
            <div className="sidebar-brand-name">Baymax AI</div>
            <div className="sidebar-brand-sub">AI Health Assistant</div>
          </div>
        </Link>
      </div>
      <div className="sidebar-new-chat">
        <button type="button" onClick={onNewChat} className="sidebar-new-chat-btn">
          <Plus size={18} />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>
      <div className="sidebar-search">
        <Search size={15} className="sidebar-search-icon" />
        <input value={searchText} onChange={(e) => setSearchText(e.target.value)}
          placeholder="Tìm kiếm cuộc trò chuyện..." className="sidebar-search-input" />
      </div>
      <div className="sidebar-conversations">
        {isLoadingHistory && <div className="sidebar-loading">Đang tải lịch sử...</div>}
        {renderGroup('Hôm nay', groups.today)}
        {renderGroup('Hôm qua', groups.yesterday)}
        {renderGroup('Trước đó', groups.older)}
      </div>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.avatar ? <img src={user.avatar} alt="" /> : <User size={18} />}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{isAuthenticated ? (user?.full_name || user?.email || 'User') : 'Khách'}</div>
            <div className="sidebar-user-email">{isAuthenticated ? (user?.email || '') : ''}</div>
          </div>
          <button type="button" className="sidebar-user-menu"><MoreHorizontal size={18} /></button>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
