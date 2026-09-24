'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Activity,
  Users,
  MousePointerClick,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

const MOCK_CAMPAIGNS = [
  { 
    id: 'CMP-1', 
    name: 'Khuyến mãi 20/10 - Nước hoa', 
    status: 'active', 
    budget: 15000000, 
    spent: 8500000, 
    leads: 245, 
    clicks: 12500,
    startDate: '2024-10-01',
    endDate: '2024-10-20',
    platform: 'Facebook Ads'
  },
  { 
    id: 'CMP-2', 
    name: 'Retargeting Website Visitors Q4', 
    status: 'draft', 
    budget: 5000000, 
    spent: 0, 
    leads: 0, 
    clicks: 0,
    startDate: '2024-10-15',
    endDate: '2024-12-31',
    platform: 'Google Ads'
  },
  { 
    id: 'CMP-3', 
    name: 'Ra mắt sản phẩm mới - Dưỡng da', 
    status: 'completed', 
    budget: 30000000, 
    spent: 29500000, 
    leads: 850, 
    clicks: 45000,
    startDate: '2024-09-01',
    endDate: '2024-09-30',
    platform: 'Tiktok Ads'
  },
];

export default function CampaignsPage() {
  const [campaigns] = useState(MOCK_CAMPAIGNS);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">Đang chạy</span>;
      case 'draft': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">Bản nháp</span>;
      case 'completed': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">Đã kết thúc</span>;
      default: return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const filteredCampaigns = campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)] mb-2">Chiến dịch (Campaigns)</h1>
          <p className="text-[var(--color-muted-foreground)]">Theo dõi và quản lý hiệu quả các chiến dịch Marketing</p>
        </div>
        <button className="bg-[var(--color-primary)] hover:opacity-90 text-white px-4 py-2 rounded-xl flex items-center font-medium transition-opacity">
          <Plus className="w-4 h-4 mr-2" />
          Tạo chiến dịch mới
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1b1e] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)] font-medium">Chiến dịch đang chạy</p>
              <h3 className="text-2xl font-bold text-[var(--color-foreground)] mt-1">1</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1b1e] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)] font-medium">Tổng ngân sách đã tiêu</p>
              <h3 className="text-2xl font-bold text-[var(--color-foreground)] mt-1">38M ₫</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1b1e] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)] font-medium">Tổng Leads thu về</p>
              <h3 className="text-2xl font-bold text-[var(--color-foreground)] mt-1">1,095</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1b1e] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
              <MousePointerClick className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)] font-medium">Tổng số Clicks</p>
              <h3 className="text-2xl font-bold text-[var(--color-foreground)] mt-1">57.5K</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-[#1a1b1e] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--color-border)] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input 
              placeholder="Tìm chiến dịch..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-foreground)]"
            />
          </div>
          <button className="p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-foreground)] flex items-center gap-2 px-4 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" />
            Lọc
          </button>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên chiến dịch</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">Nền tảng</th>
                <th className="px-6 py-4 font-semibold">Ngân sách / Đã tiêu</th>
                <th className="px-6 py-4 font-semibold text-right">Hiệu quả (Leads/Clicks)</th>
                <th className="px-6 py-4 font-semibold">Thời gian</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredCampaigns.map(campaign => {
                const percentSpent = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
                return (
                  <tr key={campaign.id} className="hover:bg-[var(--color-muted)]/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--color-foreground)]">{campaign.name}</div>
                      <div className="text-xs text-[var(--color-muted-foreground)] mt-1">{campaign.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-foreground)] font-medium">
                      {campaign.platform}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--color-foreground)] font-medium">{formatCurrency(campaign.spent)}</span>
                          <span className="text-[var(--color-muted-foreground)]">{formatCurrency(campaign.budget)}</span>
                        </div>
                        <div className="w-full bg-[var(--color-muted)] rounded-full h-1.5">
                          <div 
                            className="bg-[var(--color-primary)] h-1.5 rounded-full" 
                            style={{ width: `${Math.min(percentSpent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[var(--color-foreground)]">{campaign.leads} Leads</span>
                        <span className="text-xs text-[var(--color-muted-foreground)]">{campaign.clicks.toLocaleString()} Clicks</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[var(--color-muted-foreground)] whitespace-nowrap">
                        {format(new Date(campaign.startDate), 'dd/MM/yyyy')} - {format(new Date(campaign.endDate), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] rounded-lg hover:bg-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredCampaigns.length === 0 && (
            <div className="text-center p-12 text-[var(--color-muted-foreground)]">
              Không tìm thấy chiến dịch nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
