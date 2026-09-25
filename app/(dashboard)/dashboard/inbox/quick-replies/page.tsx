"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, MessageSquareQuote, Check, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

type QuickReply = {
  id: string;
  title?: string;
  content: string;
  shortcut: string;
  category?: string | null;
  createdAt: string;
};

export default function QuickRepliesPage() {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ 
    title: "", 
    shortcut: "", 
    content: "", 
    category: "Chung" 
  });

  useEffect(() => {
    fetchQuickReplies();
  }, []);

  const fetchQuickReplies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inbox/quick-replies");
      if (res.ok) {
        const data = await res.json();
        let list: QuickReply[] = data.quickReplies || [];

        // If completely empty, auto-seed 3 helpful starter templates
        if (list.length === 0) {
          const defaults = [
            { title: "Báo giá sản phẩm", shortcut: "gia", content: "Chào bạn, giá sản phẩm này là 599.000đ nhé ạ.", category: "Tư vấn" },
            { title: "Hỗ trợ ship COD", shortcut: "ship", content: "Bên mình hỗ trợ ship COD toàn quốc, đồng giá 30k ạ. Bạn cho shop xin tên, số điện thoại và địa chỉ để lên đơn nhé.", category: "Vận chuyển" },
            { title: "Chính sách bảo hành", shortcut: "baohanh", content: "Sản phẩm được bảo hành 1 đổi 1 trong 12 tháng nếu có lỗi từ nhà sản xuất nha bạn.", category: "Bảo hành" },
          ];

          for (const item of defaults) {
            await fetch("/api/inbox/quick-replies", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item),
            });
          }
          const retryRes = await fetch("/api/inbox/quick-replies");
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            list = retryData.quickReplies || [];
          }
        }

        setReplies(list);
      } else {
        toast.error("Không thể tải danh sách câu trả lời nhanh");
      }
    } catch (err) {
      toast.error("Lỗi khi tải câu trả lời nhanh");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (reply?: QuickReply) => {
    if (reply) {
      setEditingId(reply.id);
      setFormData({ 
        title: reply.title || "", 
        shortcut: reply.shortcut, 
        content: reply.content, 
        category: reply.category || "Chung" 
      });
    } else {
      setEditingId(null);
      setFormData({ title: "", shortcut: "", content: "", category: "Chung" });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shortcut.trim() || !formData.content.trim()) {
      return toast.error("Vui lòng điền phím tắt và nội dung");
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await fetch("/api/inbox/quick-replies", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            title: formData.title.trim() || formData.shortcut.trim(),
            shortcut: formData.shortcut.trim().replace(/^\//, ""),
            content: formData.content.trim(),
            category: formData.category.trim(),
          }),
        });

        if (res.ok) {
          toast.success("Đã cập nhật mẫu trả lời");
          setShowModal(false);
          fetchQuickReplies();
        } else {
          toast.error("Cập nhật thất bại");
        }
      } else {
        const res = await fetch("/api/inbox/quick-replies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title.trim() || formData.shortcut.trim(),
            shortcut: formData.shortcut.trim().replace(/^\//, ""),
            content: formData.content.trim(),
            category: formData.category.trim(),
          }),
        });

        if (res.ok) {
          toast.success("Đã thêm mẫu trả lời mới");
          setShowModal(false);
          fetchQuickReplies();
        } else {
          toast.error("Thêm thất bại");
        }
      }
    } catch (err) {
      toast.error("Lỗi máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa mẫu trả lời này?")) return;

    try {
      const res = await fetch(`/api/inbox/quick-replies?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Đã xóa");
        setReplies(replies.filter(r => r.id !== id));
      } else {
        toast.error("Xóa thất bại");
      }
    } catch (err) {
      toast.error("Lỗi máy chủ");
    }
  };

  const filtered = replies.filter(r => 
    r.shortcut.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.category && r.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 h-[calc(100vh-65px)] overflow-y-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)] mb-2">Trả lời nhanh</h1>
          <p className="text-[var(--color-muted-foreground)]">Quản lý các mẫu câu trả lời thường dùng (Sử dụng bằng phím &apos;/&apos; trong hộp thư)</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchQuickReplies}
            className="p-2 border border-[var(--color-border)] rounded-md hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm mẫu mới
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input 
              placeholder="Tìm kiếm phím tắt, nội dung..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[var(--color-foreground)] transition-all"
            />
          </div>
        </div>
        
        <div className="divide-y divide-[var(--color-border)]">
          {loading && replies.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-muted-foreground)]">
              Không tìm thấy mẫu trả lời nào.
            </div>
          ) : (
            filtered.map(reply => (
              <div key={reply.id} className="p-4 flex items-start gap-4 hover:bg-[var(--color-muted)]/50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-muted)] flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageSquareQuote className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs bg-indigo-500/10 text-indigo-500 font-semibold px-2 py-0.5 rounded border border-indigo-500/20">
                      /{reply.shortcut}
                    </span>
                    {reply.title && (
                      <span className="font-semibold text-sm text-[var(--color-foreground)]">
                        {reply.title}
                      </span>
                    )}
                    {reply.category && (
                      <span className="text-xs bg-[var(--color-muted)] text-[var(--color-muted-foreground)] px-2 py-0.5 rounded-full">
                        {reply.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-foreground)]/90 whitespace-pre-wrap">{reply.content}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(reply)}
                    className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(reply.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
                {editingId ? "Chỉnh sửa mẫu trả lời" : "Thêm mẫu trả lời mới"}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Tiêu đề (Gợi nhớ)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Báo giá sản phẩm"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Phím tắt (Gõ sau dấu &apos;/&apos;) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[var(--color-muted-foreground)]">/</span>
                    <input
                      type="text"
                      required
                      placeholder="gia"
                      value={formData.shortcut}
                      onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Danh mục
                  </label>
                  <input
                    type="text"
                    placeholder="Tư vấn, Báo giá..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Nội dung câu trả lời *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập nội dung mẫu tin nhắn..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "Lưu mẫu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
