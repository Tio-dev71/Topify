import { useState, useEffect, useRef } from 'react';
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
  Plus,
  Edit2,
  Pause,
  Shuffle,
  Cpu,
  ShieldCheck,
  ListFilter,
  Calendar,
} from 'lucide-react';
import api, { getElectronAuthContext } from '../../lib/axios';
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

export interface PageSchedule {
  id: string;
  name: string;
  pageUrl: string;
  pageName: string;
  intervalMinutes: number;
  accountsPerRun: number;
  concurrency: number;
  randomAccounts: boolean;
  useAiComment: boolean;
  likesPerPost: number;
  commentsPerPost: number;
  comments: string[];
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastScannedPostUrl: string | null;
  interactedPostUrls: string[];
  status: 'IDLE' | 'RUNNING' | 'QUEUED' | 'PAUSED';
  statusMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

const LIKE_UNIT_PRICE = 50; // 50 VNĐ / like
const COMMENT_UNIT_PRICE = 70; // 70 VNĐ / comment

function formatCountdown(targetIso: string | null, now: number) {
  if (!targetIso) return '--:--';
  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return 'Đến giờ quét';
  const totalSeconds = Math.floor(diff / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function FacebookPostAutomationTab() {
  // Navigation Sub-tab
  const [subTab, setSubTab] = useState<'schedules' | 'manual'>('schedules');

  // Shared Data States
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [schedules, setSchedules] = useState<PageSchedule[]>([]);
  const [accounts, setAccounts] = useState<FbAccount[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(2500000);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Scheduler Queue & Mutex Engine States
  const [activeRunningScheduleId, setActiveRunningScheduleId] = useState<string | null>(null);
  const [queueMessage, setQueueMessage] = useState<string>('Hàng đợi rảnh - Sẵn sàng');
  const isEngineProcessingRef = useRef(false);

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PageSchedule | null>(null);
  const [formPageUrl, setFormPageUrl] = useState('');
  const [formPageName, setFormPageName] = useState('');
  const [formIntervalMinutes, setFormIntervalMinutes] = useState(15);
  const [formAccountsPerRun, setFormAccountsPerRun] = useState(20);
  const [formConcurrency, setFormConcurrency] = useState(5);
  const [formRandomAccounts, setFormRandomAccounts] = useState(true);
  const [formUseAiComment, setFormUseAiComment] = useState(true);
  const [formLikesPerPost, setFormLikesPerPost] = useState(1);
  const [formCommentsPerPost, setFormCommentsPerPost] = useState(1);
  const [formCommentsStr, setFormCommentsStr] = useState(
    'Bài viết rất hay và ý nghĩa!\nThông tin cực kỳ kịp thời và chính xác\nNội dung bổ ích quá, hóng các bài tiếp theo ạ\nChuẩn luôn ad ơi, thả tim cho bài viết\nCảm ơn page đã chia sẻ!'
  );
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Manual Scanning Form States
  const [targetUrl, setTargetUrl] = useState('https://www.facebook.com/tintucvtv24');
  const [scanLimit, setScanLimit] = useState(10);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [scannedPosts, setScannedPosts] = useState<ScannedPost[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [pageTitle, setPageTitle] = useState('');
  const [scanSource, setScanSource] = useState<string>('');
  const [trackedPages, setTrackedPages] = useState<Array<{ id: string; name: string; url: string }>>([]);

  // Manual Auto-Interact Settings
  const [likesPerPost, setLikesPerPost] = useState(20);
  const [commentsPerPost, setCommentsPerPost] = useState(10);
  const [useAiComment, setUseAiComment] = useState(true);
  const [commentsStr, setCommentsStr] = useState(
    'Thả tim cho bài viết ạ ❤️\nHay quá ad ơi 👍\nTuyệt vời luôn nè\nỦng hộ page nhiệt tình!\nHóng các bài viết tiếp theo ạ'
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
    fetchTrackedPages();
  }, []);

  // Realtime IPC listener for Electron automation progress
  useEffect(() => {
    // @ts-ignore
    if (!window.electron?.onAutomationProgress) return;

    // @ts-ignore
    const unsubscribe = window.electron.onAutomationProgress((data: any) => {
      if (!data) return;
      if (runningTaskId && data.taskId && data.taskId !== runningTaskId) return;

      const newPostIndex = data.currentPostIndex ?? 0;
      const newExecutedLikes = data.executedLikes ?? 0;
      const newExecutedComments = data.executedComments ?? 0;

      setExecutingProgress(prev => ({
        currentPostIndex: newPostIndex,
        executedLikes: newExecutedLikes,
        executedComments: newExecutedComments,
        totalLikesTarget: prev.totalLikesTarget,
        totalCommentsTarget: prev.totalCommentsTarget,
      }));

      // Đồng bộ tiến độ và tính cước thực tế tức thì lên Server DB
      if (data.taskId) {
        api.post('/automation/facebook-posts', {
          action: 'update_progress',
          taskId: data.taskId,
          currentPostIndex: newPostIndex,
          executedLikes: newExecutedLikes,
          executedComments: newExecutedComments,
          status: 'RUNNING',
        }).then(() => {
          fetchTasksAndStats();
        }).catch(() => {});
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [runningTaskId]);

  // ========================================================
  // SCHEDULER ENGINE LOOP (MUTEX QUEUE + REAL-TIME COUNTDOWN)
  // ========================================================
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      // Nếu đang có 1 Page chiếm dụng trình duyệt, không kích hoạt page khác để tránh xung đột
      if (isEngineProcessingRef.current) {
        return;
      }

      // Tìm lịch đầu tiên đã đến giờ chạy (nextRunAt <= now và isActive)
      const dueSchedule = schedules.find(s => {
        if (!s.isActive || !s.nextRunAt) return false;
        return new Date(s.nextRunAt).getTime() <= now;
      });

      if (dueSchedule) {
        executeScheduleRun(dueSchedule);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [schedules, accounts]);

  const fetchTrackedPages = async () => {
    try {
      const res = await api.get('/competitors');
      if (Array.isArray(res.data?.pages)) {
        setTrackedPages(res.data.pages);
      }
    } catch (e) {
      console.error('Failed to load tracked competitors', e);
    }
  };

  const fetchTasksAndStats = async () => {
    try {
      setLoadingTasks(true);
      const res = await api.get('/automation/facebook-posts');
      if (res.data?.success) {
        setTasks(res.data.tasks || []);
        if (Array.isArray(res.data.schedules)) {
          setSchedules(res.data.schedules);
        }
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
  // EXECUTE MULTI-PAGE SCHEDULE RUN (MUTEX SAFE + BATCH KILL)
  // ========================================================
  const executeScheduleRun = async (sched: PageSchedule) => {
    if (isEngineProcessingRef.current) return;
    isEngineProcessingRef.current = true;
    setActiveRunningScheduleId(sched.id);
    setQueueMessage(`Đang chạy Fanpage: ${sched.pageName} (tránh xung đột)`);

    try {
      // 1. Quét các bài viết mới nhất từ Fanpage
      let newestPosts: ScannedPost[] = [];
      try {
        const scanRes = await api.post('/automation/facebook-posts', {
          action: 'scan',
          targetUrl: sched.pageUrl,
          limit: 3,
        });
        if (scanRes.data?.success && Array.isArray(scanRes.data.posts)) {
          newestPosts = scanRes.data.posts;
        }
      } catch (scanErr: any) {
        console.warn('Lỗi quét bài cho lịch:', scanErr);
      }

      if (newestPosts.length === 0) {
        // Không tìm thấy bài hoặc Fanpage chưa có bài mới
        const finishTime = Date.now();
        const nextRun = new Date(finishTime + sched.intervalMinutes * 60 * 1000).toISOString();
        await api.post('/automation/facebook-posts', {
          action: 'update_schedule_progress',
          id: sched.id,
          nextRunAt: nextRun,
          status: 'IDLE',
          statusMessage: `Không quét được bài viết mới. Hẹn chu kỳ tiếp theo sau ${sched.intervalMinutes} phút`,
        });
        fetchTasksAndStats();
        return;
      }

      // 2. Kiểm tra deduplication bài viết đã tương tác (ưu tiên tìm bài mới nhất chưa từng chạy)
      const normalizeDedupeUrl = (rawU: string) => {
        try {
          const parsed = new URL(String(rawU || ''));
          const fbid = parsed.searchParams.get('story_fbid') || parsed.searchParams.get('fbid');
          const idParam = parsed.searchParams.get('id');
          if (fbid) return `${parsed.origin}${parsed.pathname}?fbid=${fbid}${idParam ? `&id=${idParam}` : ''}`.toLowerCase();
          return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '').toLowerCase();
        } catch {
          return String(rawU || '').split('?')[0].replace(/\/+$/, '').toLowerCase();
        }
      };

      const interactedSet = new Set((sched.interactedPostUrls || []).map(normalizeDedupeUrl));
      const targetPost = newestPosts.find(p => !interactedSet.has(normalizeDedupeUrl(p.url)));

      if (!targetPost) {
        // Fanpage chưa có bài viết mới kể từ đợt trước
        const finishTime = Date.now();
        const nextRun = new Date(finishTime + sched.intervalMinutes * 60 * 1000).toISOString();
        await api.post('/automation/facebook-posts', {
          action: 'update_schedule_progress',
          id: sched.id,
          nextRunAt: nextRun,
          status: 'IDLE',
          statusMessage: `Bài viết mới nhất đã tương tác trước đó. Hẹn chu kỳ sau ${sched.intervalMinutes} phút.`,
        });
        fetchTasksAndStats();
        return;
      }

      // 3. Có bài mới chưa tương tác! Lấy pool tài khoản LIVE
      const liveAccounts = accounts.filter(a => a.status === 'LIVE' || a.status === 'ACTIVE');
      const pool = liveAccounts;

      if (pool.length === 0) {
        toast.warning(`[${sched.pageName}] Không có nick Facebook LIVE nào sẵn sàng.`);
        await api.post('/automation/facebook-posts', {
          action: 'update_schedule_progress',
          id: sched.id,
          nextRunAt: new Date(Date.now() + sched.intervalMinutes * 60 * 1000).toISOString(),
          status: 'PAUSED',
          statusMessage: 'Thiếu tài khoản Facebook LIVE để thực hiện',
        });
        fetchTasksAndStats();
        return;
      }

      // Shuffle & Random Pick
      let selectedAccs = [...pool];
      if (sched.randomAccounts && sched.accountsPerRun > 0 && sched.accountsPerRun < selectedAccs.length) {
        for (let i = selectedAccs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [selectedAccs[i], selectedAccs[j]] = [selectedAccs[j], selectedAccs[i]];
        }
        selectedAccs = selectedAccs.slice(0, sched.accountsPerRun);
      } else if (sched.accountsPerRun > 0) {
        selectedAccs = selectedAccs.slice(0, sched.accountsPerRun);
      }

      // 4. Tạo task trên Server
      const startRes = await api.post('/automation/facebook-posts', {
        action: 'start',
        name: `[Lịch Tự Động] ${sched.pageName} - ${selectedAccs.length} acc (${sched.concurrency} luồng/batch)`,
        targetUrl: sched.pageUrl,
        posts: [targetPost],
        likesPerPost: sched.likesPerPost,
        commentsPerPost: sched.commentsPerPost,
        comments: sched.comments,
        useAiComment: sched.useAiComment,
        accountIds: selectedAccs.map(a => a.id),
        delaySeconds: 5,
      });

      if (!startRes.data?.success) {
        toast.error(startRes.data?.error || 'Lỗi khởi tạo tác vụ');
        await api.post('/automation/facebook-posts', {
          action: 'update_schedule_progress',
          id: sched.id,
          nextRunAt: new Date(Date.now() + sched.intervalMinutes * 60 * 1000).toISOString(),
          status: 'IDLE',
          statusMessage: startRes.data?.error || 'Lỗi khởi tạo tác vụ',
        }).catch(() => {});
        return;
      }

      const newTask = startRes.data.task;
      setRunningTaskId(newTask.id);

      // Cập nhật trạng thái đang chạy vào DB
      await api.post('/automation/facebook-posts', {
        action: 'update_schedule_progress',
        id: sched.id,
        status: 'RUNNING',
        statusMessage: `Đang chạy ${selectedAccs.length} nick (${sched.concurrency} luồng/batch, đóng trình duyệt sau mỗi batch)...`,
      });
      fetchTasksAndStats();

      // 5. Chạy qua Electron Runner (hoặc mô phỏng web)
      let finalLikes = 0;
      let finalComments = 0;
      // @ts-ignore
      if (window.electron && window.electron.startAutomationTask) {
        const realProfileIds = selectedAccs.map(a => a.profileId || a.id);
        // @ts-ignore
        const runnerRes = await window.electron.startAutomationTask({
          taskId: newTask.id,
          actionType: 'fb_auto_posts_interact',
          profileIds: realProfileIds,
          accounts: selectedAccs,
          ...getElectronAuthContext(),
          config: {
            taskId: newTask.id,
            posts: [targetPost],
            buffActionType: 'BOTH',
            likesPerPost: sched.likesPerPost,
            commentsPerPost: sched.commentsPerPost,
            comments: sched.comments,
            useAiComment: sched.useAiComment,
            delaySeconds: 5,
            concurrency: sched.concurrency,
            randomAccounts: false, // Đã shuffle ở ngoài
            accountsPerRun: selectedAccs.length,
          },
        });

        finalLikes = runnerRes?.totalLikesExecuted ?? 0;
        finalComments = runnerRes?.totalCommentsExecuted ?? 0;

        await api.post('/automation/facebook-posts', {
          action: 'update_progress',
          taskId: newTask.id,
          executedLikes: finalLikes,
          executedComments: finalComments,
          status: 'DONE',
        }).catch(() => {});
      } else {
        // Mô phỏng 5 giây nếu chạy trên Web Dashboard
        await new Promise(r => setTimeout(r, 5000));
        finalLikes = selectedAccs.length * sched.likesPerPost;
        finalComments = selectedAccs.length * sched.commentsPerPost;
        await api.post('/automation/facebook-posts', {
          action: 'update_progress',
          taskId: newTask.id,
          executedLikes: finalLikes,
          executedComments: finalComments,
          status: 'DONE',
        }).catch(() => {});
      }

      // 6. XONG HẾT TOÀN BỘ ACCOUNTS: Tính set thời gian chu kỳ tiếp theo và đánh dấu bài đã chạy!
      const finishTime = Date.now();
      const nextRunTime = new Date(finishTime + sched.intervalMinutes * 60 * 1000).toISOString();
      const updatedInteracted = Array.from(new Set([...(sched.interactedPostUrls || []), targetPost.url]));

      await api.post('/automation/facebook-posts', {
        action: 'update_schedule_progress',
        id: sched.id,
        lastRunAt: new Date(finishTime).toISOString(),
        nextRunAt: nextRunTime,
        lastScannedPostUrl: targetPost.url,
        interactedPostUrls: updatedInteracted,
        status: 'IDLE',
        statusMessage: `Hoàn tất (${finalLikes} Like, ${finalComments} Cmt). Chu kỳ tiếp theo sau ${sched.intervalMinutes} phút.`,
      });

      toast.success(`[${sched.pageName}] Đã hoàn thành đợt tương tác (${finalLikes} Like, ${finalComments} Cmt)! Hẹn chu kỳ tiếp theo sau ${sched.intervalMinutes} phút.`);
    } catch (err: any) {
      console.error('Lỗi khi chạy lịch tự động:', err);
      toast.error(`[${sched.pageName}] Lỗi: ${err.message || 'Thất bại'}`);
      // Đảm bảo đặt lại nextRunAt để không bị chạy lặp vô tận mỗi 1 giây khi gặp lỗi
      const fallbackNext = new Date(Date.now() + sched.intervalMinutes * 60 * 1000).toISOString();
      await api.post('/automation/facebook-posts', {
        action: 'update_schedule_progress',
        id: sched.id,
        nextRunAt: fallbackNext,
        status: 'IDLE',
        statusMessage: `Tạm dừng do lỗi (${err.message || 'Thất bại'}). Thử lại sau ${sched.intervalMinutes} phút.`,
      }).catch(() => {});
    } finally {
      isEngineProcessingRef.current = false;
      setActiveRunningScheduleId(null);
      setRunningTaskId(null);
      setQueueMessage('Hàng đợi rảnh - Sẵn sàng');
      fetchTasksAndStats();
    }
  };

  // ========================================================
  // SCHEDULE ACTIONS (CREATE / EDIT / TOGGLE / DELETE / RUN NOW)
  // ========================================================
  const handleOpenAddSchedule = () => {
    setEditingSchedule(null);
    setFormPageUrl('');
    setFormPageName('');
    setFormIntervalMinutes(15);
    setFormAccountsPerRun(20);
    setFormConcurrency(5);
    setFormRandomAccounts(true);
    setFormUseAiComment(true);
    setFormLikesPerPost(1);
    setFormCommentsPerPost(1);
    setFormCommentsStr(
      'Bài viết rất hay và ý nghĩa!\nThông tin cực kỳ kịp thời và chính xác\nNội dung bổ ích quá, hóng các bài tiếp theo ạ\nChuẩn luôn ad ơi, thả tim cho bài viết\nCảm ơn page đã chia sẻ!'
    );
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (sched: PageSchedule) => {
    setEditingSchedule(sched);
    setFormPageUrl(sched.pageUrl);
    setFormPageName(sched.pageName);
    setFormIntervalMinutes(sched.intervalMinutes);
    setFormAccountsPerRun(sched.accountsPerRun);
    setFormConcurrency(sched.concurrency);
    setFormRandomAccounts(sched.randomAccounts);
    setFormUseAiComment(sched.useAiComment);
    setFormLikesPerPost(sched.likesPerPost);
    setFormCommentsPerPost(sched.commentsPerPost);
    setFormCommentsStr(
      Array.isArray(sched.comments) && sched.comments.length > 0
        ? sched.comments.join('\n')
        : 'Bài viết rất hay và ý nghĩa!\nThông tin cực kỳ kịp thời và chính xác\nCảm ơn page đã chia sẻ!'
    );
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!formPageUrl.trim()) {
      toast.error('Vui lòng nhập link Fanpage / Group');
      return;
    }

    setSavingSchedule(true);
    try {
      const commentsList = formCommentsStr.split('\n').map(c => c.trim()).filter(Boolean);
      const res = await api.post('/automation/facebook-posts', {
        action: 'save_schedule',
        id: editingSchedule?.id,
        pageUrl: formPageUrl.trim(),
        pageName: formPageName.trim() || undefined,
        intervalMinutes: formIntervalMinutes,
        accountsPerRun: formAccountsPerRun,
        concurrency: formConcurrency,
        randomAccounts: formRandomAccounts,
        useAiComment: formUseAiComment,
        likesPerPost: formLikesPerPost,
        commentsPerPost: formCommentsPerPost,
        comments: commentsList,
        isActive: editingSchedule ? editingSchedule.isActive : true,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Lưu cấu hình lịch thành công!');
        setIsScheduleModalOpen(false);
        fetchTasksAndStats();
      } else {
        toast.error(res.data?.error || 'Lỗi khi lưu lịch');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi lưu lịch');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleToggleSchedule = async (sched: PageSchedule) => {
    try {
      const nextActive = !sched.isActive;
      const res = await api.post('/automation/facebook-posts', {
        action: 'toggle_schedule',
        id: sched.id,
        isActive: nextActive,
      });

      if (res.data?.success) {
        toast.success(nextActive ? `Đã kích hoạt lịch cho ${sched.pageName}` : `Đã tạm dừng lịch ${sched.pageName}`);
        fetchTasksAndStats();
      }
    } catch (e) {
      toast.error('Lỗi khi bật/tắt lịch');
    }
  };

  const handleDeleteSchedule = async (sched: PageSchedule) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lịch quét cho Fanpage "${sched.pageName}"?`)) return;
    try {
      const res = await api.post('/automation/facebook-posts', {
        action: 'delete_schedule',
        id: sched.id,
      });
      if (res.data?.success) {
        toast.success('Đã xóa lịch Fanpage thành công');
        fetchTasksAndStats();
      }
    } catch (e) {
      toast.error('Lỗi khi xóa lịch');
    }
  };

  const handleRunScheduleNow = (sched: PageSchedule) => {
    if (isEngineProcessingRef.current) {
      // Đang có task chạy => Đưa schedule này lên đầu hàng đợi bằng cách set nextRunAt về quá khứ
      api.post('/automation/facebook-posts', {
        action: 'update_schedule_progress',
        id: sched.id,
        nextRunAt: new Date(Date.now() - 1000).toISOString(),
        status: 'QUEUED',
        statusMessage: 'Đang xếp hàng chờ chạy ngay sau task hiện tại...',
      }).then(() => {
        toast.info(`[${sched.pageName}] Đã xếp hàng ưu tiên! Sẽ chạy ngay khi task hiện tại hoàn tất.`);
        fetchTasksAndStats();
      });
      return;
    }

    toast.info(`[${sched.pageName}] Kích hoạt chạy ngay lập tức...`);
    executeScheduleRun(sched);
  };

  // ========================================================
  // MANUAL SCANNING CONTROLLER
  // ========================================================
  const handleScanPosts = async (overrideUrl?: string) => {
    const urlToScan = (overrideUrl || targetUrl).trim();
    if (!urlToScan) {
      toast.error('Vui lòng nhập link Fanpage hoặc chọn từ danh sách mẫu.');
      return;
    }

    setScanning(true);
    setScanStep('Đang kết nối Facebook...');
    const t1 = setTimeout(() => setScanStep('Đang phân tích và trích xuất bài viết...'), 1800);
    const t2 = setTimeout(() => setScanStep('Đang đồng bộ dữ liệu bài viết mới...'), 4000);

    try {
      const res = await api.post('/automation/facebook-posts', {
        action: 'scan',
        targetUrl: urlToScan,
        limit: scanLimit,
      });

      if (res.data?.success && Array.isArray(res.data.posts)) {
        setScannedPosts(res.data.posts);
        setPageTitle(res.data.pageName || 'Fanpage Facebook');
        setScanSource(res.data.source || '');
        setSelectedPostIds(new Set(res.data.posts.map((p: any) => p.id)));
        toast.success(`Đã quét thành công ${res.data.posts.length} bài viết thực tế từ Facebook!`);
        fetchTrackedPages();
      } else {
        toast.error('Không tìm thấy bài viết nào hoặc Fanpage ở chế độ riêng tư.');
      }
    } catch (err: any) {
      console.error('Scan error', err);
      toast.error(err.response?.data?.error || 'Lỗi khi quét bài viết mới');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setScanning(false);
      setScanStep('');
    }
  };

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

  // Billing calculations
  const selectedCount = selectedPostIds.size;
  const plannedLikes = selectedCount * Math.max(0, likesPerPost);
  const plannedComments = selectedCount * Math.max(0, commentsPerPost);
  const plannedLikeCost = plannedLikes * LIKE_UNIT_PRICE;
  const plannedCommentCost = plannedComments * COMMENT_UNIT_PRICE;
  const plannedTotalCost = plannedLikeCost + plannedCommentCost;

  const currentExecutedLikes = executingProgress.executedLikes;
  const currentExecutedComments = executingProgress.executedComments;
  const currentExecutedCost = (currentExecutedLikes * LIKE_UNIT_PRICE) + (currentExecutedComments * COMMENT_UNIT_PRICE);

  // Manual start
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

      // @ts-ignore
      if (window.electron && window.electron.startAutomationTask) {
        const candidateAccounts = accounts.filter(a => selectedAccountIds.has(a.id));
        const realProfileIds = candidateAccounts.map(a => a.profileId || a.id);

        // @ts-ignore
        window.electron.startAutomationTask({
          taskId: newTask.id,
          actionType: 'fb_auto_posts_interact',
          profileIds: realProfileIds,
          accounts: candidateAccounts,
          ...getElectronAuthContext(),
          config: {
            taskId: newTask.id,
            posts: postsToRun,
            buffActionType: 'BOTH',
            likesPerPost,
            commentsPerPost,
            comments: commentsList,
            useAiComment,
            delaySeconds,
            concurrency: 5,
            randomAccounts: false,
            accountsPerRun: candidateAccounts.length,
          },
        }).then(async (runnerRes: any) => {
          const finalLikes = runnerRes?.totalLikesExecuted !== undefined ? runnerRes.totalLikesExecuted : executingProgress.executedLikes;
          const finalComments = runnerRes?.totalCommentsExecuted !== undefined ? runnerRes.totalCommentsExecuted : executingProgress.executedComments;

          if (runnerRes?.success) {
            toast.success('Tác vụ tự động Facebook đã hoàn thành xuất sắc!');
            await api.post('/automation/facebook-posts', {
              action: 'update_progress',
              taskId: newTask.id,
              executedLikes: finalLikes,
              executedComments: finalComments,
              status: 'DONE',
            });
          } else {
            toast.warning('Tác vụ kết thúc: ' + (runnerRes?.error || 'Hoàn tất một phần'));
            await api.post('/automation/facebook-posts', {
              action: 'update_progress',
              taskId: newTask.id,
              executedLikes: finalLikes,
              executedComments: finalComments,
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
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Lỗi khi bắt đầu tự động hóa');
    }
  };

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
        executedLikes: executingProgress.executedLikes,
        executedComments: executingProgress.executedComments,
        status: 'IDLE',
      });
      setRunningTaskId(null);
      toast.success('Đã tạm dừng tác vụ tự động');
      fetchTasksAndStats();
    } catch (e) {
      toast.error('Lỗi khi dừng tác vụ');
    }
  };

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

  const liveAccountsCount = accounts.filter(a => a.status === 'LIVE' || a.status === 'ACTIVE').length;

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
                AI 9Router Automated Gateway
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-300 shrink-0" />
              Tự Động Quét Bài Viết & Chạy Like, Comment Đa Fanpage
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
              Hệ thống lập lịch tự động quét theo chu kỳ từng Page (15p, 20p...). Tự động shuffle random nick từ pool tài khoản, mở batch 5 nick rồi kill giải phóng RAM, và chỉ tính thời gian chu kỳ tiếp theo sau khi chạy xong toàn bộ tài khoản!
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
          SUB-TAB NAVIGATION BAR
      ======================================================== */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
        <button
          onClick={() => setSubTab('schedules')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            subTab === 'schedules'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch Tự Động Đa Page (Multi-Page Queue & Scheduler)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-800 text-purple-200">
            {schedules.length} Page
          </span>
        </button>

        <button
          onClick={() => setSubTab('manual')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            subTab === 'manual'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Quét Thủ Công & Chạy Nhanh (Single Run)</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: MULTI-PAGE SCHEDULES & QUEUE ENGINE
      ======================================================== */}
      {subTab === 'schedules' && (
        <div className="space-y-6">
          {/* Top 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Schedules */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fanpage Đang Quét</span>
                <div className="text-2xl font-black text-gray-900 mt-0.5 font-mono">
                  {schedules.length} <span className="text-xs font-medium text-gray-500">Page</span>
                </div>
                <span className="text-[11px] text-purple-600 font-medium">
                  Đang hoạt động: {schedules.filter(s => s.isActive).length}/{schedules.length} Page
                </span>
              </div>
            </div>

            {/* Card 2: Mutex Queue Status */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                activeRunningScheduleId ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hàng Đợi Tránh Xung Đột</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeRunningScheduleId ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {activeRunningScheduleId ? 'Đang Xử Lý' : 'Sẵn Sàng'}
                  </span>
                </div>
                <div className="text-xs font-bold text-gray-800 mt-1 truncate" title={queueMessage}>
                  {queueMessage}
                </div>
                <span className="text-[11px] text-gray-500">
                  Chạy tuần tự 1 Page/lần, không đụng độ RAM
                </span>
              </div>
            </div>

            {/* Card 3: Live Account Pool */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Shuffle className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pool Nick Tự Động</span>
                <div className="text-2xl font-black text-blue-700 mt-0.5 font-mono">
                  {liveAccountsCount} <span className="text-xs font-medium text-gray-500">nick LIVE</span>
                </div>
                <span className="text-[11px] text-gray-500">
                  Tự shuffle random nick mỗi lần quét
                </span>
              </div>
            </div>

            {/* Card 4: Concurrency & Kill Browser Safe Guard */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-5 rounded-2xl text-white shadow-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-white">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Tối Ưu Hóa Tài Nguyên</span>
                <div className="text-sm font-black text-white mt-1">
                  Kill Trình Duyệt Theo Batch
                </div>
                <span className="text-[11px] text-indigo-100/90 leading-tight block mt-0.5">
                  Xong 5 nick đóng hẳn browser → Cooldown 3s → Mở 5 nick tiếp
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Table Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Danh Sách Fanpage Lên Lịch Quét & Chạy Tự Động
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mỗi Page tự chạy theo chu kỳ hẹn trước (15p, 20p...). Tự động xếp hàng khi có page khác đang chạy để đảm bảo 0% xung đột.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={fetchTasksAndStats}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Làm mới
                </button>
                <button
                  onClick={handleOpenAddSchedule}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-200 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Fanpage Tự Động</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-800">
                <thead className="bg-gray-50/70 text-gray-500 border-b border-gray-100 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Fanpage / Mục Tiêu</th>
                    <th className="px-4 py-3">Chu Kỳ Quét</th>
                    <th className="px-4 py-3">Nick & Luồng (Batch)</th>
                    <th className="px-4 py-3">Bài Mới Nhất Đã Xử Lý</th>
                    <th className="px-4 py-3">Đếm Ngược & Trạng Thái</th>
                    <th className="px-4 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        Chưa có lịch quét Fanpage nào. Bấm nút <strong>"+ Thêm Fanpage Tự Động"</strong> ở trên để bắt đầu!
                      </td>
                    </tr>
                  ) : (
                    schedules.map(sched => {
                      const isRunning = activeRunningScheduleId === sched.id || sched.status === 'RUNNING';
                      const isDue = sched.isActive && sched.nextRunAt && new Date(sched.nextRunAt).getTime() <= currentTime;
                      const isQueued = isDue && activeRunningScheduleId && activeRunningScheduleId !== sched.id;

                      let statusBadge = (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Đang chờ: {formatCountdown(sched.nextRunAt, currentTime)}
                        </span>
                      );

                      if (!sched.isActive) {
                        statusBadge = (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            Đã Tạm Dừng
                          </span>
                        );
                      } else if (isRunning) {
                        statusBadge = (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 animate-pulse flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" /> ĐANG CHẠY BATCH...
                          </span>
                        );
                      } else if (isQueued) {
                        statusBadge = (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> ĐANG CHỜ HÀNG ĐỢI...
                          </span>
                        );
                      }

                      return (
                        <tr key={sched.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{sched.pageName}</span>
                              <a
                                href={sched.pageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-blue-600"
                                title="Xem trang trên Facebook"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono truncate max-w-[240px]">
                              {sched.pageUrl}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                              Mỗi {sched.intervalMinutes} phút
                            </span>
                            <div className="text-[10px] text-gray-400 mt-1">
                              (Chỉ đếm sau khi chạy xong)
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-gray-800">
                              {sched.accountsPerRun} nick · {sched.concurrency} luồng/batch
                            </div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                              {sched.randomAccounts && (
                                <span className="text-blue-600 font-medium">✓ Random nick</span>
                              )}
                              {sched.useAiComment && (
                                <span className="text-purple-600 font-medium">✓ AI 9Router</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            {sched.lastScannedPostUrl ? (
                              <div className="space-y-0.5">
                                <a
                                  href={sched.lastScannedPostUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-blue-600 hover:underline font-mono truncate block max-w-[200px]"
                                >
                                  {sched.lastScannedPostUrl}
                                </a>
                                <span className="text-[10px] text-gray-400">
                                  Đã tương tác {sched.interactedPostUrls?.length || 1} bài viết
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-[11px]">Chưa phát hiện bài nào</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="space-y-1">
                              {statusBadge}
                              {sched.statusMessage && (
                                <div className="text-[10px] text-gray-500 max-w-[200px] truncate" title={sched.statusMessage}>
                                  {sched.statusMessage}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleRunScheduleNow(sched)}
                                disabled={isRunning}
                                className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                                title="Kích hoạt quét và chạy ngay lập tức"
                              >
                                <Play className="w-3 h-3 fill-current" /> Chạy ngay
                              </button>
                              <button
                                onClick={() => handleToggleSchedule(sched)}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  sched.isActive
                                    ? 'text-amber-600 hover:bg-amber-50 border-amber-200'
                                    : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                                }`}
                                title={sched.isActive ? 'Tạm dừng lịch' : 'Bật lại lịch'}
                              >
                                {sched.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleOpenEditSchedule(sched)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Sửa cấu hình lịch"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(sched)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Xóa lịch"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ========================================================
          TAB 2: MANUAL SCAN & SINGLE RUN
      ======================================================== */}
      {subTab === 'manual' && (
        <div className="space-y-6">
          {/* Top KPI Cards for Manual Run */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Manual Scanner */}
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

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400 font-medium">Gợi ý & Đối thủ F051:</span>
                {trackedPages.slice(0, 3).map(tp => (
                  <button
                    key={tp.id}
                    onClick={() => handlePresetSelect(tp.url)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors font-semibold border border-rose-200 cursor-pointer flex items-center gap-1"
                    title={`Theo dõi từ F051: ${tp.url}`}
                  >
                    <span>🎯</span>
                    <span>{tp.name || 'Đối thủ F051'}</span>
                  </button>
                ))}
                <button
                  onClick={() => handlePresetSelect('https://www.facebook.com/StayeaPhuQuocOfficial/')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors font-semibold border border-purple-200 cursor-pointer"
                >
                  Stayea Phú Quốc
                </button>
                <button
                  onClick={() => handlePresetSelect('https://www.facebook.com/tintucvtv24')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-purple-50 hover:text-purple-700 transition-colors font-medium cursor-pointer"
                >
                  VTV24
                </button>
              </div>
            </div>

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
                </select>

                <button
                  onClick={() => handleScanPosts()}
                  disabled={scanning}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-purple-200 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {scanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{scanStep || 'Đang quét bài viết...'}</span>
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
          </div>

          {/* Scanned Posts & Config */}
          {scannedPosts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                </div>

                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {scannedPosts.map((post) => {
                    const isSelected = selectedPostIds.has(post.id);
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
                            onChange={() => {}}
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

                          <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed">
                            {post.content || '(Bài viết dạng ảnh / video không có văn bản)'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Settings Right Col */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" /> Cài Đặt Tương Tác Tức Thì
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-indigo-600" /> Like / bài:
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={likesPerPost}
                        onChange={e => setLikesPerPost(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-indigo-700 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-1">
                        <MessageCircle className="w-3.5 h-3.5 text-purple-600" /> Comment / bài:
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={commentsPerPost}
                        onChange={e => setCommentsPerPost(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-purple-700 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Bình Luận Thông Minh (AI 9Router)
                      </label>
                      <input
                        type="checkbox"
                        checked={useAiComment}
                        onChange={e => setUseAiComment(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={commentsStr}
                      onChange={e => setCommentsStr(e.target.value)}
                      placeholder="Nội dung bình luận mẫu (mỗi dòng 1 câu)..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleStartAutoRun}
                      disabled={selectedCount === 0 || runningTaskId !== null}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Kích Hoạt Chạy Tự Động (1-Click Run)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          CAMPAIGN HISTORY & BILLING TABLE (F145 LOGS)
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
                    Chưa có chiến dịch quét & chạy tự động nào.
                  </td>
                </tr>
              ) : (
                tasks.map(t => {
                  const cfg = t.config || {};
                  const billing = cfg.billing || {};
                  const postsCount = Array.isArray(cfg.posts) ? cfg.posts.length : (cfg.postsCount || 1);
                  const execLikes = billing.executedLikes !== undefined ? billing.executedLikes : ((t.status === 'DONE' || t.status === 'COMPLETED') ? billing.likesCount || 0 : 0);
                  const execComments = billing.executedComments !== undefined ? billing.executedComments : ((t.status === 'DONE' || t.status === 'COMPLETED') ? billing.commentsCount || 0 : 0);
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
                              : (t.status === 'DONE' || t.status === 'COMPLETED')
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
          ADD / EDIT SCHEDULE MODAL
      ======================================================== */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-xs animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h4 className="text-sm font-bold text-gray-900">
                  {editingSchedule ? 'Sửa Cấu Hình Lịch Fanpage' : 'Thêm Lịch Quét Fanpage Tự Động'}
                </h4>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Liên kết Fanpage hoặc Group Facebook: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formPageUrl}
                  onChange={e => setFormPageUrl(e.target.value)}
                  placeholder="VD: https://www.facebook.com/StayeaPhuQuocOfficial/"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Tên Fanpage / Nhãn Nhận Diện:
                </label>
                <input
                  type="text"
                  value={formPageName}
                  onChange={e => setFormPageName(e.target.value)}
                  placeholder="VD: Stayea Phú Quốc hoặc Page 1"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Chu kỳ quét (phút):
                  </label>
                  <select
                    value={formIntervalMinutes}
                    onChange={e => setFormIntervalMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={5}>Mỗi 5 phút</option>
                    <option value={10}>Mỗi 10 phút</option>
                    <option value={15}>Mỗi 15 phút (Khuyên dùng)</option>
                    <option value={20}>Mỗi 20 phút</option>
                    <option value={30}>Mỗi 30 phút</option>
                    <option value={60}>Mỗi 60 phút (1 giờ)</option>
                  </select>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Đếm sau khi chạy xong toàn bộ nick
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Số nick chạy mỗi lần:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={formAccountsPerRun}
                    onChange={e => setFormAccountsPerRun(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    VD: 20 nick mỗi lần quét
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Số luồng / batch (concurrency):
                  </label>
                  <select
                    value={formConcurrency}
                    onChange={e => setFormConcurrency(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={1}>1 nick / lần (Rất nhẹ máy)</option>
                    <option value={3}>3 nick / lần</option>
                    <option value={5}>5 nick / lần (Khuyên dùng)</option>
                    <option value={10}>10 nick / lần (Máy mạnh)</option>
                  </select>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Xong 5 nick sẽ kill browser giải phóng RAM
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Like & Comment mỗi bài:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={formLikesPerPost}
                      onChange={e => setFormLikesPerPost(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-1/2 px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                      title="Số Like mỗi nick"
                    />
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={formCommentsPerPost}
                      onChange={e => setFormCommentsPerPost(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-1/2 px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                      title="Số Comment mỗi nick"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    (Like x50đ / Cmt x70đ)
                  </span>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formRandomAccounts}
                    onChange={e => setFormRandomAccounts(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span className="font-semibold text-gray-800">
                    Tự động chọn ngẫu nhiên nick từ pool mỗi đợt quét (Tránh trùng lặp)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formUseAiComment}
                    onChange={e => setFormUseAiComment(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span className="font-semibold text-gray-800">
                    Sử dụng AI 9Router tạo bình luận thông minh bám sát nội dung bài viết
                  </span>
                </label>
              </div>

              {/* Backup comments */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Mẫu bình luận dự phòng (mỗi dòng 1 câu):
                </label>
                <textarea
                  rows={3}
                  value={formCommentsStr}
                  onChange={e => setFormCommentsStr(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-200 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingSchedule ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{editingSchedule ? 'Cập Nhật Cấu Hình' : 'Lưu & Kích Hoạt Lịch'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          INVOICE RECEIPT MODAL
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
