'use client';

import { useState, useEffect, useMemo } from 'react';
import { Link2, Copy, Plus, Trash2, History, ExternalLink, Zap } from 'lucide-react';

type UTMHistory = {
  id: string;
  url: string;
  campaign: string;
  source: string;
  medium: string;
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

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xoá link này khỏi lịch sử?')) {
      saveHistory(history.filter(item => item.id !== id));
    }
  };

  const applyPreset = (source: string, medium: string) => {
    setFormData(prev => ({ ...prev, source, medium }));
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">UTM Builder</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Tạo và quản lý các link UTM cho chiến dịch Marketing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Build UTM */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#5B3DF5]" />
              Xây dựng Link
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
                  <div key={item.id} className="p-3 border border-[var(--color-border)] rounded-xl hover:border-[#5B3DF5]/30 transition-colors group bg-[var(--color-background)]">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-sm text-[var(--color-foreground)]">{item.campaign}</h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {
                          navigator.clipboard.writeText(item.fullUrl);
                          alert('Đã sao chép!');
                        }} className="p-1 text-[var(--color-muted-foreground)] hover:text-blue-500 rounded">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 text-[var(--color-muted-foreground)] hover:text-red-500 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)] break-all line-clamp-1 mb-2">
                      {item.fullUrl}
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px] uppercase font-semibold">
                      {item.source && <span className="px-2 py-0.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded">SRC: {item.source}</span>}
                      {item.medium && <span className="px-2 py-0.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded">MED: {item.medium}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
