'use client';

import { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Search, Loader2, Eye, Edit2, X } from 'lucide-react';

type ContentPillar = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  _count?: {
    plans: number;
  };
};

export default function ContentPillarsPage() {
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#5B3DF5' });

  // View & Edit state
  const [viewingPillar, setViewingPillar] = useState<ContentPillar | null>(null);
  const [editingPillar, setEditingPillar] = useState<ContentPillar | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', color: '#5B3DF5' });
  const [isUpdating, setIsUpdating] = useState(false);

  const predefinedColors = [
    '#5B3DF5', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#F97316'
  ];

  const fetchPillars = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/content/pillars');
      if (res.ok) {
        const data = await res.json();
        setPillars(data.pillars || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPillars();
  }, []);

  const handleOpenEdit = (pillar: ContentPillar) => {
    setEditingPillar(pillar);
    setEditFormData({
      name: pillar.name,
      description: pillar.description || '',
      color: pillar.color || '#5B3DF5'
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPillar) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/content/pillars', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPillar.id,
          ...editFormData
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPillars(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
        if (viewingPillar?.id === updated.id) {
          setViewingPillar(prev => prev ? { ...prev, ...updated } : null);
        }
        setEditingPillar(null);
      } else {
        const error = await res.json();
        alert(error.error || 'Lỗi khi cập nhật');
      }
    } catch (err) {
      alert('Lỗi kết nối khi cập nhật');
    } finally {
      setIsUpdating(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá chủ đề này? Tất cả các bài viết liên quan sẽ không còn được gắn với chủ đề này.')) return;
    try {
      const res = await fetch(`/api/content/pillars?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPillars(prev => prev.filter(p => p.id !== id));
      } else {
        const error = await res.json();
        alert(error.error || 'Lỗi khi xoá');
      }
    } catch (err) {
      alert('Lỗi khi xoá');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/content/pillars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const newPillar = await res.json();
        setPillars([newPillar, ...pillars]);
        setIsModalOpen(false);
        setFormData({ name: '', description: '', color: '#5B3DF5' });
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

  const filteredPillars = pillars.filter(pillar => 
    pillar.name.toLowerCase().includes(search.toLowerCase()) || 
    (pillar.description && pillar.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Content Pillars</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Quản lý các nhóm chủ đề nội dung chiến lược</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#5B3DF5] to-[#3B82F6] text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Thêm chủ đề
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <input
          type="text"
          placeholder="Tìm kiếm chủ đề..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-md pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#5B3DF5] animate-spin" />
        </div>
      ) : filteredPillars.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-card)]">
          <Layers className="w-12 h-12 text-[var(--color-muted-foreground)] mx-auto mb-3" />
          <p className="text-[var(--color-foreground)] font-medium">Chưa có dữ liệu</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Hãy thêm nhóm chủ đề (Content Pillar) đầu tiên của bạn</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPillars.map(pillar => (
            <div key={pillar.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 hover:border-[#5B3DF5]/50 hover:shadow-lg transition-all flex flex-col relative overflow-hidden group">
              <div 
                className="absolute top-0 left-0 w-full h-1" 
                style={{ backgroundColor: pillar.color }}
              />
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${pillar.color}20`, color: pillar.color }}
                  >
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 
                      onClick={() => setViewingPillar(pillar)}
                      className="font-bold text-[var(--color-foreground)] line-clamp-1 cursor-pointer hover:text-[#5B3DF5] transition-colors" 
                      title="Bấm để xem chi tiết"
                    >
                      {pillar.name}
                    </h3>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {pillar._count?.plans || 0} bài viết
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setViewingPillar(pillar)} 
                    className="p-1.5 text-[var(--color-muted-foreground)] hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(pillar)} 
                    className="p-1.5 text-[var(--color-muted-foreground)] hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                    title="Chỉnh sửa chủ đề"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(pillar.id)} 
                    className="p-1.5 text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Xoá chủ đề"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-3 flex-1 mt-2">
                {pillar.description || 'Không có mô tả.'}
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
                <span>Tạo ngày: {new Date(pillar.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  Màu sắc: 
                  <span className="w-3 h-3 rounded-full inline-block ml-1" style={{ backgroundColor: pillar.color }}></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-background)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[var(--color-border)]">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-4">Thêm Content Pillar</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Tên chủ đề</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Giáo dục, Giải trí, Khuyến mãi..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Mô tả chi tiết</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Định hướng nội dung cho chủ đề này..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">Màu sắc nhận diện</label>
                  <div className="flex flex-wrap gap-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'scale-125 ring-2 ring-offset-2 ring-[var(--color-background)]' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color, boxShadow: formData.color === color ? `0 0 0 2px ${color}` : 'none' }}
                      />
                    ))}
                  </div>
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

      {/* View Pillar Modal */}
      {viewingPillar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-card)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[var(--color-border)]">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${viewingPillar.color}20`, color: viewingPillar.color }}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-foreground)]">{viewingPillar.name}</h3>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {viewingPillar._count?.plans || 0} bài viết liên quan
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingPillar(null)} 
                className="p-1.5 hover:bg-[var(--color-muted)] rounded-xl text-[var(--color-muted-foreground)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <p className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-1">Màu nhận diện</p>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: viewingPillar.color }} />
                  <span className="text-xs font-mono text-[var(--color-foreground)]">{viewingPillar.color}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-1">Mô tả định hướng</p>
                <div className="p-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-foreground)] whitespace-pre-wrap">
                  {viewingPillar.description || 'Chưa có mô tả định hướng nội dung.'}
                </div>
              </div>

              <div className="text-xs text-[var(--color-muted-foreground)]">
                Ngày tạo: {new Date(viewingPillar.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>

            <div className="p-6 border-t border-[var(--color-border)] flex justify-between items-center bg-[var(--color-muted)]/10">
              <button
                type="button"
                onClick={() => {
                  const p = viewingPillar;
                  setViewingPillar(null);
                  handleOpenEdit(p);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa
              </button>
              <button 
                type="button"
                onClick={() => setViewingPillar(null)}
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 transition-opacity"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pillar Modal */}
      {editingPillar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-card)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[var(--color-border)]">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--color-foreground)]">Chỉnh sửa Content Pillar</h2>
              <button 
                onClick={() => setEditingPillar(null)}
                className="p-1.5 hover:bg-[var(--color-muted)] rounded-xl text-[var(--color-muted-foreground)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Tên chủ đề *</label>
                <input 
                  required
                  type="text" 
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="VD: Giáo dục, Giải trí, Khuyến mãi..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Mô tả chi tiết</label>
                <textarea 
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  placeholder="Định hướng nội dung cho chủ đề này..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">Màu sắc nhận diện</label>
                <div className="flex flex-wrap gap-2">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${editFormData.color === color ? 'scale-125 ring-2 ring-offset-2 ring-[var(--color-background)]' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color, boxShadow: editFormData.color === color ? `0 0 0 2px ${color}` : 'none' }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingPillar(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-[var(--color-foreground)]"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#5B3DF5] to-[#3B82F6] text-white hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

