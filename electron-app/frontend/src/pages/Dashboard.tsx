import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Link2,
  Zap,
  ArrowRight,
  PlayCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import api, { getApiBaseUrl } from '../lib/axios';
import { STATUS_CONFIG, PLATFORM_CONFIG } from '../lib/utils';

interface DashboardStats {
  scheduled: number;
  published: number;
  failed: number;
  total: number;
}

interface RecentPost {
  id: string;
  title: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  platforms: { platform: string; status: string }[];
  createdBy: { name: string | null; email: string };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ scheduled: 0, published: 0, failed: 0, total: 0 });
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasConnections, setHasConnections] = useState(true);

  // Parse user from local storage
  const userData = localStorage.getItem('topify_user');
  let user = null;
  try {
    user = userData ? JSON.parse(userData) : null;
  } catch (e) {
    user = null;
  }
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, postsRes] = await Promise.all([
          api.get('/posts/stats'),
          api.get('/posts?limit=5'),
        ]);

        if (statsRes.data) {
          setStats(statsRes.data);
        }
        if (postsRes.data) {
          setRecentPosts(postsRes.data.posts || []);
        }

        // Check social connections
        if (isAdmin) {
          const connRes = await api.get('/social/status');
          if (connRes.data) {
            setHasConnections(connRes.data.connected > 0);
          }
        }
      } catch (e) {
        console.error('Failed to fetch dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAdmin]);

  const statCards = [
    {
      label: 'Đã lên lịch',
      value: stats.scheduled,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Đã đăng',
      value: stats.published,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Thất bại',
      value: stats.failed,
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Tổng bài đăng',
      value: stats.total,
      icon: TrendingUp,
      color: 'text-[var(--color-primary)]',
      bg: 'bg-[var(--color-primary-soft)]',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">
          Chào mừng trở lại{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">
          Quản lý video đăng bài trên tất cả nền tảng
        </p>
      </div>

      {/* Onboarding banner — Admin only, no connections */}
      {isAdmin && !hasConnections && !loading && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-blue-100 bg-gradient-to-r from-blue-50 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[17px] font-semibold mb-1">Kết nối tài khoản mạng xã hội</h3>
              <p className="text-[14px] text-gray-500 mb-4">
                Kết nối các nền tảng để bắt đầu đăng video tự động
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const token = localStorage.getItem('topify_token');
                    const baseUrl = getApiBaseUrl();
                    window.open(`${baseUrl}/api/social/meta?token=${token}`, '_blank');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 text-[14px] py-2 px-4 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Connect Meta
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const token = localStorage.getItem('topify_token');
                    const baseUrl = getApiBaseUrl();
                    window.open(`${baseUrl}/api/social/google?token=${token}`, '_blank');
                  }}
                  className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg inline-flex items-center gap-2 text-[14px] py-2 px-4 transition-colors"
                >
                  Connect YouTube
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            {loading ? (
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
                <div className="w-16 h-8 rounded-lg bg-gray-200 animate-pulse" />
                <div className="w-20 h-4 rounded bg-gray-200 animate-pulse" />
              </div>
            ) : (
              <>
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-[28px] font-semibold tracking-tight">{card.value}</p>
                <p className="text-[13px] text-gray-500 mt-0.5">{card.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <Link
        to="/create"
        className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 group hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold">Tạo bài đăng</h3>
              <p className="text-[13px] text-gray-500">
                Quản lý video đăng bài trên tất cả nền tảng
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-gray-900 transition-all" />
        </div>
      </Link>

      {/* Recent Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[19px] font-semibold">Bài đăng gần đây</h2>
          <Link
            to="/posts"
            className="text-[14px] text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            Xem tất cả
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : recentPosts.length === 0 ? (
            <div className="p-12 text-center">
              <PlayCircle className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-40" />
              <p className="text-[15px] font-medium text-gray-900">Chưa có bài đăng nào</p>
              <p className="text-[13px] text-gray-500 mt-1">
                Bắt đầu bằng cách tạo bài đăng đầu tiên của bạn.
              </p>
              <Link to="/create" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 mt-4 text-[14px] py-2 px-4 transition-colors">
                <PlusCircle className="w-4 h-4" />
                Tạo bài đăng đầu tiên
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kênh</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lịch trình</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPosts.map((post) => {
                  const statusConfig = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG];
                  return (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/posts/${post.id}`} className="hover:text-blue-600 transition-colors block">
                          <p className="font-medium text-[14px] truncate max-w-[200px] text-gray-900">{post.title}</p>
                          <p className="text-[12px] text-gray-500 mt-0.5">
                            bởi {post.createdBy?.name || post.createdBy?.email?.split('@')[0] || 'Unknown'}
                          </p>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          {post.platforms?.map((p) => {
                            const config = PLATFORM_CONFIG[p.platform as keyof typeof PLATFORM_CONFIG];
                            return (
                              <span
                                key={p.platform}
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: config?.color || '#ccc' }}
                                title={config?.name}
                              />
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-gray-500">
                        {post.scheduledAt
                          ? formatDistanceToNow(new Date(post.scheduledAt), { addSuffix: true, locale: vi })
                          : 'Đăng ngay'}
                      </td>
                      <td className="px-6 py-4">
                        {statusConfig && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
