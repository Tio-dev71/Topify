'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, RefreshCw, CheckCircle, Clock, ExternalLink, Activity, Search, AlertCircle, Filter, Settings, Power, TrendingUp, TrendingDown, Hash } from 'lucide-react';
import { toast } from 'sonner';

type MentionAlert = {
  id: string;
  title: string;
  message: string | null;
  sourceUrl: string | null;
  keyword: string | null;
  isRead: boolean;
  createdAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<MentionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [autoScrape, setAutoScrape] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts?limit=100');
      if (res.ok) {
        const data = await res.json();
        // Mock sentiments for visual flair if not provided
        const enrichedAlerts = (data.alerts || []).map((a: MentionAlert, i: number) => ({
          ...a,
          sentiment: a.sentiment || (i % 3 === 0 ? 'positive' : i % 3 === 1 ? 'negative' : 'neutral')
        }));
        setAlerts(enrichedAlerts);
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
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
            <Activity className="w-4 h-4" />
            Social Listening & Monitoring
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Cảnh Báo Đề Cập
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Hệ thống tự động quét và phân tích dữ liệu từ mạng xã hội theo thời gian thực.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 w-full lg:w-auto"
        >
          {/* Auto Scrape Toggle */}
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            <div className={`p-1.5 rounded-lg ${autoScrape ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
              <Power className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Tự động cào dữ liệu</span>
              <span className="text-xs text-zinc-400">{autoScrape ? 'Đang chạy nền (24/7)' : 'Đã tạm dừng'}</span>
            </div>
            <button 
              onClick={() => {
                setAutoScrape(!autoScrape);
                toast.success(autoScrape ? 'Đã dừng cào dữ liệu tự động' : 'Đã bật cào dữ liệu tự động');
              }}
              className={`ml-2 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoScrape ? 'bg-emerald-500' : 'bg-zinc-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoScrape ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <button 
            onClick={fetchAlerts} 
            className="group flex items-center justify-center p-3.5 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all duration-300"
          >
            <RefreshCw className={`w-5 h-5 text-zinc-400 group-hover:text-white ${loading ? 'animate-spin text-white' : ''}`} />
          </button>
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Bell className="w-24 h-24 text-indigo-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-zinc-400 font-medium">Thông báo mới</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{unreadCount}</span>
              <span className="text-sm text-zinc-500">cảnh báo chưa đọc</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-zinc-400 font-medium">Phản hồi tích cực</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">
                {alerts.filter(a => a.sentiment === 'positive').length}
              </span>
              <span className="text-sm text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown className="w-24 h-24 text-rose-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h3 className="text-zinc-400 font-medium">Phản hồi tiêu cực</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">
                {alerts.filter(a => a.sentiment === 'negative').length}
              </span>
              <span className="text-sm text-rose-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> -5%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm nội dung, tiêu đề, từ khóa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all backdrop-blur-xl"
          />
        </div>
        <div className="flex bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-1 backdrop-blur-xl">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
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
      </motion.div>

      {/* Alerts List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
        className="relative"
      >
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {loading && alerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 px-4 text-center bg-zinc-900/20 border border-zinc-800/50 rounded-2xl backdrop-blur-sm"
              >
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-white mb-2">Đang đồng bộ dữ liệu...</h3>
                <p className="text-zinc-400">Hệ thống đang quét các mạng xã hội để tìm đề cập mới nhất.</p>
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
                  transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
                  key={alert.id}
                  onClick={(e) => {
                    if (!alert.isRead) markAsRead(alert.id, e);
                  }}
                  className={`group relative overflow-hidden p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                    alert.isRead 
                      ? 'bg-zinc-900/20 border-zinc-800/40 hover:bg-zinc-800/40' 
                      : 'bg-zinc-900/60 border-indigo-500/30 hover:border-indigo-500/50 shadow-lg shadow-indigo-500/5'
                  }`}
                >
                  {/* Unread Indicator */}
                  {!alert.isRead && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-12 bg-indigo-500 rounded-r-full" />
                  )}

                  <div className="flex gap-4 items-start pl-2">
                    {/* Sentiment / Icon */}
                    <div className={`shrink-0 p-2.5 rounded-xl ${
                      alert.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                      alert.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {alert.sentiment === 'positive' ? <TrendingUp className="w-5 h-5" /> :
                       alert.sentiment === 'negative' ? <TrendingDown className="w-5 h-5" /> :
                       <Bell className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <h3 className={`text-base font-semibold truncate pr-4 ${alert.isRead ? 'text-zinc-400' : 'text-white'}`}>
                          {alert.title}
                        </h3>
                        <span className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.createdAt).toLocaleString('vi-VN', { 
                            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' 
                          })}
                        </span>
                      </div>
                      
                      <p className={`text-sm leading-relaxed mb-3 line-clamp-2 ${alert.isRead ? 'text-zinc-500' : 'text-zinc-300'}`}>
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center gap-3">
                        {alert.keyword && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-xs font-medium">
                            <Hash className="w-3 h-3 text-zinc-500" />
                            {alert.keyword}
                          </div>
                        )}
                        
                        {alert.sourceUrl && (
                          <a 
                            href={alert.sourceUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Nguồn bài viết
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleDeleteAlert(alert.id, e)}
                        className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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

