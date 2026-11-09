import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  MessageSquare, 
  CheckSquare, 
  Users, 
  Clock, 
  PhoneCall,
  Plus
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

interface TemplatesTabProps {
  onAppliedSuccess?: () => void;
  onNavigateToWorkflows?: () => void;
}

export function TemplatesTab({ onAppliedSuccess, onNavigateToWorkflows }: TemplatesTabProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>(() => {
    try {
      const cached = localStorage.getItem('topify_automation_templates_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(templates.length === 0);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      if (templates.length === 0) setLoading(true);
      const res = await api.get('/automations/templates');
      if (res.data?.templates) {
        setTemplates(res.data.templates);
        try {
          localStorage.setItem('topify_automation_templates_cache', JSON.stringify(res.data.templates));
        } catch {}
      }
    } catch (e) {
      console.error('Fetch templates error:', e);
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
        toast.success(res.data.message || `Đã áp dụng mẫu "${tpl.name}" thành công!`);
        
        // Optimistically update rules cache if possible
        if (res.data?.rule) {
          try {
            const cachedRules = JSON.parse(localStorage.getItem('topify_automation_rules_cache') || '[]');
            const nextRules = [res.data.rule, ...cachedRules.filter((r: any) => r.id !== res.data.rule.id)];
            localStorage.setItem('topify_automation_rules_cache', JSON.stringify(nextRules));
          } catch {}
        }

        if (onAppliedSuccess) onAppliedSuccess();
        if (onNavigateToWorkflows) onNavigateToWorkflows();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi áp dụng mẫu');
    } finally {
      setApplyingId(null);
    }
  };

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
    <div className="space-y-5">
      {/* Header bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-blue-50 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
            <Sparkles className="w-3.5 h-3.5" />
            Thư Viện Mẫu Kịch Bản Tự Động Hóa Thực Chiến (F145)
          </div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Kịch Bản Mẫu Sẵn Có Theo Use Case Marketing & CSKH
          </h2>
          <p className="text-xs text-gray-500">
            Chọn một mẫu phù hợp và bấm 1-Click để khởi tạo kịch bản tự động lưu trực tiếp vào cơ sở dữ liệu.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.key
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Templates */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-100">
          Đang tải danh sách mẫu kịch bản tự động...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          Không tìm thấy mẫu nào trong danh mục này
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{tpl.description}</p>
                </div>

                {/* Flow preview */}
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="font-semibold">Nguồn (F141):</span>
                    <span className="text-gray-600 font-mono text-[11px]">{tpl.trigger.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-semibold">Hành động (F143):</span>
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
  );
}
