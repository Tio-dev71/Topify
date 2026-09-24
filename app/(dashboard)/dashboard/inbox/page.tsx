"use client";

import { useState } from "react";
import { Search, Filter, MessageSquare, Facebook, Send, User, Clock, CheckCircle2, Star, MoreVertical, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

// Mock data for the inbox
const MOCK_MESSAGES = [
  {
    id: "1",
    platform: "facebook",
    type: "comment",
    sender: { name: "Nguyễn Văn A", avatar: "" },
    message: "Cho mình hỏi giá sản phẩm này ạ?",
    time: "10:32 AM",
    status: "unread",
    post: {
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      text: "Tai nghe Bluetooth chống ồn thế hệ mới - Sale 50% chỉ hôm nay!",
    }
  },
  {
    id: "2",
    platform: "tiktok",
    type: "comment",
    sender: { name: "user123_tiktok", avatar: "" },
    message: "Có ship COD không shop ơi?",
    time: "09:15 AM",
    status: "unread",
    post: {
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      text: "Unbox đồng hồ thông minh siêu xịn xò 😱",
    }
  },
  {
    id: "3",
    platform: "facebook",
    type: "dm",
    sender: { name: "Trần Thị B", avatar: "" },
    message: "Mình muốn đổi hàng thì làm sao ạ? Hôm qua nhận bị lỗi.",
    time: "Hôm qua",
    status: "read",
    post: null
  }
];

export default function InboxPage() {
  const [activeMessageId, setActiveMessageId] = useState(MOCK_MESSAGES[0].id);
  const [filter, setFilter] = useState("all"); // all, unread, facebook, tiktok
  const [replyText, setReplyText] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const activeMessage = MOCK_MESSAGES.find(m => m.id === activeMessageId) || MOCK_MESSAGES[0];

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReplyText(val);
    if (val.includes("/")) {
      setShowQuickReplies(true);
    } else {
      setShowQuickReplies(false);
    }
  };

  const insertQuickReply = (text: string) => {
    const textWithoutSlash = replyText.replace(/\/[a-zA-Z]*$/, "");
    setReplyText(textWithoutSlash + text);
    setShowQuickReplies(false);
  };

  const handleSend = () => {
    if (!replyText.trim()) return;
    toast.success("Đã gửi phản hồi");
    setReplyText("");
  };

  return (
    <div className="h-[calc(100vh-65px)] flex bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      
      {/* Left Column: Message List */}
      <div className="w-full md:w-80 border-r border-[var(--color-border)] flex flex-col bg-[var(--color-card)] z-10 md:z-auto absolute md:relative h-full transition-transform transform md:translate-x-0">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h1 className="text-xl font-bold mb-4">Hộp thư</h1>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <input 
                placeholder="Tìm kiếm..." 
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            <button className="p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-muted)] transition-colors">
              <Filter className="w-4 h-4 text-[var(--color-muted-foreground)]" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setFilter("all")} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${filter === "all" ? "bg-indigo-600 text-white" : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80"}`}>Tất cả</button>
            <button onClick={() => setFilter("unread")} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${filter === "unread" ? "bg-indigo-600 text-white" : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80"}`}>Chưa đọc</button>
            <button onClick={() => setFilter("facebook")} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${filter === "facebook" ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80"}`}>Facebook</button>
            <button onClick={() => setFilter("tiktok")} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${filter === "tiktok" ? "bg-black text-white border border-gray-800" : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80"}`}>TikTok</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {MOCK_MESSAGES.map(msg => (
            <div 
              key={msg.id} 
              onClick={() => setActiveMessageId(msg.id)}
              className={`p-4 border-b border-[var(--color-border)] cursor-pointer transition-colors ${activeMessageId === msg.id ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-l-2 border-l-indigo-500" : "hover:bg-[var(--color-muted)]/50 border-l-2 border-l-transparent"}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${msg.status === "unread" ? "bg-indigo-500" : "bg-transparent"}`}></div>
                  <span className="font-semibold text-sm truncate text-[var(--color-foreground)]">{msg.sender.name}</span>
                </div>
                <span className="text-xs text-[var(--color-muted-foreground)]">{msg.time}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--color-muted)] text-[var(--color-muted-foreground)] uppercase tracking-wider font-medium">{msg.platform} {msg.type}</span>
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-2">{msg.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Column: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-background)] relative">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-background)]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--color-muted-foreground)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--color-foreground)]">{activeMessage.sender.name}</h2>
              <p className="text-xs text-[var(--color-muted-foreground)] capitalize">{activeMessage.platform} {activeMessage.type}</p>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <button className="p-2 text-[var(--color-muted-foreground)] hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Đánh dấu đã xử lý"><CheckCircle2 className="w-5 h-5" /></button>
            <button className="p-2 text-[var(--color-muted-foreground)] hover:text-yellow-500 hover:bg-yellow-50 rounded-md transition-colors" title="Đánh dấu sao"><Star className="w-5 h-5" /></button>
            <button className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-md transition-colors"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[var(--color-muted)]/10">
          {/* Mock Thread */}
          <div className="flex gap-3 max-w-3xl">
            <div className="w-8 h-8 rounded-full bg-[var(--color-muted)] flex-shrink-0 flex items-center justify-center">
              <User className="w-4 h-4 text-[var(--color-muted-foreground)]" />
            </div>
            <div className="flex flex-col gap-1 w-full sm:w-auto sm:max-w-[80%]">
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm p-3 sm:p-4 rounded-2xl rounded-tl-none">
                <p className="text-sm text-[var(--color-foreground)] leading-relaxed">{activeMessage.message}</p>
              </div>
              <span className="text-xs text-[var(--color-muted-foreground)] ml-1">{activeMessage.time}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-background)]">
          <div className="relative max-w-4xl mx-auto">
            {showQuickReplies && (
              <div className="absolute bottom-full mb-3 w-72 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-2.5 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider bg-[var(--color-muted)]/50 border-b border-[var(--color-border)]">Mẫu trả lời nhanh</div>
                <div className="max-h-60 overflow-y-auto">
                  <button onClick={() => insertQuickReply("Chào bạn, giá sản phẩm này là 599.000đ nhé ạ.")} className="w-full text-left p-3 hover:bg-[var(--color-muted)] border-b border-[var(--color-border)]/50 text-sm transition-colors">
                    <span className="font-semibold block mb-1 text-indigo-600 dark:text-indigo-400">/gia</span>
                    <span className="text-[var(--color-muted-foreground)] line-clamp-2">Chào bạn, giá sản phẩm này là 599.000đ nhé ạ.</span>
                  </button>
                  <button onClick={() => insertQuickReply("Bên mình hỗ trợ ship COD toàn quốc, đồng giá 30k ạ.")} className="w-full text-left p-3 hover:bg-[var(--color-muted)] text-sm transition-colors">
                    <span className="font-semibold block mb-1 text-indigo-600 dark:text-indigo-400">/ship</span>
                    <span className="text-[var(--color-muted-foreground)] line-clamp-2">Bên mình hỗ trợ ship COD toàn quốc...</span>
                  </button>
                </div>
              </div>
            )}
            
            <div className="relative shadow-sm rounded-xl">
              <textarea
                value={replyText}
                onChange={handleReplyChange}
                placeholder="Nhập câu trả lời... Gõ '/' để chọn mẫu nhanh."
                className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-3 pr-14 resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button 
                onClick={handleSend}
                disabled={!replyText.trim()}
                className="absolute right-3 bottom-3 p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed rounded-lg text-white transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center text-xs text-[var(--color-muted-foreground)] max-w-4xl mx-auto px-1">
            <span>Mẹo: Gõ <kbd className="px-1.5 py-0.5 bg-[var(--color-muted)] rounded border border-[var(--color-border)] font-mono text-[10px]">/</kbd> để dùng câu trả lời nhanh</span>
            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="font-medium">AI Auto-Suggest đang hoạt động</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Context Area */}
      <div className="w-80 border-l border-[var(--color-border)] bg-[var(--color-card)] p-5 overflow-y-auto hidden xl:block z-0">
        <h3 className="font-bold mb-4 text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">Ngữ cảnh</h3>
        
        {activeMessage.post ? (
          <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-video relative bg-[var(--color-muted)] flex items-center justify-center overflow-hidden">
              {activeMessage.post.image ? (
                <img src={activeMessage.post.image} alt="Post" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              ) : (
                <ImageIcon className="w-8 h-8 text-[var(--color-muted-foreground)]" />
              )}
            </div>
            <div className="p-4">
              <p className="text-sm line-clamp-3 mb-3 text-[var(--color-foreground)] leading-relaxed">{activeMessage.post.text}</p>
              <a href="#" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline inline-flex items-center gap-1">
                Xem bài viết gốc ↗
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-muted-foreground)] text-sm bg-[var(--color-muted)]/30">
            Không có ngữ cảnh bài viết <br/>(Tin nhắn trực tiếp)
          </div>
        )}

        <div className="mt-8">
          <h3 className="font-bold mb-4 text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">AI Đề Xuất Trả Lời</h3>
          <div className="space-y-3">
            <button onClick={() => setReplyText("Dạ, sản phẩm này bên em đang có giá ưu đãi là 599.000đ ạ. Chị có muốn đặt hàng luôn không?")} className="w-full text-left p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-sm transition-colors text-indigo-900 dark:text-indigo-100 shadow-sm">
              Dạ, sản phẩm này bên em đang có giá ưu đãi là 599.000đ ạ. Chị có muốn đặt hàng luôn không?
            </button>
            <button onClick={() => setReplyText("Chào bạn, mẫu này giá 599k nha. Mình xin thông tin để ship hàng nhé.")} className="w-full text-left p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-muted)]/50 text-sm transition-colors text-[var(--color-foreground)] shadow-sm">
              Chào bạn, mẫu này giá 599k nha. Mình xin thông tin để ship hàng nhé.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
