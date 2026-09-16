'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, PlayCircle, Rocket, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

type BuffOrder = {
  id: string;
  url: string;
  actionType: string;
  targetCount: number;
  currentCount: number;
  status: string;
  createdAt: string;
};

export default function BuffOrdersPage() {
  const [orders, setOrders] = useState<BuffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    url: '',
    actionType: 'LIKE',
    targetCount: 100,
    config: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/buff-orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách Buff Order');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url) {
      toast.error('Vui lòng nhập Link/ID bài viết');
      return;
    }

    setSubmitting(true);
    try {
      let configObj = {};
      if (formData.config) {
        try {
          configObj = JSON.parse(formData.config);
        } catch {
          toast.error('Cấu hình nâng cao phải là JSON hợp lệ');
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch('/api/buff-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          config: configObj
        })
      });

      if (res.ok) {
        toast.success('Lên đơn Buff thành công');
        setShowAddModal(false);
        setFormData({ url: '', actionType: 'LIKE', targetCount: 100, config: '' });
        fetchOrders();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi lên đơn');
      }
    } catch (err) {
      toast.error('Lỗi khi lưu đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn huỷ/xoá đơn này?')) return;
    
    try {
      const res = await fetch(`/api/buff-orders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xoá đơn Buff');
        fetchOrders();
      } else {
        toast.error('Xoá thất bại');
      }
    } catch (err) {
      toast.error('Xoá thất bại');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
            <Rocket className="w-6 h-6 text-[#5B3DF5]" />
            Buff Like / Seeding
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Lên đơn chạy tương tác (Like, Comment, Share) cho bài viết</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Lên đơn mới
        </button>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--color-muted-foreground)] uppercase bg-[var(--color-muted)]/30 border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Mã đơn</th>
                <th className="px-6 py-4 font-semibold">URL / ID</th>
                <th className="px-6 py-4 font-semibold">Loại</th>
                <th className="px-6 py-4 font-semibold">Tiến độ</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-muted-foreground)]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-muted-foreground)]">
                    <Rocket className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-3" />
                    <p className="text-base font-medium">Chưa có đơn Buff nào</p>
                    <p className="text-sm mt-1">Lên đơn mới để tăng tương tác bài viết</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-[var(--color-muted)]/10 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-[var(--color-muted-foreground)]">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <a href={order.url} target="_blank" rel="noreferrer" className="text-[#5B3DF5] hover:underline font-medium truncate block max-w-[200px]">
                        {order.url}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs font-bold rounded-lg">
                        {order.actionType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 w-32">
                        <div className="flex justify-between text-xs font-medium">
                          <span>{order.currentCount}</span>
                          <span className="text-[var(--color-muted-foreground)]">/ {order.targetCount}</span>
                        </div>
                        <div className="h-1.5 bg-[var(--color-muted)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#5B3DF5] transition-all duration-500"
                            style={{ width: `${Math.min(100, (order.currentCount / order.targetCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.status === 'RUNNING' ? (
                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium text-xs">
                          <PlayCircle className="w-3.5 h-3.5 animate-pulse" /> Đang chạy
                        </span>
                      ) : order.status === 'COMPLETED' ? (
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                        </span>
                      ) : order.status === 'FAILED' ? (
                        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium text-xs">
                          <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-gray-500 font-medium text-xs">
                          <Clock className="w-3.5 h-3.5" /> Chờ xử lý
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(order.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Huỷ/Xoá đơn"
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-background)] rounded-2xl shadow-xl w-full max-w-md border border-[var(--color-border)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--color-border)] shrink-0">
              <h3 className="text-lg font-bold">Lên đơn Buff mới</h3>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="add-buff-form" onSubmit={handleAddOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Loại tương tác</label>
                  <select 
                    value={formData.actionType}
                    onChange={e => setFormData({...formData, actionType: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                  >
                    <option value="LIKE">Like Bài Viết</option>
                    <option value="COMMENT">Bình Luận</option>
                    <option value="SHARE">Chia Sẻ</option>
                    <option value="FOLLOW">Tăng Theo Dõi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Link hoặc ID bài viết *</label>
                  <input 
                    type="text" 
                    value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                    placeholder="https://facebook.com/..."
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Số lượng cần tăng</label>
                  <input 
                    type="number" 
                    value={formData.targetCount}
                    onChange={e => setFormData({...formData, targetCount: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Cấu hình nâng cao (JSON, Tuỳ chọn)</label>
                  <textarea 
                    value={formData.config}
                    onChange={e => setFormData({...formData, config: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-shadow h-24 font-mono text-xs resize-none"
                    placeholder='{"delay": 5, "comments": ["Hay quá", "Quá đỉnh"]}'
                  />
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Thêm delay, nội dung comment...</p>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-[var(--color-border)] shrink-0 flex gap-3 justify-end bg-[var(--color-background)]">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-[var(--color-muted)] transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit"
                form="add-buff-form"
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#5B3DF5] text-white hover:bg-[#5B3DF5]/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang lên đơn...' : 'Tạo Đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
