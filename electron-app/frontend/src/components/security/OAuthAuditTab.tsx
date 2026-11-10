import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
  Globe,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface OAuthAuditItem {
  id: string;
  provider: 'FACEBOOK' | 'TIKTOK' | 'GOOGLE' | 'ZALO' | 'INSTAGRAM';
  accountName: string;
  tokenStatus: 'HEALTHY' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  daysRemaining: number;
  grantedScopes: string[];
  requiredScopes: string[];
  missingScopes: string[];
  healthScore: number;
  lastAuditedAt: string;
}

export default function OAuthAuditTab() {
  const [loading, setLoading] = useState(false);
  const [auditingId, setAuditingId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<OAuthAuditItem[]>([
    {
      id: 'oauth-fb-1',
      provider: 'FACEBOOK',
      accountName: 'Topify Official Page & Ads Manager',
      tokenStatus: 'HEALTHY',
      expiresAt: new Date(Date.now() + 86400000 * 52).toISOString(),
      daysRemaining: 52,
      grantedScopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'ads_read'],
      requiredScopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'ads_read'],
      missingScopes: [],
      healthScore: 100,
      lastAuditedAt: new Date().toISOString(),
    },
    {
      id: 'oauth-tt-1',
      provider: 'TIKTOK',
      accountName: 'Topify Creative Shop @topify.vn',
      tokenStatus: 'EXPIRING_SOON',
      expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      daysRemaining: 3,
      grantedScopes: ['user.info.basic', 'video.list'],
      requiredScopes: ['user.info.basic', 'video.list', 'video.upload', 'item.data.read'],
      missingScopes: ['video.upload', 'item.data.read'],
      healthScore: 68,
      lastAuditedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'oauth-gg-1',
      provider: 'GOOGLE',
      accountName: 'Topify Cloud Drive & YouTube Channel',
      tokenStatus: 'HEALTHY',
      expiresAt: new Date(Date.now() + 86400000 * 180).toISOString(),
      daysRemaining: 180,
      grantedScopes: ['youtube.readonly', 'youtube.upload', 'drive.file'],
      requiredScopes: ['youtube.readonly', 'youtube.upload', 'drive.file'],
      missingScopes: [],
      healthScore: 100,
      lastAuditedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'oauth-zl-1',
      provider: 'ZALO',
      accountName: 'Zalo Official Account Doanh Nghiệp',
      tokenStatus: 'HEALTHY',
      expiresAt: new Date(Date.now() + 86400000 * 25).toISOString(),
      daysRemaining: 25,
      grantedScopes: ['oa.chat', 'oa.message', 'oa.user_interaction'],
      requiredScopes: ['oa.chat', 'oa.message', 'oa.user_interaction'],
      missingScopes: [],
      healthScore: 95,
      lastAuditedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ]);

  const [summary, setSummary] = useState({
    totalConnected: 4,
    healthyCount: 3,
    expiringSoonCount: 1,
    averageHealthScore: 91,
  });

  useEffect(() => {
    const cached = localStorage.getItem('topify_sec_oauth_audit');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.summary) setSummary(parsed.summary);
      } catch {}
    }
    fetchOAuthAudits();
  }, []);

  const fetchOAuthAudits = async () => {
    try {
      setLoading(true);
      const res = await api.get('/security/oauth-audit');
      if (res.data?.success && res.data.data) {
        setAccounts(res.data.data.accounts);
        const newSummary = {
          totalConnected: res.data.data.totalConnected,
          healthyCount: res.data.data.healthyCount,
          expiringSoonCount: res.data.data.expiringSoonCount,
          averageHealthScore: res.data.data.averageHealthScore,
        };
        setSummary(newSummary);
        localStorage.setItem(
          'topify_sec_oauth_audit',
          JSON.stringify({ accounts: res.data.data.accounts, summary: newSummary })
        );
      }
    } catch (e) {
      console.warn('Using cached oauth audit');
    } finally {
      setLoading(false);
    }
  };

  const handleRecheckAccount = async (accountId: string) => {
    try {
      setAuditingId(accountId);
      const res = await api.post('/security/oauth-audit', {
        action: 'recheck',
        accountId,
      });
      if (res.data?.success) {
        toast.success('Rà soát quyền OAuth thành công! Token đã được cập nhật.');
        fetchOAuthAudits();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi kiểm tra lại quyền OAuth');
    } finally {
      setAuditingId(null);
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'FACEBOOK':
        return { label: 'Meta Facebook', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' };
      case 'TIKTOK':
        return { label: 'TikTok for Business', bg: 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100' };
      case 'GOOGLE':
        return { label: 'Google Workspace / YT', bg: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' };
      case 'ZALO':
        return { label: 'Zalo OA', bg: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300' };
      default:
        return { label: provider, bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Token Khỏe Mạnh
          </span>
        );
      case 'EXPIRING_SOON':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 flex items-center gap-1 border border-amber-300 dark:border-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Sắp Hết Hạn
          </span>
        );
      case 'EXPIRED':
      case 'REVOKED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 flex items-center gap-1 border border-rose-300 dark:border-rose-700">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Đã Mất Quyền / Hết Hạn
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalConnected}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Tài khoản Social kết nối</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.healthyCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Token đầy đủ quyền hạn</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.expiringSoonCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Cần làm mới hoặc thiếu scope</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.averageHealthScore}%</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Điểm bảo mật & khả năng truy cập</div>
          </div>
        </div>
      </div>

      {/* Main Account Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Danh Sách Kết Nối OAuth & Rà Soát Quyền Hạn (Scopes)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kiểm tra tính hợp lệ của Refresh/Access Token, phát hiện quyền bị thiếu hụt để tránh gián đoạn đăng bài hoặc đồng bộ đơn hàng.
            </p>
          </div>
          <button
            onClick={fetchOAuthAudits}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới danh sách
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {accounts.map((acc) => {
            const badge = getProviderBadge(acc.provider);
            const isAuditing = auditingId === acc.id;

            return (
              <div
                key={acc.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-purple-300 dark:hover:border-purple-800/60 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{acc.accountName}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Thời hạn token: còn <strong>{acc.daysRemaining} ngày</strong></span>
                        <span>•</span>
                        <span>Rà soát lần cuối: {new Date(acc.lastAuditedAt).toLocaleTimeString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(acc.tokenStatus)}

                    <button
                      onClick={() => handleRecheckAccount(acc.id)}
                      disabled={isAuditing}
                      className="px-3 py-1.5 text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/50 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                      {isAuditing ? 'Đang kiểm tra...' : '⚡ Kiểm tra lại Scope'}
                    </button>
                  </div>
                </div>

                {/* Scopes Section */}
                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Granted Scopes */}
                  <div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                      Quyền Đã Cấp (Granted Scopes - {acc.grantedScopes.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {acc.grantedScopes.map((scope) => (
                        <span
                          key={scope}
                          className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-md text-[11px] font-mono font-medium"
                        >
                          ✓ {scope}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Scopes or Health Bar */}
                  <div>
                    {acc.missingScopes.length > 0 ? (
                      <div>
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block mb-2">
                          Quyền Cần Bổ Sung (Missing Scopes - {acc.missingScopes.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {acc.missingScopes.map((scope) => (
                            <span
                              key={scope}
                              className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 rounded-md text-[11px] font-mono font-medium flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" /> {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-2">
                          <span className="text-slate-600 dark:text-slate-400">Độ tin cậy & Sẵn sàng (Health Score)</span>
                          <span className="text-emerald-600 font-bold">{acc.healthScore}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${acc.healthScore}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 block">
                          Tất cả API endpoint của kênh mạng xã hội này đã sẵn sàng tiếp nhận yêu cầu.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
