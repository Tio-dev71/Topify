'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Shield,
  Download,
  AlertTriangle,
  Info,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type AuditLog = {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  metadata?: any;
  createdAt: string;
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-log');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        toast.error('Không thể tải nhật ký hệ thống');
      }
    } catch {
      toast.error('Lỗi khi tải nhật ký');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (logs.length === 0) {
      return toast.error('Không có dữ liệu để xuất');
    }

    const headers = ['Thời gian', 'Hành động', 'Loại tài nguyên', 'Tài nguyên ID', 'IP Address', 'Ghi chú'];
    const rows = logs.map(l => [
      format(new Date(l.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      l.action,
      l.entityType || '',
      l.entityId || '',
      l.ipAddress || '',
      typeof l.metadata === 'object' ? JSON.stringify(l.metadata).replace(/"/g, '""') : (l.metadata || '')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã tải xuống file CSV thành công');
  };

  const getStatusIcon = (action: string) => {
    if (action.includes('FAIL') || action.includes('ERROR') || action.includes('DENY')) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (action.includes('WARN')) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusBadge = (action: string) => {
    if (action.includes('FAIL') || action.includes('ERROR') || action.includes('DENY')) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">Thất bại</span>;
    }
    if (action.includes('WARN')) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Cảnh báo</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">Thành công</span>;
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(term);
    const entityMatch = (log.entityType || '').toLowerCase().includes(term);
    const ipMatch = (log.ipAddress || '').toLowerCase().includes(term);
    const metaMatch = log.metadata ? JSON.stringify(log.metadata).toLowerCase().includes(term) : false;
    return actionMatch || entityMatch || ipMatch || metaMatch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">Nhật ký hệ thống (Audit Log)</h1>
          </div>
          <p className="text-[var(--color-muted-foreground)]">Theo dõi toàn bộ thao tác và hoạt động của người dùng trên hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchLogs}
            className="p-2 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-foreground)] transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={exportCSV}
            className="bg-[var(--color-background)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[var(--color-foreground)] px-4 py-2 rounded-xl flex items-center font-medium transition-colors text-sm shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo (CSV)
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1b1e] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--color-border)] flex gap-4 bg-[var(--color-muted)]/10">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input 
              placeholder="Tìm kiếm theo hành động, loại tài nguyên, IP..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-foreground)]"
            />
          </div>
        </div>

        {/* Log List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Thời gian</th>
                <th className="px-6 py-4 font-semibold">Hành động</th>
                <th className="px-6 py-4 font-semibold">Tài nguyên</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">IP / Thiết bị</th>
                <th className="px-6 py-4 font-semibold">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--color-muted-foreground)]">
                    Đang tải nhật ký hệ thống...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--color-muted-foreground)]">
                    Không tìm thấy nhật ký nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const detailStr = log.metadata?.message || 
                    (typeof log.metadata === 'object' ? JSON.stringify(log.metadata) : (log.metadata || '—'));

                  return (
                    <tr key={log.id} className="hover:bg-[var(--color-muted)]/30 transition-colors">
                      <td className="px-6 py-4 text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded inline-block">
                          {log.action}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-[var(--color-foreground)]">
                        {log.entityType || 'Hệ thống'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.action)}
                          {getStatusBadge(log.action)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-[var(--color-muted-foreground)]">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="px-6 py-4 text-xs text-[var(--color-foreground)] max-w-xs truncate" title={detailStr}>
                        {detailStr}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
