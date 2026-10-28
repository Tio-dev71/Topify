import { useState, useEffect } from 'react';
import {
  LayoutTemplate,
  Plus,
  Trash2,
  Edit2,
  X,
  Copy,
  ArrowRight,
  Search,
  Sparkles,
  Hash,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

export type HashtagLibraryItem = {
  id: string;
  name: string;
  hashtags: string;
  category: 'HASHTAG' | 'CTA';
  createdAt?: string;
};

export type Template = {
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

const DEFAULT_FORMULAS: Template[] = [
  {
    id: 'formula_aida',
    name: 'Công thức AIDA (Attention - Interest - Desire - Action)',
    description: 'Mô hình kinh điển tối ưu chuyển đổi và kích thích hành vi mua hàng',
    postType: 'FEED',
    caption: `🔥 [CHÚ Ý - ATTENTION]: Bạn có đang lãng phí hàng giờ mỗi ngày để đăng bài thủ công lên từng mạng xã hội?\n\n💡 [THÍCH THÚ - INTEREST]: Topify giúp tự động hóa toàn bộ quy trình từ phân tích xu hướng, sáng tạo nội dung đa biến thể đến lập lịch xuất bản đa kênh chỉ trong 1 cú nhấp chuột.\n\n✨ [KHAO KHÁT - DESIRE]: Hơn 5,000+ nhà sáng tạo nội dung và doanh nghiệp đã tăng gấp 3 lần lượng reach tự nhiên và tiết kiệm 80% thời gian quản lý kênh.\n\n👉 [HÀNH ĐỘNG - ACTION]: Dùng thử miễn phí ngay hôm nay để bứt phá doanh số!`,
    hashtags: '#Topify #AIDA #MarketingHieuQua #XuatBanDaKenh',
    cta: 'Nhắn tin ngay để nhận ưu đãi dùng thử 14 ngày!',
    platform: 'FACEBOOK_POST',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'formula_pas',
    name: 'Công thức PAS (Problem - Agitate - Solution)',
    description: 'Xoáy sâu nỗi đau khách hàng và đưa ra giải pháp cứu cánh hoàn hảo',
    postType: 'FEED',
    caption: `😫 [NỖI ĐAU - PROBLEM]: Bỏ ra hàng đống tiền chạy ads nhưng tỉ lệ chuyển đổi vẫn lẹt đẹt, fanpage không có tương tác?\n\n⚡ [TRẦM TRỌNG HÓA - AGITATE]: Thuật toán mạng xã hội thay đổi liên tục, nếu nội dung không bắt đúng tệp và không duy trì nhịp độ đăng đều đặn, trang của bạn sẽ nhanh chóng bị bóp reach và chìm nghỉm.\n\n🛡️ [GIẢI PHÁP - SOLUTION]: Topify mang đến bộ giải pháp AI phân tích dữ liệu đối thủ và tối ưu hook 3s đầu giúp giữ chân người xem tối đa.`,
    hashtags: '#PAS #NoiDungDinhCao #KinhDoanhOnline #Topify',
    cta: 'Để lại bình luận bên dưới để nhận tài liệu chiến lược miễn phí!',
    platform: 'FACEBOOK_POST',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'formula_storytelling',
    name: 'Kể Chuyện Trải Nghiệm (Storytelling & Bài học)',
    description: 'Chạm đến cảm xúc người đọc thông qua hành trình vượt khó và bài học thực chiến',
    postType: 'FEED',
    caption: `Hôm nay mình muốn kể cho các bạn nghe về hành trình từ một shop online suýt đóng cửa đến doanh thu 500 triệu/tháng...\n\n3 tháng trước, team mình kiệt sức vì loay hoay quản lý 6 tài khoản Fanpage và TikTok cùng lúc. Cứ đến giờ đăng bài là cuống cuồng tìm ý tưởng.\n\nBước ngoặt đến khi tụi mình quyết định ứng dụng tự động hóa và phân loại trụ cột nội dung rõ ràng. Thay vì làm thủ công, mọi thứ được lên kế hoạch trước cả tháng.\n\nBài học rút ra: Công cụ đúng sẽ giải phóng 90% sức lao động để bạn tập trung vào chất lượng sản phẩm.`,
    hashtags: '#Storytelling #KhoiNghiep #KinhNghiemKinhDoanh #Topify',
    cta: 'Bạn đang gặp khó khăn gì trong quản lý kênh? Cùng chia sẻ dưới comment nhé!',
    platform: 'FACEBOOK_POST',
    createdAt: new Date().toISOString(),
  },
];

export function ContentTemplatesTab() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Library State for Hashtags & CTA
  const [hashtagLibraries, setHashtagLibraries] = useState<HashtagLibraryItem[]>([]);
  const [ctaLibraries, setCtaLibraries] = useState<HashtagLibraryItem[]>([]);

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

  const fetchLibraries = async () => {
    try {
      // 1. Try local cache first for instant render
      try {
        const cached = localStorage.getItem('topify_cached_hashtag_library');
        if (cached) {
          const parsed: HashtagLibraryItem[] = JSON.parse(cached);
          setHashtagLibraries(parsed.filter(i => i.category === 'HASHTAG'));
          setCtaLibraries(parsed.filter(i => i.category === 'CTA'));
        }
      } catch {}

      // 2. Fetch from API
      const res = await api.get('/content/hashtags');
      if (res?.data?.items) {
        const items: HashtagLibraryItem[] = res.data.items;
        setHashtagLibraries(items.filter(i => i.category === 'HASHTAG'));
        setCtaLibraries(items.filter(i => i.category === 'CTA'));
        try {
          localStorage.setItem('topify_cached_hashtag_library', JSON.stringify(items));
        } catch {}
      }
    } catch (err) {
      console.warn('Could not load hashtag/cta libraries:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);

      // 1. Read any locally customized formulas
      let customFormulasMap: Record<string, any> = {};
      try {
        const stored = localStorage.getItem('topify_custom_formulas');
        if (stored) customFormulasMap = JSON.parse(stored);
      } catch {}

      const baseFormulas = DEFAULT_FORMULAS.map(df => {
        if (customFormulasMap[df.id]) {
          return { ...df, ...customFormulasMap[df.id] };
        }
        return df;
      });

      // 2. Fetch templates from server
      const res = await api.get('/content/templates');
      if (res?.data) {
        const fetched = res.data.templates || [];
        // Combine base formulas with server templates
        const combined = [
          ...baseFormulas.map(bf => {
            const serverOverride = fetched.find((f: any) => f.id === bf.id);
            return serverOverride ? { ...bf, ...serverOverride } : bf;
          }),
          ...fetched.filter((f: any) => !DEFAULT_FORMULAS.some(d => d.id === f.id)),
        ];
        setTemplates(combined);
      } else {
        setTemplates(baseFormulas);
      }
    } catch {
      // Fallback
      let customFormulasMap: Record<string, any> = {};
      try {
        const stored = localStorage.getItem('topify_custom_formulas');
        if (stored) customFormulasMap = JSON.parse(stored);
      } catch {}

      const baseFormulas = DEFAULT_FORMULAS.map(df => {
        if (customFormulasMap[df.id]) {
          return { ...df, ...customFormulasMap[df.id] };
        }
        return df;
      });
      setTemplates(baseFormulas);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchLibraries();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xoá mẫu bài viết "${name}"?`)) return;
    try {
      await api.delete(`/content/templates?id=${id}`);
      toast.success('Đã xoá mẫu bài viết thành công');
      setTemplates(prev => prev.filter(t => t.id !== id));
      try {
        const stored = localStorage.getItem('topify_custom_formulas');
        if (stored) {
          const map = JSON.parse(stored);
          delete map[id];
          localStorage.setItem('topify_custom_formulas', JSON.stringify(map));
        }
      } catch {}
    } catch {
      toast.error('Lỗi khi xoá template');
    }
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
    fetchLibraries();
  };

  const handleOpenEdit = (t: Template) => {
    setEditingTemplate(t);
    setFormData({
      name: t.name,
      description: t.description || '',
      postType: t.postType || 'FEED',
      caption: t.caption || '',
      hashtags: t.hashtags || '',
      cta: t.cta || '',
      platform: t.platform || 'FACEBOOK_POST',
    });
    setIsModalOpen(true);
    fetchLibraries();
  };

  const handleSelectHashtag = (val: string) => {
    if (!val) return;
    setFormData(prev => {
      const existing = (prev.hashtags || '').trim();
      if (!existing) {
        return { ...prev, hashtags: val.trim() };
      }
      if (existing.includes(val.trim())) {
        return prev;
      }
      return { ...prev, hashtags: `${existing} ${val.trim()}` };
    });
    toast.success('Đã thêm hashtag vào mẫu');
  };

  const handleSelectCta = (val: string) => {
    if (!val) return;
    setFormData(prev => ({ ...prev, cta: val.trim() }));
    toast.success('Đã chọn lời kêu gọi (CTA)');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên mẫu bài viết');
      return;
    }

    try {
      setSubmitting(true);
      if (editingTemplate) {
        // If it's a default formula, persist to local storage map
        if (editingTemplate.id.startsWith('formula_')) {
          try {
            const stored = localStorage.getItem('topify_custom_formulas');
            const map = stored ? JSON.parse(stored) : {};
            map[editingTemplate.id] = { ...formData, id: editingTemplate.id };
            localStorage.setItem('topify_custom_formulas', JSON.stringify(map));
          } catch {}
        }

        // Try to update via API (PUT/PATCH)
        try {
          await api.patch('/content/templates', {
            id: editingTemplate.id,
            ...formData,
          });
        } catch (apiErr) {
          console.warn('API update failed, updated in client state:', apiErr);
        }

        // Update local state directly
        setTemplates(prev =>
          prev.map(t =>
            t.id === editingTemplate.id
              ? { ...t, ...formData }
              : t
          )
        );
        toast.success(`Đã cập nhật mẫu bài viết "${formData.name}" thành công!`);
      } else {
        // Create new template
        let createdId = 'custom_' + Date.now();
        try {
          const res = await api.post('/content/templates', formData);
          if (res?.data?.id) {
            createdId = res.data.id;
          }
        } catch (apiErr) {
          console.warn('API create failed, created in client state:', apiErr);
        }

        const newTemplate: Template = {
          id: createdId,
          ...formData,
          createdAt: new Date().toISOString(),
        };

        setTemplates(prev => [newTemplate, ...prev]);
        toast.success('Đã tạo mẫu bài viết mới thành công!');
      }

      setIsModalOpen(false);
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi lưu template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyToCreate = (t: Template) => {
    navigate('/create', {
      state: {
        prefilledTitle: t.name,
        prefilledCaption: t.caption || '',
        prefilledHashtags: t.hashtags || '',
      },
    });
    toast.success(`Đã áp dụng mẫu "${t.name}" sang màn hình Tạo Bài Viết!`);
  };

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    toast.success('Đã sao chép nội dung mẫu vào clipboard!');
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.caption || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.hashtags || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.cta || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-gray-900 text-sm">
              Thư Viện Mẫu Bài Viết &amp; Caption Chuẩn Cấu Trúc (Templates - F076)
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Đồng bộ đầy đủ các khung sườn copywriting chuyển đổi cao (AIDA, PAS, Storytelling) và các mẫu do doanh nghiệp tự cấu hình
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary py-2 px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Mẫu Bài Viết Mới</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Tìm kiếm mẫu bài viết theo công thức, tiêu đề hoặc từ khóa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">Đang tải danh sách mẫu bài viết...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-900">Không tìm thấy mẫu phù hợp</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Bạn có thể tạo mẫu bài viết theo chuẩn ngành hàng của riêng bạn để nhân viên hoặc AI tái sử dụng nhanh chóng.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((t) => {
            const isCustom = !t.id.startsWith('formula_');
            return (
              <div
                key={t.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:border-amber-300 hover:shadow-xs transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {t.postType || 'FEED'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isCustom ? (
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          Tuỳ chỉnh
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          Khuyên dùng
                        </span>
                      )}
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id, t.name)}
                          className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Xóa mẫu này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-gray-900 text-sm leading-snug">{t.name}</h4>

                  {t.description && (
                    <p className="text-xs text-gray-500 line-clamp-1">{t.description}</p>
                  )}

                  <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-xs text-gray-700 font-mono leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line">
                    {t.caption || '(Chưa có nội dung mẫu)'}
                  </div>

                  {t.hashtags && (
                    <div className="text-[11px] font-mono text-blue-600 truncate">
                      {t.hashtags}
                    </div>
                  )}

                  {t.cta && (
                    <div className="text-xs text-amber-900 font-medium bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      📢 CTA: {t.cta}
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCaption(t.caption || '')}
                      className="py-2 px-2 text-xs font-semibold rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Sao chép nội dung mẫu"
                    >
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                      <span>Sao chép</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(t)}
                      className="py-2 px-2 text-xs font-semibold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Chỉnh sửa mẫu bài viết"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Chỉnh sửa</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyToCreate(t)}
                    className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Áp dụng vào bài viết mới</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo/Sửa Mẫu */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-amber-600" />
                <span>{editingTemplate ? 'Chỉnh Sửa Mẫu Bài Viết' : 'Tạo Mẫu Bài Viết Mới (F076)'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Tên Mẫu <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Mẫu Khuyến Mãi Cuối Tuần..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Định Dạng Bài</label>
                  <select
                    value={formData.postType}
                    onChange={(e) => setFormData({ ...formData, postType: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="FEED">FEED (Bài viết thường)</option>
                    <option value="REELS">REELS / TIKTOK</option>
                    <option value="CAROUSEL">CAROUSEL (Nhiều ảnh)</option>
                    <option value="STORY">STORY (24h)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Mô Tả Mục Đích</label>
                <input
                  type="text"
                  placeholder="Phù hợp cho chiến dịch xả hàng hoặc tăng tương tác..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Nội Dung Caption Mẫu</label>
                <textarea
                  rows={6}
                  placeholder="Nội dung khung sườn bài viết..."
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-amber-500 focus:outline-none resize-y font-mono leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Hashtags Mẫu */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Hashtags Mẫu</span>
                    </label>
                    {hashtagLibraries.length > 0 ? (
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSelectHashtag(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-2 py-0.5 cursor-pointer focus:outline-none transition-colors max-w-[130px] truncate"
                        title="Chọn từ danh sách đã tạo ở menu Hashtag & Mẫu CTA"
                      >
                        <option value="" disabled>+ Chọn Thư viện ({hashtagLibraries.length})</option>
                        {hashtagLibraries.map((item) => (
                          <option key={item.id} value={item.hashtags}>
                            {item.name}: {item.hashtags.length > 25 ? item.hashtags.slice(0, 25) + '...' : item.hashtags}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Thư viện trống</span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="#Topify #Sale (tự nhập hoặc chọn Thư viện)"
                    value={formData.hashtags}
                    onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-amber-500 focus:outline-none font-mono"
                  />
                  {hashtagLibraries.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-gray-400">Gợi ý:</span>
                      {hashtagLibraries.slice(0, 2).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectHashtag(item.hashtags)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-gray-200 text-gray-600 cursor-pointer transition-colors max-w-[110px] truncate"
                          title={`${item.name}: ${item.hashtags}`}
                        >
                          + {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lời kêu gọi (CTA) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                      <span>Lời kêu gọi (CTA)</span>
                    </label>
                    {ctaLibraries.length > 0 ? (
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSelectCta(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg px-2 py-0.5 cursor-pointer focus:outline-none transition-colors max-w-[130px] truncate"
                        title="Chọn từ danh sách đã tạo ở menu Hashtag & Mẫu CTA"
                      >
                        <option value="" disabled>+ Chọn Thư viện ({ctaLibraries.length})</option>
                        {ctaLibraries.map((item) => (
                          <option key={item.id} value={item.hashtags}>
                            {item.name}: {item.hashtags.length > 25 ? item.hashtags.slice(0, 25) + '...' : item.hashtags}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Thư viện trống</span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Inbox ngay / Mua tại link (tự nhập hoặc chọn Thư viện)"
                    value={formData.cta}
                    onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                  {ctaLibraries.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-gray-400">Gợi ý:</span>
                      {ctaLibraries.slice(0, 2).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectCta(item.hashtags)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 border border-gray-200 text-gray-600 cursor-pointer transition-colors max-w-[110px] truncate"
                          title={`${item.name}: ${item.hashtags}`}
                        >
                          + {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Đang lưu...' : editingTemplate ? 'Lưu Thay Đổi' : 'Tạo Mẫu Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
