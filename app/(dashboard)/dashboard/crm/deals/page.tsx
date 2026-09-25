'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Calendar,
  Building2,
  User,
  Trash2,
  RefreshCw,
  X,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

type Customer = {
  id: string;
  name: string;
  company?: string | null;
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

export default function DealsPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newDeal, setNewDeal] = useState({
    title: '',
    value: '',
    customerId: '',
    stageId: '',
    expectedClose: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      fetchDeals(selectedPipelineId);
    }
  }, [selectedPipelineId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [pipeRes, custRes] = await Promise.all([
        fetch('/api/crm/pipelines'),
        fetch('/api/crm/customers')
      ]);

      if (pipeRes.ok) {
        const pipeData = await pipeRes.json();
        const pList: Pipeline[] = pipeData.pipelines || [];
        setPipelines(pList);
        if (pList.length > 0) {
          const defaultPipe = pList.find(p => p.isDefault) || pList[0];
          setSelectedPipelineId(defaultPipe.id);
        }
      }

      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData.customers || []);
      }
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu ban đầu');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async (pipelineId: string) => {
    try {
      const res = await fetch(`/api/crm/deals?pipelineId=${pipelineId}`);
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách giao dịch');
    }
  };

  const currentPipeline = pipelines.find(p => p.id === selectedPipelineId) || pipelines[0];
  const stages = currentPipeline?.stages || [];

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.title.trim()) {
      toast.error('Vui lòng nhập tên giao dịch');
      return;
    }

    const stageId = newDeal.stageId || stages[0]?.id;
    if (!stageId) {
      toast.error('Phễu hiện tại không có bước nào để tạo giao dịch');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDeal.title.trim(),
          value: parseFloat(newDeal.value) || 0,
          pipelineId: selectedPipelineId,
          stageId,
          customerId: newDeal.customerId || undefined,
          expectedClose: newDeal.expectedClose || undefined,
        })
      });

      if (res.ok) {
        toast.success('Tạo giao dịch thành công');
        setShowAddModal(false);
        setNewDeal({
          title: '',
          value: '',
          customerId: '',
          stageId: '',
          expectedClose: '',
        });
        fetchDeals(selectedPipelineId);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi tạo giao dịch');
      }
    } catch (err) {
      toast.error('Lỗi máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStageChange = async (dealId: string, newStageId: string) => {
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          stageId: newStageId
        })
      });

      if (res.ok) {
        toast.success('Đã cập nhật giai đoạn');
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stageId: newStageId } : d));
      } else {
        toast.error('Không thể chuyển giai đoạn');
      }
    } catch (err) {
      toast.error('Lỗi máy chủ');
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;

    try {
      const res = await fetch(`/api/crm/deals?id=${dealId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa giao dịch');
        setDeals(prev => prev.filter(d => d.id !== dealId));
      } else {
        toast.error('Không thể xóa giao dịch');
      }
    } catch (err) {
      toast.error('Lỗi máy chủ');
    }
  };

  const filteredDeals = deals.filter(deal => 
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="flex-none p-6 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-[#5B3DF5]" />
              Giao dịch (Deals)
            </h1>
            <p className="text-[var(--color-muted-foreground)] mt-1">Quản lý và theo dõi các cơ hội bán hàng trên Kanban Board</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchDeals(selectedPipelineId)}
              className="p-2 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => {
                setNewDeal(prev => ({ ...prev, stageId: stages[0]?.id || '' }));
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Tạo giao dịch mới
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <input 
                type="text" 
                placeholder="Tìm kiếm giao dịch..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
              <span>Phễu bán hàng:</span>
              <select 
                value={selectedPipelineId}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
                className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-3 py-1 font-medium text-[var(--color-foreground)] focus:outline-none cursor-pointer text-sm"
              >
                {pipelines.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isDefault ? '(Mặc định)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {loading && deals.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[var(--color-muted-foreground)] text-sm">
            Đang tải dữ liệu Kanban...
          </div>
        ) : (
          <div className="flex gap-6 h-full min-w-max">
            {stages.map(stage => {
              const stageDeals = filteredDeals.filter(d => d.stageId === stage.id);
              const totalAmount = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

              return (
                <div key={stage.id} className="w-80 flex flex-col h-full bg-[var(--color-muted)]/20 rounded-2xl p-3 border border-[var(--color-border)]/60">
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: stage.color || '#3B82F6' }} 
                      />
                      <h3 className="font-semibold text-[var(--color-foreground)] text-sm">{stage.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] text-xs font-medium">
                        {stageDeals.length}
                      </span>
                    </div>
                  </div>

                  {/* Stage Total */}
                  <div className="mb-3 px-1 text-xs text-[var(--color-muted-foreground)] font-medium">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {stageDeals.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[var(--color-muted-foreground)] border border-dashed border-[var(--color-border)] rounded-xl">
                        Chưa có giao dịch
                      </div>
                    ) : (
                      stageDeals.map(deal => (
                        <div 
                          key={deal.id}
                          className="p-4 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#1a1b1e] shadow-sm hover:shadow-md hover:border-[var(--color-primary)] transition-all group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                              {deal.title}
                            </h4>
                            <button
                              onClick={() => handleDeleteDeal(deal.id)}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              title="Xóa giao dịch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="text-base font-bold text-[var(--color-foreground)] mb-3 flex items-center gap-1">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(deal.value || 0)}
                          </div>

                          <div className="space-y-1.5 text-xs text-[var(--color-muted-foreground)]">
                            {deal.customer && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <span className="truncate">{deal.customer.name}</span>
                              </div>
                            )}
                            {deal.expectedClose && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span>{format(new Date(deal.expectedClose), 'dd/MM/yyyy')}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Stage Mover */}
                          <div className="mt-3 pt-2 border-t border-[var(--color-border)]/50 flex items-center justify-between">
                            <span className="text-[11px] text-[var(--color-muted-foreground)]">Chuyển:</span>
                            <select
                              value={deal.stageId}
                              onChange={(e) => handleStageChange(deal.id, e.target.value)}
                              className="text-xs bg-transparent border border-[var(--color-border)] rounded px-2 py-0.5 text-[var(--color-foreground)] focus:outline-none cursor-pointer"
                            >
                              {stages.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Tạo giao dịch mới</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Tên giao dịch *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hợp đồng quảng cáo Q4..."
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Giá trị dự kiến (VNĐ)
                </label>
                <input
                  type="number"
                  placeholder="50000000"
                  value={newDeal.value}
                  onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Gắn khách hàng
                </label>
                <select
                  value={newDeal.customerId}
                  onChange={(e) => setNewDeal({ ...newDeal, customerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">-- Chưa gắn khách hàng --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Giai đoạn ban đầu
                </label>
                <select
                  value={newDeal.stageId}
                  onChange={(e) => setNewDeal({ ...newDeal, stageId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {stages.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Ngày dự kiến chốt
                </label>
                <input
                  type="date"
                  value={newDeal.expectedClose}
                  onChange={(e) => setNewDeal({ ...newDeal, expectedClose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo giao dịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
