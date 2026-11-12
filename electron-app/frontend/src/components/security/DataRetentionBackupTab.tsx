import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Database,
  Download,
  RotateCcw,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Sliders,
  Shield,
  FileArchive,
  X,
  Zap,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface RetentionPolicy {
  category: 'AUDIT_LOGS' | 'MEDIA_ASSETS' | 'CRM_LEADS' | 'AUTOMATION_RUNS';
  categoryLabel: string;
  retentionDays: number;
  autoPurge: boolean;
  description: string;
}

interface BackupSnapshot {
  id: string;
  name: string;
  type: 'FULL_DATABASE' | 'CRM_ONLY' | 'MEDIA_METADATA';
  fileSizeMb: number;
  status: 'READY' | 'CREATING' | 'FAILED';
  downloadUrl: string;
  createdAt: string;
}

export default function DataRetentionBackupTab() {
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<RetentionPolicy[]>([
    {
      category: 'AUDIT_LOGS',
      categoryLabel: 'Nhật Ký Kiểm Toán & Truy Cập (Audit Logs)',
      retentionDays: 90,
      autoPurge: true,
      description: 'Lưu vết lịch sử đăng nhập, thay đổi quyền hạn và thao tác tài chính',
    },
    {
      category: 'MEDIA_ASSETS',
      categoryLabel: 'Tệp Hình Ảnh & Video Đăng Bài (Media Assets)',
      retentionDays: 365,
      autoPurge: false,
      description: 'Tài nguyên hình ảnh, video đã publish lên fanpage/tiktok',
    },
    {
      category: 'CRM_LEADS',
      categoryLabel: 'Khách Hàng Rác & Lead Không Tương Tác (Cold Leads)',
      retentionDays: 180,
      autoPurge: true,
      description: 'Lead thu thập qua form nhưng không có tương tác sau hơn 6 tháng',
    },
    {
      category: 'AUTOMATION_RUNS',
      categoryLabel: 'Lịch Sử Thực Thi Tự Động Hóa (Automation Logs)',
      retentionDays: 30,
      autoPurge: true,
      description: 'Log từng bước chạy Trigger → Condition → Action trong module M11',
    },
  ]);

  const [backups, setBackups] = useState<BackupSnapshot[]>([
    {
      id: 'snap-1',
      name: 'Bản sao lưu hệ thống định kỳ đầu tuần',
      type: 'FULL_DATABASE',
      fileSizeMb: 42.8,
      status: 'READY',
      downloadUrl: '/api/security/backup/download/snap-1',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'snap-2',
      name: 'Toàn bộ danh bạ Lead CRM & Khách hàng',
      type: 'CRM_ONLY',
      fileSizeMb: 12.4,
      status: 'READY',
      downloadUrl: '/api/security/backup/download/snap-2',
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
  ]);

  const [summary, setSummary] = useState({
    totalBackups: 2,
    latestBackupAt: new Date().toISOString(),
    totalStorageUsed: '55.2 MB',
    autoPurgeEnabledCount: 3,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBackupName, setNewBackupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem('topify_sec_backup_data');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.policies) setPolicies(parsed.policies);
        if (parsed.backups) setBackups(parsed.backups);
        if (parsed.summary) setSummary(parsed.summary);
      } catch {}
    }
    fetchBackupData();
  }, []);

  const fetchBackupData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/security/backup');
      if (res.data?.success && res.data.data) {
        setPolicies(res.data.data.policies);
        setBackups(res.data.data.backups);
        setSummary(res.data.data.summary);
        localStorage.setItem(
          'topify_sec_backup_data',
          JSON.stringify({
            policies: res.data.data.policies,
            backups: res.data.data.backups,
            summary: res.data.data.summary,
          })
        );
      }
    } catch (e) {
      console.warn('Using cached backup data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePolicy = async (category: string, retentionDays: number, autoPurge: boolean) => {
    try {
      const res = await api.post('/security/backup', {
        action: 'update_retention',
        category,
        retentionDays,
        autoPurge,
      });
      if (res.data?.success) {
        toast.success('Đã lưu chính sách lưu trữ dữ liệu!');
        fetchBackupData();
      }
    } catch (e: any) {
      toast.error('Lỗi khi cập nhật chính sách lưu trữ');
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBackupName.trim()) {
      toast.error('Vui lòng nhập tên cho bản sao lưu');
      return;
    }
    try {
      setCreating(true);
      const res = await api.post('/security/backup', {
        action: 'create_backup',
        name: newBackupName.trim(),
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Đã tạo bản sao lưu snapshot thành công!');
        setShowCreateModal(false);
        setNewBackupName('');
        fetchBackupData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi tạo bản sao lưu');
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreBackup = async (backupId: string, name: string) => {
    if (
      !window.confirm(
        `CẢNH BÁO: Bạn có chắc chắn muốn khôi phục dữ liệu từ bản sao lưu "${name}"? Các bản ghi phát sinh sau thời điểm tạo có thể bị ghi đè.`
      )
    ) {
      return;
    }
    try {
      setRestoringId(backupId);
      const res = await api.post('/security/backup', {
        action: 'restore_backup',
        backupId,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Khôi phục bản sao lưu thành công!');
        fetchBackupData();
      }
    } catch (e: any) {
      toast.error('Lỗi khi khôi phục bản sao lưu');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDownloadBackup = (backup: BackupSnapshot) => {
    // Generate simulated JSON snapshot download
    const dummyData = {
      snapshotId: backup.id,
      name: backup.name,
      createdAt: backup.createdAt,
      type: backup.type,
      exportedAt: new Date().toISOString(),
      topifyVersion: '1.3.88',
    };
    const blob = new Blob([JSON.stringify(dummyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `topify-backup-${backup.id}-${Date.now()}.json.gz`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã bắt đầu tải xuống bản sao lưu "${backup.name}"!`);
  };

  return (
    <div className="space-y-6">
      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600">
            <FileArchive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalBackups}</div>
            <div className="text-xs text-slate-500">Bản sao lưu Snapshot sẵn sàng</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {new Date(summary.latestBackupAt).toLocaleDateString('vi-VN')}
            </div>
            <div className="text-xs text-slate-500">Sao lưu gần nhất</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalStorageUsed}</div>
            <div className="text-xs text-slate-500">Dung lượng sao lưu đã dùng</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-teal-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.autoPurgeEnabledCount}/4</div>
            <div className="text-xs text-slate-500">Chính sách tự động dọn dẹp bật</div>
          </div>
        </div>
      </div>

      {/* Snapshot Backups List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              Bản Sao Lưu Dự Phòng 1-Click (Snapshot Backups)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tạo bản chụp snapshot toàn bộ cơ sở dữ liệu và tải file dự phòng an toàn.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBackupData}
              disabled={loading}
              className="p-2 text-slate-600 hover:text-purple-600 border border-slate-200 dark:border-slate-800 rounded-xl"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                setNewBackupName(`Bản sao lưu thủ công ${new Date().toLocaleDateString('vi-VN')}`);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              ⚡ Tạo Bản Sao Lưu Ngay
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-2.5 px-3">Tên Bản Sao Lưu & ID</th>
                <th className="py-2.5 px-3">Phân Loại</th>
                <th className="py-2.5 px-3">Dung Lượng</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
                <th className="py-2.5 px-3">Thời Điểm Tạo</th>
                <th className="py-2.5 px-3 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">{b.name}</div>
                    <code className="text-[10px] text-slate-400 font-mono">{b.id}</code>
                  </td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      {b.type}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-xs">{b.fileSizeMb} MB</td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SẴN SÀNG
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-500 text-xs">
                    {new Date(b.createdAt).toLocaleString('vi-VN')}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownloadBackup(b)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition flex items-center gap-1"
                        title="Tải xuống tệp .json.gz"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Tải về
                      </button>
                      <button
                        onClick={() => handleRestoreBackup(b.id, b.name)}
                        disabled={restoringId === b.id}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/40 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                        title="Khôi phục dữ liệu từ bản sao lưu này"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${restoringId === b.id ? 'animate-spin' : ''}`} />
                        {restoringId === b.id ? 'Đang khôi phục...' : 'Khôi phục'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retention Policies Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            Chính Sách Lưu Trữ Dữ Liệu & Tự Động Thu Dọn (Data Retention Policies)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quy định số ngày lưu trữ cho từng danh mục dữ liệu nhằm tối ưu chi phí lưu trữ và tuân thủ các quy định bảo mật quyền riêng tư.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((p) => (
            <div
              key={p.category}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.categoryLabel}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{p.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    Thời gian lưu giữ:
                  </span>
                  <select
                    value={p.retentionDays}
                    onChange={(e) =>
                      handleUpdatePolicy(p.category, Number(e.target.value), p.autoPurge)
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value={14}>14 ngày</option>
                    <option value={30}>30 ngày</option>
                    <option value={90}>90 ngày (Khuyên dùng)</option>
                    <option value={180}>180 ngày (~6 tháng)</option>
                    <option value={365}>365 ngày (1 năm)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    Tự động dọn dẹp:
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={p.autoPurge}
                      onChange={(e) =>
                        handleUpdatePolicy(p.category, p.retentionDays, e.target.checked)
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {p.autoPurge ? 'Đang bật' : 'Tắt'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE BACKUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Tạo Bản Sao Lưu Snapshot
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tên Mô Tả Bản Sao Lưu *
                </label>
                <input
                  type="text"
                  required
                  value={newBackupName}
                  onChange={(e) => setNewBackupName(e.target.value)}
                  placeholder="VD: Bản sao lưu trước khi cập nhật"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/40 text-xs text-purple-800 dark:text-purple-300">
                Snapshot sẽ bao gồm toàn bộ dữ liệu cấu hình kênh, chiến dịch, lead CRM, nhiệm vụ và nhật ký kiểm toán.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  {creating ? 'Đang tạo...' : 'Tạo Snapshot Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

