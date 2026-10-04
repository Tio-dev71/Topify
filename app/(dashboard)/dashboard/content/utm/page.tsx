'use client';

import { useState, useEffect, useMemo } from 'react';
import { Link2, Copy, Plus, Trash2, History, ExternalLink, Zap, Eye, Edit2, X, Check } from 'lucide-react';

type UTMHistory = {
  id: string;
  url: string;
  campaign: string;
  source: string;
  medium: string;
  term?: string;
  content?: string;
  fullUrl: string;
  createdAt: string;
};

export default function UTMBuilderPage() {
  const [formData, setFormData] = useState({
    url: '',
    campaign: '',
    source: '',
    medium: '',
    term: '',
    content: ''
  });

  const [history, setHistory] = useState<UTMHistory[]>([]);
  const [viewingItem, setViewingItem] = useState<UTMHistory | null>(null);
  const [editingItem, setEditingItem] = useState<UTMHistory | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('utm_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveHistory = (items: UTMHistory[]) => {
    setHistory(items);
    localStorage.setItem('utm_history', JSON.stringify(items));
  };

  const generateUTM = () => {
    if (!formData.url) return '';
    try {
      const urlObj = new URL(formData.url.startsWith('http') ? formData.url : `https://${formData.url}`);
      
      if (formData.source) urlObj.searchParams.set('utm_source', formData.source);
      if (formData.medium) urlObj.searchParams.set('utm_medium', formData.medium);
      if (formData.campaign) urlObj.searchParams.set('utm_campaign', formData.campaign);
      if (formData.term) urlObj.searchParams.set('utm_term', formData.term);
      if (formData.content) urlObj.searchParams.set('utm_content', formData.content);

      return urlObj.toString();
    } catch (e) {
      // If URL is completely invalid without http and cannot be parsed
      return '';
    }
  };

  const generatedUrl = generateUTM();

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    alert('Đã sao chép link UTM!');
  };

  const handleSave = () => {
    if (!generatedUrl || !formData.url || !formData.campaign) {
      alert('Vui lòng nhập ít nhất URL gốc và Tên chiến dịch');
      return;
    }
    const newItem: UTMHistory = {
      id: Math.random().toString(36).substr(2, 9),
      url: formData.url,
      campaign: formData.campaign,
      source: formData.source,
      medium: formData.medium,
      term: formData.term,
      content: formData.content,
      fullUrl: generatedUrl,
      createdAt: new Date().toISOString()
    };
    saveHistory([newItem, ...history]);
    setFormData({
      url: '',
      campaign: '',
      source: '',
      medium: '',
      term: '',
      content: ''
    });
    alert('Đã lưu link vào lịch sử!');
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const urlObj = new URL(editingItem.url.startsWith('http') ? editingItem.url : `https://${editingItem.url}`);
      if (editingItem.source) urlObj.searchParams.set('utm_source', editingItem.source);
      if (editingItem.medium) urlObj.searchParams.set('utm_medium', editingItem.medium);
      if (editingItem.campaign) urlObj.searchParams.set('utm_campaign', editingItem.campaign);
      if (editingItem.term) urlObj.searchParams.set('utm_term', editingItem.term);
      if (editingItem.content) urlObj.searchParams.set('utm_content', editingItem.content);

      const updatedFullUrl = urlObj.toString();
      const updatedHistory = history.map(item => 
        item.id === editingItem.id ? { ...editingItem, fullUrl: updatedFullUrl } : item
      );
      saveHistory(updatedHistory);
      setEditingItem(null);
      alert('Đã cập nhật link UTM thành công!');
    } catch (e) {
      alert('URL không hợp lệ, vui lòng kiểm tra lại');
    }
  };

  const handleLoadToBuilder = (item: UTMHistory) => {
    setFormData({
      url: item.url,
      campaign: item.campaign,
      source: item.source || '',
      medium: item.medium || '',
      term: item.term || '',
      content: item.content || ''
    });
    if (viewingItem) setViewingItem(null);
    if (editingItem) setEditingItem(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xoá link này khỏi lịch sử?')) {
      saveHistory(history.filter(item => item.id !== id));
      if (viewingItem?.id === id) setViewingItem(null);
      if (editingItem?.id === id) setEditingItem(null);
    }
  };

  const applyPreset = (source: string, medium: string) => {
    setFormData(prev => ({ ...prev, source, medium }));
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Tạo liên kết theo dõi (UTM Builder)</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Tạo và quản lý các liên kết UTM để đo lường hiệu quả chiến dịch Marketing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Build UTM */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#5B3DF5]" />
              Tạo liên kết UTM
            </h2>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button 
              onClick={() => applyPreset('facebook', 'social')}
              className="px-3 py-1.5 bg-[#1877F2]/10 text-[#1877F2] rounded-lg text-xs font-medium hover:bg-[#1877F2]/20 transition"
            >
              Facebook Ads
            </button>
            <button 
              onClick={() => applyPreset('google', 'cpc')}
              className="px-3 py-1.5 bg-[#EA4335]/10 text-[#EA4335] rounded-lg text-xs font-medium hover:bg-[#EA4335]/20 transition"
            >
              Google Ads
            </button>
            <button 
              onClick={() => applyPreset('tiktok', 'social')}
              className="px-3 py-1.5 bg-black/10 dark:bg-white/10 text-[var(--color-foreground)] rounded-lg text-xs font-medium hover:bg-black/20 dark:hover:bg-white/20 transition"
            >
              TikTok Ads
            </button>
            <button 
              onClick={() => applyPreset('email', 'newsletter')}
              className="px-3 py-1.5 bg-orange-500/10 text-orange-500 rounded-lg text-xs font-medium hover:bg-orange-500/20 transition"
            >
              Email Marketing
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">URL Đích *</label>
              <input 
                type="text" 
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/khuyen-mai"
                className="w-full px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Tên Chiến Dịch (utm_campaign) *</label>
              <input 
                type="text" 
                value={formData.campaign}
                onChange={e => setFormData({ ...formData, campaign: e.target.value })}
                placeholder="VD: summer_sale_2026"
                className="w-full px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Nguồn (utm_source)</label>
                <input 
                  type="text" 
                  value={formData.source}
                  onChange={e => setFormData({ ...formData, source: e.target.value })}
                  placeholder="VD: facebook"
                  className="w-full px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Phương tiện (utm_medium)</label>
                <input 
                  type="text" 
                  value={formData.medium}
                  onChange={e => setFormData({ ...formData, medium: e.target.value })}
                  placeholder="VD: cpc"
                  className="w-full px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Từ khoá (utm_term)</label>
                <input 
                  type="text" 
                  value={formData.term}
                  onChange={e => setFormData({ ...formData, term: e.target.value })}
                  placeholder="Tuỳ chọn"
                  className="w-full px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Nội dung (utm_content)</label>
                <input 
                  type="text" 
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Tuỳ chọn"
                  className="w-full px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Result & History */}
        <div className="space-y-6">
          {/* Result Box */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              Kết quả UTM
            </h2>
            <div className="relative">
              <textarea 
                readOnly
                value={generatedUrl}
                placeholder="Link UTM sẽ xuất hiện ở đây..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm break-all resize-none focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
              />
              {generatedUrl && (
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleSave}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm"
                    title="Lưu vào lịch sử"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex-1">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-[#5B3DF5]" />
              Lịch sử tạo link
            </h2>
            
            {history.length === 0 ? (
              <div className="text-center py-10">
                <Link2 className="w-10 h-10 text-[var(--color-muted-foreground)] mx-auto mb-2 opacity-50" />
                <p className="text-sm text-[var(--color-muted-foreground)]">Chưa có link nào được lưu</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {history.map(item => (
                  <div key={item.id} className="p-3.5 border border-[var(--color-border)] rounded-xl hover:border-[#5B3DF5]/40 transition-colors group bg-[var(--color-background)]">
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 
                        onClick={() => setViewingItem(item)}
                        className="font-semibold text-sm text-[var(--color-foreground)] hover:text-[#5B3DF5] cursor-pointer transition-colors"
                      >
                        {item.campaign}
                      </h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setViewingItem(item)}
                          className="p-1 text-[var(--color-muted-foreground)] hover:text-[#5B3DF5] rounded hover:bg-[var(--color-muted)] transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setEditingItem({ ...item })}
                          className="p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] rounded hover:bg-[var(--color-muted)] transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(item.fullUrl);
                            setCopiedId(item.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }} 
                          className="p-1 text-[var(--color-muted-foreground)] hover:text-blue-500 rounded hover:bg-[var(--color-muted)] transition-colors"
                          title="Sao chép link"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          className="p-1 text-[var(--color-muted-foreground)] hover:text-red-500 rounded hover:bg-[var(--color-muted)] transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p 
                      onClick={() => setViewingItem(item)}
                      className="text-xs text-[var(--color-muted-foreground)] break-all line-clamp-1 mb-2.5 cursor-pointer hover:underline"
                    >
                      {item.fullUrl}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
                      {item.source && <span className="px-2 py-0.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded">SRC: {item.source}</span>}
                      {item.medium && <span className="px-2 py-0.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded">MED: {item.medium}</span>}
                      {item.term && <span className="px-2 py-0.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded">TRM: {item.term}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View UTM Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-[var(--color-border)]">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#5B3DF5] bg-[#5B3DF5]/10 px-2.5 py-0.5 rounded-lg border border-[#5B3DF5]/20 inline-block mb-1">
                  Chi tiết link UTM
                </span>
                <h3 className="text-xl font-bold text-[var(--color-foreground)]">
                  {viewingItem.campaign}
                </h3>
              </div>
              <button 
                onClick={() => setViewingItem(null)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] p-1 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] block mb-1.5">
                  Link UTM hoàn chỉnh
                </label>
                <div className="relative">
                  <div className="p-3.5 pr-24 rounded-xl bg-[var(--color-muted)]/50 border border-[var(--color-border)] text-xs font-mono text-[var(--color-foreground)] break-all select-all leading-relaxed max-h-24 overflow-y-auto">
                    {viewingItem.fullUrl}
                  </div>
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(viewingItem.fullUrl);
                        setCopiedId(viewingItem.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="px-2.5 py-1.5 bg-[#5B3DF5] hover:bg-[#5B3DF5]/90 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm transition-colors"
                    >
                      {copiedId === viewingItem.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === viewingItem.id ? "Đã chép" : "Chép"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-muted-foreground)] block">URL Gốc (Landing Page)</span>
                  <span className="font-medium text-[var(--color-foreground)] break-all text-xs">{viewingItem.url}</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-muted-foreground)] block">Chiến dịch (utm_campaign)</span>
                  <span className="font-semibold text-[var(--color-foreground)]">{viewingItem.campaign}</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-muted-foreground)] block">Nguồn (utm_source)</span>
                  <span className="font-medium text-[var(--color-foreground)]">{viewingItem.source || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-muted-foreground)] block">Phương tiện (utm_medium)</span>
                  <span className="font-medium text-[var(--color-foreground)]">{viewingItem.medium || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-muted-foreground)] block">Từ khóa (utm_term)</span>
                  <span className="font-medium text-[var(--color-foreground)]">{viewingItem.term || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-muted-foreground)] block">Nội dung (utm_content)</span>
                  <span className="font-medium text-[var(--color-foreground)]">{viewingItem.content || '—'}</span>
                </div>
              </div>

              {viewingItem.createdAt && (
                <div className="text-xs text-[var(--color-muted-foreground)] flex items-center justify-between pt-1">
                  <span>Thời gian tạo:</span>
                  <span className="font-medium text-[var(--color-foreground)]">
                    {new Date(viewingItem.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)]">
              <a
                href={viewingItem.fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 text-xs font-medium text-[var(--color-foreground)] hover:text-[#5B3DF5] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] transition-colors inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Mở link thử nghiệm
              </a>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadToBuilder(viewingItem)}
                  className="px-3.5 py-2 text-xs font-medium bg-[#5B3DF5]/10 text-[#5B3DF5] hover:bg-[#5B3DF5]/20 rounded-xl transition-colors"
                >
                  Nạp vào trình tạo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const item = viewingItem;
                    setViewingItem(null);
                    setEditingItem({ ...item });
                  }}
                  className="px-4 py-2 bg-[#5B3DF5] hover:bg-[#5B3DF5]/90 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit UTM Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#5B3DF5]" />
                Chỉnh sửa thông số UTM
              </h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] p-1 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">URL Đích *</label>
                <input 
                  type="text" 
                  required
                  value={editingItem.url}
                  onChange={e => setEditingItem({ ...editingItem, url: e.target.value })}
                  placeholder="https://example.com/khuyen-mai"
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Tên Chiến Dịch (utm_campaign) *</label>
                <input 
                  type="text" 
                  required
                  value={editingItem.campaign}
                  onChange={e => setEditingItem({ ...editingItem, campaign: e.target.value })}
                  placeholder="VD: summer_sale_2026"
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Nguồn (utm_source)</label>
                  <input 
                    type="text" 
                    value={editingItem.source}
                    onChange={e => setEditingItem({ ...editingItem, source: e.target.value })}
                    placeholder="VD: facebook"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Phương tiện (utm_medium)</label>
                  <input 
                    type="text" 
                    value={editingItem.medium}
                    onChange={e => setEditingItem({ ...editingItem, medium: e.target.value })}
                    placeholder="VD: cpc"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Từ khoá (utm_term)</label>
                  <input 
                    type="text" 
                    value={editingItem.term || ''}
                    onChange={e => setEditingItem({ ...editingItem, term: e.target.value })}
                    placeholder="Tuỳ chọn"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Nội dung (utm_content)</label>
                  <input 
                    type="text" 
                    value={editingItem.content || ''}
                    onChange={e => setEditingItem({ ...editingItem, content: e.target.value })}
                    placeholder="Tuỳ chọn"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/50"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => handleLoadToBuilder(editingItem)}
                  className="px-3.5 py-2 text-xs font-medium bg-[#5B3DF5]/10 text-[#5B3DF5] hover:bg-[#5B3DF5]/20 rounded-xl transition-colors"
                >
                  Nạp vào trình tạo
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#5B3DF5] hover:bg-[#5B3DF5]/90 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
