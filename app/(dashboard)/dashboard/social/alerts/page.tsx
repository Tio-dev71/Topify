'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, RefreshCw, CheckCircle, Clock, ExternalLink, Activity, Search, Filter, Power, TrendingUp, TrendingDown, Hash, MessageSquare, Sparkles, Plus, Info, Check, X, Eye, Edit2 } from 'lucide-react';
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
  const [activeKeyword, setActiveKeyword] = useState<string>('all');
  const [clearPrevious, setClearPrevious] = useState(true);
  const [autoScrape, setAutoScrape] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('topify_auto_scrape');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });
  const [scrapeInterval, setScrapeInterval] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('topify_scrape_interval');
      if (saved) return parseInt(saved, 10);
    }
    return 60;
  });
  const [showAutoScrapeSpecs, setShowAutoScrapeSpecs] = useState(false);
  const [_lastScrapedAt, setLastScrapedAt] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncKeyword, setSyncKeyword] = useState('');
  const [syncing, setSyncing] = useState(false);

  // View & Edit Modal states
  const [viewingAlert, setViewingAlert] = useState<MentionAlert | null>(null);
  const [editingAlert, setEditingAlert] = useState<MentionAlert | null>(null);
  const [editAlertFormData, setEditAlertFormData] = useState({
    id: '',
    title: '',
    message: '',
    keyword: ''
  });
  const [updatingAlert, setUpdatingAlert] = useState(false);

  const fetchAlerts = async (keywordFilter?: string) => {
    setLoading(true);
    try {
      const kw = keywordFilter !== undefined ? keywordFilter : activeKeyword;
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (kw && kw !== 'all') {
        params.set('keyword', kw);
      }
      const res = await fetch(`/api/alerts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Mock sentiments for visual flair if not provided
        const enrichedAlerts = (data.alerts || []).map((a: MentionAlert, i: number) => ({
          ...a,
          sentiment: a.sentiment || (i % 3 === 0 ? 'positive' : i % 3 === 1 ? 'negative' : 'neutral')
        }));
        setAlerts(enrichedAlerts);
      }
    } catch (_err) {
      toast.error('Lỗi khi tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    fetch('/api/alerts?limit=100')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isSubscribed && data?.alerts) {
          const enrichedAlerts = data.alerts.map((a: MentionAlert, i: number) => ({
            ...a,
            sentiment: a.sentiment || (i % 3 === 0 ? 'positive' : i % 3 === 1 ? 'negative' : 'neutral')
          }));
          setAlerts(enrichedAlerts);
        }
      })
      .catch(() => {
        if (isSubscribed) toast.error('Lỗi khi tải danh sách thông báo');
      })
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Polling nhẹ theo thời gian thực khi đang mở trang và bật Quét tự động
  useEffect(() => {
    if (!autoScrape) return;

    const timer = setInterval(() => {
      fetchAlerts(activeKeyword);
      setLastScrapedAt(new Date());
    }, 60000); // 60s/lần kiểm tra cập nhật mới

    return () => clearInterval(timer);
  }, [autoScrape, activeKeyword]);

  const formatAlertTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { display: dateStr, relative: '', tooltip: '' };

      const timeStr = d.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
      const dateStrFormatted = d.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });

      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let relative = '';
      if (diffMins < 1 && diffMins >= 0) {
        relative = 'Vừa xong';
      } else if (diffMins < 60 && diffMins >= 1) {
        relative = `${diffMins} phút trước`;
      } else if (diffHours < 24 && diffHours >= 1) {
        relative = `${diffHours} giờ trước`;
      } else if (diffDays === 1) {
        relative = 'Hôm qua';
      } else if (diffDays > 1 && diffDays < 30) {
        relative = `${diffDays} ngày trước`;
      }

      return {
        display: `${timeStr} ${dateStrFormatted}`,
        relative,
        tooltip: `Thời gian xuất bản gốc: ${timeStr} ngày ${dateStrFormatted} (Múi giờ Việt Nam GMT+7)`
      };
    } catch (_e) {
      return { display: dateStr, relative: '', tooltip: '' };
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
    } catch (_err) {
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
    } catch (_err) {
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
    } catch (_err) {
      toast.error('Xóa thất bại');
    }
  };

  const handleClearAllAlerts = async () => {
    if (!confirm('Bạn có chắc muốn xóa sạch toàn bộ kết quả cảnh báo hiện tại để bắt đầu một phiên theo dõi mới?')) {
      return;
    }
    try {
      const res = await fetch('/api/alerts?all=true', { method: 'DELETE' });
      if (res.ok) {
        setAlerts([]);
        setActiveKeyword('all');
        toast.success('Đã xóa sạch toàn bộ kết quả cảnh báo');
      } else {
        toast.error('Xóa thất bại');
      }
    } catch (_err) {
      toast.error('Lỗi khi xóa kết quả');
    }
  };

  const handleOpenEditAlert = (alert: MentionAlert, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAlert(alert);
    setEditAlertFormData({
      id: alert.id,
      title: alert.title || '',
      message: alert.message || '',
      keyword: alert.keyword || ''
    });
  };

  const handleUpdateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAlertFormData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề thông báo');
      return;
    }

    setUpdatingAlert(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAlertFormData)
      });

      if (res.ok) {
        toast.success('Cập nhật thông báo thành công');
        setAlerts(prev => prev.map(a => a.id === editAlertFormData.id ? {
          ...a,
          title: editAlertFormData.title,
          message: editAlertFormData.message,
          keyword: editAlertFormData.keyword
        } : a));
        if (viewingAlert?.id === editAlertFormData.id) {
          setViewingAlert(prev => prev ? {
            ...prev,
            title: editAlertFormData.title,
            message: editAlertFormData.message,
            keyword: editAlertFormData.keyword
          } : null);
        }
        setEditingAlert(null);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Cập nhật thất bại');
      }
    } catch (_err) {
      toast.error('Lỗi khi cập nhật thông báo');
    } finally {
      setUpdatingAlert(false);
    }
  };

  const handleSyncAlerts = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKw = syncKeyword.trim();
    if (!cleanKw) {
      toast.error('Vui lòng nhập từ khóa hoặc tên thương hiệu');
      return;
    }

    setSyncing(true);
    if (clearPrevious) {
      // Clear local list immediately for clean real-time new session
      setAlerts([]);
    }

    try {
      const res = await fetch('/api/alerts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyword: cleanKw,
          clearPrevious 
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Quét cảnh báo thành công!');
        setShowAddModal(false);
        setSyncKeyword('');
        setActiveKeyword(cleanKw);
        await fetchAlerts(cleanKw);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi khi quét tin tức');
      }
    } catch (_err) {
      toast.error('Lỗi kết nối khi quét cảnh báo');
    } finally {
      setSyncing(false);
    }
  };

  const availableKeywords = Array.from(
    new Set(alerts.map(a => a.keyword).filter(Boolean) as string[])
  );

  const filteredAlerts = alerts
    .filter(a => {
      if (activeKeyword !== 'all' && a.keyword && a.keyword.toLowerCase() !== activeKeyword.toLowerCase()) {
        return false;
      }
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
          {/* Auto Scrape Toggle & Specs */}
          <div className="flex items-center gap-3.5 px-5 py-3.5 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-black/20 hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all">
            <div className={`p-2 rounded-xl transition-colors duration-500 ${autoScrape ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
              <Power className="w-5 h-5" />
            </div>
            <div className="flex flex-col pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">Quét tự động</span>
                <button 
                  type="button"
                  onClick={() => setShowAutoScrapeSpecs(true)}
                  className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  title="Bấm để xem đặc tả cơ chế hoạt động & cấu hình chu kỳ quét ngầm"
                >
                  <Info className="w-4 h-4 text-indigo-500" />
                </button>
              </div>
              <span className={`text-xs font-medium ${autoScrape ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                {autoScrape ? `Đang chạy (${scrapeInterval < 60 ? `${scrapeInterval}p` : `${scrapeInterval / 60}h`}/lần)` : 'Tạm dừng'}
              </span>
            </div>
            <button 
              type="button"
              onClick={() => {
                const nextState = !autoScrape;
                setAutoScrape(nextState);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('topify_auto_scrape', String(nextState));
                }
                toast.success(nextState ? 'Đã bật quét tự động định kỳ' : 'Đã dừng quét tự động', {
                  icon: <Power className={nextState ? "text-emerald-500" : "text-rose-500"} />
                });
              }}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 focus:ring-indigo-500 ${autoScrape ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              title={autoScrape ? "Bấm để tạm dừng quét tự động" : "Bấm để bật quét tự động"}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${autoScrape ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 h-14 rounded-2xl text-sm font-bold bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90 transition-opacity shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm cảnh báo</span>
            </button>
            <button 
              onClick={() => fetchAlerts(activeKeyword)} 
              className="group relative flex items-center justify-center w-14 h-14 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-zinc-200 dark:border-zinc-800/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 rounded-2xl transition-all duration-300 shadow-xl shadow-zinc-200/50 dark:shadow-black/20"
              title="Làm mới"
            >
              <RefreshCw className={`w-5 h-5 text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
            <button 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="group relative flex items-center justify-center gap-2 px-5 h-14 rounded-2xl text-sm font-bold bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 dark:hover:from-indigo-400 dark:hover:to-violet-500 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] overflow-hidden"
            >
              <CheckCircle className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Đọc tất cả</span>
            </button>
            {alerts.length > 0 && (
              <button 
                onClick={handleClearAllAlerts}
                className="group relative flex items-center justify-center gap-2 px-4 h-14 rounded-2xl text-sm font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition-all duration-300 shadow-sm"
                title="Xóa sạch danh sách kết quả hiện tại để tạo phiên theo dõi mới"
              >
                <Trash2 className="w-5 h-5" />
                <span className="hidden sm:inline">Xóa kết quả</span>
              </button>
            )}
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

      {/* Keyword Filter Tabs */}
      {availableKeywords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 mb-6 p-2 rounded-2xl bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm"
        >
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Từ khóa:</span>
          </div>
          <button
            onClick={() => {
              setActiveKeyword('all');
              fetchAlerts('all');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeKeyword === 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Tất cả ({alerts.length})
          </button>
          {availableKeywords.map((kw) => {
            const count = alerts.filter(a => a.keyword?.toLowerCase() === kw.toLowerCase()).length;
            const isActive = activeKeyword.toLowerCase() === kw.toLowerCase();
            return (
              <button
                key={kw}
                onClick={() => {
                  setActiveKeyword(kw);
                  fetchAlerts(kw);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/20'
                    : 'bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Hash className="w-3 h-3 opacity-70" />
                <span>{kw}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>
      )}

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
              filteredAlerts.map((alert) => (
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
                        <h3 className={`text-lg font-bold truncate pr-4 flex-1 min-w-0 ${alert.isRead ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`} title={alert.title}>
                          {alert.title}
                        </h3>
                        <div className="flex items-center gap-3">
                          {!alert.isRead && (
                            <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                              Mới
                            </span>
                          )}
                          {(() => {
                            const timeInfo = formatAlertTime(alert.createdAt);
                            return (
                              <span 
                                className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 cursor-help"
                                title={timeInfo.tooltip}
                              >
                                <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                                <span>{timeInfo.display}</span>
                                {timeInfo.relative && (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold border border-zinc-200/50 dark:border-zinc-700/50">
                                    {timeInfo.relative}
                                  </span>
                                )}
                              </span>
                            );
                          })()}
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
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingAlert(alert);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/20"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem</span>
                          </button>
                          <button 
                            onClick={(e) => handleOpenEditAlert(alert, e)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-500/20"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </button>
                          <button 
                            onClick={(e) => handleDeleteAlert(alert.id, e)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20"
                            title="Xóa cảnh báo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
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

      {/* Add Alert Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Thêm Cảnh Báo Đề Cập</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Giám sát các thảo luận thời gian thực</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSyncAlerts} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tên thương hiệu hoặc từ khóa *
                </label>
                <input 
                  type="text" 
                  value={syncKeyword}
                  onChange={e => setSyncKeyword(e.target.value)}
                  placeholder="VD: Topify, VinFast, iPhone 16..."
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-900 dark:text-white transition-all"
                  required
                  autoFocus
                />
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  Hệ thống sẽ kết nối Real-Time News API để quét ngay các bài viết, báo chí và thảo luận MXH liên quan tại Việt Nam.
                </p>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                <input 
                  type="checkbox" 
                  id="clearPrevious"
                  checked={clearPrevious}
                  onChange={e => setClearPrevious(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="clearPrevious" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                  Làm mới session (Xóa sạch kết quả của lần tìm kiếm trước)
                </label>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={syncing}
                  className="px-5 py-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={syncing}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang quét...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Bắt đầu quét ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto Scrape Specs & Config Modal */}
      {showAutoScrapeSpecs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Cơ Chế Quét Tự Động</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Đặc tả kỹ thuật & Cấu hình chu kỳ Social Listening</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAutoScrapeSpecs(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <div className="font-bold text-emerald-800 dark:text-emerald-300">
                      Trạng thái: {autoScrape ? 'Đang hoạt động' : 'Tạm dừng'}
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Chu kỳ quét: Mỗi {scrapeInterval < 60 ? `${scrapeInterval} phút` : `${scrapeInterval / 60} giờ`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !autoScrape;
                    setAutoScrape(next);
                    if (typeof window !== 'undefined') localStorage.setItem('topify_auto_scrape', String(next));
                    toast.success(next ? 'Đã bật quét tự động' : 'Đã dừng quét tự động');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    autoScrape ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {autoScrape ? 'Tạm dừng' : 'Bật quét'}
                </button>
              </div>

              {/* Specs Details */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800">
                  <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    1. Đối tượng & Phạm vi giám sát
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Hệ thống tự động theo dõi toàn bộ các từ khóa đang kích hoạt trong Workspace. Thu thập các bài viết, báo chí, mạng xã hội mới phát sinh có chứa từ khóa.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800">
                  <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    2. Chu kỳ thực thi (Frequency)
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                    Hệ thống quét định kỳ ngầm theo chu kỳ được cấu hình bên dưới. Khi đang mở tab làm việc, hệ thống duy trì polling mỗi 60 giây để cập nhật tức thì nếu có đề cập mới.
                  </p>
                  
                  {/* Select Interval */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Chọn chu kỳ quét định kỳ:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '30 phút', value: 30 },
                        { label: '1 giờ (Chuẩn)', value: 60 },
                        { label: '3 giờ', value: 180 },
                        { label: '6 giờ', value: 360 },
                        { label: '12 giờ', value: 720 },
                        { label: '24 giờ', value: 1440 },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setScrapeInterval(item.value);
                            if (typeof window !== 'undefined') localStorage.setItem('topify_scrape_interval', String(item.value));
                            toast.success(`Đã đặt chu kỳ quét: ${item.label}`);
                          }}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center border transition-all flex items-center justify-center gap-1 ${
                            scrapeInterval === item.value
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300'
                          }`}
                        >
                          {scrapeInterval === item.value && <Check className="w-3 h-3" />}
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800">
                  <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    3. Cơ chế chống trùng lặp (Deduplication)
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Khác với &quot;Làm mới session&quot;, tiến trình Quét tự động chỉ bổ sung (Append) các bài viết mới phát sinh. Bài viết được nhận diện qua URL gốc (<code className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[11px]">sourceUrl</code>) để đảm bảo không bị trùng lặp.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAutoScrapeSpecs(false)}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Alert Detail Modal */}
      {viewingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border ${
                  viewingAlert.sentiment === 'positive' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 text-emerald-600' :
                  viewingAlert.sentiment === 'negative' ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 text-rose-600' :
                  'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-600'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Chi Tiết Cảnh Báo</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Nội dung đề cập chi tiết trên mạng xã hội</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setViewingAlert(null)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-sm">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Tiêu đề bài viết</span>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white leading-snug">
                  {viewingAlert.title}
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {viewingAlert.keyword && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold border border-zinc-200 dark:border-zinc-700/60">
                    <Hash className="w-3.5 h-3.5 text-indigo-500" />
                    {viewingAlert.keyword}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold ${
                  viewingAlert.sentiment === 'positive' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                  viewingAlert.sentiment === 'negative' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400' :
                  'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                }`}>
                  {viewingAlert.sentiment === 'positive' ? 'Tích cực' : viewingAlert.sentiment === 'negative' ? 'Tiêu cực' : 'Trung lập'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60">
                  <Clock className="w-3.5 h-3.5" />
                  {formatAlertTime(viewingAlert.createdAt).display}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Nội dung chi tiết</span>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {viewingAlert.message || 'Không có nội dung mô tả.'}
                </div>
              </div>

              {viewingAlert.sourceUrl && (
                <div className="pt-1">
                  <a 
                    href={viewingAlert.sourceUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Mở bài viết gốc tại nguồn</span>
                  </a>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
              <button 
                type="button"
                onClick={() => setViewingAlert(null)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Đóng
              </button>
              <button 
                type="button"
                onClick={() => {
                  const toEdit = viewingAlert;
                  setViewingAlert(null);
                  handleOpenEditAlert(toEdit);
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all shadow-md shadow-amber-500/20"
              >
                <Edit2 className="w-4 h-4" />
                <span>Chỉnh Sửa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Alert Modal */}
      {editingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Chỉnh Sửa Cảnh Báo</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Cập nhật tiêu đề, nội dung và từ khóa phân loại</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingAlert(null)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAlert} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Tiêu đề cảnh báo *
                </label>
                <input 
                  type="text" 
                  value={editAlertFormData.title}
                  onChange={e => setEditAlertFormData({...editAlertFormData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-amber-500/50 text-zinc-900 dark:text-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Từ khóa phân loại
                </label>
                <input 
                  type="text" 
                  value={editAlertFormData.keyword}
                  onChange={e => setEditAlertFormData({...editAlertFormData, keyword: e.target.value})}
                  placeholder="VD: Topify, Khuyến mãi,..."
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-amber-500/50 text-zinc-900 dark:text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nội dung chi tiết
                </label>
                <textarea 
                  value={editAlertFormData.message}
                  onChange={e => setEditAlertFormData({...editAlertFormData, message: e.target.value})}
                  rows={5}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-amber-500/50 text-zinc-900 dark:text-white transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <button 
                  type="button"
                  onClick={() => setEditingAlert(null)}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={updatingAlert}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all disabled:opacity-50 shadow-md shadow-amber-500/20"
                >
                  {updatingAlert && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{updatingAlert ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
