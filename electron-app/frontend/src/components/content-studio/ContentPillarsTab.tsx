import { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Search,
  Edit2,
  X,
  Calendar,
  Target,
  Clock,
  Tag,
  FolderPlus,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';

export interface ContentPillar {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  _count?: {
    plans: number;
  };
}

export interface ContentPlanItem {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  pillarId: string | null;
  workspaceId?: string | null;
  pillar?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

export interface ParsedPlanDetails {
  planGroup: string;
  focus: string;
  target: string;
}

export function parsePlanDescription(desc: string | null): ParsedPlanDetails {
  if (!desc) return { planGroup: 'Kế hoạch Tháng 10/2026', focus: '', target: '' };
  try {
    const parsed = JSON.parse(desc);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        planGroup: parsed.planGroup || 'Kế hoạch Tháng 10/2026',
        focus: parsed.focus || '',
        target: parsed.target || '',
      };
    }
  } catch {}

  // Fallback for plain text containing "Trọng tâm:" or "Target:"
  const targetMatch = desc.match(/Target:\s*([^\n]+)/i);
  const target = targetMatch ? targetMatch[1].trim() : '';
  const focus = desc.replace(/Target:\s*[^\n]+/i, '').trim();
  return {
    planGroup: 'Kế hoạch Tháng 10/2026',
    focus,
    target,
  };
}

export function ContentPillarsTab() {
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [plans, setPlans] = useState<ContentPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [search, setSearch] = useState('');

  // Modals for Pillars
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#5B3DF5' });

  const [editingPillar, setEditingPillar] = useState<ContentPillar | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', color: '#5B3DF5' });
  const [isUpdating, setIsUpdating] = useState(false);

  // Sub-tab: Pillars vs Plans
  const [viewMode, setViewMode] = useState<'pillars' | 'plans'>('pillars');

  // Plan Group Selection (Multiple Plans support)
  const [selectedPlanGroup, setSelectedPlanGroup] = useState<string>('ALL');

  // Modals for Plans
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    title: '',
    focus: '',
    target: '',
    planGroup: 'Kế hoạch Tháng 10/2026',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    pillarId: '',
  });

  const [editingPlan, setEditingPlan] = useState<ContentPlanItem | null>(null);
  const [editPlanFormData, setEditPlanFormData] = useState({
    title: '',
    focus: '',
    target: '',
    planGroup: 'Kế hoạch Tháng 10/2026',
    startDate: '',
    endDate: '',
    pillarId: '',
  });
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  const predefinedColors = [
    '#5B3DF5', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#F97316'
  ];

  const fetchPillars = async () => {
    try {
      setLoading(true);
      const res = await api.get('/content/pillars');
      if (res.data) {
        setPillars(res.data.pillars || []);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách Trụ cột nội dung');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await api.get('/content/plans');
      if (res.data) {
        setPlans(res.data.plans || []);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách Kế hoạch nội dung');
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchPillars();
    fetchPlans();
  }, []);

  // Distinct plan groups for tabs
  const distinctPlanGroups = Array.from(
    new Set(plans.map((p) => parsePlanDescription(p.description).planGroup).filter(Boolean))
  );

  const handleCreatePillar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên trụ cột nội dung');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/content/pillars', formData);
      if (res.data) {
        toast.success(`Đã thêm trụ cột nội dung "${formData.name}" thành công!`);
        setIsModalOpen(false);
        setFormData({ name: '', description: '', color: '#5B3DF5' });
        fetchPillars();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi tạo trụ cột nội dung');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePillar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPillar) return;
    try {
      setIsUpdating(true);
      const res = await api.patch('/content/pillars', {
        id: editingPillar.id,
        ...editFormData
      });
      if (res.data) {
        toast.success('Đã cập nhật trụ cột nội dung thành công!');
        setPillars(prev => prev.map(p => p.id === editingPillar.id ? { ...p, ...editFormData } : p));
        setEditingPillar(null);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi cập nhật trụ cột nội dung');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePillar = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xoá trụ cột "${name}"? Các bài viết và kế hoạch liên quan sẽ được tách ra.`)) {
      return;
    }
    try {
      await api.delete(`/content/pillars?id=${id}`);
      toast.success(`Đã xoá trụ cột "${name}"`);
      setPillars(prev => prev.filter(p => p.id !== id));
      fetchPlans();
    } catch {
      toast.error('Lỗi khi xoá trụ cột');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề kế hoạch');
      return;
    }

    try {
      setIsSubmittingPlan(true);
      const res = await api.post('/content/plans', planFormData);
      if (res.data) {
        toast.success(`Đã thêm kế hoạch "${planFormData.title}" thành công!`);
        setIsPlanModalOpen(false);
        fetchPlans();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi tạo kế hoạch');
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    if (!editPlanFormData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề kế hoạch');
      return;
    }

    try {
      setIsUpdatingPlan(true);
      const res = await api.patch('/content/plans', {
        id: editingPlan.id,
        ...editPlanFormData,
      });
      if (res.data) {
        toast.success('Đã cập nhật kế hoạch thành công!');
        setEditingPlan(null);
        fetchPlans();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi cập nhật kế hoạch');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleDeletePlan = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xoá kế hoạch "${title}"?`)) {
      return;
    }
    try {
      await api.delete(`/content/plans?id=${id}`);
      toast.success(`Đã xoá kế hoạch "${title}"`);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch {
      toast.error('Lỗi khi xoá kế hoạch');
    }
  };

  const filteredPillars = pillars.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredPlans = plans.filter((plan) => {
    const details = parsePlanDescription(plan.description);
    const matchesGroup = selectedPlanGroup === 'ALL' || details.planGroup === selectedPlanGroup;
    const matchesSearch =
      !search ||
      plan.title.toLowerCase().includes(search.toLowerCase()) ||
      details.focus.toLowerCase().includes(search.toLowerCase()) ||
      details.target.toLowerCase().includes(search.toLowerCase()) ||
      (plan.pillar?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-sm">
              Trụ Cột Nội Dung (Content Pillar - F073) & Kế Hoạch Tháng/Quý (F074)
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Phân bổ tỷ trọng chủ đề cốt lõi (Kiến thức, Bán hàng, Giải trí, Review) để giữ nhịp độ kênh đa dạng, chuyên nghiệp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white p-1 rounded-xl border border-indigo-200">
            <button
              onClick={() => setViewMode('pillars')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'pillars'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Trụ cột (Pillars)
            </button>
            <button
              onClick={() => setViewMode('plans')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'plans'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kế hoạch tháng/quý (Plans)
            </button>
          </div>

          <button
            onClick={() => {
              if (viewMode === 'pillars') {
                setIsModalOpen(true);
              } else {
                setPlanFormData({
                  title: '',
                  focus: '',
                  target: '',
                  planGroup: selectedPlanGroup === 'ALL' ? (distinctPlanGroups[0] || 'Kế hoạch Tháng 10/2026') : selectedPlanGroup,
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                  pillarId: pillars[0]?.id || '',
                });
                setIsPlanModalOpen(true);
              }
            }}
            className="btn-primary py-2 px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{viewMode === 'pillars' ? 'Thêm Trụ Cột Mới' : 'Thêm Kế Hoạch Mới'}</span>
          </button>
        </div>
      </div>

      {viewMode === 'pillars' ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm trụ cột theo tên hoặc mô tả chiến dịch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Pillars Grid */}
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Đang tải danh sách trụ cột nội dung...</div>
          ) : filteredPillars.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Chưa có Trụ Cột Nội Dung nào</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Hãy định hình các trụ cột chính (ví dụ: "70% Chia sẻ kiến thức & Mẹo", "20% Review & Case Study", "10% Giảm giá & Bán hàng") để chiến lược nội dung đồng nhất.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Khởi tạo Trụ Cột Đầu Tiên</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredPillars.map((pillar) => (
                <div
                  key={pillar.id}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:border-indigo-200 hover:shadow-xs transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-2xs"
                          style={{ backgroundColor: pillar.color || '#5B3DF5' }}
                        />
                        <h4 className="font-bold text-gray-900 text-sm">{pillar.name}</h4>
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-100">
                        {pillar._count?.plans || 0} kế hoạch
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed min-h-[40px]">
                      {pillar.description || <span className="text-gray-400 italic">Chưa có mô tả chi tiết cho trụ cột này.</span>}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      Tạo ngày {new Date(pillar.createdAt).toLocaleDateString('vi-VN')}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingPillar(pillar);
                          setEditFormData({
                            name: pillar.name,
                            description: pillar.description || '',
                            color: pillar.color || '#5B3DF5'
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePillar(pillar.id, pillar.name)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-rose-600 transition"
                        title="Xoá trụ cột"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Content Plan Tháng/Quý (F074) */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-6 space-y-5">
          {/* Plan Header & Subtitle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-indigo-600" />
                Lập Kế Hoạch Nội Dung Tháng & Quý (F074)
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Xếp lịch các đợt phát hành bài viết theo tuần, tháng và quý gắn liền với mục tiêu tăng trưởng
              </p>
            </div>

            <button
              onClick={() => {
                setPlanFormData({
                  title: '',
                  focus: '',
                  target: '',
                  planGroup: selectedPlanGroup === 'ALL' ? (distinctPlanGroups[0] || 'Kế hoạch Tháng 10/2026') : selectedPlanGroup,
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                  pillarId: pillars[0]?.id || '',
                });
                setIsPlanModalOpen(true);
              }}
              className="btn-primary py-2 px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Kế Hoạch Mới</span>
            </button>
          </div>

          {/* Multiple Plans Switcher & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 pr-1">
                <FolderPlus className="w-3.5 h-3.5" />
                Bản kế hoạch:
              </span>

              <button
                onClick={() => setSelectedPlanGroup('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  selectedPlanGroup === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tất cả ({plans.length})
              </button>

              {distinctPlanGroups.map((group) => {
                const count = plans.filter(p => parsePlanDescription(p.description).planGroup === group).length;
                return (
                  <button
                    key={group}
                    onClick={() => setSelectedPlanGroup(group)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
                      selectedPlanGroup === group
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {group} ({count})
                  </button>
                );
              })}
            </div>

            {/* Quick search within plans */}
            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kế hoạch, tuần, target..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Plan Cards Grid */}
          {loadingPlans ? (
            <div className="py-12 text-center text-xs text-gray-400">Đang tải dữ liệu kế hoạch nội dung...</div>
          ) : filteredPlans.length === 0 ? (
            <div className="p-10 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Calendar className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-gray-900">Không tìm thấy kế hoạch phù hợp</h5>
              <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                {selectedPlanGroup !== 'ALL'
                  ? `Bản kế hoạch "${selectedPlanGroup}" hiện chưa có giai đoạn nào.`
                  : 'Chưa có kế hoạch nội dung nào trong hệ thống.'}
              </p>
              <button
                onClick={() => {
                  setPlanFormData({
                    title: '',
                    focus: '',
                    target: '',
                    planGroup: selectedPlanGroup === 'ALL' ? 'Kế hoạch Tháng Mới' : selectedPlanGroup,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                    pillarId: pillars[0]?.id || '',
                  });
                  setIsPlanModalOpen(true);
                }}
                className="btn-primary py-1.5 px-3.5 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo Kế Hoạch Ngay</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {filteredPlans.map((plan) => {
                const details = parsePlanDescription(plan.description);
                const pillarColor = plan.pillar?.color || '#5B3DF5';
                const hasPillar = !!plan.pillar;

                return (
                  <div
                    key={plan.id}
                    className="p-4 rounded-2xl border border-gray-200/80 bg-white hover:border-indigo-300 hover:shadow-xs transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Top Header: Title & Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-semibold mb-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200/60 truncate max-w-[130px]" title={details.planGroup}>
                              {details.planGroup}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-gray-900 leading-snug">
                            {plan.title}
                          </h5>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingPlan(plan);
                              setEditPlanFormData({
                                title: plan.title,
                                focus: details.focus,
                                target: details.target,
                                planGroup: details.planGroup,
                                startDate: plan.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : '',
                                endDate: plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '',
                                pillarId: plan.pillarId || '',
                              });
                            }}
                            className="p-1 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition cursor-pointer"
                            title="Chỉnh sửa kế hoạch"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id, plan.title)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition cursor-pointer"
                            title="Xóa kế hoạch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Associated Content Pillar Badge */}
                      <div className="flex items-center gap-1.5">
                        {hasPillar ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold border"
                            style={{
                              backgroundColor: `${pillarColor}15`,
                              borderColor: `${pillarColor}40`,
                              color: pillarColor,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: pillarColor }}
                            />
                            <span className="truncate max-w-[140px]">{plan.pillar?.name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            <Tag className="w-2.5 h-2.5" />
                            <span>Chưa gắn trụ cột</span>
                          </span>
                        )}
                      </div>

                      {/* Focus Description */}
                      <p className="text-[11px] text-gray-600 leading-relaxed min-h-[36px]">
                        {details.focus ? (
                          <span><strong className="text-gray-700">Trọng tâm:</strong> {details.focus}</span>
                        ) : (
                          <span className="text-gray-400 italic">Chưa có mô tả trọng tâm</span>
                        )}
                      </p>
                    </div>

                    {/* Bottom Metadata & Target */}
                    <div className="pt-2.5 border-t border-gray-100 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-gray-600">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{formatDateDisplay(plan.startDate)} – {formatDateDisplay(plan.endDate)}</span>
                        </span>
                      </div>

                      {details.target ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50/80 text-indigo-700 font-semibold border border-indigo-200 flex items-center gap-1">
                            <Target className="w-2.5 h-2.5" />
                            Target: {details.target}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-600 italic">Chưa đặt target</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Tạo Trụ Cột Mới (F073) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Tạo Trụ Cột Nội Dung (F073)</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePillar} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Tên Trụ Cột <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kiến thức chuyên môn, Review sản phẩm, Khuyến mãi..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Mô Tả Định Hướng</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả mục tiêu, phong cách và thông điệp cốt lõi cho trụ cột này..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Màu Sắc Nhận Diện</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-7 h-7 rounded-xl transition-transform ${
                        formData.color === color ? 'scale-115 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Tạo Trụ Cột'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sửa Trụ Cột */}
      {editingPillar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>Chỉnh Sửa Trụ Cột</span>
              </h3>
              <button
                onClick={() => setEditingPillar(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePillar} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Tên Trụ Cột</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Mô Tả Định Hướng</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Màu Sắc Nhận Diện</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, color })}
                      className={`w-7 h-7 rounded-xl transition-transform ${
                        editFormData.color === color ? 'scale-115 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPillar(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isUpdating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo Kế Hoạch Mới (F074) */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Thêm Kế Hoạch / Giai Đoạn Mới (F074)</span>
              </h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Bản Kế Hoạch / Chiến Dịch <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    list="plan-groups-list"
                    placeholder="Ví dụ: Kế hoạch Tháng 10/2026..."
                    value={planFormData.planGroup}
                    onChange={(e) => setPlanFormData({ ...planFormData, planGroup: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  <datalist id="plan-groups-list">
                    {distinctPlanGroups.map(g => (
                      <option key={g} value={g} />
                    ))}
                    <option value="Kế hoạch Tháng 10/2026" />
                    <option value="Kế hoạch Tháng 11/2026 - Mega Sale" />
                    <option value="Chiến dịch Q4/2026 - Tết Nguyên Đán" />
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Trụ Cột Gắn Kết</label>
                  <select
                    value={planFormData.pillarId}
                    onChange={(e) => setPlanFormData({ ...planFormData, pillarId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Không chọn (Chưa phân loại) --</option>
                    {pillars.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Tiêu Đề Giai Đoạn / Tuần <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tuần 1: Nhận diện & Giáo dục, Tuần 2: Tương tác..."
                  value={planFormData.title}
                  onChange={(e) => setPlanFormData({ ...planFormData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Ngày Bắt Đầu</label>
                  <input
                    type="date"
                    required
                    value={planFormData.startDate}
                    onChange={(e) => setPlanFormData({ ...planFormData, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Ngày Kết Thúc</label>
                  <input
                    type="date"
                    required
                    value={planFormData.endDate}
                    onChange={(e) => setPlanFormData({ ...planFormData, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Trọng Tâm Nội Dung (Focus)</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả trọng tâm nội dung: chia sẻ kiến thức, hướng dẫn, mini-game, ưu đãi..."
                  value={planFormData.focus}
                  onChange={(e) => setPlanFormData({ ...planFormData, focus: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Mục Tiêu Số Lượng (Target)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 10 bài / 4 kênh, 15 video ngắn..."
                  value={planFormData.target}
                  onChange={(e) => setPlanFormData({ ...planFormData, target: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPlan}
                  className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isSubmittingPlan ? 'Đang lưu...' : 'Tạo Kế Hoạch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Kế Hoạch (F074) */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>Chỉnh Sửa Kế Hoạch / Giai Đoạn (F074)</span>
              </h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlan} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Bản Kế Hoạch / Chiến Dịch <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    list="edit-plan-groups-list"
                    value={editPlanFormData.planGroup}
                    onChange={(e) => setEditPlanFormData({ ...editPlanFormData, planGroup: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  <datalist id="edit-plan-groups-list">
                    {distinctPlanGroups.map(g => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Trụ Cột Gắn Kết</label>
                  <select
                    value={editPlanFormData.pillarId}
                    onChange={(e) => setEditPlanFormData({ ...editPlanFormData, pillarId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Không chọn (Chưa phân loại) --</option>
                    {pillars.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Tiêu Đề Giai Đoạn / Tuần <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editPlanFormData.title}
                  onChange={(e) => setEditPlanFormData({ ...editPlanFormData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Ngày Bắt Đầu</label>
                  <input
                    type="date"
                    required
                    value={editPlanFormData.startDate}
                    onChange={(e) => setEditPlanFormData({ ...editPlanFormData, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Ngày Kết Thúc</label>
                  <input
                    type="date"
                    required
                    value={editPlanFormData.endDate}
                    onChange={(e) => setEditPlanFormData({ ...editPlanFormData, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Trọng Tâm Nội Dung (Focus)</label>
                <textarea
                  rows={2}
                  value={editPlanFormData.focus}
                  onChange={(e) => setEditPlanFormData({ ...editPlanFormData, focus: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Mục Tiêu Số Lượng (Target)</label>
                <input
                  type="text"
                  value={editPlanFormData.target}
                  onChange={(e) => setEditPlanFormData({ ...editPlanFormData, target: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPlan}
                  className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isUpdatingPlan ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
