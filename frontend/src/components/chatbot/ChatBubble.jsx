const ChatBubble = ({ message }) => {
  const isBot = message.from === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center mr-2 shrink-0">
          <span className="text-xs text-red-500 font-bold">B</span>
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
          isBot
            ? 'bg-red-50 text-red-900 rounded-tl-none'
            : 'bg-red-500 text-white rounded-tr-none'
        }`}
      >
        {message.text}
        {isBot && message.textVi && (
          <p className="text-xs text-red-400 italic mt-1 border-t border-red-100 pt-1">
            {message.textVi}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;