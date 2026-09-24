"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, MessageSquareQuote, Check } from "lucide-react";
import { toast } from "sonner";

const MOCK_REPLIES = [
  { id: "1", shortcut: "gia", text: "Chào bạn, giá sản phẩm này là 599.000đ nhé ạ.", category: "Tư vấn" },
  { id: "2", shortcut: "ship", text: "Bên mình hỗ trợ ship COD toàn quốc, đồng giá 30k ạ. Bạn cho shop xin tên, số điện thoại và địa chỉ để lên đơn nhé.", category: "Vận chuyển" },
  { id: "3", shortcut: "baohanh", text: "Sản phẩm được bảo hành 1 đổi 1 trong 12 tháng nếu có lỗi từ nhà sản xuất nha bạn.", category: "Bảo hành" },
];

export default function QuickRepliesPage() {
  const [replies, setReplies] = useState(MOCK_REPLIES);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ shortcut: "", text: "", category: "Chung" });

  const filtered = replies.filter(r => 
    r.shortcut.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (reply?: typeof MOCK_REPLIES[0]) => {
    if (reply) {
      setEditingId(reply.id);
      setFormData({ shortcut: reply.shortcut, text: reply.text, category: reply.category });
    } else {
      setEditingId(null);
      setFormData({ shortcut: "", text: "", category: "Chung" });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.shortcut || !formData.text) {
      return toast.error("Vui lòng điền phím tắt và nội dung");
    }

    if (editingId) {
      setReplies(replies.map(r => r.id === editingId ? { ...r, ...formData } : r));
      toast.success("Đã cập nhật mẫu trả lời");
    } else {
      setReplies([...replies, { id: Date.now().toString(), ...formData }]);
      toast.success("Đã thêm mẫu trả lời mới");
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa mẫu trả lời này?")) {
      setReplies(replies.filter(r => r.id !== id));
      toast.success("Đã xóa");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 h-[calc(100vh-65px)] overflow-y-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)] mb-2">Trả lời nhanh</h1>
          <p className="text-[var(--color-muted-foreground)]">Quản lý các mẫu câu trả lời thường dùng (Sử dụng bằng phím '/' trong hộp thư)</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center font-medium shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm mẫu mới
        </button>
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
          {filtered.length === 0 ? (
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
                    <span className="font-mono text-sm font-semibold bg-[var(--color-muted)] text-[var(--color-foreground)] px-2 py-0.5 rounded border border-[var(--color-border)]">/{reply.shortcut}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)] bg-[var(--color-background)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">{reply.category}</span>
                  </div>
                  <p className="text-[var(--color-foreground)]/80 text-sm whitespace-pre-wrap">{reply.text}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(reply)} className="p-2 text-[var(--color-muted-foreground)] hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(reply.id)} className="p-2 text-[var(--color-muted-foreground)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-muted)]/30">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{editingId ? "Sửa mẫu trả lời" : "Thêm mẫu trả lời mới"}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Phím tắt <span className="text-[var(--color-muted-foreground)] font-normal">(Không dấu cách)</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] font-mono">/</span>
                    <input 
                      value={formData.shortcut}
                      onChange={(e) => setFormData({...formData, shortcut: e.target.value.replace(/\s/g, '')})}
                      className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-md pl-7 pr-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
                      placeholder="gia"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Danh mục</label>
                  <input 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-md px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                    placeholder="Tư vấn, Sales..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)] flex justify-between">
                  Nội dung trả lời
                  <span className="text-[var(--color-muted-foreground)] text-xs font-normal">Hỗ trợ biến: {"{{"}Tên Khách Hàng{"}}"}</span>
                </label>
                <textarea 
                  value={formData.text}
                  onChange={(e) => setFormData({...formData, text: e.target.value})}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-md px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[120px] resize-none text-sm"
                  placeholder="Nhập nội dung mẫu câu..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--color-border)] flex justify-end gap-2 bg-[var(--color-muted)]/30">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md hover:bg-[var(--color-muted)] text-[var(--color-foreground)] font-medium transition-colors border border-[var(--color-border)]"
              >
                Hủy
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center font-medium shadow-sm transition-colors"
              >
                <Check className="w-4 h-4 mr-2" />
                Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
