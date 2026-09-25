'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  RefreshCw,
  Activity, 
  Users, 
  MousePointerClick, 
  DollarSign,
  Trash2,
  X,
  Target,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Campaign = {
  id: string;
  name: string;
  description?: string | null;
  objective?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  budget: number;
  spent?: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objective: 'Chuyển đổi bán hàng',
    budget: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        let list: Campaign[] = data.campaigns || [];

        // Auto-seed starter campaigns if empty
        if (list.length === 0) {
          const starterCampaigns = [
            {
              name: 'Khuyến mãi mùa lễ hội - Siêu Sale',
              description: 'Chạy quảng cáo chuyển đổi trên Facebook & TikTok',
              objective: 'Chuyển đổi',
              budget: 15000000,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
            },
            {
              name: 'Quảng bá Thương hiệu & Fanpage mới',
              description: 'Tăng tương tác và lượt theo dõi kênh',
              objective: 'Tương tác',
              budget: 5000000,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 86400000 * 15).toISOString(),
            }
          ];

          for (const item of starterCampaigns) {
            await fetch('/api/campaigns', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            });
          }

          const retryRes = await fetch('/api/campaigns');
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            list = retryData.campaigns || [];
          }
        }

        setCampaigns(list);
      } else {
        toast.error('Không thể tải danh sách chiến dịch');
      }
    } catch {
      toast.error('Lỗi kết nối khi tải chiến dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.error('Vui lòng nhập tên chiến dịch');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          objective: formData.objective,
          budget: parseFloat(formData.budget) || 0,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        toast.success('Đã tạo chiến dịch mới');
        setShowAddModal(false);
        setFormData({ name: '', description: '', objective: 'Chuyển đổi bán hàng', budget: '', startDate: '', endDate: '' });
        fetchCampaigns();
      } else {
        toast.error('Tạo chiến dịch thất bại');
      }
    } catch {
      toast.error('Lỗi máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    const cycle: Record<string, 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'> = {
      DRAFT: 'ACTIVE',
      ACTIVE: 'PAUSED',
      PAUSED: 'ACTIVE',
      COMPLETED: 'DRAFT',
    };

    const nextStatus = cycle[campaign.status] || 'ACTIVE';

    try {
      const res = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: campaign.id,
          status: nextStatus,
        }),
      });

      if (res.ok) {
        toast.success(`Đã chuyển trạng thái sang ${nextStatus}`);
        setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: nextStatus } : c));
      } else {
        toast.error('Không thể đổi trạng thái');
      }
    } catch {
      toast.error('Lỗi máy chủ');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chiến dịch này?')) return;

    try {
      const res = await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa chiến dịch');
        setCampaigns(prev => prev.filter(c => c.id !== id));
      } else {
        toast.error('Xóa thất bại');
      }
    } catch {
      toast.error('Lỗi máy chủ');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">Đang chạy</span>;
      case 'PAUSED': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Tạm dừng</span>;
      case 'DRAFT': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">Bản nháp</span>;
      case 'COMPLETED': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">Hoàn thành</span>;
      default: return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length;
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.objective && c.objective.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)] mb-2 flex items-center gap-2">
            <Target className="w-7 h-7 text-[#5B3DF5]" />
            Chiến dịch (Campaigns)
          </h1>
          <p className="text-[var(--color-muted-foreground)]">Theo dõi và quản lý hiệu quả các chiến dịch Marketing</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchCampaigns}
            className="p-2 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[var(--color-primary)] hover:opacity-90 text-white px-4 py-2 rounded-xl flex items-center font-medium transition-opacity"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo chiến dịch mới
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1b1e] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)] font-medium">Chiến dịch đang chạy</p>
              <h3 className="text-2xl font-bold text-[var(--color-foreground)] mt-1">{activeCount}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1b1e] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)] font-medium">Tổng ngân sách</p>
              <h3 className="text-xl font-bold text-[var(--color-foreground)] mt-1 truncate">{formatCurrency(totalBudget)}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1b1e] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)] font-medium">Tổng chiến dịch</p>
              <h3 className="text-2xl font-bold text-[var(--color-foreground)] mt-1">{campaigns.length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1b1e] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <MousePointerClick className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)] font-medium">Mục tiêu chính</p>
              <h3 className="text-lg font-bold text-[var(--color-foreground)] mt-1">Đa kênh Social</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-[#1a1b1e] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--color-border)] flex gap-4 bg-[var(--color-muted)]/10">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input 
              placeholder="Tìm chiến dịch..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-foreground)]"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên chiến dịch</th>
                <th className="px-6 py-4 font-semibold">Trạng thái (Bấm để đổi)</th>
                <th className="px-6 py-4 font-semibold">Mục tiêu</th>
                <th className="px-6 py-4 font-semibold">Ngân sách</th>
                <th className="px-6 py-4 font-semibold">Thời gian</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading && campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--color-muted-foreground)]">
                    Đang tải danh sách chiến dịch...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--color-muted-foreground)]">
                    Không tìm thấy chiến dịch nào.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map(campaign => (
                  <tr key={campaign.id} className="hover:bg-[var(--color-muted)]/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--color-foreground)]">{campaign.name}</div>
                      {campaign.description && (
                        <div className="text-xs text-[var(--color-muted-foreground)] line-clamp-1 mt-0.5">{campaign.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(campaign)}
                        className="hover:opacity-80 transition-opacity"
                        title="Bấm để chuyển trạng thái"
                      >
                        {getStatusBadge(campaign.status)}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-foreground)] font-medium">
                      {campaign.objective || 'Mặc định'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-foreground)]">
                      {formatCurrency(campaign.budget || 0)}
                    </td>
                    <td className="px-6 py-4">
                      {campaign.startDate ? (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{format(new Date(campaign.startDate), 'dd/MM/yyyy')}</span>
                          {campaign.endDate && (
                            <span> - {format(new Date(campaign.endDate), 'dd/MM/yyyy')}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--color-muted-foreground)]">Không xác định</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa chiến dịch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Campaign Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Tạo chiến dịch Marketing mới</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Tên chiến dịch *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chiến dịch Tết 2027, Ra mắt sản phẩm mới..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Mô tả chiến dịch
                </label>
                <textarea
                  rows={2}
                  placeholder="Kế hoạch, mục đích, nội dung chính..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Mục tiêu chính
                  </label>
                  <select
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="Chuyển đổi bán hàng">Chuyển đổi bán hàng</option>
                    <option value="Tương tác & Follower">Tương tác & Follower</option>
                    <option value="Nhận diện thương hiệu">Nhận diện thương hiệu</option>
                    <option value="Thu thập Lead khách hàng">Thu thập Lead khách hàng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Ngân sách dự kiến (VNĐ)
                  </label>
                  <input
                    type="number"
                    placeholder="10000000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
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
                  {submitting ? 'Đang tạo...' : 'Tạo chiến dịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
