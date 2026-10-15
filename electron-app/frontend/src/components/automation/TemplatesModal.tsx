import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  MessageSquare, 
  CheckSquare, 
  Users, 
  Clock, 
  PhoneCall,
  Tag
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: any;
  conditions: any[];
  actions: any[];
  icon: string;
  recommendedFor: string;
}

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppliedSuccess: () => void;
}

export function TemplatesModal({ isOpen, onClose, onAppliedSuccess }: TemplatesModalProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/automations/templates');
      if (res.data?.templates) {
        setTemplates(res.data.templates);
      }
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải danh sách mẫu tự động hóa');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (tpl: TemplateItem) => {
    try {
      setApplyingId(tpl.id);
      const res = await api.post('/automations/templates', { templateId: tpl.id });
      if (res.data?.success) {
        toast.success(res.data.message || 'Đã áp dụng mẫu quy trình thành công!');
        onAppliedSuccess();
        onClose();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi áp dụng mẫu');
    } finally {
      setApplyingId(null);
    }
  };

  if (!isOpen) return null;

  const categories = [
    { key: 'ALL', label: 'Tất cả mẫu' },
    { key: 'MARKETING', label: 'Marketing & Bán hàng' },
    { key: 'CSKH', label: 'Chăm sóc khách hàng' },
    { key: 'CRM', label: 'Quản lý Lead & CRM' },
    { key: 'OPERATIONS', label: 'Vận hành & Nhắc việc' },
  ];

  const filtered = templates.filter(t => activeCategory === 'ALL' || t.category === activeCategory);

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare': return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'CheckSquare': return <CheckSquare className="w-5 h-5 text-purple-600" />;
      case 'Users': return <Users className="w-5 h-5 text-emerald-600" />;
      case 'Clock': return <Clock className="w-5 h-5 text-amber-600" />;
      case 'PhoneCall': return <PhoneCall className="w-5 h-5 text-rose-600" />;
      default: return <Zap className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-gray-100 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-blue-50">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              <Sparkles className="w-3.5 h-3.5" />
              Thư viện Mẫu Kịch Bản Chuẩn Doanh Nghiệp (F145)
            </div>
            <h2 className="text-lg font-bold text-gray-900">Mẫu Tự Động Hóa Thực Chiến</h2>
            <p className="text-xs text-gray-500">
              Chọn mẫu kịch bản đã được thiết kế sẵn và kích hoạt chỉ với 1 cú nhấp chuột.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 overflow-x-auto bg-gray-50/50">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.key
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates List */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Đang tải thư viện mẫu...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">Không có mẫu nào trong danh mục này</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(tpl => (
                <div 
                  key={tpl.id}
                  className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        {getTemplateIcon(tpl.icon)}
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                        {tpl.category}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-gray-900 leading-snug">{tpl.name}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">{tpl.description}</p>
                    </div>

                    {/* Flow Steps */}
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-semibold">Nguồn:</span>
                        <span className="text-gray-600">{tpl.trigger.type}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-semibold">Hành động:</span>
                        <div className="flex flex-wrap gap-1">
                          {tpl.actions.map((act: any, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px] font-medium text-gray-600">
                              {act.type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-400">
                      Phù hợp với: <span className="font-medium text-gray-600">{tpl.recommendedFor}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApply(tpl)}
                    disabled={applyingId === tpl.id}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {applyingId === tpl.id ? 'Đang kích hoạt...' : 'Áp dụng quy trình (1-Click)'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
