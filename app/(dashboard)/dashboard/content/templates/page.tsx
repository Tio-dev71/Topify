'use client';

import { useState, useEffect } from 'react';
import { Plus, LayoutTemplate, Trash2, Edit, X, Eye, Copy, Check } from 'lucide-react';

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

  // View & Edit Modal State
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
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
                <h3 
                  onClick={() => setViewingTemplate(template)}
                  className="font-bold text-[var(--color-foreground)] truncate pr-4 cursor-pointer hover:text-[#5B3DF5] transition-colors"
                  title="Bấm để xem chi tiết template"
                >
                  {template.name}
                </h3>
                <span className="px-2 py-1 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-lg text-xs font-medium uppercase">
                  {template.postType}
                </span>
              </div>
              {template.description && (
                <p className="text-sm text-[var(--color-muted-foreground)] mb-4 line-clamp-2">{template.description}</p>
              )}
              <div 
                onClick={() => setViewingTemplate(template)}
                className="bg-[var(--color-background)] rounded-xl p-3 mb-4 flex-1 cursor-pointer hover:ring-1 hover:ring-[#5B3DF5]/30 transition-all"
              >
                <p className="text-xs text-[var(--color-foreground)] whitespace-pre-wrap line-clamp-4">{template.caption || '(Không có caption)'}</p>
                {template.hashtags && <p className="text-xs text-blue-500 mt-2 line-clamp-1">{template.hashtags}</p>}
                {template.cta && <p className="text-xs text-green-500 mt-1 line-clamp-1">{template.cta}</p>}
              </div>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {new Date(template.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => setViewingTemplate(template)} 
                    className="p-2 hover:bg-[var(--color-muted)] rounded-lg text-[var(--color-muted-foreground)] hover:text-[#5B3DF5] transition-colors"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openEditModal(template)} 
                    className="p-2 hover:bg-[var(--color-muted)] rounded-lg text-[var(--color-muted-foreground)] hover:text-amber-500 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(template.id)} 
                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-[var(--color-muted-foreground)] transition-colors"
                    title="Xóa"
                  >
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

      {/* View Template Modal */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#5B3DF5]/10 text-[#5B3DF5] rounded-2xl">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-foreground)]">Chi tiết Mẫu nội dung (Template)</h2>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Định dạng sẵn sàng để sao chép hoặc tái sử dụng</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingTemplate(null)} 
                className="p-2 hover:bg-[var(--color-muted)] rounded-xl text-[var(--color-muted-foreground)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    Tên template
                  </span>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-0.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-lg text-xs font-semibold uppercase">
                      {viewingTemplate.postType}
                    </span>
                    {viewingTemplate.platform && (
                      <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-semibold">
                        {viewingTemplate.platform}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-foreground)]">{viewingTemplate.name}</h3>
                {viewingTemplate.description && (
                  <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{viewingTemplate.description}</p>
                )}
              </div>

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-[var(--color-foreground)]">Nội dung Caption mẫu</label>
                  {viewingTemplate.caption && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(viewingTemplate.caption || '');
                        setCopiedField('caption');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="flex items-center gap-1 text-xs text-[#5B3DF5] hover:underline font-medium"
                    >
                      {copiedField === 'caption' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedField === 'caption' ? 'Đã chép' : 'Sao chép'}
                    </button>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                  <p className="text-sm text-[var(--color-foreground)] whitespace-pre-wrap leading-relaxed">
                    {viewingTemplate.caption || '(Chưa có nội dung caption)'}
                  </p>
                </div>
              </div>

              {/* Hashtags */}
              {viewingTemplate.hashtags && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-[var(--color-foreground)]">Hashtags</label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(viewingTemplate.hashtags || '');
                        setCopiedField('hashtags');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="flex items-center gap-1 text-xs text-blue-500 hover:underline font-medium"
                    >
                      {copiedField === 'hashtags' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedField === 'hashtags' ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                  <p className="text-sm text-blue-500 font-mono bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/40">
                    {viewingTemplate.hashtags}
                  </p>
                </div>
              )}

              {/* CTA */}
              {viewingTemplate.cta && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-[var(--color-foreground)]">Lời kêu gọi hành động (CTA)</label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(viewingTemplate.cta || '');
                        setCopiedField('cta');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="flex items-center gap-1 text-xs text-emerald-500 hover:underline font-medium"
                    >
                      {copiedField === 'cta' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedField === 'cta' ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                    {viewingTemplate.cta}
                  </p>
                </div>
              )}

              <div className="pt-2 text-xs text-[var(--color-muted-foreground)]">
                Ngày tạo: {new Date(viewingTemplate.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-muted)]/20 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const id = viewingTemplate.id;
                  setViewingTemplate(null);
                  handleDelete(id);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Xóa template
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewingTemplate(null)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingTemplate;
                    setViewingTemplate(null);
                    openEditModal(target);
                  }}
                  className="flex items-center gap-2 px-5 py-2 bg-[#5B3DF5] text-white rounded-xl text-sm font-semibold shadow-md hover:bg-[#5B3DF5]/90 transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
