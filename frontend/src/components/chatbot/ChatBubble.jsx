import { Headphones, Paperclip } from "lucide-react";
import BaymaxLogo from "../BaymaxLogo";

const formatFileSize = (size) => {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const ChatBubble = ({ message, isAdminView = false }) => {
  const isBot = message.from === "bot";
  const isAdmin = message.from === "admin";
  const isError = message.isError;

  const formatSource = (src) => {
    const [file, chunk] = String(src).split("#");
    return chunk ? `${file} (đoạn ${chunk})` : file;
  };

  const uniqueSources = message.sources?.length
    ? [...new Set(message.sources.map(formatSource))]
    : [];


  const avatarUrl = message.avatarUrl;
  const senderName = message.senderName || "U";

  const getInitials = (name) => {
    if (!name) return "U";
    const trimmed = name.trim();
    if (!trimmed) return "U";
    const parts = trimmed.split(/\s+/);
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

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
        <div className={`mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          (!isBot && !isAdmin && avatarUrl) ? "bg-transparent" : "bg-red-100"
        }`}>
          {isBot ? (
            <BaymaxLogo size={20} />
          ) : isAdmin ? (
            <Headphones size={18} className="text-red-600" />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt="User Avatar" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-blue-500">{getInitials(senderName)}</span>
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
          {message.isStreaming && !message.text ? (
            <div className="flex gap-1 py-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-red-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          ) : (
            <>
              {message.text}
              {message.isStreaming && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-red-400 align-middle" />
              )}
            </>
          )}

          {message.attachments && message.attachments.length > 0 && (
            <div className={`mt-2 space-y-1.5 border-t pt-2 ${
              onRight ? "border-white/20" : "border-gray-300"
            }`}>
              {message.attachments.map((file, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col gap-1 rounded-lg p-2 text-xs ${
                    onRight
                      ? "bg-white/10 text-white"
                      : "bg-white text-gray-700 border border-gray-100 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <Paperclip size={12} className="flex-shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                    </div>
                    <span className="text-[10px] opacity-75 flex-shrink-0">
                      {file.sizeLabel || formatFileSize(file.size)}
                    </span>
                  </div>

                  {file.status === "uploading" && (
                    <div className="w-full mt-1">
                      <div className="flex justify-between text-[9px] mb-0.5 opacity-80">
                        <span>Đang tải lên...</span>
                        <span>{file.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-black/10 dark:bg-white/20 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${onRight ? 'bg-white' : 'bg-red-500'}`}
                          style={{ width: `${file.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {file.status === "processed" && (
                    <span className={`text-[9px] font-semibold flex items-center gap-1 ${
                      onRight ? "text-emerald-200" : "text-emerald-600"
                    }`}>
                      ✓ Đã nhận {file.chunkCount ? `(${file.chunkCount} đoạn)` : ""}
                    </span>
                  )}

                  {file.status === "failed" && (
                    <span className={`text-[9px] font-semibold flex items-center gap-1 ${
                      onRight ? "text-red-200" : "text-red-600"
                    }`}>
                      ✕ Thất bại: File không hợp lệ hoặc không liên quan
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {isBot && uniqueSources.length > 0 && !message.isStreaming && (
          <div className="mt-1 rounded-lg border border-red-100 bg-red-50/80 px-2.5 py-1.5 text-[11px] text-red-700">
            <span className="font-medium">Nguồn tham khảo:</span>{" "}
            {uniqueSources.join(" · ")}
          </div>
        )}
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
