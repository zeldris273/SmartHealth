import { Headphones } from "lucide-react";
import BaymaxLogo from "../BaymaxLogo";

const ChatBubble = ({ message, isAdminView = false }) => {
  const isBot = message.from === "bot";
  const isAdmin = message.from === "admin";
  const isError = message.isError;

  const uniqueSources = message.sources?.length
    ? [...new Set(message.sources.map((src) => src.split("#")[0]))]
    : [];

  // In user view: bot/admin are "others" (left), user is "me" (right)
  // In admin view: admin is "me" (right), user/bot are "others" (left)
  const isFromAssistant = isBot || isAdmin;
  const onRight = isAdminView ? isAdmin : !isFromAssistant;

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex ${onRight ? "justify-end" : "justify-start"}`}>
      {/* Show avatar for "others" */}
      {!onRight && (
        <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
          {isBot ? (
            <BaymaxLogo size={20} />
          ) : isAdmin ? (
            <Headphones size={18} className="text-red-600" />
          ) : (
            <span className="text-xs font-bold text-blue-500">U</span>
          )}
        </div>
      )}
      <div className="max-w-[78%] space-y-1">
        <div
          className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
            isError
              ? "rounded-tl-none bg-amber-50 text-amber-900 ring-1 ring-amber-100"
              : isAdmin
                ? `${onRight ? "rounded-tr-none" : "rounded-tl-none"} bg-blue-50 text-blue-900`
                : isBot
                  ? "rounded-tl-none bg-red-50 text-red-900"
                  : onRight
                    ? "rounded-tr-none bg-red-500 text-white"
                    : "rounded-tl-none bg-gray-200 text-gray-800"
          }`}
        >
          {message.text}
          {isBot && uniqueSources.length > 0 && (
            <div className="mt-1 text-[9px] text-red-600 italic">
              Nguồn: {uniqueSources.join(", ")}
            </div>
          )}
        </div>
        {message.createdAt && (
          <div
            className={`text-[10px] text-gray-400 ${onRight ? "mr-1 text-right" : "ml-1"}`}
          >
            {formatTime(message.createdAt)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
