import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar,
  User,
  Trash2,
  X,
  Target,
  Kanban,
  DollarSign,
  Users,
  UserPlus,
  Check,
  CheckCircle2,
  Phone,
  Mail,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

type Stage = {
  id: string;
  name: string;
  color?: string | null;
  sortOrder: number;
};

type Pipeline = {
  id: string;
  name: string;
  isDefault: boolean;
  stages: Stage[];
};

type CustomerOption = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  temperature?: 'HOT' | 'WARM' | 'COLD' | string;
  leadScore?: number;
  avatar?: string | null;
};

type Deal = {
  id: string;
  title: string;
  value: number;
  stageId: string;
  pipelineId: string;
  customerId?: string | null;
  expectedClose?: string | null;
  status: string;
  createdAt: string;
  customer?: { id?: string; name: string; email?: string; phone?: string; avatar?: string } | null;
  stage?: { name: string; color?: string } | null;
};

const DEFAULT_STAGES: Stage[] = [
  { id: 'stage_1', name: 'Tiếp cận ban đầu', color: '#6366F1', sortOrder: 1 },
  { id: 'stage_2', name: 'Tư vấn & Báo giá', color: '#3B82F6', sortOrder: 2 },
  { id: 'stage_3', name: 'Đàm phán chốt hợp đồng', color: '#F59E0B', sortOrder: 3 },
  { id: 'stage_4', name: 'Thành công (Won)', color: '#10B981', sortOrder: 4 },
];

export default function Deals() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('default');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Deal form states
  const [dealForm, setDealForm] = useState({
    title: '',
    value: 5000000,
    stageId: 'stage_1',
  });

  // Customer selection / creation states
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustSource, setNewCustSource] = useState('MANUAL');
  const [newCustNotes, setNewCustNotes] = useState('');

  const fetchDealsAndCustomers = async () => {
    setLoading(true);
    try {
      const [pipeRes, dealsRes, custRes] = await Promise.all([
        api.get('/crm/pipelines').catch(() => ({ data: { pipelines: [] } })),
        api.get('/crm/deals').catch(() => ({ data: { deals: [] } })),
        api.get('/crm/customers').catch(() => ({ data: { customers: [] } })),
      ]);

      if (pipeRes.data?.pipelines?.length > 0) {
        setPipelines(pipeRes.data.pipelines);
        setSelectedPipelineId(pipeRes.data.pipelines[0].id);
      } else {
        setPipelines([{ id: 'default', name: 'Quy trình bán hàng chuẩn', isDefault: true, stages: DEFAULT_STAGES }]);
      }

      if (dealsRes.data?.deals?.length > 0) {
        setDeals(dealsRes.data.deals);
      } else {
        setDeals([
          { id: 'd_1', title: 'Hợp đồng Marketing Trọn Gói - Chuỗi Spa Mai Anh', value: 18000000, stageId: 'stage_2', pipelineId: 'default', status: 'OPEN', createdAt: new Date().toISOString(), customer: { name: 'Mai Anh', phone: '0988112233' } },
          { id: 'd_2', title: 'Gói Chuyển Đổi Số - Cửa Hàng Thời Trang Bella', value: 8500000, stageId: 'stage_1', pipelineId: 'default', status: 'OPEN', createdAt: new Date().toISOString(), customer: { name: 'Bella Boutique', phone: '0977223344' } },
          { id: 'd_3', title: 'Setup Hệ Thống Đa Kênh Tự Động - Gym Fitness X', value: 25000000, stageId: 'stage_4', pipelineId: 'default', status: 'WON', createdAt: new Date().toISOString(), customer: { name: 'Anh Tuấn', phone: '0912345678' } },
        ]);
      }

      if (custRes.data?.customers?.length > 0) {
        setCustomers(custRes.data.customers);
      }
    } catch {
      setPipelines([{ id: 'default', name: 'Quy trình bán hàng chuẩn', isDefault: true, stages: DEFAULT_STAGES }]);
      setDeals([
        { id: 'd_1', title: 'Hợp đồng Marketing Trọn Gói - Chuỗi Spa Mai Anh', value: 18000000, stageId: 'stage_2', pipelineId: 'default', status: 'OPEN', createdAt: new Date().toISOString(), customer: { name: 'Mai Anh', phone: '0988112233' } },
        { id: 'd_2', title: 'Gói Chuyển Đổi Số - Cửa Hàng Thời Trang Bella', value: 8500000, stageId: 'stage_1', pipelineId: 'default', status: 'OPEN', createdAt: new Date().toISOString(), customer: { name: 'Bella Boutique', phone: '0977223344' } },
        { id: 'd_3', title: 'Setup Hệ Thống Đa Kênh Tự Động - Gym Fitness X', value: 25000000, stageId: 'stage_4', pipelineId: 'default', status: 'WON', createdAt: new Date().toISOString(), customer: { name: 'Anh Tuấn', phone: '0912345678' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealsAndCustomers();
  }, []);

  const currentPipeline = pipelines.find(p => p.id === selectedPipelineId) || pipelines[0] || { stages: DEFAULT_STAGES };

  const handleOpenCreateModal = () => {
    setDealForm({
      title: '',
      value: 5000000,
      stageId: currentPipeline.stages[0]?.id || 'stage_1',
    });
    setCustomerMode('existing');
    setSelectedCustomerId('');
    setCustomerSearchQuery('');
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewCustSource('MANUAL');
    setNewCustNotes('');
    setIsModalOpen(true);
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.title.trim()) {
      toast.error('Vui lòng nhập tên cơ hội / dự án');
      return;
    }

    if (customerMode === 'new' && !newCustName.trim()) {
      toast.error('Vui lòng nhập họ và tên khách hàng mới');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: dealForm.title.trim(),
        value: Number(dealForm.value) || 0,
        stageId: dealForm.stageId,
        pipelineId: selectedPipelineId,
      };

      if (customerMode === 'existing' && selectedCustomerId) {
        payload.customerId = selectedCustomerId;
      } else if (customerMode === 'new' && newCustName.trim()) {
        payload.newCustomer = {
          name: newCustName.trim(),
          phone: newCustPhone.trim() || undefined,
          email: newCustEmail.trim() || undefined,
          source: newCustSource,
          notes: newCustNotes.trim() || undefined,
        };
      }

      const res = await api.post('/crm/deals', payload);
      const createdDeal = res.data?.deal || res.data;

      if (createdDeal?.id) {
        setDeals(prev => [createdDeal, ...prev]);
      } else {
        const selectedCust = customers.find(c => c.id === selectedCustomerId);
        const newDeal: Deal = {
          id: Date.now().toString(),
          title: dealForm.title,
          value: Number(dealForm.value),
          stageId: dealForm.stageId,
          pipelineId: selectedPipelineId,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          customer: customerMode === 'existing' && selectedCust
            ? { name: selectedCust.name, phone: selectedCust.phone || undefined, email: selectedCust.email || undefined }
            : { name: newCustName || 'Khách hàng mới', phone: newCustPhone || undefined, email: newCustEmail || undefined }
        };
        setDeals(prev => [newDeal, ...prev]);
      }

      if (res.data?.createdCustomer) {
        setCustomers(prev => [res.data.createdCustomer, ...prev]);
        toast.success(`Đã tạo Deal và đồng bộ khách hàng "${newCustName.trim()}" vào CRM thành công!`);
      } else {
        toast.success('Đã tạo cơ hội bán hàng mới thành công!');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo cơ hội bán hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveStage = async (dealId: string, stageId: string) => {
    try {
      await api.patch('/crm/deals', { id: dealId, stageId });
      setDeals(deals.map(d => d.id === dealId ? { ...d, stageId } : d));
      toast.success('Đã cập nhật giai đoạn cơ hội');
    } catch {
      toast.error('Lỗi khi cập nhật giai đoạn');
    }
  };

  const handleDelete = async (id: string, title?: string) => {
    if (!confirm(`Bạn có chắc muốn xóa cơ hội "${title || 'này'}"?`)) return;
    try {
      await api.delete(`/crm/deals?id=${id}`).catch(() => {});
      setDeals(deals.filter(d => d.id !== id));
      toast.success('Đã xóa cơ hội');
    } catch {
      toast.error('Lỗi khi xóa cơ hội');
    }
  };

  const filteredDeals = deals.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.customer?.phone && d.customer.phone.includes(searchTerm))
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const filteredCustomers = customers.filter(c => {
    if (!customerSearchQuery.trim()) return true;
    const q = customerSearchQuery.toLowerCase().trim();
    return (
      c.name?.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cơ hội bán hàng & Nguồn Lead (Deals - F096 | Lead Source - F097)</h1>
          <p className="text-sm text-gray-500 mt-1">Cơ hội bán hàng: giá trị, xác suất, người phụ trách, dự kiến chốt (F096) và theo dõi nguồn lead liên hệ (F097)</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Deal Mới</span>
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm deal theo tên hoặc khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-3">
          <span>Tổng số cơ hội: <strong className="text-gray-900 font-semibold">{filteredDeals.length}</strong></span>
          <span>•</span>
          <span>Khách hàng CRM kết nối: <strong className="text-indigo-600 font-semibold">{customers.length}</strong></span>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Đang tải phễu cơ hội...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {currentPipeline.stages.map((stage) => {
            const stageDeals = filteredDeals.filter(d => d.stageId === stage.id);
            const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

            return (
              <div key={stage.id} className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-3 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color || '#6366F1' }}
                    />
                    <h3 className="font-bold text-xs text-gray-900">{stage.name}</h3>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {stageDeals.length}
                  </span>
                </div>

                <div className="text-[11px] text-gray-500 font-semibold px-1">
                  Tổng: <span className="font-bold text-indigo-700">{totalValue.toLocaleString()} đ</span>
                </div>

                <div className="space-y-2.5 min-h-[150px]">
                  {stageDeals.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-gray-400 border border-dashed border-gray-200 rounded-xl bg-white">
                      Trống
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs hover:shadow-xs transition space-y-2.5 text-xs group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-gray-900 line-clamp-2">{deal.title}</h4>
                          <button
                            onClick={() => handleDelete(deal.id, deal.title)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-600 p-0.5 transition shrink-0"
                            title="Xóa cơ hội"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="font-bold text-emerald-600 text-sm">
                            {(deal.value || 0).toLocaleString()} đ
                          </div>
                          
                          {/* Quick stage switch */}
                          <select
                            value={deal.stageId}
                            onChange={(e) => handleMoveStage(deal.id, e.target.value)}
                            className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-600 hover:border-indigo-300 cursor-pointer focus:outline-none"
                            title="Chuyển giai đoạn"
                          >
                            {currentPipeline.stages.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>

                        {deal.customer && (
                          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate font-semibold text-gray-800">{deal.customer.name}</span>
                            </div>
                            {deal.customer.phone && (
                              <span className="text-[10px] text-gray-400 shrink-0 font-mono">{deal.customer.phone}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Thêm Cơ Hội Bán Hàng</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Tạo giao dịch và đồng bộ thông tin khách hàng với CRM</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3.5">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên cơ hội / Dự án *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hợp đồng triển khai nội dung Q4"
                  value={dealForm.title}
                  onChange={e => setDealForm({ ...dealForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Giá trị hợp đồng (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100000}
                    value={dealForm.value}
                    onChange={e => setDealForm({ ...dealForm, value: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Giai đoạn ban đầu</label>
                  <select
                    value={dealForm.stageId}
                    onChange={e => setDealForm({ ...dealForm, stageId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-xs bg-white"
                  >
                    {currentPipeline.stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section: Khách hàng liên hệ (Chọn từ CRM hoặc Thêm mới) */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Khách hàng liên hệ</span>
                  </label>
                  <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCustomerMode('existing')}
                      className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                        customerMode === 'existing'
                          ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      <span>Chọn từ CRM ({customers.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('new')}
                      className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                        customerMode === 'new'
                          ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Thêm khách mới</span>
                    </button>
                  </div>
                </div>

                {customerMode === 'existing' ? (
                  <div className="space-y-2">
                    {selectedCustomer ? (
                      <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {selectedCustomer.name?.slice(0, 1).toUpperCase() || 'K'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900 text-xs truncate">
                                {selectedCustomer.name}
                              </span>
                              {selectedCustomer.temperature === 'HOT' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700">HOT 🔥</span>
                              )}
                              {selectedCustomer.temperature === 'WARM' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">WARM ⚡</span>
                              )}
                              {selectedCustomer.temperature === 'COLD' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">COLD ❄️</span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-2 truncate mt-0.5">
                              {selectedCustomer.phone && <span className="font-mono">{selectedCustomer.phone}</span>}
                              {selectedCustomer.email && <span>• {selectedCustomer.email}</span>}
                              {selectedCustomer.source && <span className="uppercase text-[9px] px-1 bg-gray-100 text-gray-600 rounded">{selectedCustomer.source}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedCustomerId(''); setCustomerSearchQuery(''); }}
                          className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white text-xs font-semibold flex items-center gap-1 transition"
                          title="Chọn khách hàng khác"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Tìm khách hàng theo Tên, SĐT hoặc Email..."
                            value={customerSearchQuery}
                            onChange={e => setCustomerSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                          />
                          {customerSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setCustomerSearchQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Customer List Dropdown */}
                        <div className="max-h-40 overflow-y-auto border border-gray-200/80 rounded-xl bg-gray-50/50 p-1 divide-y divide-gray-100">
                          {filteredCustomers.length === 0 ? (
                            <div className="py-3 px-3 text-center space-y-1.5">
                              <p className="text-[11px] text-gray-500">
                                {customerSearchQuery
                                  ? `Không tìm thấy khách hàng nào khớp với "${customerSearchQuery}"`
                                  : 'Chưa có khách hàng nào trong hệ thống CRM.'}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomerMode('new');
                                  if (customerSearchQuery) setNewCustName(customerSearchQuery);
                                }}
                                className="text-xs text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Thêm mới khách hàng ngay</span>
                              </button>
                            </div>
                          ) : (
                            filteredCustomers.map(c => (
                              <div
                                key={c.id}
                                onClick={() => setSelectedCustomerId(c.id)}
                                className="p-2 rounded-lg hover:bg-white cursor-pointer transition flex items-center justify-between group"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-gray-800 text-xs truncate group-hover:text-indigo-600">
                                      {c.name}
                                    </span>
                                    {c.temperature === 'HOT' && (
                                      <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700">HOT 🔥</span>
                                    )}
                                    {c.temperature === 'WARM' && (
                                      <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700">WARM ⚡</span>
                                    )}
                                    {c.temperature === 'COLD' && (
                                      <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-700">COLD ❄️</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-400 flex items-center gap-2 truncate mt-0.5">
                                    {c.phone && <span className="font-mono">{c.phone}</span>}
                                    {c.email && <span>• {c.email}</span>}
                                    {c.source && <span className="uppercase text-[9px] px-1 bg-gray-200/60 text-gray-600 rounded">{c.source}</span>}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="text-[11px] text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition shrink-0 bg-indigo-50 px-2 py-0.5 rounded"
                                >
                                  Chọn
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* New Customer Form */
                  <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-indigo-100/60">
                      <span className="font-bold text-[11px] text-indigo-900 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        Thông tin khách hàng mới
                      </span>
                      <span className="text-[10px] text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-full font-medium">
                        Tự động đồng bộ CRM
                      </span>
                    </div>

                    <div>
                      <label className="font-medium text-gray-700 text-[11px] block mb-1">
                        Họ và tên khách hàng *
                      </label>
                      <input
                        type="text"
                        required={customerMode === 'new'}
                        placeholder="VD: Anh Minh - Giám đốc Marketing"
                        value={newCustName}
                        onChange={e => setNewCustName(e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="font-medium text-gray-700 text-[11px] block mb-1">
                          Số điện thoại
                        </label>
                        <input
                          type="text"
                          placeholder="VD: 0912 345 678"
                          value={newCustPhone}
                          onChange={e => setNewCustPhone(e.target.value)}
                          className="w-full p-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-medium text-gray-700 text-[11px] block mb-1">
                          Địa chỉ Email
                        </label>
                        <input
                          type="email"
                          placeholder="VD: minh@example.com"
                          value={newCustEmail}
                          onChange={e => setNewCustEmail(e.target.value)}
                          className="w-full p-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="font-medium text-gray-700 text-[11px] block mb-1">
                          Kênh nguồn
                        </label>
                        <select
                          value={newCustSource}
                          onChange={e => setNewCustSource(e.target.value)}
                          className="w-full p-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="MANUAL">Trực tiếp / Thủ công</option>
                          <option value="TIKTOK">TikTok Shop / Video</option>
                          <option value="FACEBOOK">Facebook Fanpage</option>
                          <option value="ZALO">Zalo OA / Chat</option>
                          <option value="INSTAGRAM">Instagram Direct</option>
                          <option value="LANDING_PAGE">Landing Page</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700 text-[11px] block mb-1">
                          Ghi chú nhu cầu
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Quan tâm gói marketing Q4"
                          value={newCustNotes}
                          onChange={e => setNewCustNotes(e.target.value)}
                          className="w-full p-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-indigo-700/80 bg-indigo-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                      <span>💡</span>
                      <span>Khách hàng này sẽ được tự động thêm vào danh sách Khách hàng (CRM) và gắn liền với Deal này.</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 rounded-xl font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {submitting ? (
                    <span>Đang tạo Deal...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Tạo Deal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
