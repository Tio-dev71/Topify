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
  DollarSign
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
  customer?: { name: string; email?: string } | null;
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dealForm, setDealForm] = useState({
    title: '',
    value: 5000000,
    stageId: 'stage_1',
    customerName: ''
  });

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const [pipeRes, dealsRes] = await Promise.all([
        api.get('/crm/pipelines'),
        api.get('/crm/deals')
      ]);

      if (pipeRes.data?.pipelines?.length > 0) {
        setPipelines(pipeRes.data.pipelines);
        setSelectedPipelineId(pipeRes.data.pipelines[0].id);
      } else {
        setPipelines([{ id: 'default', name: 'Quy trình bán hàng chuẩn', isDefault: true, stages: DEFAULT_STAGES }]);
      }

      if (dealsRes.data?.deals) {
        setDeals(dealsRes.data.deals);
      } else {
        setDeals([
          { id: 'd_1', title: 'Hợp đồng Marketing Trọn Gói - Chuỗi Spa Mai Anh', value: 18000000, stageId: 'stage_2', pipelineId: 'default', status: 'OPEN', createdAt: new Date().toISOString(), customer: { name: 'Mai Anh' } },
          { id: 'd_2', title: 'Gói Chuyển Đổi Số - Cửa Hàng Thời Trang Bella', value: 8500000, stageId: 'stage_1', pipelineId: 'default', status: 'OPEN', createdAt: new Date().toISOString(), customer: { name: 'Bella Boutique' } },
          { id: 'd_3', title: 'Setup Hệ Thống Đa Kênh Tự Động - Gym Fitness X', value: 25000000, stageId: 'stage_4', pipelineId: 'default', status: 'WON', createdAt: new Date().toISOString(), customer: { name: 'Anh Tuấn' } },
        ]);
      }
    } catch {
      setPipelines([{ id: 'default', name: 'Quy trình bán hàng chuẩn', isDefault: true, stages: DEFAULT_STAGES }]);
      setDeals([
        { id: 'd_1', title: 'Hợp đồng Marketing Trọn Gói - Chuỗi Spa Mai Anh', value: 18000000, stageId: 'stage_2', pipelineId: 'default', status: 'OPEN', createdAt: new Date().toISOString(), customer: { name: 'Mai Anh' } },
        { id: 'd_2', title: 'Gói Chuyển Đổi Số - Cửa Hàng Thời Trang Bella', value: 8500000, stageId: 'stage_1', pipelineId: 'default', status: 'OPEN', createdAt: new Date().toISOString(), customer: { name: 'Bella Boutique' } },
        { id: 'd_3', title: 'Setup Hệ Thống Đa Kênh Tự Động - Gym Fitness X', value: 25000000, stageId: 'stage_4', pipelineId: 'default', status: 'WON', createdAt: new Date().toISOString(), customer: { name: 'Anh Tuấn' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const currentPipeline = pipelines.find(p => p.id === selectedPipelineId) || pipelines[0] || { stages: DEFAULT_STAGES };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.title.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post('/crm/deals', {
        title: dealForm.title,
        value: Number(dealForm.value),
        stageId: dealForm.stageId,
        pipelineId: selectedPipelineId,
      });

      if (res.data?.deal) {
        setDeals([res.data.deal, ...deals]);
      } else {
        const newDeal: Deal = {
          id: Date.now().toString(),
          title: dealForm.title,
          value: Number(dealForm.value),
          stageId: dealForm.stageId,
          pipelineId: selectedPipelineId,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          customer: { name: dealForm.customerName || 'Khách hàng mới' }
        };
        setDeals([newDeal, ...deals]);
      }
      toast.success('Đã tạo cơ hội bán hàng mới');
      setIsModalOpen(false);
      setDealForm({ title: '', value: 5000000, stageId: currentPipeline.stages[0]?.id || 'stage_1', customerName: '' });
    } catch {
      toast.error('Lỗi khi tạo cơ hội bán hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeals(deals.filter(d => d.id !== id));
    toast.success('Đã xóa cơ hội');
  };

  const filteredDeals = deals.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Cơ hội bán hàng (Deals - F097)</h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi phễu giao dịch, giá trị hợp đồng và thúc đẩy tỷ lệ chốt đơn theo từng giai đoạn</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Deal Mới</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm deal theo tên hoặc khách hàng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
        />
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
                        className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs hover:shadow-xs transition space-y-2 text-xs group"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-gray-900 line-clamp-2">{deal.title}</h4>
                          <button
                            onClick={() => handleDelete(deal.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1 font-bold text-emerald-600 text-sm">
                          <span>{(deal.value || 0).toLocaleString()} đ</span>
                        </div>

                        {deal.customer && (
                          <div className="flex items-center gap-1 text-[11px] text-gray-500">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="truncate">{deal.customer.name}</span>
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
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Thêm Cơ Hội Bán Hàng</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateDeal} className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên cơ hội / Dự án *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hợp đồng triển khai nội dung Q4"
                  value={dealForm.title}
                  onChange={e => setDealForm({ ...dealForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Giá trị hợp đồng (VNĐ) *</label>
                <input
                  type="number"
                  required
                  value={dealForm.value}
                  onChange={e => setDealForm({ ...dealForm, value: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên khách hàng liên hệ</label>
                <input
                  type="text"
                  placeholder="VD: Anh Minh - Giám đốc Marketing"
                  value={dealForm.customerName}
                  onChange={e => setDealForm({ ...dealForm, customerName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Giai đoạn ban đầu</label>
                <select
                  value={dealForm.stageId}
                  onChange={e => setDealForm({ ...dealForm, stageId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  {currentPipeline.stages.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 rounded-xl font-semibold"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
