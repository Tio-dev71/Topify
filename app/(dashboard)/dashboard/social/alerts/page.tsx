'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, RefreshCw, CheckCircle, Clock, ExternalLink, Activity, Search, AlertCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';

type MentionAlert = {
  id: string;
  title: string;
  message: string | null;
  sourceUrl: string | null;
  keyword: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<MentionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts?limit=100');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true })
      });

      if (res.ok) {
        setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a));
      }
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadAlerts = alerts.filter(a => !a.isRead);
      if (unreadAlerts.length === 0) return;
      
      // We process them in parallel for speed
      await Promise.all(
        unreadAlerts.map(alert => 
          fetch('/api/alerts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: alert.id, isRead: true })
          })
        )
      );
      
      setAlerts(alerts.map(a => ({ ...a, isRead: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteAlert = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAlerts(alerts.filter(a => a.id !== id));
        toast.success('Đã xóa thông báo');
      } else {
        toast.error('Xóa thất bại');
      }
    } catch (err) {
      toast.error('Xóa thất bại');
    }
  };

  const filteredAlerts = alerts
    .filter(a => {
      if (filter === 'unread') return !a.isRead;
      if (filter === 'read') return a.isRead;
      return true;
    })
    .filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.message && a.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.keyword && a.keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium">
            <Activity className="w-4 h-4" />
            Social Listening
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500">
            Cảnh Báo Đề Cập
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Theo dõi thương hiệu và từ khóa của bạn trên toàn mạng xã hội. Phản hồi nhanh chóng và nắm bắt mọi cơ hội.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 w-full lg:w-auto"
        >
          <button 
            onClick={fetchAlerts} 
            className="group flex items-center justify-center p-3.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          >
            <RefreshCw className={`w-5 h-5 text-zinc-400 group-hover:text-white ${loading ? 'animate-spin text-white' : ''}`} />
          </button>
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] group"
          >
            <CheckCircle className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
            <span className="text-zinc-300 group-hover:text-white transition-colors">Đánh dấu tất cả đã đọc</span>
          </button>
        </motion.div>
      </div>

      {/* Filters and Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8"
      >
        <div className="md:col-span-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm nội dung, tiêu đề, từ khóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-xl"
            />
          </div>
          <div className="flex bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-1.5 backdrop-blur-xl">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? 'text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {filter === f && (
                  <motion.div
                    layoutId="filter-bg"
                    className="absolute inset-0 bg-zinc-800 rounded-lg shadow-sm"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 capitalize">
                  {f === 'all' ? 'Tất cả' : f === 'unread' ? 'Chưa đọc' : 'Đã đọc'}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="md:col-span-4 flex items-center justify-between px-6 py-3.5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Bell className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-400/80 uppercase tracking-wider">Thông báo mới</p>
              <p className="text-2xl font-bold text-white leading-none mt-1">{unreadCount}</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 flex items-center justify-center animate-[spin_3s_linear_infinite]">
             <div className="w-8 h-8 bg-indigo-500/10 rounded-full"></div>
          </div>
        </div>
      </motion.div>

      {/* Alerts List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        className="relative"
      >
        {/* Glow behind list */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-purple-500/5 to-transparent blur-3xl -z-10 rounded-3xl" />
        
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {loading && alerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 px-4 text-center bg-zinc-900/20 border border-zinc-800/50 rounded-2xl backdrop-blur-sm"
              >
                <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-zinc-400 text-lg">Đang đồng bộ dữ liệu mạng xã hội...</p>
              </motion.div>
            ) : filteredAlerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 px-4 text-center bg-zinc-900/20 border border-zinc-800/50 rounded-2xl backdrop-blur-sm border-dashed"
              >
                <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <AlertCircle className="w-10 h-10 text-zinc-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Không tìm thấy thông báo</h3>
                <p className="text-zinc-400 max-w-md">
                  {searchQuery 
                    ? `Không có kết quả nào phù hợp với "${searchQuery}"` 
                    : "Hệ thống đang theo dõi 24/7. Các lượt đề cập đến thương hiệu sẽ xuất hiện ở đây."}
                </p>
              </motion.div>
            ) : (
              filteredAlerts.map((alert, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  key={alert.id}
                  onClick={(e) => {
                    if (!alert.isRead) markAsRead(alert.id, e);
                  }}
                  className={`group relative overflow-hidden p-5 md:p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    alert.isRead 
                      ? 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-800/40' 
                      : 'bg-gradient-to-r from-zinc-900/80 to-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/50 shadow-[0_0_30px_-15px_rgba(99,102,241,0.2)]'
                  } backdrop-blur-md`}
                >
                  {/* Unread Indicator Glow */}
                  {!alert.isRead && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  )}

                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    {/* Icon */}
                    <div className={`shrink-0 p-3 rounded-xl ${
                      alert.isRead ? 'bg-zinc-800/50 text-zinc-500' : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      <Bell className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2 w-full">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className={`text-lg font-bold truncate pr-4 ${alert.isRead ? 'text-zinc-300' : 'text-white'}`}>
                          {alert.title}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(alert.createdAt).toLocaleString('vi-VN', { 
                              hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm leading-relaxed ${alert.isRead ? 'text-zinc-500' : 'text-zinc-300'}`}>
                        {alert.message}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {alert.keyword && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
                            <Hash className="w-3.5 h-3.5" />
                            {alert.keyword}
                          </div>
                        )}
                        
                        {alert.sourceUrl && (
                          <a 
                            href={alert.sourceUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/5 hover:bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/10"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Xem bài viết gốc
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 self-end sm:self-center mt-2 sm:mt-0">
                      <button 
                        onClick={(e) => handleDeleteAlert(alert.id, e)}
                        className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                        title="Xóa cảnh báo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
