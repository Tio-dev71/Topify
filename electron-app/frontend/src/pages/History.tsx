import { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  MessageSquare, 
  PlusSquare, 
  History as HistoryIcon, 
  RefreshCcw,
  Eye,
  X,
  Calendar,
  Shield,
  Key,
  CreditCard,
  UserCheck,
  Download,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

interface AuditLogItem {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  ipAddress?: string;
  metadata?: any;
  createdAt: string;
}

interface AutomationLog {
  id: string;
  profileId: string;
  accountName: string | null;
  actionType: string;
  link: string | null;
  message: string | null;
  createdAt: string;
}

interface HistoryStats {
  runningTasks: number;
  totalComments: number;
  totalPosts: number;
}

export default function History() {
  const [activeTab, setActiveTab] = useState<'audit' | 'automation'>('audit');

  // Audit Logs State (F065)
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [auditFilterAction, setAuditFilterAction] = useState('');
  const [auditSearchText, setAuditSearchText] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);

  // Automation Logs State
  const [autoLogs, setAutoLogs] = useState<AutomationLog[]>([]);
  const [autoStats, setAutoStats] = useState<HistoryStats>({ runningTasks: 0, totalComments: 0, totalPosts: 0 });
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [autoPage, setAutoPage] = useState(1);
  const [autoTotalPages, setAutoTotalPages] = useState(1);
  const [selectedAutoLog, setSelectedAutoLog] = useState<AutomationLog | null>(null);

  useEffect(() => {
    fetchAuditLogs();
    fetchAutoLogs(1);
  }, []);

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.get('/audit-log?limit=100');
      if (res.data?.logs) {
        setAuditLogs(res.data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
      toast.error('Không thể tải nhật ký quản trị hệ thống');
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchAutoLogs = async (pageNumber = 1) => {
    setLoadingAuto(true);
    try {
      const res = await api.get(`/automation-logs?page=${pageNumber}&limit=50`);
      setAutoLogs(res.data.logs || []);
      setAutoStats(res.data.stats || { runningTasks: 0, totalComments: 0, totalPosts: 0 });
      setAutoTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải lịch sử tự động hoá');
    } finally {
      setLoadingAuto(false);
    }
  };

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesAction = !auditFilterAction || log.action.includes(auditFilterAction);
    const matchesSearch = !auditSearchText || 
      log.action.toLowerCase().includes(auditSearchText.toLowerCase()) ||
      (log.entityType && log.entityType.toLowerCase().includes(auditSearchText.toLowerCase())) ||
      (log.userId && log.userId.toLowerCase().includes(auditSearchText.toLowerCase())) ||
      (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(auditSearchText.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const getAuditActionBadge = (action: string) => {
    if (action.includes('AUTH') || action.includes('LOGIN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Key className="w-3 h-3" /> {action}
        </span>
      );
    }
    if (action.includes('ROLE') || action.includes('PERMISSION') || action.includes('RBAC')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Shield className="w-3 h-3" /> {action}
        </span>
      );
    }
    if (action.includes('BILLING') || action.includes('PLAN') || action.includes('SUBSCRIPTION')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <CreditCard className="w-3 h-3" /> {action}
        </span>
      );
    }
    if (action.includes('EXPORT') || action.includes('BACKUP')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Download className="w-3 h-3" /> {action}
        </span>
      );
    }
    if (action.includes('MEMBER') || action.includes('USER') || action.includes('INVITE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <UserCheck className="w-3 h-3" /> {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
        <Activity className="w-3 h-3" /> {action}
      </span>
    );
  };

  const getAutoActionLabel = (type: string) => {
    switch (type) {
      case 'COMMENT': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><MessageSquare className="w-3 h-3" /> Comment</span>;
      case 'POST_REEL': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700"><Play className="w-3 h-3" /> Đăng Reel</span>;
      case 'ADD_FRIEND': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><PlusSquare className="w-3 h-3" /> Thêm bạn</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{type}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-purple-600" />
            Nhật Ký Hoạt Động (F065 Audit Log)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ghi log toàn bộ thao tác quan trọng: đăng nhập, phân quyền, quản lý nhân viên, đổi gói cước và bảo mật hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'audit') fetchAuditLogs();
              else fetchAutoLogs(autoPage);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 relative transition-colors cursor-pointer ${
            activeTab === 'audit'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Nhật Ký Quản Trị Hệ Thống (Audit Log - F065)
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 font-bold">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('automation')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 relative transition-colors cursor-pointer ${
            activeTab === 'automation'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Nhật Ký Tự Động Hóa Mạng Xã Hội
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 font-medium">
            {autoLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: AUDIT LOG (F065) */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <span className="text-xs font-medium text-gray-500">Tổng số bản ghi Audit</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{auditLogs.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <span className="text-xs font-medium text-gray-500">Đăng nhập & Phiên</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {auditLogs.filter((l) => l.action.includes('AUTH') || l.action.includes('LOGIN')).length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <span className="text-xs font-medium text-gray-500">Phân quyền & Nhân sự</span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {auditLogs.filter((l) => l.action.includes('ROLE') || l.action.includes('USER') || l.action.includes('MEMBER')).length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <span className="text-xs font-medium text-gray-500">Gói cước & Xuất dữ liệu</span>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {auditLogs.filter((l) => l.action.includes('BILLING') || l.action.includes('PLAN') || l.action.includes('EXPORT')).length}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={auditSearchText}
                onChange={(e) => setAuditSearchText(e.target.value)}
                placeholder="Tìm kiếm theo hành động, người dùng, metadata..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={auditFilterAction}
                onChange={(e) => setAuditFilterAction(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">Tất cả loại hành động</option>
                <option value="AUTH">Xác thực (Auth / Login)</option>
                <option value="ROLE">Phân quyền (RBAC / Role)</option>
                <option value="MEMBER">Nhân viên & Lời mời</option>
                <option value="BILLING">Thanh toán & Gói cước</option>
                <option value="WORKSPACE">Không gian làm việc</option>
                <option value="EXPORT">Xuất dữ liệu</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-900">
                <thead className="bg-gray-50/60 text-gray-500 border-b border-gray-100 text-xs">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Thời gian</th>
                    <th className="px-6 py-3.5 font-semibold">Hành động</th>
                    <th className="px-6 py-3.5 font-semibold">Thực thể</th>
                    <th className="px-6 py-3.5 font-semibold">Người thực hiện</th>
                    <th className="px-6 py-3.5 font-semibold">Địa chỉ IP</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Đang tải nhật ký kiểm toán...
                      </td>
                    </tr>
                  ) : filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-xs">
                        Không có bản ghi nhật ký nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getAuditActionBadge(log.action)}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-700 whitespace-nowrap">
                          <span className="font-semibold">{log.entityType || 'Hệ thống'}</span>
                          {log.entityId && (
                            <span className="text-gray-400 font-mono text-[11px] ml-1.5">
                              #{log.entityId.slice(0, 8)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-800 whitespace-nowrap">
                          {log.userId || 'admin@topify.app'}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-mono whitespace-nowrap">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedAuditLog(log)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                            title="Xem chi tiết payload"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATION & SOCIAL LOGS */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          {/* Social Automation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tiến trình đang chạy</p>
                <p className="text-2xl font-semibold text-gray-900">{autoStats.runningTasks}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Bình luận đã gửi</p>
                <p className="text-2xl font-semibold text-gray-900">{autoStats.totalComments}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Play className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Reels đã đăng</p>
                <p className="text-2xl font-semibold text-gray-900">{autoStats.totalPosts}</p>
              </div>
            </div>
          </div>

          {/* Automation Logs Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-900">
                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100 text-xs">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Thời gian</th>
                    <th className="px-6 py-3.5 font-medium">Tài khoản</th>
                    <th className="px-6 py-3.5 font-medium">Hành động</th>
                    <th className="px-6 py-3.5 font-medium">Nội dung</th>
                    <th className="px-6 py-3.5 font-medium text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingAuto ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Đang tải lịch sử tự động hoá...
                      </td>
                    </tr>
                  ) : autoLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-xs">
                        Chưa có lịch sử tự động hoá nào.
                      </td>
                    </tr>
                  ) : (
                    autoLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {log.accountName || 'Không tên'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getAutoActionLabel(log.actionType)}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 max-w-md truncate">
                          {log.message || log.link || 'Không có nội dung'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedAutoLog(log)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {autoTotalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Trang {autoPage} / {autoTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={autoPage <= 1}
                    onClick={() => setAutoPage((p) => p - 1)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 cursor-pointer"
                  >
                    Trước
                  </button>
                  <button
                    disabled={autoPage >= autoTotalPages}
                    onClick={() => setAutoPage((p) => p + 1)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL MODAL: AUDIT LOG */}
      {selectedAuditLog && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">Chi Tiết Nhật Ký Kiểm Toán</h3>
              </div>
              <button onClick={() => setSelectedAuditLog(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 block mb-1">Hành động</span>
                  <span className="font-semibold text-gray-900">{selectedAuditLog.action}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 block mb-1">Thời gian</span>
                  <span className="font-medium text-gray-900">{new Date(selectedAuditLog.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 block mb-1">Thực thể (Entity)</span>
                  <span className="font-semibold text-gray-900">{selectedAuditLog.entityType || 'N/A'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 block mb-1">IP Address</span>
                  <span className="font-mono text-gray-900">{selectedAuditLog.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-700 block mb-1.5">Metadata Payload:</span>
                <pre className="p-3 bg-gray-900 text-gray-100 rounded-xl text-xs font-mono overflow-x-auto max-h-60 leading-relaxed">
                  {JSON.stringify(selectedAuditLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: AUTOMATION LOG */}
      {selectedAutoLog && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Chi Tiết Tự Động Hóa</h3>
              <button onClick={() => setSelectedAutoLog(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div>
                <span className="text-gray-500 block mb-1">Tài khoản</span>
                <span className="font-semibold text-gray-900">{selectedAutoLog.accountName}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Hành động</span>
                <span>{getAutoActionLabel(selectedAutoLog.actionType)}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Nội dung</span>
                <p className="p-3 bg-gray-50 rounded-xl text-gray-800 break-words">{selectedAutoLog.message || 'Không có nội dung'}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button
                onClick={() => setSelectedAutoLog(null)}
                className="px-5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
