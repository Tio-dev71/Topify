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
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Trả lời nhanh</h1>
          <p className="text-muted-foreground">Quản lý các mẫu câu trả lời thường dùng (Sử dụng bằng phím '/' trong hộp thư)</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm mẫu mới
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              placeholder="Tìm kiếm phím tắt, nội dung..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
            />
          </div>
        </div>
        
        <div className="divide-y divide-zinc-800">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              Không tìm thấy mẫu trả lời nào.
            </div>
          ) : (
            filtered.map(reply => (
              <div key={reply.id} className="p-4 flex items-start gap-4 hover:bg-zinc-800/30 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageSquareQuote className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">/{reply.shortcut}</span>
                    <span className="text-xs text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">{reply.category}</span>
                  </div>
                  <p className="text-zinc-300 text-sm whitespace-pre-wrap">{reply.text}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(reply)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(reply.id)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md">
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold">{editingId ? "Sửa mẫu trả lời" : "Thêm mẫu trả lời mới"}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Phím tắt (Không dấu cách)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">/</span>
                    <input 
                      value={formData.shortcut}
                      onChange={(e) => setFormData({...formData, shortcut: e.target.value.replace(/\s/g, '')})}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-md pl-7 pr-3 py-2 outline-none focus:border-indigo-500 font-mono"
                      placeholder="gia"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Danh mục</label>
                  <input 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-md px-3 py-2 outline-none focus:border-indigo-500"
                    placeholder="Tư vấn, Sales..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 flex justify-between">
                  Nội dung trả lời
                  <span className="text-xs">Hỗ trợ biến: {"{{"}Tên Khách Hàng{"}}"}</span>
                </label>
                <textarea 
                  value={formData.text}
                  onChange={(e) => setFormData({...formData, text: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-md px-3 py-2 outline-none focus:border-indigo-500 min-h-[120px] resize-none"
                  placeholder="Nhập nội dung mẫu câu..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-zinc-950/50">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md hover:bg-zinc-800 text-zinc-300"
              >
                Hủy
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center font-medium"
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
