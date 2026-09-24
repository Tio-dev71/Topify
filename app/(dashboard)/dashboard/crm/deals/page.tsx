'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Calendar,
  Building2,
  User
} from 'lucide-react';
import { format } from 'date-fns';

const INITIAL_STAGES = [
  { id: 'stage-1', name: 'Khách hàng mới', color: 'bg-blue-500' },
  { id: 'stage-2', name: 'Đang liên hệ', color: 'bg-yellow-500' },
  { id: 'stage-3', name: 'Thương lượng', color: 'bg-purple-500' },
  { id: 'stage-4', name: 'Đã gửi báo giá', color: 'bg-indigo-500' },
  { id: 'stage-5', name: 'Thành công', color: 'bg-green-500' },
];

const MOCK_DEALS = [
  {
    id: 'deal-1',
    title: 'Hợp đồng Marketing Q4',
    company: 'Công ty ABC',
    contact: 'Nguyễn Văn A',
    amount: 50000000,
    stageId: 'stage-1',
    expectedCloseDate: '2024-12-31',
    priority: 'high'
  },
  {
    id: 'deal-2',
    title: 'Gói chăm sóc Fanpage 6 tháng',
    company: 'Shop Thời trang XYZ',
    contact: 'Trần Thị B',
    amount: 15000000,
    stageId: 'stage-2',
    expectedCloseDate: '2024-11-15',
    priority: 'medium'
  },
  {
    id: 'deal-3',
    title: 'Thiết kế hệ thống nhận diện',
    company: 'Tập đoàn DEF',
    contact: 'Lê Văn C',
    amount: 120000000,
    stageId: 'stage-3',
    expectedCloseDate: '2024-10-30',
    priority: 'high'
  },
  {
    id: 'deal-4',
    title: 'Chạy ads Tiktok Tháng 10',
    company: 'Mỹ phẩm ABC',
    contact: 'Phạm D',
    amount: 8000000,
    stageId: 'stage-1',
    expectedCloseDate: '2024-10-15',
    priority: 'low'
  }
];

export default function DealsPage() {
  const [deals, setDeals] = useState(MOCK_DEALS);

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="flex-none p-6 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Giao dịch (Deals)</h1>
            <p className="text-[var(--color-muted-foreground)] mt-1">Quản lý và theo dõi các cơ hội bán hàng trên Kanban Board</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            Tạo giao dịch mới
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <input 
                type="text" 
                placeholder="Tìm kiếm giao dịch..." 
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-muted)] transition-colors text-[var(--color-foreground)]">
              <Filter className="w-4 h-4" />
              Lọc
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
              <span>Phễu bán hàng:</span>
              <select className="bg-transparent font-medium text-[var(--color-foreground)] focus:outline-none cursor-pointer">
                <option>Quy trình Bán hàng chuẩn</option>
                <option>Quy trình B2B</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-6 h-full min-w-max">
          {INITIAL_STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stageId === stage.id);
            const totalAmount = stageDeals.reduce((sum, deal) => sum + deal.amount, 0);

            return (
              <div key={stage.id} className="w-80 flex flex-col h-full bg-[var(--color-muted)]/30 rounded-xl p-3 border border-[var(--color-border)]/50">
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <h3 className="font-semibold text-[var(--color-foreground)]">{stage.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] text-xs font-medium">
                      {stageDeals.length}
                    </span>
                  </div>
                  <button className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Stage Total */}
                <div className="mb-4 px-1 text-sm text-[var(--color-muted-foreground)] font-medium">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {stageDeals.map(deal => (
                    <div 
                      key={deal.id}
                      className="p-4 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#1a1b1e] shadow-sm hover:shadow-md hover:border-[var(--color-primary)] transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                          {deal.title}
                        </h4>
                      </div>
                      
                      <div className="text-lg font-semibold text-[var(--color-foreground)] mb-3 flex items-center gap-1">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(deal.amount)}
                      </div>

                      <div className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span className="truncate">{deal.company}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="truncate">{deal.contact}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(deal.expectedCloseDate), 'dd/MM/yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
