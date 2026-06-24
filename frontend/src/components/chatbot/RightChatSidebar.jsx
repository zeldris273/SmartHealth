import React from "react";
import { FileText, HelpCircle } from "lucide-react";

const RightChatSidebar = ({ documents = [], onSuggestClick }) => {
  const suggestedQuestions = [
    "BMI của tôi có ổn không?",
    "Tôi nên ăn bao nhiêu calo mỗi ngày?",
    "Gợi ý bài tập cho người thừa cân?",
    "Tôi cần lưu ý gì về chế độ dinh dưỡng?",
  ];

  return (
    <aside className="flex flex-col w-60 flex-shrink-0 h-full bg-gray-50 border-l border-gray-200">
      {/* Uploaded Files Section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2 text-gray-800 font-semibold text-sm">
          <FileText size={16} className="text-red-500" />
          <span>Tài liệu đã tải lên</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          {documents.length === 0 ? (
            <div className="text-xs text-gray-400 italic text-center py-4">
              Chưa có tài liệu nào được tải lên
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200 hover:border-red-200 transition-colors group"
                >
                  <FileText size={14} className="text-gray-400 group-hover:text-red-400" />
                  <span className="text-xs text-gray-700 truncate flex-1" title={doc.filename}>
                    {doc.filename}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suggested Questions Section */}
      <div className="flex flex-col border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm mb-3">
          <HelpCircle size={16} className="text-red-500" />
          <span>Gợi ý cho bạn</span>
        </div>
        
        <div className="flex flex-col gap-2">
          {suggestedQuestions.map((q, index) => (
            <button
              key={index}
              onClick={() => onSuggestClick(q)}
              className="text-left text-xs p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RightChatSidebar;