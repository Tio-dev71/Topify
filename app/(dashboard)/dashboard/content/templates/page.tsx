'use client';

import { useState, useEffect } from 'react';
import { Plus, LayoutTemplate, Trash2, Edit, X } from 'lucide-react';

type Template = {
  id: string;
  name: string;
  description: string | null;
  postType: string;
  caption: string | null;
  hashtags: string | null;
  cta: string | null;
  platform: string | null;
  createdAt: string;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const defaultForm = {
    name: '',
    description: '',
    postType: 'FEED',
    caption: '',
    hashtags: '',
    cta: '',
    platform: 'FACEBOOK_POST',
  };
  const [formData, setFormData] = useState(defaultForm);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/content/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá template này?')) return;
    try {
      const res = await fetch(`/api/content/templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        alert('Lỗi khi xoá template');
      }
    } catch (err) {
      alert('Lỗi khi xoá');
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      postType: template.postType || 'FEED',
      caption: template.caption || '',
      hashtags: template.hashtags || '',
      cta: template.cta || '',
      platform: template.platform || 'FACEBOOK_POST',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const method = editingTemplate ? 'PUT' : 'POST';
      const bodyData = editingTemplate ? { id: editingTemplate.id, ...formData } : formData;

      const res = await fetch('/api/content/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        await fetchTemplates();
        closeModal();
      } else {
        const error = await res.json();
        alert(error.error || 'Đã xảy ra lỗi');
      }
    } catch (err) {
      alert('Lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Templates</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Quản lý mẫu nội dung tái sử dụng</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#5B3DF5] to-[#3B82F6] text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Tạo template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#5B3DF5]/30 border-t-[#5B3DF5] rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-card)]">
          <LayoutTemplate className="w-12 h-12 text-[var(--color-muted-foreground)] mx-auto mb-3" />
          <p className="text-[var(--color-foreground)] font-medium">Chưa có template nào</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Tạo template đầu tiên để tiết kiệm thời gian soạn bài</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 hover:border-[#5B3DF5]/50 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-[var(--color-foreground)] truncate pr-4">{template.name}</h3>
                <span className="px-2 py-1 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-lg text-xs font-medium uppercase">
                  {template.postType}
                </span>
              </div>
              {template.description && (
                <p className="text-sm text-[var(--color-muted-foreground)] mb-4 line-clamp-2">{template.description}</p>
              )}
              <div className="bg-[var(--color-background)] rounded-xl p-3 mb-4 flex-1">
                <p className="text-xs text-[var(--color-foreground)] whitespace-pre-wrap line-clamp-4">{template.caption || '(Không có caption)'}</p>
                {template.hashtags && <p className="text-xs text-blue-500 mt-2 line-clamp-1">{template.hashtags}</p>}
                {template.cta && <p className="text-xs text-green-500 mt-1 line-clamp-1">{template.cta}</p>}
              </div>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {new Date(template.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(template)} className="p-2 hover:bg-[var(--color-muted)] rounded-lg text-[var(--color-muted-foreground)] transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(template.id)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-[var(--color-muted-foreground)] transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-bold text-[var(--color-foreground)]">
                {editingTemplate ? 'Chỉnh sửa Template' : 'Tạo Template mới'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-[var(--color-muted)] rounded-xl text-[var(--color-muted-foreground)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Tên Template *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 text-sm"
                    placeholder="VD: Chào buổi sáng thứ 2"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Mô tả (Tuỳ chọn)</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 text-sm"
                    placeholder="Mô tả ngắn gọn về mục đích của template"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Loại bài đăng</label>
                  <select
                    value={formData.postType}
                    onChange={e => setFormData({...formData, postType: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 text-sm"
                  >
                    <option value="FEED">Feed</option>
                    <option value="CAROUSEL">Carousel</option>
                    <option value="REEL">Reel</option>
                    <option value="STORY">Story</option>
                    <option value="ARTICLE">Article</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Nền tảng mặc định</label>
                  <select
                    value={formData.platform}
                    onChange={e => setFormData({...formData, platform: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 text-sm"
                  >
                    <option value="FACEBOOK_POST">Facebook Post</option>
                    <option value="FACEBOOK_REELS">Facebook Reels</option>
                    <option value="INSTAGRAM_REELS">Instagram Reels</option>
                    <option value="INSTAGRAM_CAROUSEL">Instagram Carousel</option>
                    <option value="YOUTUBE_SHORTS">YouTube Shorts</option>
                    <option value="TIKTOK_VIDEO">TikTok Video</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Nội dung Caption</label>
                  <textarea
                    rows={4}
                    value={formData.caption}
                    onChange={e => setFormData({...formData, caption: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 text-sm"
                    placeholder="Nhập nội dung mẫu..."
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Hashtags</label>
                  <input
                    type="text"
                    value={formData.hashtags}
                    onChange={e => setFormData({...formData, hashtags: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 text-sm"
                    placeholder="#trend #viral"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Call to Action (CTA)</label>
                  <input
                    type="text"
                    value={formData.cta}
                    onChange={e => setFormData({...formData, cta: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/30 text-sm"
                    placeholder="Để lại bình luận bên dưới nhé!"
                  />
                </div>
              </div>
            </form>
            
            <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-3 bg-[var(--color-muted)]/30 rounded-b-2xl">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 rounded-xl text-sm font-semibold bg-[#5B3DF5] text-white hover:bg-[#5B3DF5]/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : 'Lưu Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
