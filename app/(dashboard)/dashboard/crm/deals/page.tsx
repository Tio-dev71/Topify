'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar,
  User,
  Trash2,
  RefreshCw,
  X,
  Briefcase,
  Eye,
  Edit2
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

  // View & Edit Modal State
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editDealData, setEditDealData] = useState({
    title: '',
    value: '',
    customerId: '',
    stageId: '',
    expectedClose: '',
    status: 'OPEN'
  });
  const [updating, setUpdating] = useState(false);

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


  const fetchDeals = async (pipelineId: string) => {
    try {
      const res = await fetch(`/api/crm/deals?pipelineId=${pipelineId}`);
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
      }
    } catch (_err) {
      toast.error('Lỗi khi tải danh sách cơ hội bán hàng');
    }
  };

  useEffect(() => {
    let ignore = false;

    Promise.all([
      fetch('/api/crm/pipelines'),
      fetch('/api/crm/customers')
    ])
      .then(async ([pipeRes, custRes]) => {
        if (!ignore && pipeRes.ok) {
          const pipeData = await pipeRes.json();
          const pList: Pipeline[] = pipeData.pipelines || [];
          setPipelines(pList);
          if (pList.length > 0) {
            const defaultPipe = pList.find(p => p.isDefault) || pList[0];
            setSelectedPipelineId(defaultPipe.id);
          }
        }

        if (!ignore && custRes.ok) {
          const custData = await custRes.json();
          setCustomers(custData.customers || []);
        }
      })
      .catch((_err) => {
        if (!ignore) {
          toast.error('Lỗi khi tải dữ liệu ban đầu');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedPipelineId) return;
    let ignore = false;

    fetch(`/api/crm/deals?pipelineId=${selectedPipelineId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed'))))
      .then((data) => {
        if (!ignore) {
          setDeals(data.deals || []);
        }
      })
      .catch((_err) => {
        if (!ignore) {
          toast.error('Lỗi khi tải danh sách cơ hội bán hàng');
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedPipelineId]);

  const currentPipeline = pipelines.find(p => p.id === selectedPipelineId) || pipelines[0];
  const stages = currentPipeline?.stages || [];

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.title.trim()) {
      toast.error('Vui lòng nhập tên cơ hội bán hàng');
      return;
    }

    const stageId = newDeal.stageId || stages[0]?.id;
    if (!stageId) {
      toast.error('Quy trình hiện tại chưa có giai đoạn nào để tạo cơ hội bán hàng');
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
        toast.success('Tạo cơ hội bán hàng thành công');
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
        toast.error(err.error || 'Lỗi khi tạo cơ hội bán hàng');
      }
    } catch (_err) {
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
    } catch (_err) {
      toast.error('Lỗi máy chủ');
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cơ hội bán hàng này?')) return;

    try {
      const res = await fetch(`/api/crm/deals?id=${dealId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa cơ hội bán hàng');
        setDeals(prev => prev.filter(d => d.id !== dealId));
      } else {
        toast.error('Không thể xóa cơ hội bán hàng');
      }
    } catch (_err) {
      toast.error('Lỗi máy chủ');
    }
  };

  const handleOpenEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setEditDealData({
      title: deal.title || '',
      value: deal.value ? String(deal.value) : '',
      customerId: deal.customerId || '',
      stageId: deal.stageId || '',
      expectedClose: deal.expectedClose ? format(new Date(deal.expectedClose), 'yyyy-MM-dd') : '',
      status: deal.status || 'OPEN'
    });
  };

  const handleUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;
    if (!editDealData.title.trim()) {
      return toast.error('Vui lòng nhập tên cơ hội bán hàng');
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: editingDeal.id,
          title: editDealData.title,
          value: parseFloat(editDealData.value) || 0,
          customerId: editDealData.customerId || null,
          stageId: editDealData.stageId,
          expectedClose: editDealData.expectedClose || null,
          status: editDealData.status
        })
      });

      if (res.ok) {
        toast.success('Cập nhật cơ hội bán hàng thành công!');
        fetchDeals(selectedPipelineId);
        setEditingDeal(null);
        if (viewingDeal?.id === editingDeal.id) {
          setViewingDeal(null);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi cập nhật cơ hội bán hàng');
      }
    } catch (_err) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setUpdating(false);
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
              Cơ hội bán hàng (Deals)
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
              Tạo cơ hội mới
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
                placeholder="Tìm kiếm cơ hội bán hàng..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
              <span>Quy trình bán hàng:</span>
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
                        Chưa có cơ hội bán hàng
                      </div>
                    ) : (
                      stageDeals.map(deal => (
                        <div 
                          key={deal.id}
                          className="p-4 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#1a1b1e] shadow-sm hover:shadow-md hover:border-[var(--color-primary)] transition-all group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 
                              onClick={() => setViewingDeal(deal)}
                              className="font-semibold text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors cursor-pointer truncate max-w-[180px]"
                              title="Bấm để xem chi tiết"
                            >
                              {deal.title}
                            </h4>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setViewingDeal(deal)}
                                className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                                title="Xem chi tiết cơ hội"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditDeal(deal)}
                                className="text-gray-400 hover:text-amber-600 p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                title="Chỉnh sửa cơ hội"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDeal(deal.id)}
                                className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                                title="Xóa cơ hội"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Tạo cơ hội bán hàng mới</h3>
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
                  Tên cơ hội bán hàng *
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
                  Khách hàng liên kết
                </label>
                <select
                  value={newDeal.customerId}
                  onChange={(e) => setNewDeal({ ...newDeal, customerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">-- Chưa chọn khách hàng --</option>
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
                  {submitting ? 'Đang tạo...' : 'Tạo cơ hội bán hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Deal Modal */}
      {viewingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-foreground)]">{viewingDeal.title}</h3>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Mã cơ hội: #{viewingDeal.id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingDeal(null)} 
                className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] rounded-xl hover:bg-[var(--color-muted)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-4 bg-[var(--color-muted)]/20 rounded-2xl border border-[var(--color-border)]/50 flex justify-between items-center">
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)] mb-1">Giá trị cơ hội (Deal value)</p>
                  <p className="text-2xl font-bold text-[var(--color-primary)]">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewingDeal.value || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--color-muted-foreground)] mb-1">Trạng thái</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    viewingDeal.status === 'WON' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                    viewingDeal.status === 'LOST' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                    'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                  }`}>
                    {viewingDeal.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--color-muted)]/30 rounded-xl border border-[var(--color-border)]/40">
                  <p className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1.5 mb-1 font-medium">
                    <User className="w-3.5 h-3.5" /> Khách hàng
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
                    {viewingDeal.customer?.name || 'Chưa gắn'}
                  </p>
                </div>
                <div className="p-3 bg-[var(--color-muted)]/30 rounded-xl border border-[var(--color-border)]/40">
                  <p className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1.5 mb-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" /> Dự kiến chốt
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {viewingDeal.expectedClose ? format(new Date(viewingDeal.expectedClose), 'dd/MM/yyyy') : 'Chưa xác định'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[var(--color-muted)]/30 rounded-xl border border-[var(--color-border)]/40">
                <p className="text-xs text-[var(--color-muted-foreground)] mb-1 font-medium">Giai đoạn hiện tại</p>
                <div className="flex items-center gap-2 mt-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: viewingDeal.stage?.color || '#3B82F6' }} 
                  />
                  <span className="text-sm font-semibold text-[var(--color-foreground)]">
                    {viewingDeal.stage?.name || stages.find(s => s.id === viewingDeal.stageId)?.name || 'Mặc định'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[var(--color-muted-foreground)] text-right">
                Ngày tạo: {format(new Date(viewingDeal.createdAt), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>

            <div className="p-6 border-t border-[var(--color-border)] flex justify-between items-center bg-[var(--color-muted)]/10">
              <button
                type="button"
                onClick={() => {
                  const d = viewingDeal;
                  setViewingDeal(null);
                  handleOpenEditDeal(d);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa cơ hội
              </button>
              <button 
                type="button"
                onClick={() => setViewingDeal(null)}
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 transition-opacity"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deal Modal */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Chỉnh sửa cơ hội bán hàng</h3>
              <button 
                onClick={() => setEditingDeal(null)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Tên cơ hội bán hàng *
                </label>
                <input
                  type="text"
                  required
                  value={editDealData.title}
                  onChange={(e) => setEditDealData({ ...editDealData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Giá trị dự kiến (VNĐ)
                </label>
                <input
                  type="number"
                  value={editDealData.value}
                  onChange={(e) => setEditDealData({ ...editDealData, value: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Khách hàng liên kết
                </label>
                <select
                  value={editDealData.customerId}
                  onChange={(e) => setEditDealData({ ...editDealData, customerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">-- Chưa chọn khách hàng --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Giai đoạn
                  </label>
                  <select
                    value={editDealData.stageId}
                    onChange={(e) => setEditDealData({ ...editDealData, stageId: e.target.value })}
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
                    Trạng thái
                  </label>
                  <select
                    value={editDealData.status}
                    onChange={(e) => setEditDealData({ ...editDealData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="OPEN">Đang mở (OPEN)</option>
                    <option value="WON">Thắng thầu (WON)</option>
                    <option value="LOST">Mất cơ hội (LOST)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Ngày dự kiến chốt
                </label>
                <input
                  type="date"
                  value={editDealData.expectedClose}
                  onChange={(e) => setEditDealData({ ...editDealData, expectedClose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setEditingDeal(null)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

