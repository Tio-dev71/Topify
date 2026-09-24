'use client';

import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Shield,
  Download,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

const MOCK_AUDIT_LOGS = [
  { id: 'log-1', action: 'CREATE_CAMPAIGN', resource: 'Campaign 20/10', user: 'Hương Nguyễn', email: 'huong@topify.vn', ip: '113.190.23.45', status: 'success', timestamp: '2024-10-01T08:30:00Z', details: 'Tạo chiến dịch mới với ngân sách 15M' },
  { id: 'log-2', action: 'UPDATE_DEAL', resource: 'Deal ABC', user: 'Tuấn Trần', email: 'tuan@topify.vn', ip: '14.232.11.90', status: 'success', timestamp: '2024-10-01T09:15:22Z', details: 'Cập nhật trạng thái sang "Đang thương lượng"' },
  { id: 'log-3', action: 'DELETE_CUSTOMER', resource: 'Customer C009', user: 'Tuấn Trần', email: 'tuan@topify.vn', ip: '14.232.11.90', status: 'failure', timestamp: '2024-10-01T09:45:10Z', details: 'Từ chối quyền truy cập: Không đủ thẩm quyền' },
  { id: 'log-4', action: 'LOGIN', resource: 'System', user: 'Admin', email: 'admin@topify.vn', ip: '118.69.123.55', status: 'success', timestamp: '2024-10-01T10:00:00Z', details: 'Đăng nhập thành công' },
  { id: 'log-5', action: 'EXPORT_DATA', resource: 'Customers List', user: 'Hương Nguyễn', email: 'huong@topify.vn', ip: '113.190.23.45', status: 'warning', timestamp: '2024-10-01T14:20:00Z', details: 'Xuất 5,000 dòng dữ liệu khách hàng' },
];

export default function AuditLogPage() {
  const [logs] = useState(MOCK_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failure': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'failure': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">Nhật ký hệ thống (Audit Log)</h1>
          </div>
          <p className="text-[var(--color-muted-foreground)]">Theo dõi toàn bộ thao tác và hoạt động của người dùng trên hệ thống</p>
        </div>
        <button className="bg-[var(--color-background)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[var(--color-foreground)] px-4 py-2 rounded-xl flex items-center font-medium transition-colors">
          <Download className="w-4 h-4 mr-2" />
          Xuất báo cáo (CSV)
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a1b1e] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--color-border)] flex gap-4 bg-[var(--color-muted)]/10">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input 
              placeholder="Tìm kiếm theo hành động, người dùng, tài nguyên..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-foreground)]"
            />
          </div>
          <button className="p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-foreground)] flex items-center gap-2 px-4 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" />
            Lọc theo thời gian & loại
          </button>
        </div>

        {/* Log List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Thời gian</th>
                <th className="px-6 py-4 font-semibold">Hành động</th>
                <th className="px-6 py-4 font-semibold">Tài nguyên</th>
                <th className="px-6 py-4 font-semibold">Người dùng</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">Chi tiết / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-[var(--color-muted)]/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-[var(--color-muted-foreground)] font-mono text-xs">
                    {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-[var(--color-foreground)]">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-foreground)]">
                    {log.resource}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-[var(--color-foreground)]">{log.user}</span>
                      <span className="text-xs text-[var(--color-muted-foreground)]">{log.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)} uppercase`}>
                      {getStatusIcon(log.status)}
                      {log.status}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[var(--color-foreground)] line-clamp-1">{log.details}</span>
                      <span className="text-xs text-[var(--color-muted-foreground)] font-mono mt-0.5">IP: {log.ip}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="text-center p-12 text-[var(--color-muted-foreground)]">
              Không tìm thấy nhật ký nào khớp.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
