import { Bot, User, Paperclip } from 'lucide-react';

const ChatBubble = ({ message }) => {
  const isBot = message.from === 'bot';
  const isError = message.isError;
  const attachments = message.attachments || [];

  return (
    <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
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
                : 'rounded-tr-md bg-slate-900 text-white'
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
                  isBot ? 'border-slate-200 bg-white text-slate-600' : 'border-slate-700 bg-slate-800 text-slate-100'
                }`}
              >
                <Paperclip size={13} />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 opacity-70">{file.sizeLabel}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isBot && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
          <User size={16} />
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
