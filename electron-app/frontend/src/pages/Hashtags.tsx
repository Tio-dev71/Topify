import { useState, useEffect } from 'react';
import { Hash, MessageSquare, Plus, Trash2, Copy, Search, Eye, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

export type HashtagLibrary = {
  id: string;
  name: string;
  hashtags: string;
  category: 'HASHTAG' | 'CTA';
  createdAt: string;
};

export default function Hashtags() {
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
      const res = await api.get(`/content/hashtags${filter !== 'ALL' ? `?category=${filter}` : ''}`);
      if (res.data) {
        setItems(res.data.items || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách hashtags / mẫu CTA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xoá thư viện "${name}"?`)) return;
    try {
      await api.delete(`/content/hashtags?id=${id}`);
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Đã xoá thành công');
    } catch {
      toast.error('Lỗi khi xoá');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/content/hashtags', formData);
      if (res.data) {
        setItems([res.data, ...items]);
        setIsModalOpen(false);
        setFormData({ name: '', hashtags: '', category: 'HASHTAG' });
        toast.success('Đã tạo mới thành công');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsEditSubmitting(true);
    try {
      const res = await api.patch('/content/hashtags', {
        id: editingItem.id,
        ...editFormData,
      });
      if (res.data) {
        setItems(prev => prev.map(item => item.id === res.data.id ? { ...item, ...res.data } : item));
        if (viewingItem?.id === res.data.id) {
          setViewingItem(prev => prev ? { ...prev, ...res.data } : null);
        }
        setEditingItem(null);
        toast.success('Đã cập nhật thành công');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi cập nhật');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleCopy = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép "${title}" vào bộ nhớ tạm`);
  };

  const handleOpenEdit = (item: HashtagLibrary) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      hashtags: item.hashtags,
      category: item.category,
    });
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.hashtags.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Thư viện Hashtags & Mẫu CTA (F075)</h1>
          <p className="text-sm text-gray-500 mt-1">Lưu trữ các bộ hashtags theo ngành hàng và mẫu kêu gọi hành động (CTA) chuyển đổi cao</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Mới</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${filter === 'ALL' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('HASHTAG')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${filter === 'HASHTAG' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Bộ Hashtags
          </button>
          <button
            onClick={() => setFilter('CTA')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${filter === 'CTA' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Mẫu Kêu gọi (CTA)
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-indigo-500 text-xs"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Đang tải danh sách thư viện...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-3">
          <Hash className="w-10 h-10 text-gray-400 mx-auto" />
          <p className="text-gray-900 font-bold text-sm">Chưa có thư viện nào</p>
          <p className="text-xs text-gray-500">Tạo nhóm hashtags hoặc mẫu CTA đầu tiên để tối ưu bài đăng nhanh chóng.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Mới Ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-xs transition flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.category === 'HASHTAG' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {item.category === 'HASHTAG' ? <Hash className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 
                        onClick={() => setViewingItem(item)}
                        className="font-bold text-sm text-gray-900 cursor-pointer hover:text-indigo-600 transition"
                      >
                        {item.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        {item.category === 'HASHTAG' ? 'Hashtag' : 'Call to action'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Xoá"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div 
                  onClick={() => setViewingItem(item)}
                  className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-mono text-gray-700 whitespace-pre-wrap line-clamp-4 cursor-pointer hover:bg-gray-100/70 transition"
                >
                  {item.hashtags}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                <button
                  onClick={() => handleCopy(item.hashtags, item.name)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">Thêm mới Hashtag / CTA</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Loại thư viện</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'HASHTAG' })}
                    className={`flex-1 py-2 rounded-xl font-semibold border ${formData.category === 'HASHTAG' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-gray-200 text-gray-500'}`}
                  >
                    Bộ Hashtags
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'CTA' })}
                    className={`flex-1 py-2 rounded-xl font-semibold border ${formData.category === 'CTA' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'border-gray-200 text-gray-500'}`}
                  >
                    Mẫu CTA
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên nhóm / nhãn *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hashtag Bất động sản, CTA Nhắn tin..."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nội dung *</label>
                <textarea
                  required
                  rows={4}
                  placeholder={formData.category === 'HASHTAG' ? '#marketing #kinhdoanh #topify' : 'Để lại bình luận hoặc nhắn tin ngay để nhận tư vấn!'}
                  value={formData.hashtags}
                  onChange={e => setFormData({ ...formData, hashtags: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs font-mono resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary px-5 py-2 rounded-xl font-semibold text-xs"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">Chỉnh sửa</h3>
              <button onClick={() => setEditingItem(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên nhóm</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nội dung</label>
                <textarea
                  required
                  rows={4}
                  value={editFormData.hashtags}
                  onChange={e => setEditFormData({ ...editFormData, hashtags: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs font-mono resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="btn-primary px-5 py-2 rounded-xl font-semibold text-xs"
                >
                  {isEditSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
