'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, PlayCircle, Rocket, CheckCircle2, AlertCircle, Clock, Search, X, Eye, Edit2, ExternalLink, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type BuffOrder = {
  id: string;
  url: string;
  actionType: string;
  targetCount: number;
  currentCount: number;
  status: string;
  config?: any;
  createdAt: string;
  updatedAt?: string;
};

export default function BuffOrdersPage() {
  const [orders, setOrders] = useState<BuffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    url: '',
    actionType: 'LIKE',
    targetCount: 100,
    config: ''
  });

  // View Modal State
  const [viewingOrder, setViewingOrder] = useState<BuffOrder | null>(null);

  // Edit Modal State
  const [editingOrder, setEditingOrder] = useState<BuffOrder | null>(null);
  const [editFormData, setEditFormData] = useState({
    url: '',
    actionType: 'LIKE',
    targetCount: 100,
    currentCount: 0,
    status: 'PENDING',
    config: ''
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

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
      toast.error('Lỗi khi tải danh sách đơn tăng tương tác');
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
        toast.success('Tạo đơn tăng tương tác thành công');
        setShowAddModal(false);
        setFormData({ url: '', actionType: 'LIKE', targetCount: 100, config: '' });
        fetchOrders();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi tạo đơn');
      }
    } catch (err) {
      toast.error('Lỗi khi lưu đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn tăng tương tác này?')) return;
    
    try {
      const res = await fetch(`/api/buff-orders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa đơn tăng tương tác');
        fetchOrders();
      } else {
        toast.error('Xoá thất bại');
      }
    } catch (err) {
      toast.error('Xoá thất bại');
    }
  };

  const openEditModal = (order: BuffOrder) => {
    setEditingOrder(order);
    setEditFormData({
      url: order.url,
      actionType: order.actionType,
      targetCount: order.targetCount,
      currentCount: order.currentCount,
      status: order.status,
      config: order.config ? JSON.stringify(order.config, null, 2) : '',
    });
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (!editFormData.url) {
      return toast.error('Vui lòng nhập Link bài viết');
    }

    setIsEditSubmitting(true);
    try {
      let configObj = null;
      if (editFormData.config) {
        try {
          configObj = JSON.parse(editFormData.config);
        } catch {
          toast.error('Cấu hình nâng cao phải là JSON hợp lệ');
          setIsEditSubmitting(false);
          return;
        }
      }

      const res = await fetch('/api/buff-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingOrder.id,
          url: editFormData.url.trim(),
          actionType: editFormData.actionType,
          targetCount: editFormData.targetCount,
          currentCount: editFormData.currentCount,
          status: editFormData.status,
          config: configObj,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, ...updated } : o));
        if (viewingOrder?.id === editingOrder.id) {
          setViewingOrder(prev => prev ? { ...prev, ...updated } : null);
        }
        toast.success('Cập nhật đơn tăng tương tác thành công');
        setEditingOrder(null);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Cập nhật thất bại');
      }
    } catch {
      toast.error('Lỗi khi cập nhật đơn');
    } finally {
      setIsEditSubmitting(false);
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
            Tăng tương tác & Seeding (Buff)
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2 font-medium">Tạo và quản lý các tác vụ tăng tương tác tự động cho bài viết / kênh</p>
        </div>
        
        <div className="relative z-10 w-full sm:w-auto">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#5B3DF5] to-[#7B61FF] text-white hover:shadow-lg hover:shadow-[#5B3DF5]/25 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tạo đơn tăng tương tác
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
                <th className="px-6 py-5 font-bold tracking-wider whitespace-nowrap w-[120px]">Mã đơn</th>
                <th className="px-6 py-5 font-bold tracking-wider whitespace-nowrap min-w-[220px]">URL / ID</th>
                <th className="px-6 py-5 font-bold tracking-wider whitespace-nowrap w-[140px]">Loại</th>
                <th className="px-6 py-5 font-bold tracking-wider whitespace-nowrap w-[200px]">Tiến độ</th>
                <th className="px-6 py-5 font-bold tracking-wider whitespace-nowrap w-[160px]">Trạng thái</th>
                <th className="px-6 py-5 font-bold tracking-wider text-right whitespace-nowrap w-[100px]">Thao tác</th>
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
                      <td className="px-6 py-5 font-mono text-xs font-bold text-[var(--color-muted-foreground)] whitespace-nowrap w-[120px]">
                        <span 
                          onClick={() => setViewingOrder(order)}
                          className="cursor-pointer hover:text-[#5B3DF5] transition-colors"
                          title="Bấm để xem chi tiết"
                        >
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5 min-w-[220px] max-w-[320px]">
                        <div className="flex items-center gap-1.5">
                          <span 
                            onClick={() => setViewingOrder(order)}
                            title={order.url} 
                            className="text-[var(--color-foreground)] hover:text-[#5B3DF5] font-semibold truncate block transition-colors cursor-pointer"
                          >
                            {order.url}
                          </span>
                          <a 
                            href={order.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            title="Mở liên kết"
                            className="text-[var(--color-muted-foreground)] hover:text-[#5B3DF5] shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap w-[140px]">
                        <span className="px-3 py-1.5 bg-[#5B3DF5]/10 text-[#5B3DF5] text-xs font-bold rounded-xl border border-[#5B3DF5]/20 whitespace-nowrap inline-block">
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
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => setViewingOrder(order)}
                            className="p-2 text-[var(--color-muted-foreground)] hover:text-[#5B3DF5] hover:bg-[#5B3DF5]/10 rounded-xl transition-all"
                            title="Xem chi tiết đơn"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEditModal(order)}
                            className="p-2 text-[var(--color-muted-foreground)] hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
                            title="Chỉnh sửa đơn"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(order.id)}
                            className="p-2 text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                            title="Huỷ/Xoá đơn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                  Tạo đơn tăng tương tác mới
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
                  {submitting ? 'Đang tạo đơn...' : 'Tạo đơn'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Buff Order Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setViewingOrder(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--color-background)] rounded-3xl shadow-2xl border border-[var(--color-border)] flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 sm:p-8 border-b border-[var(--color-border)] shrink-0 flex justify-between items-center bg-[var(--color-card)]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#5B3DF5]/10 rounded-xl text-[#5B3DF5]">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-foreground)]">
                      Đơn tăng tương tác #{viewingOrder.id.slice(-6).toUpperCase()}
                    </h3>
                    <p className="text-xs text-[var(--color-muted-foreground)]">Chi tiết tiến độ và cấu hình seeding</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingOrder(null)}
                  className="p-2 rounded-xl text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
                {/* Status & Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
                    <span className="text-xs text-[var(--color-muted-foreground)] block mb-1">Loại tương tác</span>
                    <span className="px-3 py-1 bg-[#5B3DF5]/10 text-[#5B3DF5] text-xs font-bold rounded-xl border border-[#5B3DF5]/20 inline-block">
                      {viewingOrder.actionType}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
                    <span className="text-xs text-[var(--color-muted-foreground)] block mb-1">Trạng thái</span>
                    <div>
                      {viewingOrder.status === 'RUNNING' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl border border-blue-500/20">
                          <PlayCircle className="w-3.5 h-3.5 animate-pulse" /> Đang chạy
                        </span>
                      ) : viewingOrder.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-xs rounded-xl border border-green-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                        </span>
                      ) : viewingOrder.status === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl border border-red-500/20">
                          <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-500/10 text-gray-600 dark:text-gray-400 font-bold text-xs rounded-xl border border-gray-500/20">
                          <Clock className="w-3.5 h-3.5" /> Chờ xử lý
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-[var(--color-muted-foreground)]">Tiến độ thực hiện</span>
                    <span className="text-[var(--color-foreground)]">
                      {viewingOrder.currentCount} / {viewingOrder.targetCount} ({Math.round(Math.min(100, (viewingOrder.currentCount / viewingOrder.targetCount) * 100))}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-[var(--color-muted)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#5B3DF5] to-[#7B61FF] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (viewingOrder.currentCount / viewingOrder.targetCount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Target URL */}
                <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-1.5">
                  <span className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider block">
                    Link bài viết mục tiêu
                  </span>
                  <div className="flex items-center gap-2">
                    <input 
                      readOnly 
                      value={viewingOrder.url}
                      className="w-full text-xs font-mono bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-[var(--color-foreground)] outline-none"
                    />
                    <a 
                      href={viewingOrder.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[#5B3DF5] shrink-0"
                      title="Mở trình duyệt"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Config */}
                {viewingOrder.config && Object.keys(viewingOrder.config).length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider block">
                      Cấu hình nâng cao
                    </span>
                    <div className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] overflow-x-auto">
                      <pre className="text-xs font-mono text-[var(--color-foreground)] whitespace-pre-wrap">
                        {JSON.stringify(viewingOrder.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="text-xs text-[var(--color-muted-foreground)]">
                  Thời gian tạo: {new Date(viewingOrder.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-[var(--color-border)] shrink-0 flex gap-3 bg-[var(--color-card)]">
                <button 
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
                >
                  Đóng
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const target = viewingOrder;
                    setViewingOrder(null);
                    openEditModal(target);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-[#5B3DF5] text-white hover:bg-[#4829E6] shadow-lg shadow-[#5B3DF5]/20 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Buff Order Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingOrder(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--color-background)] rounded-3xl shadow-2xl border border-[var(--color-border)] flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 sm:p-8 border-b border-[var(--color-border)] shrink-0 flex justify-between items-center bg-[var(--color-card)]">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 text-[var(--color-foreground)]">
                    <Edit2 className="w-5 h-5 text-[#5B3DF5]" />
                    Chỉnh sửa đơn tăng tương tác #{editingOrder.id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Cập nhật số lượng, mục tiêu và trạng thái đơn</p>
                </div>
                <button 
                  onClick={() => setEditingOrder(null)}
                  className="p-2 rounded-xl text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 sm:p-8 overflow-y-auto">
                <form id="edit-buff-form" onSubmit={handleUpdateOrder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">Loại tương tác</label>
                      <select 
                        value={editFormData.actionType}
                        onChange={e => setEditFormData({...editFormData, actionType: e.target.value})}
                        className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5] font-medium"
                      >
                        <option value="LIKE">👍 Like Bài Viết</option>
                        <option value="COMMENT">💬 Bình Luận</option>
                        <option value="SHARE">🔄 Chia Sẻ</option>
                        <option value="FOLLOW">👥 Tăng Theo Dõi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">Trạng thái</label>
                      <select 
                        value={editFormData.status}
                        onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                        className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5] font-medium"
                      >
                        <option value="PENDING">Chờ xử lý (PENDING)</option>
                        <option value="RUNNING">Đang chạy (RUNNING)</option>
                        <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
                        <option value="FAILED">Thất bại/Lỗi (FAILED)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">Link hoặc ID bài viết *</label>
                    <input 
                      type="text" 
                      value={editFormData.url}
                      onChange={e => setEditFormData({...editFormData, url: e.target.value})}
                      placeholder="https://facebook.com/..."
                      className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5] font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">Số lượng mục tiêu</label>
                      <input 
                        type="number" 
                        value={editFormData.targetCount}
                        onChange={e => setEditFormData({...editFormData, targetCount: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5] font-medium"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">Số lượng hiện tại</label>
                      <input 
                        type="number" 
                        value={editFormData.currentCount}
                        onChange={e => setEditFormData({...editFormData, currentCount: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5] font-medium"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">Cấu hình nâng cao (JSON)</label>
                    <textarea 
                      value={editFormData.config}
                      onChange={e => setEditFormData({...editFormData, config: e.target.value})}
                      className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#5B3DF5] font-mono text-xs h-24 resize-none"
                      placeholder='{"delay": 5, "comments": ["Hay quá", "Quá đỉnh"]}'
                    />
                  </div>
                </form>
              </div>
              
              <div className="p-6 sm:p-8 border-t border-[var(--color-border)] shrink-0 flex gap-4 justify-end bg-[var(--color-card)]">
                <button 
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-6 py-2.5 text-sm font-bold rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  form="edit-buff-form"
                  disabled={isEditSubmitting}
                  className="px-8 py-2.5 text-sm font-bold rounded-xl bg-[#5B3DF5] text-white hover:bg-[#4829E6] shadow-lg shadow-[#5B3DF5]/20 hover:shadow-[#5B3DF5]/40 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isEditSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
