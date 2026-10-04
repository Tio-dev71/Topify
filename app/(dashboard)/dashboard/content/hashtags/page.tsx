'use client';

import { useState, useEffect } from 'react';
import { Hash, MessageSquare, Plus, Trash2, Copy, Search, Loader2, Eye, Edit2, X, Check } from 'lucide-react';

type HashtagLibrary = {
  id: string;
  name: string;
  hashtags: string;
  category: 'HASHTAG' | 'CTA';
  createdAt: string;
};

export default function HashtagsPage() {
  const [items, setItems] = useState<HashtagLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'HASHTAG' | 'CTA'>('ALL');
  const [search, setSearch] = useState('');
  
  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', hashtags: '', category: 'HASHTAG' });

  // View Modal state
  const [viewingItem, setViewingItem] = useState<HashtagLibrary | null>(null);

  // Edit Modal state
  const [editingItem, setEditingItem] = useState<HashtagLibrary | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', hashtags: '', category: 'HASHTAG' as 'HASHTAG' | 'CTA' });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/hashtags${filter !== 'ALL' ? `?category=${filter}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá thư viện này?')) return;
    try {
      const res = await fetch(`/api/content/hashtags?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      alert('Lỗi khi xoá');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép vào bộ nhớ tạm!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/content/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems([newItem, ...items]);
        setIsModalOpen(false);
        setFormData({ name: '', hashtags: '', category: 'HASHTAG' });
      } else {
        const error = await res.json();
        alert(error.error || 'Lỗi khi tạo');
      }
    } catch (err) {
      alert('Lỗi khi tạo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: HashtagLibrary) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      hashtags: item.hashtags,
      category: item.category,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsEditSubmitting(true);
    try {
      const res = await fetch('/api/content/hashtags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          name: editFormData.name,
          hashtags: editFormData.hashtags,
          category: editFormData.category,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems(prev => prev.map(item => item.id === updated.id ? updated : item));
        setEditingItem(null);
        if (viewingItem?.id === updated.id) {
          setViewingItem(updated);
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Lỗi khi cập nhật');
      }
    } catch (err) {
      alert('Lỗi khi cập nhật');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.hashtags.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Hashtags & CTA</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Quản lý thư viện hashtags và câu kêu gọi hành động</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#5B3DF5] to-[#3B82F6] text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Thêm mới
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'HASHTAG', 'CTA'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === type
                  ? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
                  : 'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              {type === 'ALL' ? 'Tất cả' : type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#5B3DF5] animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-card)]">
          <Hash className="w-12 h-12 text-[var(--color-muted-foreground)] mx-auto mb-3" />
          <p className="text-[var(--color-foreground)] font-medium">Chưa có dữ liệu</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Hãy thêm hashtag hoặc CTA đầu tiên của bạn</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 hover:border-[#5B3DF5]/50 hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${item.category === 'HASHTAG' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                      {item.category === 'HASHTAG' ? <Hash className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    </div>
                    <h3 
                      onClick={() => setViewingItem(item)}
                      className="font-semibold text-[var(--color-foreground)] line-clamp-1 hover:text-[#5B3DF5] cursor-pointer transition-colors"
                      title="Xem chi tiết"
                    >
                      {item.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setViewingItem(item)} 
                      title="Xem chi tiết"
                      className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[#5B3DF5] hover:bg-[#5B3DF5]/10 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openEditModal(item)} 
                      title="Chỉnh sửa"
                      className="p-1.5 text-[var(--color-muted-foreground)] hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleCopy(item.hashtags)} 
                      title="Sao chép nội dung"
                      className="p-1.5 text-[var(--color-muted-foreground)] hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      title="Xóa"
                      className="p-1.5 text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p 
                  onClick={() => setViewingItem(item)}
                  className="text-sm text-[var(--color-muted-foreground)] whitespace-pre-wrap flex-1 line-clamp-4 cursor-pointer hover:text-[var(--color-foreground)] transition-colors"
                >
                  {item.hashtags}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--color-border)]">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.category === 'HASHTAG' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                  {item.category === 'HASHTAG' ? 'Hashtag' : 'Kêu gọi CTA'}
                </span>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Detail Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-background)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-[var(--color-border)] animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${viewingItem.category === 'HASHTAG' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                  {viewingItem.category === 'HASHTAG' ? <Hash className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-foreground)]">Chi tiết {viewingItem.category === 'HASHTAG' ? 'Hashtag' : 'CTA'}</h2>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Xem thông tin và nội dung mẫu</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingItem(null)}
                className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Tên mẫu / Nhóm</span>
                <p className="text-base font-semibold text-[var(--color-foreground)] mt-1">{viewingItem.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-muted-foreground)]">Phân loại</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${viewingItem.category === 'HASHTAG' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                      {viewingItem.category === 'HASHTAG' ? 'Hashtags' : 'Call to Action (CTA)'}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-muted-foreground)]">Ngày tạo</span>
                  <p className="text-xs font-semibold text-[var(--color-foreground)] mt-1">
                    {new Date(viewingItem.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Nội dung</span>
                  <button 
                    onClick={() => handleCopy(viewingItem.hashtags)}
                    className="flex items-center gap-1 text-xs text-[#5B3DF5] hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] max-h-56 overflow-y-auto">
                  <p className="text-sm text-[var(--color-foreground)] whitespace-pre-wrap leading-relaxed font-mono">
                    {viewingItem.hashtags}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)] pt-2">
                <span>Số ký tự: <strong>{viewingItem.hashtags.length}</strong></span>
                <span>Số từ: <strong>{viewingItem.hashtags.split(/\s+/).filter(Boolean).length}</strong></span>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button 
                type="button" 
                onClick={() => setViewingItem(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-[var(--color-foreground)]"
              >
                Đóng
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const target = viewingItem;
                  setViewingItem(null);
                  openEditModal(target);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#5B3DF5] hover:bg-[#492de0] text-white transition-all shadow-md"
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-background)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[var(--color-border)] animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-foreground)]">Chỉnh sửa {editFormData.category === 'HASHTAG' ? 'Hashtag' : 'CTA'}</h2>
                <p className="text-xs text-[var(--color-muted-foreground)]">Cập nhật thông tin và nội dung</p>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Loại</label>
                <select 
                  value={editFormData.category}
                  onChange={e => setEditFormData({ ...editFormData, category: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 text-sm"
                >
                  <option value="HASHTAG">Hashtags</option>
                  <option value="CTA">Call to Action (CTA)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Tên nhóm</label>
                <input 
                  required
                  type="text" 
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="VD: Hashtag BĐS cao cấp"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Nội dung</label>
                <textarea 
                  required
                  value={editFormData.hashtags}
                  onChange={e => setEditFormData({ ...editFormData, hashtags: e.target.value })}
                  rows={4}
                  placeholder={editFormData.category === 'HASHTAG' ? "#bds #batdongsan..." : "Liên hệ ngay để nhận ưu đãi..."}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 resize-none text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-[var(--color-foreground)]"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isEditSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#5B3DF5] to-[#3B82F6] text-white hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isEditSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isEditSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-background)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[var(--color-border)]">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-4">Thêm mới {formData.category === 'HASHTAG' ? 'Hashtag' : 'CTA'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Loại</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  >
                    <option value="HASHTAG">Hashtags</option>
                    <option value="CTA">Call to Action (CTA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Tên nhóm</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Hashtag BĐS cao cấp"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Nội dung</label>
                  <textarea 
                    required
                    value={formData.hashtags}
                    onChange={e => setFormData({ ...formData, hashtags: e.target.value })}
                    rows={4}
                    placeholder={formData.category === 'HASHTAG' ? "#bds #batdongsan..." : "Liên hệ ngay để nhận ưu đãi..."}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-[var(--color-foreground)]"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#5B3DF5] to-[#3B82F6] text-white hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
