const ChatBubble = ({ message }) => {
  const isBot = message.from === 'bot';
  const isError = message.isError;

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-red-400 bg-red-100">
          <span className="text-xs font-bold text-red-500">B</span>
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
          isError
            ? 'rounded-tl-none bg-amber-50 text-amber-900 ring-1 ring-amber-100'
            : isBot
              ? 'rounded-tl-none bg-red-50 text-red-900'
              : 'rounded-tr-none bg-red-500 text-white'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};

export default ChatBubble;
