const ChatBubble = ({ message }) => {
  const isBot = message.from === "bot";
  const isAdmin = message.from === "admin";
  const isError = message.isError;
  const isFromAssistant = isBot || isAdmin;

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isFromAssistant ? "justify-start" : "justify-end"}`}>
      {isFromAssistant && (
        <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-blue-400 bg-blue-100">
          <span className="text-xs font-bold text-blue-500">
            {isAdmin ? "A" : "B"}
          </span>
        </div>
      )}
      <div className="max-w-[78%] space-y-1">
        <div
          className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
            isError
              ? "rounded-tl-none bg-amber-50 text-amber-900 ring-1 ring-amber-100"
              : isAdmin
                ? "rounded-tl-none bg-blue-50 text-blue-900"
                : isBot
                  ? "rounded-tl-none bg-red-50 text-red-900"
                  : "rounded-tr-none bg-red-500 text-white"
          }`}
        >
          {message.text}
        </div>
        {message.createdAt && (
          <div className={`text-[10px] text-gray-400 ${isFromAssistant ? "ml-1" : "mr-1 text-right"}`}>
            {formatTime(message.createdAt)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
