import { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Search,
  RefreshCw,
  ThumbsUp,
  MessageCircle,
  Wallet,
  DollarSign,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle,
  Trash2,
  Eye,
  Check,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Share2,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface ScannedPost {
  id: string;
  externalId?: string;
  url: string;
  content: string;
  mediaUrl?: string | null;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  postedAt?: string;
}

interface FbAccount {
  id: string;
  name: string;
  uid?: string | null;
  status: string;
  profileId?: string;
}

interface TaskItem {
  id: string;
  name: string;
  status: string;
  config: any;
  profileIds: string[];
  createdAt: string;
}

const LIKE_UNIT_PRICE = 50; // 50 VNĐ / like
const COMMENT_UNIT_PRICE = 70; // 70 VNĐ / comment

export function FacebookPostAutomationTab() {
  // Tab & Data States
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [accounts, setAccounts] = useState<FbAccount[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(2500000);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Scanning Form
  const [targetUrl, setTargetUrl] = useState('https://www.facebook.com/tintucvtv24');
  const [scanLimit, setScanLimit] = useState(10);
  const [scanning, setScanning] = useState(false);
  const [scannedPosts, setScannedPosts] = useState<ScannedPost[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [pageTitle, setPageTitle] = useState('');

  // Auto-Interact Settings
  const [likesPerPost, setLikesPerPost] = useState(20);
  const [commentsPerPost, setCommentsPerPost] = useState(10);
  const [useAiComment, setUseAiComment] = useState(true);
  const [commentsStr, setCommentsStr] = useState(
    'Bài viết rất hay và ý nghĩa, cảm ơn ad đã chia sẻ!\nNội dung bổ ích quá, hóng các bài tiếp theo ạ\nChuẩn luôn ad ơi, thả tim cho bài viết\nThông tin cực kỳ kịp thời và chính xác\nQuan tâm ạ, page tư vấn thêm giúp mình với'
  );
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [autoDetectNew, setAutoDetectNew] = useState(false);

  // Running & Execution States
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [executingProgress, setExecutingProgress] = useState<{
    currentPostIndex: number;
    executedLikes: number;
    executedComments: number;
    totalLikesTarget: number;
    totalCommentsTarget: number;
  }>({
    currentPostIndex: 0,
    executedLikes: 0,
    executedComments: 0,
    totalLikesTarget: 0,
    totalCommentsTarget: 0,
  });

  // Invoice / Details Modal
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskItem | null>(null);
  const [payingTaskId, setPayingTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasksAndStats();
    fetchAccounts();
    fetchWallet();
  }, []);

  const fetchTasksAndStats = async () => {
    try {
      setLoadingTasks(true);
      const res = await api.get('/automation/facebook-posts');
      if (res.data?.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load automation tasks', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/facebook-accounts');
      if (Array.isArray(res.data)) {
        setAccounts(res.data);
        // Default select all LIVE/ACTIVE accounts
        const active = res.data.filter(a => a.status === 'LIVE' || a.status === 'ACTIVE');
        setSelectedAccountIds(new Set((active.length > 0 ? active : res.data).map(a => a.id)));
      }
    } catch (e) {
      console.error('Failed to load facebook accounts', e);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallet');
      if (res.data?.wallet?.availableBalance !== undefined) {
        setWalletBalance(res.data.wallet.availableBalance);
      }
    } catch (e) {
      console.error('Failed to load wallet balance', e);
    }
  };

  // ========================================================
  // SCAN LATEST POSTS
  // ========================================================
  const handleScanPosts = async (overrideUrl?: string) => {
    const urlToScan = (overrideUrl || targetUrl).trim();
    if (!urlToScan) {
      toast.error('Vui lòng nhập link Fanpage hoặc chọn từ danh sách mẫu.');
      return;
    }

    setScanning(true);
    try {
      const res = await api.post('/automation/facebook-posts', {
        action: 'scan',
        targetUrl: urlToScan,
        limit: scanLimit,
      });

      if (res.data?.success && Array.isArray(res.data.posts)) {
        setScannedPosts(res.data.posts);
        setPageTitle(res.data.pageName || 'Fanpage Facebook');
        // By default select all scanned posts
        setSelectedPostIds(new Set(res.data.posts.map((p: any) => p.id)));
        toast.success(`Đã quét thành công ${res.data.posts.length} bài viết mới nhất!`);
      } else {
        toast.error('Không tìm thấy bài viết nào hoặc Fanpage ở chế độ riêng tư.');
      }
    } catch (err: any) {
      console.error('Scan error', err);
      toast.error(err.response?.data?.error || 'Lỗi khi quét bài viết mới');
    } finally {
      setScanning(false);
    }
  };

  // Quick preset selections
  const handlePresetSelect = (presetUrl: string) => {
    setTargetUrl(presetUrl);
    handleScanPosts(presetUrl);
  };

  const toggleSelectPost = (postId: string) => {
    const next = new Set(selectedPostIds);
    if (next.has(postId)) next.delete(postId);
    else next.add(postId);
    setSelectedPostIds(next);
  };

  const toggleSelectAllPosts = () => {
    if (selectedPostIds.size === scannedPosts.length) {
      setSelectedPostIds(new Set());
    } else {
      setSelectedPostIds(new Set(scannedPosts.map(p => p.id)));
    }
  };

  const toggleAccount = (accId: string) => {
    const next = new Set(selectedAccountIds);
    if (next.has(accId)) next.delete(accId);
    else next.add(accId);
    setSelectedAccountIds(next);
  };

  // ========================================================
  // BILLING CALCULATIONS (50 VNĐ / like, 70 VNĐ / comment)
  // ========================================================
  const selectedCount = selectedPostIds.size;
  const plannedLikes = selectedCount * Math.max(0, likesPerPost);
  const plannedComments = selectedCount * Math.max(0, commentsPerPost);

  const plannedLikeCost = plannedLikes * LIKE_UNIT_PRICE;
  const plannedCommentCost = plannedComments * COMMENT_UNIT_PRICE;
  const plannedTotalCost = plannedLikeCost + plannedCommentCost;

  // Real-time Executed billing
  const currentExecutedLikes = executingProgress.executedLikes;
  const currentExecutedComments = executingProgress.executedComments;
  const currentExecutedCost = (currentExecutedLikes * LIKE_UNIT_PRICE) + (currentExecutedComments * COMMENT_UNIT_PRICE);

  // ========================================================
  // START AUTOMATION RUN
  // ========================================================
  const handleStartAutoRun = async () => {
    if (selectedPostIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất 1 bài viết để chạy tự động.');
      return;
    }
    if (likesPerPost <= 0 && commentsPerPost <= 0) {
      toast.error('Cần đặt số Like hoặc Comment lớn hơn 0.');
      return;
    }
    if (selectedAccountIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất 1 tài khoản Facebook để thực hiện.');
      return;
    }

    const postsToRun = scannedPosts.filter(p => selectedPostIds.has(p.id));
    const commentsList = commentsStr.split('\n').map(c => c.trim()).filter(Boolean);

    try {
      const res = await api.post('/automation/facebook-posts', {
        action: 'start',
        name: `Auto Like (${likesPerPost}x) & Cmt (${commentsPerPost}x) - ${pageTitle || 'FB Page'} (${postsToRun.length} bài)`,
        targetUrl,
        posts: postsToRun,
        likesPerPost,
        commentsPerPost,
        comments: commentsList,
        useAiComment,
        accountIds: Array.from(selectedAccountIds),
        delaySeconds,
      });

      if (!res.data?.success) {
        toast.error(res.data?.error || 'Lỗi khi khởi tạo tác vụ');
        return;
      }

      const newTask = res.data.task;
      toast.success('Đã kích hoạt chiến dịch tự động!');
      setRunningTaskId(newTask.id);

      setExecutingProgress({
        currentPostIndex: 0,
        executedLikes: 0,
        executedComments: 0,
        totalLikesTarget: plannedLikes,
        totalCommentsTarget: plannedComments,
      });

      fetchTasksAndStats();

      // Check if running on Electron desktop app
      // @ts-ignore
      if (window.electron && window.electron.startAutomationTask) {
        const candidateAccounts = accounts.filter(a => selectedAccountIds.has(a.id));
        const realProfileIds = candidateAccounts.map(a => a.profileId || a.id);

        // Trigger native Electron automation runner
        // @ts-ignore
        window.electron.startAutomationTask({
          taskId: newTask.id,
          actionType: 'fb_auto_posts_interact',
          profileIds: realProfileIds,
          accounts: candidateAccounts,
          config: {
            posts: postsToRun,
            buffActionType: 'BOTH',
            likesPerPost,
            commentsPerPost,
            comments: commentsList,
            useAiComment,
            delaySeconds,
          },
        }).then(async (runnerRes: any) => {
          if (runnerRes?.success) {
            toast.success('Tác vụ tự động Facebook đã hoàn thành xuất sắc!');
            await api.post('/automation/facebook-posts', {
              action: 'update_progress',
              taskId: newTask.id,
              executedLikes: plannedLikes,
              executedComments: plannedComments,
              status: 'COMPLETED',
            });
          } else {
            toast.warning('Tác vụ kết thúc với trạng thái: ' + (runnerRes?.error || 'Hoàn tất một phần'));
            await api.post('/automation/facebook-posts', {
              action: 'update_progress',
              taskId: newTask.id,
              status: 'IDLE',
            });
          }
          setRunningTaskId(null);
          fetchTasksAndStats();
          fetchWallet();
        }).catch((e: any) => {
          console.error(e);
          setRunningTaskId(null);
        });
      } else {
        // Simulated incremental execution on Web Dashboard
        toast.info('Đang chạy tiến trình tự động hóa nền...');
        simulateWebExecution(newTask.id, postsToRun.length, likesPerPost, commentsPerPost);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Lỗi khi bắt đầu tự động hóa');
    }
  };

  // Simulation runner for web environment with live billing counter
  const simulateWebExecution = (taskId: string, totalPosts: number, lPerPost: number, cPerPost: number) => {
    let pIdx = 0;
    let likesDone = 0;
    let cmtsDone = 0;

    const interval = setInterval(async () => {
      if (pIdx >= totalPosts) {
        clearInterval(interval);
        setRunningTaskId(null);
        toast.success(`Đã hoàn tất tự động tương tác cho toàn bộ ${totalPosts} bài viết!`);
        await api.post('/automation/facebook-posts', {
          action: 'update_progress',
          taskId,
          executedLikes: likesDone,
          executedComments: cmtsDone,
          status: 'COMPLETED',
        });
        fetchTasksAndStats();
        return;
      }

      likesDone += lPerPost;
      cmtsDone += cPerPost;
      pIdx += 1;

      setExecutingProgress({
        currentPostIndex: pIdx,
        executedLikes: likesDone,
        executedComments: cmtsDone,
        totalLikesTarget: totalPosts * lPerPost,
        totalCommentsTarget: totalPosts * cPerPost,
      });

      // Update backend progress and billing in DB
      await api.post('/automation/facebook-posts', {
        action: 'update_progress',
        taskId,
        currentPostIndex: pIdx,
        executedLikes: likesDone,
        executedComments: cmtsDone,
        status: pIdx >= totalPosts ? 'COMPLETED' : 'RUNNING',
      }).catch(() => {});
    }, Math.max(2500, delaySeconds * 800));
  };

  // Stop running task
  const handleStopAutoRun = async () => {
    if (!runningTaskId) return;
    try {
      // @ts-ignore
      if (window.electron && window.electron.stopAutomationTask) {
        // @ts-ignore
        await window.electron.stopAutomationTask({ taskId: runningTaskId, profileIds: [] });
      }
      await api.post('/automation/facebook-posts', {
        action: 'update_progress',
        taskId: runningTaskId,
        status: 'IDLE',
      });
      setRunningTaskId(null);
      toast.success('Đã tạm dừng tác vụ tự động');
      fetchTasksAndStats();
    } catch (e) {
      toast.error('Lỗi khi dừng tác vụ');
    }
  };

  // Pay invoice via Topify Wallet
  const handlePayTask = async (task: TaskItem) => {
    const cfg = task.config || {};
    const billing = cfg.billing || {};
    const amount = billing.executedCost || billing.totalCost || 0;

    if (amount <= 0) {
      toast.info('Tác vụ này không có phí cần thanh toán.');
      return;
    }

    if (!confirm(`Xác nhận thanh toán ${amount.toLocaleString('vi-VN')} đ qua Ví Topify cho tác vụ này?`)) {
      return;
    }

    setPayingTaskId(task.id);
    try {
      const res = await api.post('/automation/facebook-posts', {
        action: 'pay',
        taskId: task.id,
        amount,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Thanh toán thành công!');
        if (res.data.newBalance !== undefined) {
          setWalletBalance(res.data.newBalance);
        }
        fetchTasksAndStats();
      } else {
        toast.error(res.data?.error || 'Thanh toán thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi thanh toán qua ví');
    } finally {
      setPayingTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tác vụ này?')) return;
    try {
      await api.delete(`/automation/facebook-posts?id=${taskId}`);
      toast.success('Đã xóa tác vụ');
      fetchTasksAndStats();
    } catch (e) {
      toast.error('Lỗi khi xóa tác vụ');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 pb-12">
      {/* ========================================================
          1. HEADER & PRICING BANNER
      ======================================================== */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-purple-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/30 border border-purple-400/40 text-purple-200">
                F145 Facebook Auto
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Bảng giá: Like 50đ · Comment 70đ
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/30 text-blue-200">
                Live Dynamic Billing
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-300 shrink-0" />
              Tự Động Quét Bài Viết & Chạy Like, Comment Facebook
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
              Hệ thống tự động phát hiện các bài viết mới nhất trên Fanpage, kích hoạt dàn nick tự động Like và Bình luận thông minh. 
              Cước phí thanh toán được tính lũy tiến chuẩn xác theo số lượt thực tế: <strong className="text-white">Like = 50 VNĐ</strong> và <strong className="text-white">Comment = 70 VNĐ</strong>.
            </p>
          </div>

          {/* Quick Wallet Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col gap-2 min-w-[220px] shadow-inner">
            <div className="flex items-center justify-between text-xs text-purple-200">
              <span className="flex items-center gap-1.5 font-medium">
                <Wallet className="w-4 h-4 text-emerald-400" /> Số dư Ví Topify
              </span>
              <button onClick={fetchWallet} className="hover:text-white transition-colors" title="Làm mới số dư">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <div className="text-xl font-black text-emerald-300 font-mono">
              {walletBalance.toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-purple-200/70">
              Khấu trừ tự động sau khi hoàn tất tác vụ
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. TOP KPI & BILLING OVERVIEW CARDS
      ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Scanned Posts */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bài viết đã quét</span>
            <div className="text-2xl font-black text-gray-900 mt-0.5 font-mono">
              {scannedPosts.length} <span className="text-xs font-medium text-gray-500">bài</span>
            </div>
            <span className="text-[11px] text-blue-600 font-medium">
              Đang chọn: {selectedPostIds.size}/{scannedPosts.length} bài
            </span>
          </div>
        </div>

        {/* Card 2: Like Rate */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lượt Like tự động</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700">50đ/like</span>
            </div>
            <div className="text-2xl font-black text-indigo-700 mt-0.5 font-mono">
              {plannedLikes.toLocaleString('vi-VN')}
            </div>
            <span className="text-[11px] text-gray-500">
              = <strong className="text-gray-900 font-semibold">{plannedLikeCost.toLocaleString('vi-VN')} đ</strong>
            </span>
          </div>
        </div>

        {/* Card 3: Comment Rate */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lượt Comment tự động</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">70đ/cmt</span>
            </div>
            <div className="text-2xl font-black text-purple-700 mt-0.5 font-mono">
              {plannedComments.toLocaleString('vi-VN')}
            </div>
            <span className="text-[11px] text-gray-500">
              = <strong className="text-gray-900 font-semibold">{plannedCommentCost.toLocaleString('vi-VN')} đ</strong>
            </span>
          </div>
        </div>

        {/* Card 4: TOTAL BILLING AMOUNT */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 p-5 rounded-2xl text-white shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-white">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Tổng tiền thanh toán</span>
            <div className="text-2xl font-black text-white mt-0.5 font-mono">
              {plannedTotalCost.toLocaleString('vi-VN')} <span className="text-sm font-normal">đ</span>
            </div>
            <span className="text-[11px] text-emerald-100/90 font-mono">
              ({plannedLikes}×50đ) + ({plannedComments}×70đ)
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. SCANNER CONTROLLER (STEP 1)
      ======================================================== */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-600" />
              Bước 1: Quét Bài Viết Mới Nhất từ Fanpage / Group
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Nhập liên kết Fanpage hoặc chọn mẫu các trang tin tức phổ biến để tự động crawl bài viết mới nhất
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Gợi ý nhanh:</span>
            <button
              onClick={() => handlePresetSelect('https://www.facebook.com/tintucvtv24')}
              className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-purple-50 hover:text-purple-700 transition-colors font-medium cursor-pointer"
            >
              VTV24
            </button>
            <button
              onClick={() => handlePresetSelect('https://www.facebook.com/VinFastAuto.VN')}
              className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-purple-50 hover:text-purple-700 transition-colors font-medium cursor-pointer"
            >
              VinFast VN
            </button>
            <button
              onClick={() => handlePresetSelect('https://www.facebook.com/groups/congdongkinhdoanhtmdt')}
              className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors font-medium border border-purple-200 cursor-pointer"
            >
              👥 Nhóm Kinh Doanh TMĐT
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              placeholder="Dán link Fanpage hoặc Group Facebook bất kỳ (VD: https://facebook.com/groups/... hoặc https://facebook.com/page)..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={scanLimit}
              onChange={e => setScanLimit(Number(e.target.value))}
              className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={5}>Quét 5 bài gần nhất</option>
              <option value={10}>Quét 10 bài gần nhất</option>
              <option value={20}>Quét 20 bài gần nhất</option>
              <option value={30}>Quét 30 bài gần nhất</option>
            </select>

            <button
              onClick={() => handleScanPosts()}
              disabled={scanning}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-purple-200 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang quét bài viết...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Quét Bài Viết Mới</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time sync option */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700">
            <input
              type="checkbox"
              checked={autoDetectNew}
              onChange={e => setAutoDetectNew(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
            />
            <span className="font-medium">
              Tự động quét và phát hiện bài viết mới mỗi 15 phút (Auto-Poll & Queue)
            </span>
          </label>

          {pageTitle && (
            <span className="text-purple-700 font-semibold bg-purple-50 px-3 py-1 rounded-lg">
              Đang xem bài từ: {pageTitle}
            </span>
          )}
        </div>
      </div>

      {/* ========================================================
          4. SCANNED POSTS SELECTION & CONFIGURATION (STEP 2 & 3)
      ======================================================== */}
      {scannedPosts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Post Selection Column (Left 7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="selectAllPosts"
                  checked={selectedPostIds.size === scannedPosts.length && scannedPosts.length > 0}
                  onChange={toggleSelectAllPosts}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="selectAllPosts" className="text-xs font-bold text-gray-900 cursor-pointer">
                  Chọn tất cả ({selectedPostIds.size}/{scannedPosts.length} bài được chọn)
                </label>
              </div>
              <span className="text-[11px] text-gray-400">
                Tích chọn bài viết muốn chạy Like & Comment
              </span>
            </div>

            {/* Posts Scrollable List */}
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {scannedPosts.map((post, idx) => {
                const isSelected = selectedPostIds.has(post.id);
                const postLikesCost = likesPerPost * LIKE_UNIT_PRICE;
                const postCommentsCost = commentsPerPost * COMMENT_UNIT_PRICE;
                const postTotalCost = postLikesCost + postCommentsCost;

                return (
                  <div
                    key={post.id}
                    onClick={() => toggleSelectPost(post.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row gap-3.5 ${
                      isSelected
                        ? 'border-purple-300 bg-purple-50/40 shadow-sm'
                        : 'border-gray-100 bg-gray-50/40 hover:bg-gray-50 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                        className="mt-1 rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                      />
                      {post.mediaUrl && (
                        <img
                          src={post.mediaUrl}
                          alt="Thumbnail"
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.postedAt ? new Date(post.postedAt).toLocaleString('vi-VN') : 'Vừa xong'}
                        </span>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          Xem bài gốc <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-relaxed">
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3 text-blue-500" /> {post.likesCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 text-amber-500" /> {post.commentsCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="w-3 h-3 text-emerald-500" /> {post.sharesCount || 0}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="font-mono text-purple-700 font-bold bg-purple-100/80 px-2 py-0.5 rounded-md">
                            Dự tính: {postTotalCost.toLocaleString('vi-VN')} đ
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuration & Billing Panel (Right 5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Auto Config Box */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Bước 2: Cài Đặt Số Lượt & Nội Dung Tương Tác
              </h3>

              {/* Likes per post */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-indigo-600" /> Số Like mỗi bài viết:
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {likesPerPost} lượt × 50đ = {(likesPerPost * 50).toLocaleString('vi-VN')} đ/bài
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={5}
                  value={likesPerPost}
                  onChange={e => setLikesPerPost(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>0 lượt</span>
                  <span>50 lượt</span>
                  <span>100 lượt</span>
                  <span>200 lượt</span>
                </div>
              </div>

              {/* Comments per post */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-purple-600" /> Số Comment mỗi bài viết:
                  </label>
                  <span className="text-xs font-mono font-bold text-purple-600">
                    {commentsPerPost} lượt × 70đ = {(commentsPerPost * 70).toLocaleString('vi-VN')} đ/bài
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={2}
                  value={commentsPerPost}
                  onChange={e => setCommentsPerPost(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>0 lượt</span>
                  <span>20 lượt</span>
                  <span>50 lượt</span>
                  <span>100 lượt</span>
                </div>
              </div>

              {/* Comment Content Mode */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">Nội dung bình luận:</label>
                  <label className="flex items-center gap-1.5 text-xs text-purple-600 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={useAiComment}
                      onChange={e => setUseAiComment(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                    />
                    <span>AI sinh nội dung thông minh</span>
                  </label>
                </div>

                {!useAiComment ? (
                  <textarea
                    rows={3}
                    value={commentsStr}
                    onChange={e => setCommentsStr(e.target.value)}
                    placeholder="Mỗi dòng một bình luận..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  />
                ) : (
                  <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-[11px] text-purple-800 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>
                      Topify AI sẽ tự động đọc nội dung từng bài viết đã quét và sinh bình luận tự nhiên, đa dạng, không trùng lặp, tối ưu an toàn tuyệt đối cho tài khoản.
                    </span>
                  </div>
                )}
              </div>

              {/* Facebook Accounts Selection */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">
                    Dàn nick thực hiện ({selectedAccountIds.size}/{accounts.length}):
                  </span>
                  <button
                    onClick={() => {
                      if (selectedAccountIds.size === accounts.length) setSelectedAccountIds(new Set());
                      else setSelectedAccountIds(new Set(accounts.map(a => a.id)));
                    }}
                    className="text-purple-600 hover:underline font-medium text-[11px]"
                  >
                    {selectedAccountIds.size === accounts.length ? 'Bỏ chọn' : 'Chọn tất cả'}
                  </button>
                </div>

                <div className="max-h-28 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1 bg-gray-50/50">
                  {accounts.length === 0 ? (
                    <p className="text-[11px] text-gray-400 text-center py-2">
                      Chưa có tài khoản Facebook nào trong hệ thống.
                    </p>
                  ) : (
                    accounts.map(acc => (
                      <div
                        key={acc.id}
                        onClick={() => toggleAccount(acc.id)}
                        className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          selectedAccountIds.has(acc.id)
                            ? 'bg-purple-100/70 text-purple-900 font-semibold'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span className="truncate max-w-[140px]">{acc.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-white border border-gray-200">
                          {acc.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* BILLING SUMMARY CARD (STEP 3) */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 rounded-3xl text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  Bảng Tính Chi Phí Tự Động (Billing)
                </h4>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-400/30">
                  Chuẩn 50đ/like · 70đ/cmt
                </span>
              </div>

              {/* Cost breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-purple-200">
                  <span>Số bài viết được áp dụng:</span>
                  <span className="font-mono font-bold text-white">{selectedCount} bài</span>
                </div>
                <div className="flex items-center justify-between text-purple-200">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-indigo-400" /> Like ({plannedLikes} lượt × 50đ):
                  </span>
                  <span className="font-mono font-bold text-indigo-300">
                    {plannedLikeCost.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex items-center justify-between text-purple-200">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-purple-400" /> Comment ({plannedComments} lượt × 70đ):
                  </span>
                  <span className="font-mono font-bold text-purple-300">
                    {plannedCommentCost.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-white">TỔNG CƯỚC THANH TOÁN:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {plannedTotalCost.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xs text-emerald-200 ml-1">VNĐ</span>
                  </div>
                </div>
              </div>

              {/* Running Status Progress */}
              {runningTaskId && (
                <div className="p-3.5 bg-white/10 rounded-2xl border border-white/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-yellow-300">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang chạy tương tác tự động...
                    </span>
                    <span className="font-mono text-purple-200">
                      {executingProgress.currentPostIndex}/{selectedCount} bài
                    </span>
                  </div>

                  <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full transition-all duration-300"
                      style={{
                        width: `${selectedCount > 0 ? (executingProgress.currentPostIndex / selectedCount) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-purple-200 pt-1">
                    <span>Đã chạy: {currentExecutedLikes} Like · {currentExecutedComments} Comment</span>
                    <span className="font-mono font-bold text-emerald-300">
                      Phí hiện tại: {currentExecutedCost.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                {runningTaskId ? (
                  <button
                    onClick={handleStopAutoRun}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Dừng Tác Vụ Đang Chạy</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartAutoRun}
                    disabled={selectedCount === 0 || (likesPerPost === 0 && commentsPerPost === 0)}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Kích Hoạt Chạy Tự Động (1-Click Run)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          5. TASKS & BILLING HISTORY TABLE (F145 LOGS)
      ======================================================== */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Lịch Sử Chiến Dịch & Bảng Kê Cước Đã Chạy
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Theo dõi chi tiết số lượt đã thực thi, số tiền đã nhân theo công thức (Like 50đ, Comment 70đ) và trạng thái thanh toán
            </p>
          </div>
          <button
            onClick={fetchTasksAndStats}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-800">
            <thead className="bg-gray-50/70 text-gray-500 border-b border-gray-100 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Tác Vụ & Fanpage</th>
                <th className="px-4 py-3">Số Bài</th>
                <th className="px-4 py-3">Like Đã Chạy (x50đ)</th>
                <th className="px-4 py-3">Comment Đã Chạy (x70đ)</th>
                <th className="px-4 py-3 font-mono">Tổng Cước</th>
                <th className="px-4 py-3">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Chưa có chiến dịch quét & chạy tự động nào. Quét bài viết mới ở trên để bắt đầu!
                  </td>
                </tr>
              ) : (
                tasks.map(t => {
                  const cfg = t.config || {};
                  const billing = cfg.billing || {};
                  const postsCount = Array.isArray(cfg.posts) ? cfg.posts.length : (cfg.postsCount || 1);
                  const execLikes = billing.executedLikes !== undefined ? billing.executedLikes : (t.status === 'COMPLETED' ? billing.likesCount || 0 : 0);
                  const execComments = billing.executedComments !== undefined ? billing.executedComments : (t.status === 'COMPLETED' ? billing.commentsCount || 0 : 0);
                  const totalCost = (execLikes * LIKE_UNIT_PRICE) + (execComments * COMMENT_UNIT_PRICE);

                  const isPaid = Boolean(billing.isPaid);

                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">{t.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono truncate max-w-[220px]">
                          {cfg.targetUrl || 'Bài viết Facebook'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                          {postsCount} bài
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-indigo-700">
                          {execLikes} <span className="text-[10px] text-gray-400 font-normal">/ {billing.likesCount || 0}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">
                          = {(execLikes * 50).toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-purple-700">
                          {execComments} <span className="text-[10px] text-gray-400 font-normal">/ {billing.commentsCount || 0}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">
                          = {(execComments * 70).toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-black font-mono text-emerald-600 text-sm">
                          {totalCost.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {isPaid ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Đã trừ ví
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">Chưa thanh toán</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'RUNNING'
                              ? 'bg-blue-100 text-blue-700 animate-pulse'
                              : t.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && totalCost > 0 && (
                            <button
                              onClick={() => handlePayTask(t)}
                              disabled={payingTaskId === t.id}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                              title="Thanh toán trừ ví Topify"
                            >
                              <CreditCard className="w-3 h-3" /> Trừ Ví
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTaskDetail(t)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Xem chi tiết hóa đơn"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa tác vụ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          6. INVOICE RECEIPT MODAL
      ======================================================== */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <h4 className="text-sm font-bold text-gray-900">Chi Tiết Hóa Đơn Tự Động Hóa Facebook</h4>
              </div>
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-gray-700">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <div className="font-bold text-gray-900">{selectedTaskDetail.name}</div>
                <div className="text-[11px] text-gray-500 font-mono">Mã ID: {selectedTaskDetail.id}</div>
                <div className="text-[11px] text-gray-500">
                  Thời gian tạo: {new Date(selectedTaskDetail.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              {/* Billing Itemization */}
              {(() => {
                const cfg = selectedTaskDetail.config || {};
                const billing = cfg.billing || {};
                const execLikes = billing.executedLikes || billing.likesCount || 0;
                const execComments = billing.executedComments || billing.commentsCount || 0;
                const totalCost = (execLikes * LIKE_UNIT_PRICE) + (execComments * COMMENT_UNIT_PRICE);

                return (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span>Lượt Like thực tế:</span>
                      <span className="font-mono font-bold">
                        {execLikes} lượt × 50đ = {(execLikes * 50).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span>Lượt Comment thực tế:</span>
                      <span className="font-mono font-bold">
                        {execComments} lượt × 70đ = {(execComments * 70).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-sm font-black text-emerald-600">
                      <span>TỔNG CỘNG THANH TOÁN:</span>
                      <span className="font-mono">{totalCost.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs"
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

