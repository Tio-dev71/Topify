import { useState, useEffect } from 'react';
import { Link2, Copy, Plus, Trash2, History, ExternalLink, Zap, Eye, Check } from 'lucide-react';
import { toast } from 'sonner';

export type UTMHistoryItem = {
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

const PRESETS = [
  { name: 'Facebook Ads', source: 'facebook', medium: 'cpc' },
  { name: 'TikTok Ads', source: 'tiktok', medium: 'cpc' },
  { name: 'Email Newsletter', source: 'newsletter', medium: 'email' },
  { name: 'Zalo OA', source: 'zalo', medium: 'social' },
  { name: 'Reels / Shorts', source: 'shorts', medium: 'video' },
];

export default function UTMBuilder() {
  const [formData, setFormData] = useState({
    url: '',
    campaign: '',
    source: '',
    medium: '',
    term: '',
    content: ''
  });

  const [history, setHistory] = useState<UTMHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('topify_utm_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveHistory = (items: UTMHistoryItem[]) => {
    setHistory(items);
    localStorage.setItem('topify_utm_history', JSON.stringify(items));
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
    } catch {
      return '';
    }
  };

  const fullUrl = generateUTM();

  const handleCopy = (urlToCopy = fullUrl) => {
    if (!urlToCopy) {
      toast.error('Vui lòng nhập link trang đích hợp lệ');
      return;
    }
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    toast.success('Đã sao chép liên kết UTM vào bộ nhớ tạm');
    setTimeout(() => setCopied(false), 2000);

    // Save to history if current
    if (urlToCopy === fullUrl && formData.url && formData.campaign) {
      const exists = history.some(h => h.fullUrl === fullUrl);
      if (!exists) {
        const newItem: UTMHistoryItem = {
          id: Date.now().toString(),
          ...formData,
          fullUrl,
          createdAt: new Date().toISOString()
        };
        saveHistory([newItem, ...history]);
      }
    }
  };

  const handleDeleteHistory = (id: string) => {
    saveHistory(history.filter(h => h.id !== id));
    toast.success('Đã xóa khỏi lịch sử');
  };

  const applyPreset = (preset: { source: string; medium: string }) => {
    setFormData(prev => ({
      ...prev,
      source: preset.source,
      medium: preset.medium
    }));
    toast.info(`Đã áp dụng mẫu ${preset.source} / ${preset.medium}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tạo liên kết UTM (UTM Builder - F080)</h1>
        <p className="text-sm text-gray-500 mt-1">Đính kèm tham số theo dõi nguồn traffic, chiến dịch và chuyển đổi chính xác vào Google Analytics / CRM</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-2xs space-y-4 text-xs">
            <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600" />
              <span>Thiết lập tham số theo dõi</span>
            </h2>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-600">Mẫu nguồn nhanh (Presets):</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 border border-gray-200 transition font-medium"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">URL Trang đích *</label>
              <input
                type="text"
                required
                placeholder="https://yourbrand.com/landing-page"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Tên Chiến dịch (utm_campaign) *</label>
                <input
                  type="text"
                  placeholder="VD: tet_sale_2026, launch_app"
                  value={formData.campaign}
                  onChange={e => setFormData({ ...formData, campaign: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Nguồn Traffic (utm_source) *</label>
                <input
                  type="text"
                  placeholder="VD: facebook, tiktok, google"
                  value={formData.source}
                  onChange={e => setFormData({ ...formData, source: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Phương thức (utm_medium)</label>
                <input
                  type="text"
                  placeholder="VD: cpc, banner, bio_link"
                  value={formData.medium}
                  onChange={e => setFormData({ ...formData, medium: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Nội dung / Phiên bản (utm_content)</label>
                <input
                  type="text"
                  placeholder="VD: video_reels_1, cta_bottom"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            {/* Preview Output */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <label className="font-bold text-gray-700 block">Liên kết UTM tạo ra:</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px] text-indigo-700 break-all select-all">
                {fullUrl || 'Vui lòng nhập URL trang đích để xem trước'}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy()}
                  disabled={!fullUrl}
                  className="btn-primary py-2 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép & Lưu'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Lịch sử liên kết gần đây</span>
            </h2>
            <span className="text-[11px] font-semibold text-gray-400">{history.length} links</span>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">Chưa có liên kết UTM nào được lưu.</div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {history.map(item => (
                <div key={item.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-100/70 transition space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-gray-900 line-clamp-1">{item.campaign || 'Chiến dịch'}</span>
                    <button
                      onClick={() => handleDeleteHistory(item.id)}
                      className="text-gray-400 hover:text-rose-600 p-0.5 rounded transition"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="font-mono text-[10px] text-gray-500 line-clamp-2 break-all">
                    {item.fullUrl}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/50">
                    <span className="text-[10px] text-gray-400">{item.source} / {item.medium}</span>
                    <button
                      onClick={() => handleCopy(item.fullUrl)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
