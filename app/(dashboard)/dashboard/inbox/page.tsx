"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  CheckCircle2, 
  Star, 
  MoreVertical, 
  ImageIcon,
  RefreshCw,
  Sparkles,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Message = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  content?: string | null;
  senderName?: string | null;
  createdAt: string;
};

type Conversation = {
  id: string;
  contactName?: string | null;
  contactAvatar?: string | null;
  platform: string;
  status: string;
  lastMessageAt?: string | null;
  messages?: Message[];
};

type QuickReply = {
  id: string;
  title?: string;
  shortcut: string;
  content: string;
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [seeding, setSeeding] = useState(false);
  
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  
  // Quick replies
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchQuickReplies();
  }, []);

  useEffect(() => {
    if (activeId) {
      fetchConversationDetails(activeId);
    } else {
      setActiveConversation(null);
    }
  }, [activeId]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inbox");
      if (res.ok) {
        const data = await res.json();
        const list: Conversation[] = data.conversations || [];
        setConversations(list);
        if (list.length > 0 && !activeId) {
          setActiveId(list[0].id);
        }
      }
    } catch (err) {
      toast.error("Lỗi khi tải danh sách hội thoại");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationDetails = async (id: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/inbox/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data.conversation);
      }
    } catch (err) {
      toast.error("Lỗi khi tải chi tiết tin nhắn");
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchQuickReplies = async () => {
    try {
      const res = await fetch("/api/inbox/quick-replies");
      if (res.ok) {
        const data = await res.json();
        setQuickReplies(data.quickReplies || []);
      }
    } catch {
      // Ignore
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: true }),
      });
      if (res.ok) {
        toast.success("Đã nạp 3 tin nhắn mẫu thành công");
        fetchConversations();
      } else {
        toast.error("Không thể nạp tin nhắn mẫu");
      }
    } catch {
      toast.error("Lỗi máy chủ khi nạp tin nhắn mẫu");
    } finally {
      setSeeding(false);
    }
  };

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
    const textWithoutSlash = replyText.replace(/\/[a-zA-Z0-9_]*$/, "");
    setReplyText(textWithoutSlash + text);
    setShowQuickReplies(false);
  };

  const handleSend = async () => {
    if (!replyText.trim() || !activeId) return;

    setSending(true);
    try {
      const res = await fetch(`/api/inbox/${activeId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      });

      if (res.ok) {
        toast.success("Đã gửi phản hồi");
        setReplyText("");
        // Reload conversation messages
        fetchConversationDetails(activeId);
      } else {
        toast.error("Gửi phản hồi thất bại");
      }
    } catch {
      toast.error("Lỗi máy chủ");
    } finally {
      setSending(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!activeId || !activeConversation) return;
    const newStatus = activeConversation.status === "RESOLVED" ? "OPEN" : "RESOLVED";

    try {
      const res = await fetch(`/api/inbox/${activeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Đã đánh dấu ${newStatus === "RESOLVED" ? "đã xử lý" : "đang mở"}`);
        setActiveConversation({ ...activeConversation, status: newStatus });
        fetchConversations();
      }
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa hội thoại này?")) return;

    try {
      const res = await fetch(`/api/inbox?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Đã xóa hội thoại");
        if (activeId === id) {
          setActiveId(null);
        }
        fetchConversations();
      }
    } catch {
      toast.error("Lỗi khi xóa hội thoại");
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const nameMatch = (conv.contactName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const lastMsg = conv.messages?.[0]?.content || "";
    const msgMatch = lastMsg.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || msgMatch;

    if (filter === "unread") return matchesSearch && conv.status === "NEW";
    if (filter === "facebook") return matchesSearch && conv.platform.includes("FACEBOOK");
    if (filter === "tiktok") return matchesSearch && conv.platform.includes("TIKTOK");
    if (filter === "zalo") return matchesSearch && conv.platform.includes("ZALO");
    return matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-65px)] flex bg-background text-foreground overflow-hidden">
      
      {/* Left Column: Message List */}
      <div className="w-full md:w-80 border-r border-border flex flex-col bg-card z-10 md:z-auto absolute md:relative h-full transition-transform transform md:translate-x-0">
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Hộp thư
            </h1>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={fetchConversations} 
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                title="Làm mới"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={handleSeedDemo} 
                disabled={seeding}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                title="Tạo tin nhắn mẫu để kiểm thử"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {seeding ? "Đang tạo..." : "Mẫu test"}
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                placeholder="Tìm kiếm..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
            <button onClick={() => setFilter("all")} className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${filter === "all" ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Tất cả</button>
            <button onClick={() => setFilter("unread")} className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${filter === "unread" ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Chưa đọc</button>
            <button onClick={() => setFilter("facebook")} className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${filter === "facebook" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Facebook</button>
            <button onClick={() => setFilter("tiktok")} className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${filter === "tiktok" ? "bg-black text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>TikTok</button>
            <button onClick={() => setFilter("zalo")} className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${filter === "zalo" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Zalo</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Đang tải hộp thư...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-3">
              <p>Chưa có tin nhắn nào trong hộp thư.</p>
              <button
                onClick={handleSeedDemo}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Tạo 3 tin nhắn mẫu ngay
              </button>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const lastMsg = conv.messages?.[0]?.content || "Chưa có nội dung";
              const isSelected = activeId === conv.id;

              return (
                <div 
                  key={conv.id} 
                  onClick={() => setActiveId(conv.id)}
                  className={`p-3.5 border-b border-border cursor-pointer transition-colors group relative ${
                    isSelected ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-l-2 border-l-indigo-500" : "hover:bg-muted/50 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${conv.status === "NEW" ? "bg-indigo-500" : "bg-transparent"}`} />
                      <span className="font-semibold text-sm truncate text-foreground">{conv.contactName || "Khách hàng"}</span>
                    </div>
                    {conv.lastMessageAt && (
                      <span className="text-[11px] text-muted-foreground flex-shrink-0">
                        {format(new Date(conv.lastMessageAt), "HH:mm")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider font-semibold">
                      {conv.platform}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      title="Xóa hội thoại"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{lastMsg}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Middle Column: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        {activeConversation ? (
          <>
            <div className="p-4 border-b border-border flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  {activeConversation.contactName ? activeConversation.contactName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-sm">{activeConversation.contactName || "Khách hàng"}</h2>
                  <p className="text-xs text-muted-foreground">{activeConversation.platform} • Trạng thái: {activeConversation.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleToggleStatus}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeConversation.status === "RESOLVED"
                      ? "bg-green-500/10 text-green-600 border border-green-500/20"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                  title="Đổi trạng thái xử lý"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {activeConversation.status === "RESOLVED" ? "Đã xử lý" : "Đánh dấu đã xử lý"}
                </button>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-muted/10">
              {loadingMessages ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Đang tải tin nhắn...</div>
              ) : activeConversation.messages?.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Chưa có tin nhắn trong hội thoại này.</div>
              ) : (
                activeConversation.messages?.map(msg => {
                  const isOutbound = msg.direction === "OUTBOUND";
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 max-w-2xl ${isOutbound ? "ml-auto justify-end" : ""}`}
                    >
                      {!isOutbound && (
                        <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-xs font-medium">
                          {activeConversation.contactName?.charAt(0) || "K"}
                        </div>
                      )}
                      <div className={`flex flex-col gap-1 max-w-[80%] ${isOutbound ? "items-end" : ""}`}>
                        <div 
                          className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isOutbound 
                              ? "bg-indigo-600 text-white rounded-tr-none" 
                              : "bg-card border border-border text-foreground rounded-tl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground px-1">
                          {format(new Date(msg.createdAt), "HH:mm, dd/MM")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Composer */}
            <div className="p-4 border-t border-border bg-background">
              <div className="relative max-w-4xl mx-auto">
                {showQuickReplies && (
                  <div className="absolute bottom-full mb-3 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border">
                      Mẫu trả lời nhanh
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-border/50">
                      {quickReplies.map(qr => (
                        <button 
                          key={qr.id}
                          onClick={() => insertQuickReply(qr.content)} 
                          className="w-full text-left p-3 hover:bg-muted text-sm transition-colors"
                        >
                          <span className="font-semibold block mb-0.5 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                            /{qr.shortcut}
                          </span>
                          <span className="text-muted-foreground text-xs line-clamp-2">{qr.content}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="relative shadow-sm rounded-xl">
                  <textarea
                    value={replyText}
                    onChange={handleReplyChange}
                    placeholder="Nhập câu trả lời... Gõ '/' để chọn mẫu nhanh."
                    className="w-full bg-card border border-border rounded-xl p-3 pr-14 resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[80px] text-sm text-foreground transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!replyText.trim() || sending}
                    className="absolute right-3 bottom-3 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground max-w-4xl mx-auto px-1">
                <span>Mẹo: Gõ <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono text-[10px]">/</kbd> để dùng câu trả lời nhanh</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">Hỗ trợ đa kênh Facebook, TikTok, Zalo</span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-foreground">Chọn một cuộc trò chuyện từ danh sách bên trái</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Bạn có thể nhấn vào nút &quot;Mẫu test&quot; ở góc trên để tạo các hội thoại mô phỏng gửi từ mạng xã hội.
            </p>
          </div>
        )}
      </div>

      {/* Right Column: Context Area */}
      <div className="w-72 border-l border-border bg-card p-5 overflow-y-auto hidden xl:block z-0">
        <h3 className="font-bold mb-3 text-xs uppercase tracking-wider text-muted-foreground">Thông tin liên hệ</h3>
        
        {activeConversation ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/20 border border-border rounded-xl">
              <p className="text-xs text-muted-foreground">Họ và tên</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{activeConversation.contactName || "Khách vãng lai"}</p>
              
              <p className="text-xs text-muted-foreground mt-3">Nền tảng</p>
              <p className="text-xs font-medium text-indigo-600 mt-0.5">{activeConversation.platform}</p>

              <p className="text-xs text-muted-foreground mt-3">Trạng thái</p>
              <p className="text-xs font-medium text-foreground mt-0.5">{activeConversation.status}</p>
            </div>

            <div>
              <h4 className="font-bold mb-2 text-xs uppercase tracking-wider text-muted-foreground">Gợi ý phản hồi nhanh</h4>
              <div className="space-y-2">
                {quickReplies.slice(0, 3).map(qr => (
                  <button
                    key={qr.id}
                    onClick={() => setReplyText(qr.content)}
                    className="w-full text-left p-2.5 rounded-lg border border-border hover:bg-muted text-xs text-foreground transition-colors"
                  >
                    <span className="font-medium text-indigo-600 block mb-0.5">{qr.title || `/${qr.shortcut}`}</span>
                    <span className="text-muted-foreground line-clamp-2">{qr.content}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Chưa chọn hội thoại</div>
        )}
      </div>
    </div>
  );
}
