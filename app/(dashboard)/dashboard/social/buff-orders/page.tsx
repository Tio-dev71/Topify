'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, PlayCircle, Rocket, CheckCircle2, AlertCircle, Clock, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const filteredOrders = orders.filter(order => 
    order.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.actionType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-card)] p-6 rounded-3xl border border-[var(--color-border)] shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5B3DF5]/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-3">
            <div className="p-2.5 bg-[#5B3DF5]/10 rounded-xl text-[#5B3DF5]">
              <Rocket className="w-6 h-6" />
            </div>
            Buff Like / Seeding
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2 font-medium">Lên đơn chạy tương tác tự động cho chiến dịch của bạn</p>
        </div>
        
        <div className="relative z-10 w-full sm:w-auto">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#5B3DF5] to-[#7B61FF] text-white hover:shadow-lg hover:shadow-[#5B3DF5]/25 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Lên đơn mới
          </button>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)] group-focus-within:text-[#5B3DF5] transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm theo URL, ID, hoặc Loại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5]/50 transition-all font-medium"
          />
        </div>
      </motion.div>

      {/* Main Table */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-[var(--color-muted-foreground)] uppercase bg-[var(--color-muted)]/40 border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-5 font-bold tracking-wider">Mã đơn</th>
                <th className="px-6 py-5 font-bold tracking-wider">URL / ID</th>
                <th className="px-6 py-5 font-bold tracking-wider">Loại</th>
                <th className="px-6 py-5 font-bold tracking-wider">Tiến độ</th>
                <th className="px-6 py-5 font-bold tracking-wider">Trạng thái</th>
                <th className="px-6 py-5 font-bold tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-[var(--color-muted-foreground)]">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      <RefreshCw className="w-6 h-6 mb-2 mx-auto" />
                    </motion.div>
                    <p className="font-medium text-sm">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-[var(--color-muted-foreground)]">
                    <Rocket className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
                    <p className="text-base font-bold text-[var(--color-foreground)]">Không tìm thấy đơn Buff nào</p>
                    <p className="text-sm mt-1">Thay đổi từ khóa tìm kiếm hoặc lên đơn mới</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredOrders.map((order, index) => (
                    <motion.tr 
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                      className="hover:bg-[var(--color-muted)]/20 transition-colors group"
                    >
                      <td className="px-6 py-5 font-mono text-xs font-bold text-[var(--color-muted-foreground)]">
                        #{order.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-5">
                        <a href={order.url} target="_blank" rel="noreferrer" className="text-[var(--color-foreground)] hover:text-[#5B3DF5] font-semibold truncate block max-w-[250px] transition-colors">
                          {order.url}
                        </a>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1.5 bg-[#5B3DF5]/10 text-[#5B3DF5] text-xs font-bold rounded-xl border border-[#5B3DF5]/20">
                          {order.actionType}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2 w-40">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-[var(--color-foreground)]">{order.currentCount}</span>
                            <span className="text-[var(--color-muted-foreground)]">/ {order.targetCount}</span>
                          </div>
                          <div className="h-2 bg-[var(--color-muted)] rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (order.currentCount / order.targetCount) * 100)}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                              className="h-full bg-gradient-to-r from-[#5B3DF5] to-[#7B61FF]"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {order.status === 'RUNNING' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl border border-blue-500/20">
                            <PlayCircle className="w-3.5 h-3.5 animate-pulse" /> Đang chạy
                          </span>
                        ) : order.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-xs rounded-xl border border-green-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                          </span>
                        ) : order.status === 'FAILED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl border border-red-500/20">
                            <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-500/10 text-gray-600 dark:text-gray-400 font-bold text-xs rounded-xl border border-gray-500/20">
                            <Clock className="w-3.5 h-3.5" /> Chờ xử lý
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => handleDelete(order.id)}
                          className="p-2.5 text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Huỷ/Xoá đơn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add New Order Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--color-background)] rounded-3xl shadow-2xl border border-[var(--color-border)] flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 sm:p-8 border-b border-[var(--color-border)] shrink-0 flex justify-between items-center bg-[var(--color-card)]">
                <h3 className="text-xl font-bold flex items-center gap-2 text-[var(--color-foreground)]">
                  <Rocket className="w-5 h-5 text-[#5B3DF5]" />
                  Lên đơn Buff mới
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-xl text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 sm:p-8 overflow-y-auto">
                <form id="add-buff-form" onSubmit={handleAddOrder} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-foreground)] mb-2">Loại tương tác</label>
                    <div className="relative">
                      <select 
                        value={formData.actionType}
                        onChange={e => setFormData({...formData, actionType: e.target.value})}
                        className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5] focus:border-transparent transition-all font-medium appearance-none"
                      >
                        <option value="LIKE">👍 Like Bài Viết</option>
                        <option value="COMMENT">💬 Bình Luận</option>
                        <option value="SHARE">🔄 Chia Sẻ</option>
                        <option value="FOLLOW">👥 Tăng Theo Dõi</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-muted-foreground)]">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--color-foreground)] mb-2">Link hoặc ID bài viết *</label>
                    <input 
                      type="text" 
                      value={formData.url}
                      onChange={e => setFormData({...formData, url: e.target.value})}
                      placeholder="https://facebook.com/..."
                      className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5] focus:border-transparent transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--color-foreground)] mb-2">Số lượng cần tăng</label>
                    <input 
                      type="number" 
                      value={formData.targetCount}
                      onChange={e => setFormData({...formData, targetCount: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5] focus:border-transparent transition-all font-medium"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--color-foreground)] mb-2">Cấu hình nâng cao (JSON)</label>
                    <textarea 
                      value={formData.config}
                      onChange={e => setFormData({...formData, config: e.target.value})}
                      className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5] focus:border-transparent transition-all font-mono text-xs h-28 resize-none"
                      placeholder='{"delay": 5, "comments": ["Hay quá", "Quá đỉnh"]}'
                    />
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-2 font-medium">Bỏ trống nếu không cần thiết. Tuân thủ định dạng JSON hợp lệ.</p>
                  </div>
                </form>
              </div>
              
              <div className="p-6 sm:p-8 border-t border-[var(--color-border)] shrink-0 flex gap-4 justify-end bg-[var(--color-card)]">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 text-sm font-bold rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  form="add-buff-form"
                  disabled={submitting}
                  className="px-8 py-2.5 text-sm font-bold rounded-xl bg-[#5B3DF5] text-white hover:bg-[#4829E6] shadow-lg shadow-[#5B3DF5]/20 hover:shadow-[#5B3DF5]/40 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitting ? 'Đang lên đơn...' : 'Tạo Đơn'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
