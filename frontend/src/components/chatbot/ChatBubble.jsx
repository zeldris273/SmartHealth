import { Bot, FileText, Paperclip, User } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';

const ChatBubble = ({ message }) => {
  const { user } = useAuth();
  const isBot = message.from === 'bot';
  const isError = message.isError;
  const attachments = message.attachments || [];
  const sources = message.sources || [];

  return (
    <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
          <Bot size={17} />
        </div>
      )}

      <div className={`flex max-w-[78%] flex-col gap-2 ${isBot ? 'items-start' : 'items-end'}`}>
        <div
          className={`whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isError
              ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
              : isBot
                ? 'rounded-tl-md bg-white text-slate-800 ring-1 ring-slate-200'
                : 'rounded-tr-md bg-red-500 text-white shadow-red-200'
          }`}
        >
          {message.text}
        </div>

        {attachments.length > 0 && (
          <div className="flex max-w-full flex-col gap-1">
            {attachments.map((file) => (
              <div
                key={`${file.name}-${file.size}`}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs ${
                  isBot ? 'border-slate-200 bg-white text-slate-600' : 'border-red-100 bg-red-50 text-red-700'
                }`}
              >
                <Paperclip size={13} />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 opacity-70">{file.sizeLabel}</span>
                {file.status === 'uploading' && <span className="shrink-0 text-amber-500 font-medium">đang xử lý</span>}
                {file.status === 'processed' && (
                  <span className="shrink-0 text-red-500 font-medium">{file.chunkCount || 0} chunks</span>
                )}
              </div>
            ))}
          </div>
        )}

        {sources.length > 0 && (
          <div className="flex max-w-full flex-wrap gap-1.5">
            {sources.slice(0, 4).map((source) => (
              <div key={source} className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-800">
                <FileText size={12} />
                <span className="max-w-[180px] truncate">{source}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isBot && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-sm border border-red-200 bg-red-50">
          {user?.avatar ? (
            <img src={user.avatar} alt="User" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-red-500">
              <User size={16} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
