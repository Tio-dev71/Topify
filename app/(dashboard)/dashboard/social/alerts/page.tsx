'use client';

import { useState, useEffect } from 'react';
import { Bell, Trash2, RefreshCw, CheckCircle, Clock, ExternalLink } from 'lucide-react';
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

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts?limit=50');
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

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      // Optimistic update for UI, in a real scenario you'd want an endpoint that marks all as read
      // But since we only have PATCH for a single id, we'll map through them
      const unreadAlerts = alerts.filter(a => !a.isRead);
      for (const alert of unreadAlerts) {
        await fetch('/api/alerts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: alert.id, isRead: true })
        });
      }
      
      setAlerts(alerts.map(a => ({ ...a, isRead: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteAlert = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    
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

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#5B3DF5]" />
            Cảnh Báo Đề Cập (Mentions)
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Nhận thông báo khi thương hiệu hoặc từ khóa của bạn được nhắc đến
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAlerts} 
            className="p-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={markAllAsRead}
            disabled={!alerts.some(a => !a.isRead)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-foreground)]">
            Thông báo mới nhất
          </h2>
          <span className="text-sm px-2.5 py-1 bg-[#5B3DF5]/10 text-[#5B3DF5] rounded-full font-medium">
            {alerts.filter(a => !a.isRead).length} chưa đọc
          </span>
        </div>

        <div className="divide-y divide-[var(--color-border)] max-h-[700px] overflow-y-auto">
          {loading && alerts.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-muted-foreground)]">
              Đang tải danh sách thông báo...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Bell className="w-12 h-12 text-[var(--color-muted)] mb-4" />
              <p className="text-lg font-medium text-[var(--color-foreground)]">Chưa có thông báo nào</p>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Khi có ai đó nhắc đến từ khóa bạn theo dõi, thông báo sẽ hiển thị ở đây.
              </p>
            </div>
          ) : (
            alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-4 hover:bg-[var(--color-muted)]/20 transition-colors group ${!alert.isRead ? 'bg-[#5B3DF5]/5' : ''}`}
                onClick={(e) => {
                  if (!alert.isRead) markAsRead(alert.id, e);
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {!alert.isRead ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#5B3DF5]"></div>
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-transparent"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className={`text-sm font-semibold truncate ${!alert.isRead ? 'text-[var(--color-foreground)]' : 'text-[var(--color-muted-foreground)]'}`}>
                        {alert.title}
                      </h3>
                      <span className="text-xs text-[var(--color-muted-foreground)] shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    
                    <p className="text-sm text-[var(--color-foreground)] mt-1 line-clamp-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-3">
                      {alert.keyword && (
                        <span className="text-xs px-2 py-1 bg-[var(--color-muted)] rounded-md font-medium text-[var(--color-foreground)]">
                          Từ khóa: {alert.keyword}
                        </span>
                      )}
                      
                      {alert.sourceUrl && (
                        <a 
                          href={alert.sourceUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-[#5B3DF5] hover:underline flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Xem nguồn
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleDeleteAlert(alert.id, e)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
