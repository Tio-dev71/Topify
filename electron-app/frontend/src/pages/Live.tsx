import { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Activity, 
  RefreshCw, 
  Maximize2, 
  X, 
  Layers, 
  Globe, 
  Square,
  CheckCircle2,
  Terminal,
  Radio,
  Monitor,
  Flame,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import api from '../lib/axios';

interface FbAccount {
  id: string;
  name: string;
  uid: string | null;
  profileId: string | null;
  avatar?: string | null;
  status?: string;
}

interface RunningTask {
  id: string;
  name: string;
  type: string;
  status: string;
  profileIds: string[];
  config?: any;
  updatedAt?: string;
}

interface AutomationLog {
  id: string;
  profileId: string;
  accountName?: string;
  actionType: string;
  link?: string;
  message: string;
  createdAt: string;
}

interface MonitorStream {
  profileId: string;
  account?: FbAccount;
  task?: RunningTask;
  status: 'LIVE' | 'RUNNING' | 'QUEUED';
  url?: string;
  title?: string;
  screenshot?: string; // base64 or URL
  latestLog?: string;
  updatedAt: number;
}

const formatTaskAction = (type: string) => {
  switch (type) {
    case 'fb_auto_interact': return 'Tự động tương tác (Lướt Feed/Group, Like, Comment)';
    case 'fb_buff_post': return 'Auto Comment & Like (Buff bài viết)';
    case 'fb_farm_reels': return 'Tự động lướt Reels (Xem, thả tim)';
    case 'fb_add_friends_group': return 'Auto Kết Bạn (Thành viên nhóm)';
    case 'fb_invite_to_group': return 'Auto Mời Bạn Bè Vào Nhóm';
    default: return type || 'Tác vụ tự động';
  }
};

export default function LiveDashboardPage() {
  const [monitors, setMonitors] = useState<MonitorStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [zoomedMonitor, setZoomedMonitor] = useState<MonitorStream | null>(null);
  const [stoppingProfileId, setStoppingProfileId] = useState<string | null>(null);

  const fetchMonitorData = useCallback(async () => {
    try {
      // 1. Lấy thông tin browser trực tiếp từ Electron IPC (nếu chạy trên App Desktop)
      let desktopBrowsers: any[] = [];
      if (window.electron && window.electron.getActiveBrowsers) {
        try {
          desktopBrowsers = await window.electron.getActiveBrowsers() || [];
        } catch (err) {
          console.error('[Live] getActiveBrowsers IPC failed:', err);
        }
      }

      // 2. Lấy đồng thời danh sách tài khoản, tác vụ và logs từ backend API
      const [accRes, liveRes, taskRes, logsRes] = await Promise.allSettled([
        api.get('/facebook-accounts'),
        api.get('/dashboard/live'),
        api.get('/automation-tasks'),
        api.get('/automation-logs?limit=30')
      ]);

      const allAccounts: FbAccount[] = accRes.status === 'fulfilled' && Array.isArray(accRes.value.data) 
        ? accRes.value.data 
        : [];
      
      const accMapByProfile: Record<string, FbAccount> = {};
      const accMapById: Record<string, FbAccount> = {};
      allAccounts.forEach(acc => {
        if (acc.profileId) accMapByProfile[acc.profileId] = acc;
        accMapById[acc.id] = acc;
      });

      const liveData = liveRes.status === 'fulfilled' ? liveRes.value.data : {};
      const allTasks: RunningTask[] = taskRes.status === 'fulfilled' && Array.isArray(taskRes.value.data)
        ? taskRes.value.data
        : (Array.isArray(liveData.runningTasks) ? liveData.runningTasks : []);

      const runningTasks = allTasks.filter(t => t.status === 'RUNNING');

      const logs: AutomationLog[] = logsRes.status === 'fulfilled' && Array.isArray(logsRes.value.data?.logs)
        ? logsRes.value.data.logs
        : (Array.isArray(liveData.recentLogs) ? liveData.recentLogs : []);

      const logsByProfile: Record<string, string> = {};
      logs.forEach(l => {
        if (l.profileId && !logsByProfile[l.profileId]) {
          logsByProfile[l.profileId] = l.message || l.actionType;
        }
      });

      // 3. Hợp nhất dữ liệu để hiển thị đầy đủ màn hình Monitor
      const monitorMap = new Map<string, MonitorStream>();

      // A. Nạp từ các trình duyệt đang mở thực tế (Desktop App IPC)
      desktopBrowsers.forEach(b => {
        const pId = b.profileId;
        const account = accMapByProfile[pId] || accMapById[pId] || allAccounts.find(a => a.profileId === pId || a.id === pId);
        const associatedTask = runningTasks.find(t => 
          t.profileIds?.some(id => id === pId || id === account?.id || id === account?.profileId)
        );

        monitorMap.set(pId, {
          profileId: pId,
          account,
          task: associatedTask,
          status: 'LIVE',
          url: b.url || 'https://www.facebook.com/',
          title: b.title || (account ? `${account.name} (Facebook)` : `Profile ${pId.substring(0, 8)}`),
          screenshot: b.screenshot || undefined,
          latestLog: logsByProfile[pId] || logsByProfile[account?.id || ''] || 'Trình duyệt đang mở và sẵn sàng thao tác...',
          updatedAt: b.timestamp || Date.now()
        });
      });

      // B. Nạp từ các tác vụ đang chạy (Automation Tasks có status RUNNING)
      runningTasks.forEach(task => {
        task.profileIds?.forEach(id => {
          const account = accMapById[id] || accMapByProfile[id] || allAccounts.find(a => a.id === id || a.profileId === id);
          const pId = account?.profileId || id;

          if (!monitorMap.has(pId)) {
            const hasServerFile = liveData.activeProfiles?.includes(pId);
            monitorMap.set(pId, {
              profileId: pId,
              account,
              task,
              status: hasServerFile ? 'LIVE' : 'RUNNING',
              url: task.config?.targetUrl || 'https://www.facebook.com/',
              title: `${task.name} • ${formatTaskAction(task.type)}`,
              screenshot: hasServerFile ? `/screenshots/${pId}.jpg?t=${Date.now()}` : undefined,
              latestLog: logsByProfile[pId] || logsByProfile[id] || 'Đang thực thi tác vụ tự động theo cấu hình...',
              updatedAt: Date.now()
            });
          } else {
            const existing = monitorMap.get(pId)!;
            if (!existing.task) existing.task = task;
          }
        });
      });

      // C. Nạp từ các file screenshots trên server (nếu có luồng chạy ngầm trên server)
      if (Array.isArray(liveData.activeProfiles)) {
        liveData.activeProfiles.forEach((pId: string) => {
          if (!monitorMap.has(pId)) {
            const account = accMapByProfile[pId] || accMapById[pId];
            monitorMap.set(pId, {
              profileId: pId,
              account,
              status: 'LIVE',
              url: 'https://www.facebook.com/',
              title: account ? account.name : `Profile ${pId.substring(0, 8)}`,
              screenshot: `/screenshots/${pId}.jpg?t=${Date.now()}`,
              latestLog: logsByProfile[pId] || 'Đang nhận luồng hình ảnh giám sát...',
              updatedAt: Date.now()
            });
          }
        });
      }

      setMonitors(Array.from(monitorMap.values()));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[Live Dashboard] Lỗi khi tải dữ liệu monitor:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling tự động mỗi 2.5 giây khi bật autoRefresh
  useEffect(() => {
    fetchMonitorData();
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMonitorData();
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchMonitorData, autoRefresh]);

  // Đóng một trình duyệt cụ thể
  const handleStopBrowser = async (profileId: string) => {
    if (!confirm('Bạn có chắc chắn muốn đóng trình duyệt này?')) return;
    setStoppingProfileId(profileId);
    try {
      if (window.electron && window.electron.closeActiveBrowser) {
        await window.electron.closeActiveBrowser(profileId);
      }
      toast.success('Đã gửi yêu cầu đóng trình duyệt');
      setTimeout(fetchMonitorData, 800);
    } catch (e: any) {
      toast.error('Lỗi khi đóng trình duyệt: ' + e.message);
    } finally {
      setStoppingProfileId(null);
    }
  };

  const activeLiveCount = monitors.filter(m => m.status === 'LIVE' || !!m.screenshot).length;
  const runningTaskNames = Array.from(new Set(monitors.map(m => m.task?.name).filter(Boolean)));

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-black/[0.06] dark:border-neutral-800 rounded-3xl p-6 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200/50">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            Trực tiếp & Giám sát (Live Monitor)
          </h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            Theo dõi thông số, hình ảnh live và trạng thái các tiến trình tự động hoá đang chạy thời gian thực.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`whitespace-nowrap inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
              autoRefresh 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' 
                : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            <span>{autoRefresh ? 'Tự động làm mới: Bật' : 'Tự động làm mới: Tắt'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchMonitorData();
            }}
            className="whitespace-nowrap inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 text-white hover:bg-black text-xs font-bold shrink-0 shadow-xs transition-all"
            title="Làm mới ngay lập tức"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Luồng trực tiếp */}
        <div className="bg-white dark:bg-neutral-900 border border-black/[0.06] dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Luồng Live Trực Tiếp</p>
            <p className="text-2xl font-black text-emerald-600 flex items-center gap-2">
              {activeLiveCount}
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Tổng tiến trình theo dõi */}
        <div className="bg-white dark:bg-neutral-900 border border-black/[0.06] dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tiến Trình Thực Thi</p>
            <p className="text-2xl font-black text-indigo-600">
              {monitors.length} <span className="text-xs font-medium text-gray-500">tài khoản</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Tác vụ đang chạy */}
        <div className="bg-white dark:bg-neutral-900 border border-black/[0.06] dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0 pr-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tác Vụ Kích Hoạt</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {runningTaskNames.length > 0 ? runningTaskNames.join(', ') : 'Chưa có tác vụ'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Cập nhật lần cuối */}
        <div className="bg-white dark:bg-neutral-900 border border-black/[0.06] dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Trạng Thái Kết Nối</p>
            <p className="text-xs font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              {lastUpdated.toLocaleTimeString('vi-VN')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
            <Monitor className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Monitors Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Monitor className="w-4 h-4 text-[var(--color-primary)]" />
            Màn hình hiển thị các luồng ({monitors.length})
          </h2>
        </div>

        {loading && monitors.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-black/[0.06] space-y-4 animate-pulse">
                <div className="h-6 bg-gray-100 dark:bg-neutral-800 rounded-lg w-3/4" />
                <div className="aspect-video bg-gray-100 dark:bg-neutral-800 rounded-2xl" />
                <div className="h-4 bg-gray-100 dark:bg-neutral-800 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : monitors.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-black/[0.06] dark:border-neutral-800 rounded-3xl p-12 text-center space-y-5 shadow-xs">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 mx-auto flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
              <Play className="w-10 h-10 ml-1 opacity-70" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Chưa có tiến trình hoặc luồng trực tiếp nào đang chạy
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
                Hệ thống sẽ tự động bắt trạng thái (State) và truyền hình ảnh màn hình trực tiếp ngay khi bạn khởi chạy một tác vụ Tự động hoá hoặc Mở trình duyệt Facebook.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <Link
                to="/automation"
                className="whitespace-nowrap inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-bold shrink-0 shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Mở Tự động hoá để chạy tác vụ</span>
              </Link>
              <Link
                to="/accounts"
                className="whitespace-nowrap inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-200 text-gray-700 text-xs font-bold shrink-0 transition-all"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Xem danh sách tài khoản FB</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {monitors.map((m) => {
              const accountName = m.account?.name || (m.profileId ? `Tài khoản ${m.profileId.substring(0, 10)}` : 'Trình duyệt');
              const isLive = m.status === 'LIVE' || !!m.screenshot;

              return (
                <div
                  key={m.profileId}
                  className="bg-white dark:bg-neutral-900 border border-black/[0.06] dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/60 dark:bg-neutral-950/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {m.account?.name ? m.account.name[0].toUpperCase() : 'FB'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {accountName}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                          <span>UID: {m.account?.uid || m.profileId.substring(0, 12)}</span>
                          {m.task && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 font-semibold">{m.task.name}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                        isLive 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                        {isLive ? 'TRỰC TIẾP' : 'ĐANG CHẠY'}
                      </span>
                    </div>
                  </div>

                  {/* Browser Monitor Screen */}
                  <div className="relative aspect-video bg-neutral-950 flex flex-col overflow-hidden border-y border-black/10">
                    {/* Faux Browser Top Bar */}
                    <div className="h-6 bg-neutral-900 px-3 flex items-center gap-2 text-[10px] text-neutral-400 select-none border-b border-neutral-800">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/80" />
                        <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                        <div className="w-2 h-2 rounded-full bg-green-500/80" />
                      </div>
                      <div className="flex-1 mx-2 bg-neutral-800/80 px-2 py-0.5 rounded text-[10px] text-neutral-300 truncate flex items-center gap-1.5 font-mono">
                        <Globe className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{m.url || 'https://www.facebook.com/'}</span>
                      </div>
                    </div>

                    {/* Screenshot Display or Live Animation */}
                    <div 
                      className="flex-1 relative flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => setZoomedMonitor(m)}
                    >
                      {m.screenshot ? (
                        <>
                          <img
                            src={m.screenshot}
                            alt={`Live view ${accountName}`}
                            className="w-full h-full object-contain mx-auto"
                            onError={(e) => {
                              // If image fails, hide image element
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="px-3 py-1.5 rounded-xl bg-black/80 text-white text-xs font-bold inline-flex items-center gap-1.5 backdrop-blur-sm shadow-md">
                              <Maximize2 className="w-3.5 h-3.5" />
                              Phóng to theo dõi
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
                          <div className="relative flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                            <Activity className="w-5 h-5 text-emerald-400 absolute" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-neutral-200">
                              Trình duyệt đang thực thi ngầm
                            </p>
                            <p className="text-[11px] text-neutral-400 max-w-[240px] truncate mx-auto">
                              {m.title || 'Đang tương tác tự động...'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer with Details & Actions */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-gray-800 dark:text-neutral-200 line-clamp-1 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{m.latestLog || 'Tiến trình tự động đang kích hoạt...'}</span>
                      </p>
                      {m.task && (
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400 line-clamp-1">
                          Cấu hình: <span className="font-semibold text-gray-700 dark:text-neutral-300">{formatTaskAction(m.task.type)}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setZoomedMonitor(m)}
                        className="whitespace-nowrap inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 text-xs font-bold shrink-0 transition-colors"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Xem chi tiết</span>
                      </button>

                      <button
                        type="button"
                        disabled={stoppingProfileId === m.profileId}
                        onClick={() => handleStopBrowser(m.profileId)}
                        className="whitespace-nowrap inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold shrink-0 transition-colors border border-red-200/50"
                        title="Đóng trình duyệt này"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>{stoppingProfileId === m.profileId ? 'Đang đóng...' : 'Đóng luồng'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-Screen Zoom Modal */}
      {zoomedMonitor && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setZoomedMonitor(null)}
        >
          <div 
            className="bg-white dark:bg-neutral-900 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-black/10 dark:border-neutral-800 space-y-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {zoomedMonitor.account?.name || zoomedMonitor.profileId}
                  </h3>
                  <p className="text-xs text-gray-500 truncate max-w-md">
                    {zoomedMonitor.url || 'https://www.facebook.com/'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStopBrowser(zoomedMonitor.profileId)}
                  className="whitespace-nowrap inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Đóng trình duyệt
                </button>
                <button
                  type="button"
                  onClick={() => setZoomedMonitor(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Display */}
            <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-black/20 shadow-inner">
              {zoomedMonitor.screenshot ? (
                <img
                  src={zoomedMonitor.screenshot}
                  alt="Full screen live view"
                  className="w-full h-full object-contain mx-auto"
                />
              ) : (
                <div className="text-center p-8 text-neutral-400 space-y-3">
                  <Activity className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
                  <p className="text-sm font-semibold text-white">Đang thực thi tác vụ trình duyệt ngầm</p>
                  <p className="text-xs text-neutral-400">Hình ảnh live sẽ tự động cập nhật khi trang web tải xong.</p>
                </div>
              )}
            </div>

            {/* Modal Info Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-950 p-4 rounded-2xl">
              <div>
                <span className="font-bold text-gray-900 dark:text-white">Hoạt động gần nhất: </span>
                <span>{zoomedMonitor.latestLog || 'Đang chạy tác vụ tự động...'}</span>
              </div>
              <div className="shrink-0 font-medium">
                Cập nhật lúc: {new Date(zoomedMonitor.updatedAt).toLocaleTimeString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
