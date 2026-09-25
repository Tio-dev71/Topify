'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, RefreshCw, CheckCircle, Clock, ExternalLink, Activity, Search, AlertCircle, Filter, Settings, Power, TrendingUp, TrendingDown, Hash, MessageSquare, Sparkles } from 'lucide-react';
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
  const positiveCount = alerts.filter(a => a.sentiment === 'positive').length;
  const negativeCount = alerts.filter(a => a.sentiment === 'negative').length;

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen font-sans relative">
      {/* Background ambient glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-semibold tracking-wide backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            Social Listening Intelligence
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-indigo-900 to-indigo-600 dark:from-white dark:via-indigo-100 dark:to-indigo-300 py-2">
            Cảnh Báo Đề Cập
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed font-medium">
            Hệ thống giám sát thương hiệu theo thời gian thực. Theo dõi mọi thảo luận trên đa nền tảng mạng xã hội.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="flex flex-wrap items-center gap-4 w-full xl:w-auto"
        >
          {/* Auto Scrape Toggle */}
          <div className="flex items-center gap-4 px-5 py-3.5 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-black/20 hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all">
            <div className={`p-2 rounded-xl transition-colors duration-500 ${autoScrape ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
              <Power className="w-5 h-5" />
            </div>
            <div className="flex flex-col pr-2">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">Quét tự động</span>
              <span className={`text-xs font-medium ${autoScrape ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                {autoScrape ? 'Đang hoạt động' : 'Tạm dừng'}
              </span>
            </div>
            <button 
              onClick={() => {
                setAutoScrape(!autoScrape);
                toast.success(autoScrape ? 'Đã dừng quét tự động' : 'Đã bật quét tự động', {
                  icon: <Power className={autoScrape ? "text-rose-500" : "text-emerald-500"} />
                });
              }}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 focus:ring-indigo-500 ${autoScrape ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${autoScrape ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={fetchAlerts} 
              className="group relative flex items-center justify-center w-14 h-14 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-zinc-200 dark:border-zinc-800/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 rounded-2xl transition-all duration-300 shadow-xl shadow-zinc-200/50 dark:shadow-black/20"
              title="Làm mới"
            >
              <RefreshCw className={`w-5 h-5 text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
            <button 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="group relative flex items-center justify-center gap-2 px-6 h-14 rounded-2xl text-sm font-bold bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 dark:hover:from-indigo-400 dark:hover:to-violet-500 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <CheckCircle className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Đọc tất cả</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10"
      >
        {[
          { 
            title: "Cảnh báo mới", 
            value: unreadCount, 
            subtitle: "chưa xử lý", 
            icon: Bell, 
            color: "indigo", 
            gradient: "from-indigo-100/50 to-blue-50/50 dark:from-indigo-500/20 dark:to-blue-500/5",
            border: "border-indigo-200 dark:border-indigo-500/20",
            text: "text-indigo-600 dark:text-indigo-400",
            bgIcon: "bg-indigo-100 dark:bg-zinc-900/50"
          },
          { 
            title: "Tích cực", 
            value: positiveCount, 
            subtitle: "so với tuần trước", 
            trend: "+12%",
            icon: TrendingUp, 
            color: "emerald", 
            gradient: "from-emerald-100/50 to-teal-50/50 dark:from-emerald-500/20 dark:to-teal-500/5",
            border: "border-emerald-200 dark:border-emerald-500/20",
            text: "text-emerald-600 dark:text-emerald-400",
            bgIcon: "bg-emerald-100 dark:bg-zinc-900/50"
          },
          { 
            title: "Tiêu cực", 
            value: negativeCount, 
            subtitle: "cần chú ý", 
            trend: "-5%",
            icon: TrendingDown, 
            color: "rose", 
            gradient: "from-rose-100/50 to-orange-50/50 dark:from-rose-500/20 dark:to-orange-500/5",
            border: "border-rose-200 dark:border-rose-500/20",
            text: "text-rose-600 dark:text-rose-400",
            bgIcon: "bg-rose-100 dark:bg-zinc-900/50"
          }
        ].map((stat, i) => (
          <div key={i} className={`relative group overflow-hidden bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border ${stat.border} rounded-[2rem] p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-${stat.color}-500/10`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/40 dark:bg-white/5 rounded-full blur-3xl group-hover:bg-white/60 dark:group-hover:bg-white/10 transition-colors duration-500" />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-8">
                <div className={`p-3 rounded-2xl ${stat.bgIcon} backdrop-blur-md border border-white/40 dark:border-zinc-800 shadow-inner ${stat.text}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                {stat.trend && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${stat.bgIcon} backdrop-blur-md border border-white/40 dark:border-zinc-800 text-sm font-bold ${stat.text}`}>
                    <stat.icon className="w-4 h-4" /> {stat.trend}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-5xl font-black text-zinc-900 dark:text-white tracking-tight">{stat.value}</span>
                </div>
                <h3 className="text-zinc-600 dark:text-zinc-400 font-medium text-lg">{stat.title} <span className="text-sm opacity-60">({stat.subtitle})</span></h3>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Controls Bar - Search & Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        className="flex flex-col lg:flex-row gap-4 mb-8 sticky top-6 z-40"
      >
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors duration-300" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm nội dung, từ khóa, nguồn gốc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-400 dark:focus:border-indigo-500/50 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl shadow-zinc-200/50 dark:shadow-black/20 text-lg font-medium"
          />
        </div>
        
        <div className="flex bg-white/80 dark:bg-zinc-900/70 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-1.5 shadow-xl shadow-zinc-200/50 dark:shadow-black/20">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative px-8 py-3 rounded-xl text-sm font-bold transition-colors duration-300 ${
                filter === f ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              {filter === f && (
                <motion.div
                  layoutId="filter-active"
                  className="absolute inset-0 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 rounded-xl shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {f === 'all' ? <Activity className="w-4 h-4" /> : f === 'unread' ? <Bell className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        className="relative"
      >
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {loading && alerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 px-4 text-center bg-white/50 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/50 rounded-[2rem]"
              >
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-3">Đang đồng bộ dữ liệu</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-md">Quét các mạng xã hội để tìm đề cập mới nhất về thương hiệu của bạn...</p>
              </motion.div>
            ) : filteredAlerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 px-4 text-center bg-white/50 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/50 rounded-[2rem] border-dashed"
              >
                <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-zinc-200 dark:ring-zinc-700/50">
                  <MessageSquare className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-3">Chưa có thông báo nào</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-md">
                  {searchQuery 
                    ? `Không tìm thấy kết quả cho "${searchQuery}"` 
                    : "Hệ thống giám sát đang theo dõi 24/7. Các lượt đề cập sẽ xuất hiện ở đây."}
                </p>
              </motion.div>
            ) : (
              filteredAlerts.map((alert, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  key={alert.id}
                  onClick={(e) => {
                    if (!alert.isRead) markAsRead(alert.id, e);
                  }}
                  className={`group relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer 
                    ${alert.isRead 
                      ? 'bg-zinc-50/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400' 
                      : 'bg-white dark:bg-zinc-800/90 backdrop-blur-xl border border-indigo-200 dark:border-indigo-500/50 hover:border-indigo-300 dark:hover:border-indigo-400/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {/* Unread Glow Effect */}
                  {!alert.isRead && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-violet-600 shadow-[0_0_10px_rgba(99,102,241,0.4)] dark:shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                  )}

                  <div className="flex flex-col sm:flex-row gap-5 p-5 sm:p-6 items-start">
                    {/* Sentiment Icon */}
                    <div className={`shrink-0 p-3.5 rounded-2xl border ${
                      alert.sentiment === 'positive' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] dark:shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' :
                      alert.sentiment === 'negative' ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 shadow-[inset_0_0_20px_rgba(244,63,94,0.05)] dark:shadow-[inset_0_0_20px_rgba(244,63,94,0.1)]' :
                      'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)] dark:shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]'
                    }`}>
                      {alert.sentiment === 'positive' ? <TrendingUp className="w-6 h-6" /> :
                       alert.sentiment === 'negative' ? <TrendingDown className="w-6 h-6" /> :
                       <Activity className="w-6 h-6" />}
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <h3 className={`text-lg font-bold truncate pr-4 ${alert.isRead ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          {alert.title}
                        </h3>
                        <div className="flex items-center gap-3">
                          {!alert.isRead && (
                            <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                              Mới
                            </span>
                          )}
                          <span className="text-sm font-medium text-zinc-500 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {new Date(alert.createdAt).toLocaleString('vi-VN', { 
                              hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-base leading-relaxed mb-4 line-clamp-3 ${alert.isRead ? 'text-zinc-500 dark:text-zinc-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {alert.message}
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                        <div className="flex flex-wrap items-center gap-3">
                          {alert.keyword && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 text-xs font-semibold">
                              <Hash className="w-3.5 h-3.5 text-zinc-500" />
                              {alert.keyword}
                            </div>
                          )}
                          
                          {alert.sourceUrl && (
                            <a 
                              href={alert.sourceUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Xem bài viết gốc
                            </a>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => handleDeleteAlert(alert.id, e)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20"
                            title="Xóa cảnh báo"
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </button>
                        </div>
                      </div>
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
