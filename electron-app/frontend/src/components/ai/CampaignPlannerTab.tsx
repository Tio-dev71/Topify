import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
  TrendingUp,
  Target,
  ArrowRight,
  Plus,
  RefreshCw,
  FolderPlus,
  Clock,
  DollarSign,
  Share2,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Users
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface CampaignPlan {
  id: string;
  name: string;
  brief: {
    targetAudience: string;
    budget: number;
    durationDays: number;
    channels: string[];
    productBrief: string;
    objectiveType: string;
  };
  objectives: Array<{
    metric: string;
    target: string;
    description: string;
  }>;
  pillars: Array<{
    name: string;
    ratioPercent: number;
    theme: string;
    sampleAngles: string[];
  }>;
  contentPlan: Array<{
    week: number;
    phase: string;
    theme: string;
    postsCount: number;
    keyDeliverables: string[];
  }>;
  tasks: Array<{
    title: string;
    role: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    deadlineDays: number;
  }>;
  estimatedROI: string;
  createdAt: string;
  isPushedToCampaign?: boolean;
}

const STORAGE_KEY = 'topify_ai_campaign_plans_cache';

export const CampaignPlannerTab: React.FC = () => {
  const [plans, setPlans] = useState<CampaignPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [pushing, setPushing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Form states for generating new plan
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [campaignName, setCampaignName] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('Chủ shop thời trang & mỹ phẩm bán hàng trên TikTok Shop & Facebook');
  const [budget, setBudget] = useState<number>(35000000);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['TIKTOK', 'FACEBOOK', 'ZALO']);
  const [productBrief, setProductBrief] = useState<string>('Bộ giải pháp tự động hóa tương tác chốt đơn và phễu CRM đa kênh');
  const [objectiveType, setObjectiveType] = useState<string>('LEAD_GENERATION');

  const availableChannels = [
    { id: 'TIKTOK', label: 'TikTok' },
    { id: 'FACEBOOK', label: 'Facebook' },
    { id: 'INSTAGRAM', label: 'Instagram' },
    { id: 'YOUTUBE', label: 'YouTube Shorts' },
    { id: 'ZALO', label: 'Zalo OA / ZNS' },
  ];

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/campaign-planner');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPlans(res.data.data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.data));
        if (res.data.data.length > 0 && !selectedPlanId) {
          setSelectedPlanId(res.data.data[0].id);
        }
      }
    } catch (err: any) {
      console.warn('Fallback loading plans from localStorage:', err);
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setPlans(parsed);
          if (parsed.length > 0 && !selectedPlanId) {
            setSelectedPlanId(parsed[0].id);
          }
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleToggleChannel = (id: string) => {
    if (selectedChannels.includes(id)) {
      if (selectedChannels.length > 1) {
        setSelectedChannels(selectedChannels.filter((c) => c !== id));
      } else {
        toast.error('Cần chọn ít nhất 1 kênh truyền thông');
      }
    } else {
      setSelectedChannels([...selectedChannels, id]);
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      toast.error('Vui lòng nhập tên chiến dịch');
      return;
    }
    if (!productBrief.trim()) {
      toast.error('Vui lòng nhập tóm tắt sản phẩm / dịch vụ');
      return;
    }

    try {
      setGenerating(true);
      const payload = {
        name: campaignName.trim(),
        targetAudience,
        budget: Number(budget) || 20000000,
        durationDays: Number(durationDays) || 30,
        channels: selectedChannels,
        productBrief,
        objectiveType,
      };

      const res = await api.post('/ai/campaign-planner', payload);
      if (res.data?.success && res.data.data) {
        const newPlan = res.data.data;
        const updated = [newPlan, ...plans];
        setPlans(updated);
        setSelectedPlanId(newPlan.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setShowNewModal(false);
        toast.success('AI đã sinh thành công kế hoạch chiến dịch toàn diện (F159)!');
      } else {
        toast.error(res.data?.error || 'Không thể tạo kế hoạch chiến dịch');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi gọi AI Campaign Planner');
    } finally {
      setGenerating(false);
    }
  };

  const handlePushToModules = async (plan: CampaignPlan) => {
    try {
      setPushing(true);
      const res = await api.post('/ai/campaign-planner', {
        action: 'push_to_modules',
        planId: plan.id,
      });

      if (res.data?.success) {
        const updated = plans.map((p) =>
          p.id === plan.id ? { ...p, isPushedToCampaign: true } : p
        );
        setPlans(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        toast.success(res.data.message || 'Đã đồng bộ thành công sang Campaign (M10) và Quản lý Task (M09)!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi đồng bộ sang các phân hệ');
    } finally {
      setPushing(false);
    }
  };

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const handleCopySummary = () => {
    if (!activePlan) return;
    const text = `CHIẾN DỊCH: ${activePlan.name}
Ngân sách: ${activePlan.brief.budget.toLocaleString('vi-VN')} đ | Thời lượng: ${activePlan.brief.durationDays} ngày
Kênh: ${activePlan.brief.channels.join(', ')}

MỤC TIÊU & KPI:
${activePlan.objectives.map((o) => `- ${o.metric}: ${o.target} (${o.description})`).join('\n')}

TRỤC NỘI DUNG (PILLARS):
${activePlan.pillars.map((p) => `- ${p.name} (${p.ratioPercent}%): ${p.theme}`).join('\n')}

DỰ KIẾN ROI: ${activePlan.estimatedROI}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép tóm tắt kế hoạch chiến dịch vào clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                PHÂN HỆ M14 • F159
              </span>
              <span className="text-xs text-blue-200">AI Campaign Planner</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              Lập Kế Hoạch Chiến Dịch Tự Động (AI Campaign Planner)
            </h2>
            <p className="text-sm text-blue-100/90 mt-1 max-w-2xl">
              Tự động phân tích brief kinh doanh để sinh mục tiêu (KPIs), trục định hướng nội dung (Content Pillars), lộ trình 4 tuần và phân rã task hành động cho từng nhân sự.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCampaignName(`Chiến Dịch Khai Xuân ${new Date().getFullYear() + 1}`);
                setShowNewModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Sinh Kế Hoạch Mới
            </button>
            <button
              onClick={fetchPlans}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Plan Selector Carousel/Tabs */}
      {plans.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0 mr-2">
            Kế Hoạch Đã Lưu:
          </span>
          {plans.map((p) => {
            const isSelected = p.id === (activePlan?.id || selectedPlanId);
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs font-semibold'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="max-w-[200px] truncate">{p.name}</span>
                {p.isPushedToCampaign && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã đồng bộ sang M10" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {activePlan ? (
        <div className="space-y-6">
          {/* Header Bar of Active Plan */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {activePlan.brief.objectiveType === 'LEAD_GENERATION'
                    ? 'Thu Thập Lead (CPL)'
                    : activePlan.brief.objectiveType === 'SALES_CONVERSION'
                    ? 'Tăng Chuyển Đổi Doanh Số'
                    : 'Nhận Diện Thương Hiệu'}
                </span>
                <span className="text-xs text-gray-500">
                  Tạo lúc {new Date(activePlan.createdAt).toLocaleDateString('vi-VN')}
                </span>
                {activePlan.isPushedToCampaign && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Đã liên kết vào M10 Campaign & M09 Tasks
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{activePlan.name}</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-2xl">
                Đối tượng: <strong className="text-gray-800">{activePlan.brief.targetAudience}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Đã sao chép' : 'Sao chép tóm tắt'}
              </button>

              <button
                onClick={() => handlePushToModules(activePlan)}
                disabled={pushing || activePlan.isPushedToCampaign}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                  activePlan.isPushedToCampaign
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <FolderPlus className="w-4 h-4" />
                {pushing
                  ? 'Đang đồng bộ...'
                  : activePlan.isPushedToCampaign
                  ? 'Đã Đồng Bộ Sang M10 & M09'
                  : '🚀 Đẩy Sang Campaign (M10) & Tasks (M09)'}
              </button>
            </div>
          </div>

          {/* Quick Metrics & Budget Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">Ngân Sách Dự Kiến</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-gray-900">
                {Number(activePlan.brief.budget).toLocaleString('vi-VN')} đ
              </div>
              <div className="text-[11px] text-gray-500 mt-1">Ước tính theo chu kỳ {activePlan.brief.durationDays} ngày</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">Thời Gian Thực Thi</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-lg font-bold text-gray-900">{activePlan.brief.durationDays} Ngày</div>
              <div className="text-[11px] text-gray-500 mt-1">Phân rã theo 4 giai đoạn tuần</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">Kênh Triển Khai</span>
                <Share2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-sm font-bold text-gray-900 truncate">
                {activePlan.brief.channels.join(' • ')}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">{activePlan.brief.channels.length} kênh trọng tâm</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">Dự Phóng ROI</span>
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-sm font-bold text-amber-700 truncate">{activePlan.estimatedROI}</div>
              <div className="text-[11px] text-gray-500 mt-1">Dựa trên benchmark ngành</div>
            </div>
          </div>

          {/* Section 1: Objectives & KPIs */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-blue-600" />
              1. Mục Tiêu & Chỉ Số Hiệu Quả (Objectives & KPIs)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activePlan.objectives.map((obj, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block mb-1">
                      {obj.metric}
                    </span>
                    <div className="text-base font-bold text-gray-900 mb-2">{obj.target}</div>
                  </div>
                  <p className="text-xs text-gray-600 border-t border-blue-100 pt-2">{obj.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Content Pillars */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-indigo-600" />
              2. Trục Định Hướng Nội Dung (Content Pillars)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activePlan.pillars.map((pil, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-800 truncate">{pil.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                        {pil.ratioPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-3">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pil.ratioPercent}%` }} />
                    </div>
                    <p className="text-xs text-gray-600 mb-3 font-medium">{pil.theme}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-2 space-y-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Gợi ý góc tiếp cận:</span>
                    {pil.sampleAngles.map((angle, aidx) => (
                      <div key={aidx} className="text-[11px] text-gray-700 flex items-start gap-1">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{angle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: 4-Week Content Plan */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-purple-600" />
              3. Lộ Trình Triển Khai Nội Dung Theo Tuần (Weekly Content Plan)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activePlan.contentPlan.map((wk) => (
                <div key={wk.week} className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-purple-700">Tuần {wk.week}</span>
                      <span className="text-[11px] font-semibold text-gray-600">{wk.postsCount} Bài/Video</span>
                    </div>
                    <div className="text-xs font-bold text-gray-900 mb-1">{wk.phase}</div>
                    <p className="text-xs text-gray-600 mb-3">{wk.theme}</p>
                  </div>

                  <div className="border-t border-purple-100 pt-2 space-y-1">
                    <span className="text-[10px] font-semibold text-purple-700 uppercase">Sản phẩm đầu ra (Deliverables):</span>
                    {wk.keyDeliverables.map((del, didx) => (
                      <div key={didx} className="text-[11px] text-gray-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-purple-600 shrink-0" />
                        <span>{del}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Tasks Breakdown for Team */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                4. Phân Rã Nhiệm Vụ Cho Nhân Sự & Đội Ngũ (Tasks Breakdown)
              </h4>
              <span className="text-xs text-gray-500">{activePlan.tasks.length} nhiệm vụ hành động</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50">
                    <th className="py-2.5 px-3">Tên Nhiệm Vụ</th>
                    <th className="py-2.5 px-3">Vai Trò Phụ Trách</th>
                    <th className="py-2.5 px-3">Mức Ưu Tiên</th>
                    <th className="py-2.5 px-3">Hạn Hoàn Thành</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activePlan.tasks.map((task, tidx) => (
                    <tr key={tidx} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium text-gray-900">{task.title}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700 font-semibold">
                          {task.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            task.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-700'
                              : task.priority === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {task.priority === 'HIGH' ? 'Cao (High)' : task.priority === 'MEDIUM' ? 'Trung bình' : 'Tiêu chuẩn'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">Trong {task.deadlineDays} ngày đầu</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-xs">
          <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">Chưa có kế hoạch chiến dịch nào</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
            Hãy bắt đầu bằng cách nhập brief kinh doanh để AI tự động tạo kế hoạch chiến dịch 360 độ gồm mục tiêu, trục nội dung, lịch đăng và nhiệm vụ.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Sinh Kế Hoạch Chiến Dịch Ngay (F159)
          </button>
        </div>
      )}

      {/* Modal: Create / Generate New Plan */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">Tạo Kế Hoạch Chiến Dịch Với AI (F159)</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên Chiến Dịch *</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="VD: Chiến Dịch Mega Sale Quý 4 - Chốt Đơn Đa Kênh"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Khách Hàng Mục Tiêu *</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="VD: Chủ shop kinh doanh online trên TikTok Shop & Facebook"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ngân Sách Dự Kiến (VNĐ)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Thời Lượng (Ngày)</label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mục Tiêu Trọng Tâm</label>
                <select
                  value={objectiveType}
                  onChange={(e) => setObjectiveType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="LEAD_GENERATION">Thu thập Lead chất lượng (Lead Generation)</option>
                  <option value="SALES_CONVERSION">Bùng nổ chuyển đổi doanh số (Sales Conversion)</option>
                  <option value="BRAND_AWARENESS">Phủ sóng nhận diện thương hiệu (Brand Awareness)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kênh Triển Khai (Chọn ít nhất 1)</label>
                <div className="flex flex-wrap gap-2">
                  {availableChannels.map((ch) => {
                    const isSelected = selectedChannels.includes(ch.id);
                    return (
                      <button
                        type="button"
                        key={ch.id}
                        onClick={() => handleToggleChannel(ch.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mô Tả Sản Phẩm & USP (Điểm Khác Biệt) *
                </label>
                <textarea
                  rows={3}
                  value={productBrief}
                  onChange={(e) => setProductBrief(e.target.value)}
                  placeholder="VD: Phần mềm tự động hóa tương tác chốt đơn đa kênh, giảm 80% thời gian trực chat, lọc khách VIP..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'AI Đang Sinh Kế Hoạch...' : 'Khởi Tạo Kế Hoạch 360°'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
