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
    <div className="h-[calc(100vh-65px)] flex bg-zinc-950 text-zinc-100 overflow-hidden">
      
      {/* Left Column: Message List */}
      <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold mb-4">Hộp thư</h1>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                placeholder="Tìm kiếm..." 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800">
              <Filter className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setFilter("all")} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filter === "all" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>Tất cả</button>
            <button onClick={() => setFilter("unread")} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filter === "unread" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>Chưa đọc</button>
            <button onClick={() => setFilter("facebook")} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filter === "facebook" ? "bg-blue-600/20 text-blue-400" : "bg-zinc-800 text-zinc-400"}`}>Facebook</button>
            <button onClick={() => setFilter("tiktok")} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filter === "tiktok" ? "bg-black text-white border border-zinc-700" : "bg-zinc-800 text-zinc-400"}`}>TikTok</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {MOCK_MESSAGES.map(msg => (
            <div 
              key={msg.id} 
              onClick={() => setActiveMessageId(msg.id)}
              className={`p-4 border-b border-zinc-800/50 cursor-pointer transition-colors ${activeMessageId === msg.id ? "bg-zinc-900 border-l-2 border-l-indigo-500" : "hover:bg-zinc-900/50 border-l-2 border-l-transparent"}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${msg.status === "unread" ? "bg-indigo-500" : "bg-transparent"}`}></div>
                  <span className="font-semibold text-sm truncate">{msg.sender.name}</span>
                </div>
                <span className="text-xs text-zinc-500">{msg.time}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-sm bg-zinc-800 text-zinc-400 uppercase tracking-wider">{msg.platform} {msg.type}</span>
              </div>
              <p className="text-sm text-zinc-400 line-clamp-2">{msg.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Column: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h2 className="font-semibold">{activeMessage.sender.name}</h2>
              <p className="text-xs text-zinc-400 capitalize">{activeMessage.platform} {activeMessage.type}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md" title="Đánh dấu đã xử lý"><CheckCircle2 className="w-5 h-5" /></button>
            <button className="p-2 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800 rounded-md" title="Đánh dấu sao"><Star className="w-5 h-5" /></button>
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900/20">
          {/* Mock Thread */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center">
              <User className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex flex-col gap-1 max-w-[70%]">
              <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none">
                <p className="text-sm">{activeMessage.message}</p>
              </div>
              <span className="text-xs text-zinc-500">{activeMessage.time}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="relative">
            {showQuickReplies && (
              <div className="absolute bottom-full mb-2 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-10">
                <div className="p-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-950/50">Mẫu trả lời nhanh</div>
                <div className="max-h-48 overflow-y-auto">
                  <button onClick={() => insertQuickReply("Chào bạn, giá sản phẩm này là 599.000đ nhé ạ.")} className="w-full text-left p-3 hover:bg-zinc-800 border-b border-zinc-800/50 text-sm">
                    <span className="font-semibold block mb-1">/gia</span>
                    <span className="text-zinc-400 line-clamp-1">Chào bạn, giá sản phẩm này là 599.000đ nhé ạ.</span>
                  </button>
                  <button onClick={() => insertQuickReply("Bên mình hỗ trợ ship COD toàn quốc, đồng giá 30k ạ.")} className="w-full text-left p-3 hover:bg-zinc-800 text-sm">
                    <span className="font-semibold block mb-1">/ship</span>
                    <span className="text-zinc-400 line-clamp-1">Bên mình hỗ trợ ship COD toàn quốc...</span>
                  </button>
                </div>
              </div>
            )}
            
            <textarea
              value={replyText}
              onChange={handleReplyChange}
              placeholder="Nhập câu trả lời... Gõ '/' để chọn mẫu nhanh."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 pr-12 resize-none focus:outline-none focus:border-indigo-500 min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button 
              onClick={handleSend}
              className="absolute right-3 bottom-3 p-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 flex justify-between items-center text-xs text-zinc-500">
            <span>Mẹo: Gõ '/' để dùng câu trả lời nhanh</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>AI Auto-Suggest đang hoạt động</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Context Area */}
      <div className="w-72 border-l border-zinc-800 bg-zinc-950 p-4 overflow-y-auto hidden lg:block">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-zinc-400">Ngữ cảnh</h3>
        
        {activeMessage.post ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="aspect-video relative bg-zinc-800 flex items-center justify-center">
              {activeMessage.post.image ? (
                <img src={activeMessage.post.image} alt="Post" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-zinc-600" />
              )}
            </div>
            <div className="p-3">
              <p className="text-sm line-clamp-3 mb-2">{activeMessage.post.text}</p>
              <a href="#" className="text-xs text-indigo-400 hover:underline">Xem bài viết gốc ↗</a>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-sm">
            Không có ngữ cảnh bài viết (Tin nhắn trực tiếp)
          </div>
        )}

        <div className="mt-8">
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-zinc-400">AI Đề Xuất Trả Lời</h3>
          <div className="space-y-2">
            <button onClick={() => setReplyText("Dạ, sản phẩm này bên em đang có giá ưu đãi là 599.000đ ạ. Chị có muốn đặt hàng luôn không?")} className="w-full text-left p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-sm transition-colors text-indigo-100">
              Dạ, sản phẩm này bên em đang có giá ưu đãi là 599.000đ ạ. Chị có muốn đặt hàng luôn không?
            </button>
            <button onClick={() => setReplyText("Chào bạn, mẫu này giá 599k nha. Mình xin thông tin để ship hàng nhé.")} className="w-full text-left p-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-sm transition-colors text-zinc-300">
              Chào bạn, mẫu này giá 599k nha. Mình xin thông tin để ship hàng nhé.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
