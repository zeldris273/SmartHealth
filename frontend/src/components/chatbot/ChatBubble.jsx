import { Bot, FileText, Paperclip, User, Download } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import BaymaxLogo from '../BaymaxLogo';

const ChatBubble = ({ message }) => {
  const { user } = useAuth();
  const isBot = message.from === 'bot';
  const isError = message.isError;
  const attachments = message.attachments || [];
  const sources = message.sources || [];

  return (
    <div className={`chat-bubble-row ${isBot ? 'bot' : 'user'}`}>
      {isBot && (
        <div className="chat-bubble-avatar bot-avatar">
          <BaymaxLogo size={24} />
        </div>
      )}

      <div className={`chat-bubble-content ${isBot ? 'bot' : 'user'}`}>
        {isBot && (
          <div className="chat-bubble-sender">
            <span className="chat-bubble-sender-name">Baymax AI</span>
            <span className="chat-bubble-time">
              {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        {!isBot && (
          <div className="chat-bubble-sender user-sender">
            <span className="chat-bubble-sender-name">Bạn</span>
            <span className="chat-bubble-time">
              {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        <div className={`chat-bubble ${isError ? 'error' : isBot ? 'bot' : 'user'}`}>
          {message.text}
        </div>

        {attachments.length > 0 && (
          <div className="chat-bubble-attachments">
            {attachments.map((file) => (
              <div key={`${file.name}-${file.size}`} className="chat-attachment-card">
                <div className="chat-attachment-icon">
                  <FileText size={20} />
                </div>
                <div className="chat-attachment-info">
                  <span className="chat-attachment-name">{file.name}</span>
                  <span className="chat-attachment-size">{file.sizeLabel}</span>
                </div>
                {file.status === 'uploading' && <span className="chat-attachment-status uploading">đang xử lý</span>}
                {file.status === 'processed' && <Download size={16} className="chat-attachment-download" />}
              </div>
            ))}
          </div>
        )}

        {sources.length > 0 && (
          <div className="chat-bubble-sources">
            {sources.slice(0, 4).map((source) => (
              <div key={source} className="chat-source-tag">
                <FileText size={12} />
                <span>{source}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isBot && (
        <div className="chat-bubble-avatar user-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt="User" />
          ) : (
            <User size={16} />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
