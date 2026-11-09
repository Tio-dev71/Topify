import { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Users,
  Repeat,
  Paperclip,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Check,
  ListFilter,
  LayoutGrid,
  List,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  X,
  Send,
  AtSign,
  FileText,
  UploadCloud,
  Film,
  Rocket,
  UserCheck,
  RefreshCw,
  MoreVertical,
  Trash2,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type RecurFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface EnrichedTask {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  assigneeId?: string | null;
  assignee?: {
    id?: string;
    name: string | null;
    email: string;
    image?: string | null;
  } | null;
  collaborators: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  collaboratorIds: string[];
  isRecurring: boolean;
  recurRule?: string | null;
  subtasks: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    assigneeName?: string;
  }>;
  commentsCount: number;
  attachmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCommentItem {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  mentions: string[];
  attachments: Array<{
    id: string;
    name: string;
    size: number;
    url: string;
    type: string;
    uploadedAt: string;
  }>;
  createdAt: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  category: 'CONTENT' | 'CSKH' | 'CAMPAIGN' | 'ONBOARDING' | 'CUSTOM' | string;
  description: string;
  estimatedDays: number;
  icon: string;
  isCustom?: boolean;
  createdAt?: string;
  steps: Array<{
    title: string;
    description?: string;
    relativeDueDays: number;
    defaultRole?: string;
  }>;
}

export interface MemberProductivityMetric {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  totalAssigned: number;
  activeCount: number;
  completedCount: number;
  overdueCount: number;
  onTimeRate: number;
  productivityScore: number;
  isOverloaded: boolean;
}

const TEAM_MEMBERS = [
  { id: 'user_1', name: 'Nguyễn Văn A', email: 'nguyenvana@topify.vn', role: 'Content & Media Lead', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
  { id: 'user_2', name: 'Trần Thị B', email: 'tranthib@topify.vn', role: 'Video Editor & CSKH', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { id: 'user_3', name: 'Lê Hoàng C', email: 'lehoangc@topify.vn', role: 'Growth & Ads Specialist', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
];

const INITIAL_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tpl_content_video',
    name: 'Sản xuất Video Content (TikTok/Reels/Shorts)',
    category: 'CONTENT',
    description: 'Quy chuẩn sản xuất video từ bước lên ý tưởng, kịch bản, quay dựng, duyệt phụ đề tới khi xuất bản.',
    estimatedDays: 3,
    icon: 'Film',
    steps: [
      { title: 'Nghiên cứu chủ đề bùng nổ & Hook 3s đầu tiên', relativeDueDays: 1, defaultRole: 'Content Creator' },
      { title: 'Viết kịch bản chi tiết & Chuẩn bị bối cảnh quay', relativeDueDays: 1, defaultRole: 'Content Creator' },
      { title: 'Quay source video chất lượng cao (4K/60fps)', relativeDueDays: 2, defaultRole: 'Videographer' },
      { title: 'Dựng video, cắt nhịp nhanh & Chèn hiệu ứng âm thanh', relativeDueDays: 2, defaultRole: 'Video Editor' },
      { title: 'Tạo phụ đề tự động WebVTT/SRT & Kiểm duyệt bản quyền nhạc', relativeDueDays: 3, defaultRole: 'Video Editor' },
      { title: 'Soạn Caption, Hashtag & Đặt lịch đăng tự động đa kênh', relativeDueDays: 3, defaultRole: 'Marketing Staff' },
    ],
  },
  {
    id: 'tpl_cskh_complaint',
    name: 'Xử lý Khiếu nại & Chăm sóc Khách hàng (CSKH)',
    category: 'CSKH',
    description: 'Quy trình tiếp nhận, xác minh lỗi vận chuyển/sản phẩm và xử lý bồi hoàn cho khách hàng nhanh chóng.',
    estimatedDays: 1,
    icon: 'MessageSquare',
    steps: [
      { title: 'Tiếp nhận phản hồi và ghi nhận mã đơn hàng/SĐT', relativeDueDays: 0, defaultRole: 'CSKH Staff' },
      { title: 'Xác minh lỗi với bộ phận kho vận & đơn vị giao hàng', relativeDueDays: 1, defaultRole: 'CSKH Staff' },
      { title: 'Liên hệ khách đề xuất giải pháp (Đổi hàng hoặc Hoàn tiền)', relativeDueDays: 1, defaultRole: 'CSKH Staff' },
      { title: 'Tạo đơn gửi bù hoặc chuyển khoản bồi hoàn', relativeDueDays: 1, defaultRole: 'Accountant' },
      { title: 'Gọi điện/nhắn tin xin đánh giá hài lòng sau hỗ trợ & Đóng ca', relativeDueDays: 2, defaultRole: 'CSKH Staff' },
    ],
  },
  {
    id: 'tpl_campaign_launch',
    name: 'Triển khai Chiến dịch Marketing & Mở bán',
    category: 'CAMPAIGN',
    description: 'Quy trình phối hợp liên phòng ban chuẩn bị tài nguyên và phân phối chiến dịch quảng bá sản phẩm.',
    estimatedDays: 7,
    icon: 'Rocket',
    steps: [
      { title: 'Xác định mục tiêu KPI doanh thu & Ngân sách chiến dịch', relativeDueDays: 1, defaultRole: 'Marketing Lead' },
      { title: 'Sản xuất bộ tài nguyên hình ảnh banner & Video teaser', relativeDueDays: 3, defaultRole: 'Design & Media Team' },
      { title: 'Cài đặt mã pixel tracking & Thiết lập chiến dịch Ads đa kênh', relativeDueDays: 4, defaultRole: 'Performance Ads' },
      { title: 'Phát động Seeding hội nhóm & Kêu gọi cộng tác viên', relativeDueDays: 5, defaultRole: 'Community Staff' },
      { title: 'Chính thức Kick-off mở bán & Giám sát phễu chuyển đổi Leads', relativeDueDays: 6, defaultRole: 'Sales Team' },
      { title: 'Tổng kết doanh thu, đối soát chi phí & Báo cáo Campaign ROI', relativeDueDays: 7, defaultRole: 'Marketing Lead' },
    ],
  },
  {
    id: 'tpl_team_onboarding',
    name: 'Tiếp nhận & Đào tạo Nhân sự mới (Onboarding)',
    category: 'ONBOARDING',
    description: 'Hỗ trợ thành viên mới hòa nhập văn hóa, nắm bắt công cụ làm việc và nhận việc trong tuần đầu tiên.',
    estimatedDays: 5,
    icon: 'UserCheck',
    steps: [
      { title: 'Cấp email doanh nghiệp và mời vào Workspace Topify', relativeDueDays: 1, defaultRole: 'Admin' },
      { title: 'Phổ biến nội quy làm việc, Brand Voice & Chính sách bảo mật', relativeDueDays: 1, defaultRole: 'Team Leader' },
      { title: 'Hướng dẫn sử dụng Topify Studio, Inbox và CRM thực chiến', relativeDueDays: 2, defaultRole: 'Mentor' },
      { title: 'Giao nhiệm vụ thử việc đầu tiên có người hướng dẫn kèm 1-1', relativeDueDays: 3, defaultRole: 'Team Leader' },
      { title: 'Đánh giá năng lực tuần đầu tiên & Họp 1-1 phản hồi', relativeDueDays: 5, defaultRole: 'Team Leader' },
    ],
  },
];

const INITIAL_TASKS: EnrichedTask[] = [];

const INITIAL_COMMENTS: Record<string, TaskCommentItem[]> = {};

export default function Tasks() {
  const [activeTab, setActiveTab] = useState<'board' | 'templates' | 'productivity'>('board');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Team members (synced with workspace or fallback)
  const [teamMembers, setTeamMembers] = useState(TEAM_MEMBERS);

  // Load real team members from workspace
  useEffect(() => {
    api.get('/team')
      .then((res) => {
        if (res.data?.members && Array.isArray(res.data.members) && res.data.members.length > 0) {
          const mapped = res.data.members.map((m: any, idx: number) => ({
            id: m.id || m.email,
            name: m.name || m.email.split('@')[0],
            email: m.email,
            role: m.role === 'ADMIN' ? 'Quản trị viên (Admin)' : 'Nhân viên (Staff)',
            avatar: m.image || `https://images.unsplash.com/photo-${1534528741775 + idx}?w=100&h=100&fit=crop`,
          }));
          setTeamMembers(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Load team members from workspace
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get('/workspace/members');
        if (res.data?.members && Array.isArray(res.data.members) && res.data.members.length > 0) {
          const mapped = res.data.members.map((m: any) => ({
            id: m.id || m.userId,
            name: m.name || m.email?.split('@')[0] || 'Thành viên',
            email: m.email || '',
            role: m.role || 'Thành viên',
            avatar: m.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || 'User')}&background=random`,
          }));
          setTeamMembers(mapped);
          if (mapped[0]?.id) {
            setNewAssigneeId(mapped[0].id);
          }
        }
      } catch (err) {
        // keep TEAM_MEMBERS fallback
      }
    };
    fetchMembers();
  }, []);

  // Tasks state (initialized from persistent localStorage cache for zero-flicker and offline retention)
  const [tasks, setTasks] = useState<EnrichedTask[]>(() => {
    try {
      const cached = localStorage.getItem('topify_tasks_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_TASKS;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/tasks');
      if (res.data?.success && Array.isArray(res.data?.tasks)) {
        const fetchedTasks: EnrichedTask[] = res.data.tasks;
        let merged = [...fetchedTasks];
        try {
          const cached = localStorage.getItem('topify_tasks_cache');
          if (cached) {
            const cachedTasks: EnrichedTask[] = JSON.parse(cached);
            const fetchedIds = new Set(fetchedTasks.map((t) => t.id));
            const unsynced = cachedTasks.filter((t) => !fetchedIds.has(t.id));
            merged = [...fetchedTasks, ...unsynced];
          }
        } catch {}
        setTasks(merged);
        try {
          localStorage.setItem('topify_tasks_cache', JSON.stringify(merged));
        } catch {}
      }
    } catch (err) {
      console.warn('Tasks API fallback to cache:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/tasks/templates');
      if (res.data?.success && Array.isArray(res.data?.templates)) {
        const fetched: TaskTemplate[] = res.data.templates;
        let merged = [...fetched];
        try {
          const cached = localStorage.getItem('topify_task_templates_cache');
          if (cached) {
            const cachedTpls: TaskTemplate[] = JSON.parse(cached);
            const fetchedIds = new Set(fetched.map((t) => t.id));
            const customUnsynced = cachedTpls.filter((t) => t.isCustom && !fetchedIds.has(t.id));
            merged = [...fetched, ...customUnsynced];
          }
        } catch {}
        setTemplates(merged);
        try {
          localStorage.setItem('topify_task_templates_cache', JSON.stringify(merged));
        } catch {}
      }
    } catch (err) {
      console.warn('Templates API fallback to cache:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchTemplates();
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterMember, setFilterMember] = useState<string>('ALL');
  const [onlyOverdue, setOnlyOverdue] = useState<boolean>(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);

  // Templates State (F130)
  const [templates, setTemplates] = useState<TaskTemplate[]>(() => {
    try {
      const cached = localStorage.getItem('topify_task_templates_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_TEMPLATES;
  });

  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState<'CONTENT' | 'CSKH' | 'CAMPAIGN' | 'ONBOARDING' | 'CUSTOM'>('CUSTOM');
  const [tplDescription, setTplDescription] = useState('');
  const [tplEstimatedDays, setTplEstimatedDays] = useState(3);
  const [tplSteps, setTplSteps] = useState<Array<{ title: string; defaultRole: string; relativeDueDays: number }>>([
    { title: 'Nghiên cứu & Lập kế hoạch chi tiết', defaultRole: 'Trưởng nhóm', relativeDueDays: 1 },
    { title: 'Triển khai công việc & Chuẩn bị tài nguyên', defaultRole: 'Thành viên thực hiện', relativeDueDays: 2 },
    { title: 'Kiểm duyệt chất lượng & Nghiệm thu', defaultRole: 'Quản lý dự án', relativeDueDays: 3 },
  ]);

  // Create Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('user_1');
  const [newCollaboratorIds, setNewCollaboratorIds] = useState<string[]>([]);
  const [newIsRecurring, setNewIsRecurring] = useState(false);
  const [newRecurRule, setNewRecurRule] = useState<RecurFrequency>('WEEKLY');
  const [newSelectedTemplateId, setNewSelectedTemplateId] = useState<string>('');
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<string[]>(['']);

  // Edit Task Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EnrichedTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('MEDIUM');
  const [editStatus, setEditStatus] = useState<TaskStatus>('TODO');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editCollaboratorIds, setEditCollaboratorIds] = useState<string[]>([]);
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurRule, setEditRecurRule] = useState<RecurFrequency>('WEEKLY');

  const openEditTaskModal = (task: EnrichedTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setEditAssigneeId(task.assigneeId || '');
    setEditCollaboratorIds(task.collaboratorIds || []);
    setEditIsRecurring(task.isRecurring);
    setEditRecurRule((task.recurRule as RecurFrequency) || 'WEEKLY');
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề công việc');
      return;
    }

    const assignee = teamMembers.find((m) => m.id === editAssigneeId) || null;
    const collaborators = teamMembers.filter((m) => editCollaboratorIds.includes(m.id));

    const updatedTask: EnrichedTask = {
      ...editingTask,
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      priority: editPriority,
      status: editStatus,
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      assigneeId: editAssigneeId || null,
      assignee,
      collaboratorIds: editCollaboratorIds,
      collaborators,
      isRecurring: editIsRecurring,
      recurRule: editIsRecurring ? editRecurRule : null,
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => {
      const next = prev.map((t) => (t.id === editingTask.id ? updatedTask : t));
      try {
        localStorage.setItem('topify_tasks_cache', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (selectedTask && selectedTask.id === editingTask.id) {
      setSelectedTask(updatedTask);
    }

    setIsEditModalOpen(false);

    try {
      await api.patch('/tasks', {
        id: editingTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        status: updatedTask.status,
        dueDate: updatedTask.dueDate,
        assigneeId: updatedTask.assigneeId,
        collaboratorIds: updatedTask.collaboratorIds,
        isRecurring: updatedTask.isRecurring,
        recurRule: updatedTask.recurRule,
      });
      toast.success('Đã cập nhật công việc thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi cập nhật công việc');
    }
  };

  // Comments state for modal
  const [commentsMap, setCommentsMap] = useState<Record<string, TaskCommentItem[]>>(INITIAL_COMMENTS);
  const [newCommentText, setNewCommentText] = useState('');
  const [mockAttachmentName, setMockAttachmentName] = useState('');

  // Productivity metrics
  const [productivityMetrics, setProductivityMetrics] = useState<MemberProductivityMetric[]>([]);

  // Calculate Member Metrics on tasks change
  useEffect(() => {
    const now = Date.now();
    const metrics: MemberProductivityMetric[] = teamMembers.map((member) => {
      const userTasks = tasks.filter(
        (t) => t.assigneeId === member.id || t.collaboratorIds.includes(member.id)
      );
      const totalAssigned = userTasks.length;
      const activeTasks = userTasks.filter((t) => t.status !== 'DONE');
      const completedTasks = userTasks.filter((t) => t.status === 'DONE');
      const overdueTasks = activeTasks.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < now);
      const urgentActiveCount = activeTasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length;

      const activeCount = activeTasks.length;
      const completedCount = completedTasks.length;
      const overdueCount = overdueTasks.length;

      // On-time rate:
      // - 0% if no tasks completed (cannot claim 100% on-time without completed work)
      // - completedCount / (completedCount + overdueCount) * 100
      let onTimeRate = 0;
      if (completedCount > 0) {
        onTimeRate = Math.max(0, Math.min(100, Math.round((completedCount / (completedCount + overdueCount)) * 100)));
      }

      // Productivity score (0 - 100):
      // - 0 if totalAssigned === 0 (no work assigned)
      // - Based on completion (50%), on-time/progress (35%), active workload bonus (15%), minus overdue penalty
      let productivityScore = 0;
      if (totalAssigned > 0) {
        const completionWeight = (completedCount / totalAssigned) * 50;
        const onTimeWeight = completedCount > 0 ? (onTimeRate / 100) * 35 : (overdueCount === 0 ? 15 : 0);
        const workloadBonus =
          activeCount > 0 && overdueCount === 0
            ? 15
            : completedCount === totalAssigned
            ? 15
            : Math.max(0, 15 - overdueCount * 10);
        const overduePenalty = (overdueCount / totalAssigned) * 40;

        productivityScore = Math.max(
          0,
          Math.min(100, Math.round(completionWeight + onTimeWeight + workloadBonus - overduePenalty))
        );
      }

      const isOverloaded = activeCount >= 4 || urgentActiveCount >= 2;

      return {
        userId: member.id,
        name: member.name,
        email: member.email,
        avatar: member.avatar,
        role: member.role,
        totalAssigned,
        activeCount,
        completedCount,
        overdueCount,
        onTimeRate,
        productivityScore,
        isOverloaded,
      };
    });
    setProductivityMetrics(metrics);
  }, [tasks, teamMembers]);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = filterPriority === 'ALL' || t.priority === filterPriority;

    const matchesMember =
      filterMember === 'ALL' ||
      t.assigneeId === filterMember ||
      t.collaboratorIds.includes(filterMember);

    const isOverdueNow = t.status !== 'DONE' && t.dueDate && new Date(t.dueDate).getTime() < Date.now();
    const matchesOverdue = !onlyOverdue || isOverdueNow;

    return matchesSearch && matchesPriority && matchesMember && matchesOverdue;
  });

  // Kanban Columns
  const columns: Array<{ id: TaskStatus; label: string; color: string; bg: string }> = [
    { id: 'TODO', label: 'Cần làm', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'IN_PROGRESS', label: 'Đang thực hiện', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'REVIEW', label: 'Chờ duyệt / Test', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'DONE', label: 'Đã hoàn thành', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  // Quick Change Status
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) => {
      const updatedList = prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, status: newStatus, updatedAt: new Date().toISOString() };
          // If task completed & is recurring, notify
          if (newStatus === 'DONE' && t.isRecurring) {
            toast.success(`Công việc lặp [${t.recurRule}]: Đã hoàn thành và tự động gia hạn chu kỳ kế tiếp!`);
          }
          return updated;
        }
        return t;
      });
      try {
        localStorage.setItem('topify_tasks_cache', JSON.stringify(updatedList));
      } catch {}
      return updatedList;
    });

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await api.patch('/tasks', {
        id: taskId,
        status: newStatus,
      });
    } catch (err) {
      console.warn('Backend task status update warning:', err);
    }
  };

  // Toggle Subtask in Modal
  const handleToggleSubtask = async (taskId: string, subId: string) => {
    let updatedSubs: any[] = [];
    setTasks((prev) => {
      const updatedList = prev.map((t) => {
        if (t.id === taskId) {
          updatedSubs = t.subtasks.map((st) =>
            st.id === subId ? { ...st, isCompleted: !st.isCompleted } : st
          );
          return { ...t, subtasks: updatedSubs };
        }
        return t;
      });
      try {
        localStorage.setItem('topify_tasks_cache', JSON.stringify(updatedList));
      } catch {}
      return updatedList;
    });

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          subtasks: prev.subtasks.map((st) =>
            st.id === subId ? { ...st, isCompleted: !st.isCompleted } : st
          ),
        };
      });
    }

    try {
      await api.patch('/tasks', {
        id: taskId,
        subtasks: updatedSubs,
      });
    } catch (err) {
      console.warn('Backend subtask update warning:', err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string, taskTitle?: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa công việc "${taskTitle || 'này'}"?`)) return;

    setTasks((prev) => {
      const filtered = prev.filter((t) => t.id !== taskId);
      try {
        localStorage.setItem('topify_tasks_cache', JSON.stringify(filtered));
      } catch {}
      return filtered;
    });

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(null);
    }

    try {
      await api.delete(`/tasks?id=${taskId}`);
      toast.success('Đã xóa công việc thành công!');
    } catch (err) {
      toast.success('Đã xóa công việc khỏi danh sách!');
    }
  };

  // Load comments from API when selectedTask opens
  useEffect(() => {
    if (selectedTask?.id) {
      api.get(`/tasks/comments?taskId=${selectedTask.id}`)
        .then((res) => {
          if (res.data?.comments) {
            setCommentsMap((prev) => ({
              ...prev,
              [selectedTask.id]: res.data.comments,
            }));
          }
        })
        .catch(() => {});
    }
  }, [selectedTask?.id]);

  // Add Comment with mentions & attachments (F128)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newCommentText.trim()) return;

    // Detect mentions like @Name
    const detectedMentions: string[] = [];
    teamMembers.forEach((m) => {
      if (newCommentText.includes(`@${m.name}`) || newCommentText.includes(`@${m.email}`)) {
        detectedMentions.push(m.email);
      }
    });

    const commentPayload = {
      taskId: selectedTask.id,
      content: newCommentText.trim(),
      authorName: 'Bạn (Quản trị)',
      mentions: detectedMentions,
      attachments: mockAttachmentName.trim()
        ? [
            {
              id: `att_${Date.now()}`,
              name: mockAttachmentName.trim(),
              size: 2500000,
              url: '#',
              type: mockAttachmentName.endsWith('.mp4') ? 'video/mp4' : 'application/pdf',
              uploadedAt: new Date().toISOString(),
            },
          ]
        : [],
    };

    try {
      const res = await api.post('/tasks/comments', commentPayload);
      const savedComment: TaskCommentItem = res.data?.comment || {
        id: `comm_${Date.now()}`,
        authorId: 'user_current',
        authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        ...commentPayload,
        createdAt: new Date().toISOString(),
      };

      setCommentsMap((prev) => ({
        ...prev,
        [selectedTask.id]: [...(prev[selectedTask.id] || []), savedComment],
      }));

      // Update comments count on task
      setTasks((prev) => {
        const updatedList = prev.map((t) =>
          t.id === selectedTask.id
            ? {
                ...t,
                commentsCount: (t.commentsCount || 0) + 1,
                attachmentsCount: (t.attachmentsCount || 0) + (mockAttachmentName.trim() ? 1 : 0),
              }
            : t
        );
        try {
          localStorage.setItem('topify_tasks_cache', JSON.stringify(updatedList));
        } catch {}
        return updatedList;
      });

      setNewCommentText('');
      setMockAttachmentName('');
      toast.success('Đã gửi phản hồi thành công!');
    } catch {
      toast.error('Lỗi khi gửi phản hồi');
    }
  };

  // 1-Click Apply Template
  const handleApplyTemplate = async (tpl: TaskTemplate) => {
    const due = new Date();
    due.setDate(due.getDate() + tpl.estimatedDays);

    const localTask: EnrichedTask = {
      id: `task_${Date.now()}`,
      title: `${tpl.name}`,
      description: tpl.description,
      priority: 'HIGH',
      status: 'TODO',
      dueDate: due.toISOString(),
      assigneeId: teamMembers[0]?.id || 'user_1',
      assignee: teamMembers[0] || null,
      collaboratorIds: teamMembers[1] ? [teamMembers[1].id] : [],
      collaborators: teamMembers[1] ? [teamMembers[1]] : [],
      isRecurring: false,
      recurRule: null,
      subtasks: tpl.steps.map((st, i) => ({
        id: `sub_${Date.now()}_${i}`,
        title: st.title,
        isCompleted: false,
        assigneeName: st.defaultRole,
      })),
      commentsCount: 0,
      attachmentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextTasks = [localTask, ...tasks];
    setTasks(nextTasks);
    try {
      localStorage.setItem('topify_tasks_cache', JSON.stringify(nextTasks));
    } catch {}

    setActiveTab('board');
    setSelectedTask(localTask);

    try {
      const res = await api.post('/tasks', {
        title: localTask.title,
        description: localTask.description,
        priority: localTask.priority,
        status: localTask.status,
        dueDate: localTask.dueDate,
        assigneeId: localTask.assigneeId,
        assigneeName: localTask.assignee?.name,
        assigneeEmail: localTask.assignee?.email,
        collaboratorIds: localTask.collaboratorIds,
        isRecurring: false,
        subtasks: localTask.subtasks,
        templateId: tpl.id,
      });

      if (res.data?.success && res.data?.task) {
        const serverTask: EnrichedTask = res.data.task;
        setTasks((prev) => {
          const updated = prev.map((t) => (t.id === localTask.id ? serverTask : t));
          try {
            localStorage.setItem('topify_tasks_cache', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
      toast.success(`Đã áp dụng mẫu quy trình [${tpl.name}] thành công với ${tpl.steps.length} bước!`);
    } catch (err) {
      toast.success(`Đã áp dụng mẫu quy trình [${tpl.name}] thành công!`);
    }
  };

  // Create New Custom Template (F130)
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName.trim()) {
      toast.error('Vui lòng nhập tên mẫu quy trình');
      return;
    }

    const validSteps = tplSteps.filter((s) => s.title.trim().length > 0);
    if (validSteps.length === 0) {
      toast.error('Quy trình phải có ít nhất 1 bước thực hiện');
      return;
    }

    const newTemplate: TaskTemplate = {
      id: `tpl_custom_${Date.now()}`,
      name: tplName.trim(),
      category: tplCategory,
      description: tplDescription.trim() || 'Mẫu quy trình làm việc do người dùng tùy biến thiết lập.',
      estimatedDays: Number(tplEstimatedDays) > 0 ? Number(tplEstimatedDays) : 1,
      icon:
        tplCategory === 'CONTENT'
          ? 'Film'
          : tplCategory === 'CSKH'
          ? 'MessageSquare'
          : tplCategory === 'CAMPAIGN'
          ? 'Rocket'
          : tplCategory === 'ONBOARDING'
          ? 'UserCheck'
          : 'Sparkles',
      steps: validSteps,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    const nextTemplates = [newTemplate, ...templates];
    setTemplates(nextTemplates);
    try {
      localStorage.setItem('topify_task_templates_cache', JSON.stringify(nextTemplates));
    } catch {}

    setIsCreateTemplateModalOpen(false);
    // Reset form
    setTplName('');
    setTplCategory('CUSTOM');
    setTplDescription('');
    setTplEstimatedDays(3);
    setTplSteps([
      { title: 'Nghiên cứu & Lập kế hoạch chi tiết', defaultRole: 'Trưởng nhóm', relativeDueDays: 1 },
      { title: 'Triển khai công việc & Chuẩn bị tài nguyên', defaultRole: 'Thành viên thực hiện', relativeDueDays: 2 },
      { title: 'Kiểm duyệt chất lượng & Nghiệm thu', defaultRole: 'Quản lý dự án', relativeDueDays: 3 },
    ]);

    try {
      const res = await api.post('/tasks/templates', {
        name: newTemplate.name,
        category: newTemplate.category,
        description: newTemplate.description,
        estimatedDays: newTemplate.estimatedDays,
        icon: newTemplate.icon,
        steps: newTemplate.steps,
      });
      if (res.data?.success && res.data?.template) {
        const serverTpl: TaskTemplate = res.data.template;
        setTemplates((prev) => {
          const updated = prev.map((t) => (t.id === newTemplate.id ? serverTpl : t));
          try {
            localStorage.setItem('topify_task_templates_cache', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
      toast.success(`Đã tạo mẫu quy trình "${newTemplate.name}" thành công!`);
    } catch (err) {
      toast.success(`Đã tạo mẫu quy trình "${newTemplate.name}" thành công!`);
    }
  };

  // Delete Custom Template (F130)
  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu quy trình "${templateName}"?`)) {
      return;
    }

    const nextTemplates = templates.filter((t) => t.id !== templateId);
    setTemplates(nextTemplates);
    try {
      localStorage.setItem('topify_task_templates_cache', JSON.stringify(nextTemplates));
    } catch {}

    try {
      await api.delete(`/tasks/templates?id=${templateId}`);
      toast.success(`Đã xóa mẫu quy trình "${templateName}"!`);
    } catch (err) {
      toast.success(`Đã xóa mẫu quy trình "${templateName}"!`);
    }
  };

  // Submit Create Task Form
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề công việc');
      return;
    }

    const assignee = teamMembers.find((m) => m.id === newAssigneeId) || null;
    const collaborators = teamMembers.filter((m) => newCollaboratorIds.includes(m.id));

    // Handle template subtasks if selected
    let subtasksList: Array<{ id: string; title: string; isCompleted: boolean; assigneeName?: string }> = [];
    if (newSelectedTemplateId) {
      const tpl = templates.find((t) => t.id === newSelectedTemplateId);
      if (tpl) {
        subtasksList = tpl.steps.map((st, i) => ({
          id: `sub_${Date.now()}_${i}`,
          title: st.title,
          isCompleted: false,
          assigneeName: st.defaultRole,
        }));
      }
    } else {
      subtasksList = newSubtaskInputs
        .filter((s) => s.trim().length > 0)
        .map((s, i) => ({
          id: `sub_${Date.now()}_${i}`,
          title: s.trim(),
          isCompleted: false,
        }));
    }

    const localTask: EnrichedTask = {
      id: `task_${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      priority: newPriority,
      status: 'TODO',
      dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
      assigneeId: newAssigneeId,
      assignee,
      collaboratorIds: newCollaboratorIds,
      collaborators,
      isRecurring: newIsRecurring,
      recurRule: newIsRecurring ? newRecurRule : null,
      subtasks: subtasksList,
      commentsCount: 0,
      attachmentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update state & local cache immediately
    const nextTasks = [localTask, ...tasks];
    setTasks(nextTasks);
    try {
      localStorage.setItem('topify_tasks_cache', JSON.stringify(nextTasks));
    } catch {}

    setIsCreateModalOpen(false);

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewDueDate('');
    setNewSubtaskInputs(['']);
    setNewCollaboratorIds([]);
    setNewIsRecurring(false);
    setNewSelectedTemplateId('');

    // Persist to backend API & DB
    try {
      const res = await api.post('/tasks', {
        title: localTask.title,
        description: localTask.description,
        priority: localTask.priority,
        status: localTask.status,
        dueDate: localTask.dueDate,
        assigneeId: localTask.assigneeId,
        assigneeName: assignee?.name,
        assigneeEmail: assignee?.email,
        collaboratorIds: localTask.collaboratorIds,
        isRecurring: localTask.isRecurring,
        recurRule: localTask.recurRule,
        subtasks: localTask.subtasks,
      });

      if (res.data?.success && res.data?.task) {
        const serverTask: EnrichedTask = res.data.task;
        setTasks((prev) => {
          const updated = prev.map((t) => (t.id === localTask.id ? serverTask : t));
          try {
            localStorage.setItem('topify_tasks_cache', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
      toast.success('Đã tạo công việc mới thành công!');
    } catch (err) {
      console.warn('Backend task create warning, saved to local cache:', err);
      toast.success('Đã tạo công việc mới thành công!');
    }
  };

  // Helper render priority badge
  const renderPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">Khẩn cấp</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">Ưu tiên cao</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">Trung bình</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">Thấp</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              Quản lý Công việc & Phối hợp (Work & Task)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Phân hệ M9
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Giao việc theo vai trò chính và phối hợp, trao đổi tệp đính kèm, lập lịch định kỳ và tối ưu năng suất đội ngũ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-95 font-medium text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo việc mới</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-[var(--color-border)] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 shrink-0">
          <button
            onClick={() => setActiveTab('board')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'board'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Bảng công việc (Tasks & Kanban)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-[var(--color-muted)] text-[var(--color-foreground)] whitespace-nowrap">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'templates'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Thư viện Mẫu quy trình (F130)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-purple-500/10 text-purple-400 whitespace-nowrap">
              {templates.length} mẫu
            </span>
          </button>

          <button
            onClick={() => setActiveTab('productivity')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'productivity'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Năng suất & Khối lượng (F131)</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: BOARD & KANBAN (F124, F128, F129) */}
      {/* ==================================================================== */}
      {activeTab === 'board' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Tìm công việc, nội dung..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Member filter */}
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
                <select
                  value={filterMember}
                  onChange={(e) => setFilterMember(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none"
                >
                  <option value="ALL">Tất cả thành viên</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none"
              >
                <option value="ALL">Mọi mức ưu tiên</option>
                <option value="URGENT">Khẩn cấp (Urgent)</option>
                <option value="HIGH">Ưu tiên cao (High)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="LOW">Thấp (Low)</option>
              </select>

              {/* Overdue filter */}
              <button
                onClick={() => setOnlyOverdue(!onlyOverdue)}
                className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                  onlyOverdue
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 font-semibold'
                    : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Chỉ việc trễ hạn</span>
              </button>

              <div className="h-5 w-[1px] bg-[var(--color-border)] mx-1 hidden sm:block" />

              {/* View Mode Switcher (Kanban / Danh sách) */}
              <div className="flex items-center p-0.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                    viewMode === 'kanban'
                      ? 'bg-[var(--color-primary)] text-white font-semibold shadow-xs'
                      : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                  }`}
                  title="Kanban Board"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kanban</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                    viewMode === 'list'
                      ? 'bg-[var(--color-primary)] text-white font-semibold shadow-xs'
                      : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                  }`}
                  title="Danh sách bảng"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Danh sách</span>
                </button>
              </div>
            </div>
          </div>

          {/* Kanban Board View */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {columns.map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col.id);
                return (
                  <div
                    key={col.id}
                    className="flex flex-col rounded-2xl bg-[var(--color-card)]/50 border border-[var(--color-border)] p-3 min-h-[520px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.bg.replace('/10', '')}`} />
                        <span className="font-semibold text-xs text-[var(--color-foreground)]">
                          {col.label}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${col.bg} ${col.color}`}>
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Task Cards */}
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                      {colTasks.map((task) => {
                        const isOverdue =
                          task.status !== 'DONE' &&
                          task.dueDate &&
                          new Date(task.dueDate).getTime() < Date.now();

                        const completedSubs = task.subtasks.filter((s) => s.isCompleted).length;

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-md cursor-pointer transition-all space-y-2.5 group relative"
                          >
                            {/* Priority & Recurring badge */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {renderPriorityBadge(task.priority)}
                                {task.isRecurring && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                                    <Repeat className="w-2.5 h-2.5" />
                                    <span>{task.recurRule}</span>
                                  </span>
                                )}
                              </div>

                              {isOverdue && (
                                <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>Trễ hạn</span>
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-semibold text-[var(--color-foreground)] line-clamp-2 leading-relaxed group-hover:text-[var(--color-primary)]">
                              {task.title}
                            </h4>

                            {/* Subtask checklist progress */}
                            {task.subtasks.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-[var(--color-muted-foreground)]">
                                  <span className="flex items-center gap-1">
                                    <CheckSquare className="w-2.5 h-2.5 text-[var(--color-primary)]" />
                                    <span>Checklist</span>
                                  </span>
                                  <span className="font-semibold">
                                    {completedSubs}/{task.subtasks.length}
                                  </span>
                                </div>
                                <div className="w-full h-1 bg-[var(--color-muted)] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                                    style={{
                                      width: `${(completedSubs / task.subtasks.length) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Due date */}
                            {task.dueDate && (
                              <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted-foreground)]">
                                <Calendar className="w-3 h-3 text-[var(--color-muted-foreground)]" />
                                <span>
                                  {new Date(task.dueDate).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            )}

                            {/* Assignee & Collaborators Footer */}
                            <div className="pt-2 border-t border-[var(--color-border)]/60 flex items-center justify-between">
                              {/* Assignee & Collaborator avatars */}
                              <div className="flex items-center -space-x-1.5">
                                {task.assignee && (
                                  <div
                                    className="w-6 h-6 rounded-full border-2 border-[var(--color-card)] overflow-hidden bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold"
                                    title={`Chủ trì: ${task.assignee.name || task.assignee.email}`}
                                  >
                                    {task.assignee.image ? (
                                      <img src={task.assignee.image} alt="assignee" className="w-full h-full object-cover" />
                                    ) : (
                                      (task.assignee.name || 'A')[0]
                                    )}
                                  </div>
                                )}
                                {task.collaborators.map((c) => (
                                  <div
                                    key={c.id}
                                    className="w-6 h-6 rounded-full border-2 border-[var(--color-card)] overflow-hidden bg-slate-600 text-white text-[9px] flex items-center justify-center font-bold"
                                    title={`Phối hợp: ${c.name}`}
                                  >
                                    {c.avatar ? (
                                      <img src={c.avatar} alt="collab" className="w-full h-full object-cover" />
                                    ) : (
                                      c.name[0]
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Stats: comments & attachments */}
                              <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted-foreground)]">
                                {task.commentsCount > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <MessageSquare className="w-3 h-3" />
                                    <span>{task.commentsCount}</span>
                                  </span>
                                )}
                                {task.attachmentsCount > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <Paperclip className="w-3 h-3" />
                                    <span>{task.attachmentsCount}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quick status transition dropdown on hover & delete action */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="pt-1 flex items-center justify-between gap-1"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id, task.title);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Xóa công việc"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                                className="text-[10px] py-0.5 px-1.5 rounded border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none"
                              >
                                <option value="TODO">Cần làm</option>
                                <option value="IN_PROGRESS">Đang làm</option>
                                <option value="REVIEW">Chờ duyệt</option>
                                <option value="DONE">Hoàn thành</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}

                      {colTasks.length === 0 && (
                        <div className="h-28 flex items-center justify-center text-[11px] text-[var(--color-muted-foreground)] italic border border-dashed border-[var(--color-border)] rounded-xl">
                          Chưa có công việc
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List Table View */}
          {viewMode === 'list' && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] font-semibold border-b border-[var(--color-border)]">
                  <tr>
                    <th className="py-3 px-4">Tên công việc</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    <th className="py-3 px-3">Mức ưu tiên</th>
                    <th className="py-3 px-3">Chủ trì (Assignee)</th>
                    <th className="py-3 px-3">Phối hợp (Collaborators)</th>
                    <th className="py-3 px-3">Hạn chót</th>
                    <th className="py-3 px-3">Lặp định kỳ</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredTasks.map((task) => {
                    const isOverdue =
                      task.status !== 'DONE' &&
                      task.dueDate &&
                      new Date(task.dueDate).getTime() < Date.now();

                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="hover:bg-[var(--color-muted)]/30 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[var(--color-foreground)]">{task.title}</div>
                          {task.subtasks.length > 0 && (
                            <div className="text-[10px] text-[var(--color-muted-foreground)] flex items-center gap-1 mt-0.5">
                              <CheckSquare className="w-2.5 h-2.5 text-[var(--color-primary)]" />
                              <span>
                                {task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length} checklist
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              task.status === 'DONE'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-blue-500/10 text-blue-500'
                                : task.status === 'REVIEW'
                                ? 'bg-purple-500/10 text-purple-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {task.status === 'DONE'
                              ? 'Hoàn thành'
                              : task.status === 'IN_PROGRESS'
                              ? 'Đang làm'
                              : task.status === 'REVIEW'
                              ? 'Chờ duyệt'
                              : 'Cần làm'}
                          </span>
                        </td>
                        <td className="py-3 px-3">{renderPriorityBadge(task.priority)}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[9px]">
                              {(task.assignee?.name || 'A')[0]}
                            </div>
                            <span className="font-medium text-[var(--color-foreground)]">
                              {task.assignee?.name || 'Chưa gán'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center -space-x-1">
                            {task.collaborators.length > 0 ? (
                              task.collaborators.map((c) => (
                                <div
                                  key={c.id}
                                  className="w-5 h-5 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-[9px] border border-[var(--color-card)]"
                                  title={c.name}
                                >
                                  {c.name[0]}
                                </div>
                              ))
                            ) : (
                              <span className="text-[11px] text-[var(--color-muted-foreground)]">Không có</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {task.dueDate ? (
                            <span className={`text-[11px] ${isOverdue ? 'text-rose-500 font-bold' : 'text-[var(--color-muted-foreground)]'}`}>
                              {new Date(task.dueDate).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--color-muted-foreground)]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {task.isRecurring ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400">
                              {task.recurRule}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--color-muted-foreground)]">Không</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[11px] font-medium"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: TASK TEMPLATES (F130) */}
      {/* ==================================================================== */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[var(--color-foreground)]">
                Thư viện Mẫu quy trình chuẩn hóa (Task Templates)
              </h3>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                Các quy trình phối hợp liên phòng ban chuẩn mực, 1-click kích hoạt ngay công việc cha và danh mục checklist phân vai.
              </p>
            </div>
            <button
              onClick={() => setIsCreateTemplateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-95 font-medium text-xs shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo mẫu quy trình mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold shrink-0">
                        {tpl.category === 'CONTENT' && <Film className="w-5 h-5" />}
                        {tpl.category === 'CSKH' && <MessageSquare className="w-5 h-5" />}
                        {tpl.category === 'CAMPAIGN' && <Rocket className="w-5 h-5" />}
                        {tpl.category === 'ONBOARDING' && <UserCheck className="w-5 h-5" />}
                        {tpl.category !== 'CONTENT' &&
                          tpl.category !== 'CSKH' &&
                          tpl.category !== 'CAMPAIGN' &&
                          tpl.category !== 'ONBOARDING' && <Sparkles className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[var(--color-foreground)]">
                            {tpl.name}
                          </h4>
                          {tpl.isCustom && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Tùy chỉnh
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--color-muted-foreground)] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>Dự kiến: {tpl.estimatedDays} ngày • {tpl.steps.length} bước quy trình</span>
                        </span>
                      </div>
                    </div>
                    {tpl.isCustom && (
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Xóa mẫu quy trình này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                    {tpl.description}
                  </p>

                  {/* Steps preview */}
                  <div className="space-y-1.5 pt-2 border-t border-[var(--color-border)]">
                    <span className="text-[11px] font-semibold text-[var(--color-foreground)]">
                      Các bước quy trình chuẩn:
                    </span>
                    <div className="space-y-1 pl-2">
                      {tpl.steps.map((st, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <span className="text-[var(--color-foreground)] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                            <span>{st.title}</span>
                          </span>
                          <span className="text-[10px] text-[var(--color-muted-foreground)] bg-[var(--color-muted)] px-1.5 py-0.5 rounded">
                            {st.defaultRole}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-end">
                  <button
                    onClick={() => handleApplyTemplate(tpl)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-95 text-xs font-semibold shadow-sm transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Áp dụng quy trình (1-Click)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: WORKLOAD & PRODUCTIVITY (F131) */}
      {/* ==================================================================== */}
      {activeTab === 'productivity' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-1">
              <span className="text-xs text-[var(--color-muted-foreground)]">Tổng khối lượng việc</span>
              <div className="text-2xl font-bold text-[var(--color-foreground)]">{tasks.length}</div>
              <span className="text-[11px] text-blue-400">Toàn bộ phòng ban đang chạy</span>
            </div>

            {(() => {
              const totalCompleted = tasks.filter((t) => t.status === 'DONE').length;
              const now = Date.now();
              const totalOverdue = tasks.filter(
                (t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate).getTime() < now
              ).length;
              const overallOnTimeRate =
                totalCompleted > 0
                  ? Math.round((totalCompleted / (totalCompleted + totalOverdue)) * 100)
                  : 0;

              let statusText = 'Đang trong hạn thực hiện';
              let statusColor = 'text-blue-400';
              let rateColor = 'text-slate-400';

              if (tasks.length === 0) {
                statusText = 'Chưa có công việc';
                statusColor = 'text-[var(--color-muted-foreground)]';
                rateColor = 'text-[var(--color-muted-foreground)]';
              } else if (totalCompleted === 0) {
                if (totalOverdue > 0) {
                  statusText = `${totalOverdue} việc trễ hạn`;
                  statusColor = 'text-rose-500';
                  rateColor = 'text-rose-500';
                } else {
                  statusText = 'Đang trong tiến độ xử lý';
                  statusColor = 'text-blue-400';
                  rateColor = 'text-blue-400';
                }
              } else {
                if (overallOnTimeRate >= 80) {
                  statusText = 'Duy trì hiệu suất cao';
                  statusColor = 'text-emerald-500';
                  rateColor = 'text-emerald-500';
                } else if (overallOnTimeRate >= 50) {
                  statusText = 'Cần chú ý tiến độ';
                  statusColor = 'text-amber-500';
                  rateColor = 'text-amber-500';
                } else {
                  statusText = 'Cảnh báo trễ hạn cao';
                  statusColor = 'text-rose-500';
                  rateColor = 'text-rose-500';
                }
              }

              return (
                <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-1">
                  <span className="text-xs text-[var(--color-muted-foreground)]">Tỷ lệ đúng hạn (On-time Rate)</span>
                  <div className={`text-2xl font-bold ${rateColor}`}>{overallOnTimeRate}%</div>
                  <span className={`text-[11px] ${statusColor}`}>{statusText}</span>
                </div>
              );
            })()}

            <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-1">
              <span className="text-xs text-[var(--color-muted-foreground)]">Đã hoàn tất (Completion)</span>
              <div className="text-2xl font-bold text-indigo-400">
                {tasks.filter((t) => t.status === 'DONE').length} / {tasks.length}
              </div>
              <span className="text-[11px] text-emerald-400">
                {Math.round((tasks.filter((t) => t.status === 'DONE').length / (tasks.length || 1)) * 100)}% tổng số việc
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-1">
              <span className="text-xs text-[var(--color-muted-foreground)]">Cảnh báo nhân sự Quá tải</span>
              <div className="text-2xl font-bold text-rose-500">
                {productivityMetrics.filter((m) => m.isOverloaded).length} thành viên
              </div>
              <span className="text-[11px] text-rose-400">Cần tái phân bổ công việc</span>
            </div>
          </div>

          {/* Member Productivity Table */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-bold text-[var(--color-foreground)]">
                Bảng theo dõi Khối lượng việc & Năng suất từng thành viên
              </h3>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                Đo lường tự động dựa trên khối lượng việc đang nhận, số việc hoàn thành, tỷ lệ đúng hạn và cờ cảnh báo quá tải.
              </p>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] font-semibold border-b border-[var(--color-border)]">
                <tr>
                  <th className="py-3 px-4">Thành viên</th>
                  <th className="py-3 px-3">Vai trò</th>
                  <th className="py-3 px-3 text-center">Đang phụ trách</th>
                  <th className="py-3 px-3 text-center">Đã xong</th>
                  <th className="py-3 px-3 text-center">Trễ hạn</th>
                  <th className="py-3 px-3">Tỷ lệ đúng hạn</th>
                  <th className="py-3 px-3">Điểm năng suất</th>
                  <th className="py-3 px-4">Trạng thái khối lượng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {productivityMetrics.map((member) => (
                  <tr key={member.userId} className="hover:bg-[var(--color-muted)]/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-500 text-white flex items-center justify-center font-bold">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            member.name[0]
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--color-foreground)]">{member.name}</div>
                          <div className="text-[11px] text-[var(--color-muted-foreground)]">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[var(--color-muted-foreground)] font-medium">
                      {member.role}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-blue-400">
                      {member.activeCount}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-500">
                      {member.completedCount}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-rose-500">
                      {member.overdueCount}
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span
                            className={
                              member.totalAssigned === 0
                                ? 'text-[var(--color-muted-foreground)]'
                                : member.onTimeRate >= 80
                                ? 'text-emerald-500'
                                : member.onTimeRate >= 50
                                ? 'text-amber-500'
                                : member.completedCount === 0
                                ? 'text-[var(--color-muted-foreground)]'
                                : 'text-rose-500'
                            }
                          >
                            {member.onTimeRate}%
                          </span>
                          {member.totalAssigned > 0 && member.completedCount === 0 && (
                            <span className="text-[10px] text-[var(--color-muted-foreground)] font-normal">
                              (Chưa xong)
                            </span>
                          )}
                        </div>
                        <div className="w-24 h-1.5 bg-[var(--color-muted)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              member.onTimeRate >= 80
                                ? 'bg-emerald-500'
                                : member.onTimeRate >= 60
                                ? 'bg-amber-500'
                                : member.onTimeRate > 0
                                ? 'bg-rose-500'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${member.onTimeRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold text-sm ${
                            member.totalAssigned === 0
                              ? 'text-[var(--color-muted-foreground)]'
                              : member.productivityScore >= 70
                              ? 'text-emerald-500'
                              : member.productivityScore >= 40
                              ? 'text-blue-400'
                              : 'text-amber-500'
                          }`}
                        >
                          {member.productivityScore}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted-foreground)]">/100</span>
                        {member.totalAssigned === 0 && (
                          <span className="text-[9px] text-[var(--color-muted-foreground)] bg-[var(--color-muted)] px-1.5 py-0.5 rounded">
                            Chưa giao việc
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {member.isOverloaded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Quá tải (Overloaded)</span>
                        </span>
                      ) : member.activeCount >= 3 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <span>Bận rộn</span>
                        </span>
                      ) : member.totalAssigned === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          <span>Chưa nhận việc</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Bình thường</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TASK DETAIL & COLLABORATION MODAL (F124, F128, F129) */}
      {/* ==================================================================== */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-muted)]/20">
              <div className="flex items-center gap-2">
                {renderPriorityBadge(selectedTask.priority)}
                {selectedTask.isRecurring && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    <span>Lặp: {selectedTask.recurRule}</span>
                  </span>
                )}
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleStatusChange(selectedTask.id, e.target.value as TaskStatus)}
                  className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none"
                >
                  <option value="TODO">Cần làm</option>
                  <option value="IN_PROGRESS">Đang thực hiện</option>
                  <option value="REVIEW">Chờ duyệt</option>
                  <option value="DONE">Hoàn thành</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEditTaskModal(selectedTask)}
                  className="p-1.5 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Chỉnh sửa công việc này"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTask(selectedTask.id, selectedTask.title)}
                  className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Xóa công việc này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-[var(--color-foreground)]">
                  {selectedTask.title}
                </h2>
                {selectedTask.description && (
                  <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                    {selectedTask.description}
                  </p>
                )}
              </div>

              {/* Members Metadata (F124) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)]">
                <div>
                  <span className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                    Người phụ trách chính (Assignee)
                  </span>
                  <div className="flex items-center gap-2.5 mt-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                      {(selectedTask.assignee?.name || 'A')[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--color-foreground)]">
                        {selectedTask.assignee?.name || 'Chưa phân công'}
                      </div>
                      <div className="text-[10px] text-[var(--color-muted-foreground)]">
                        {selectedTask.assignee?.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                    Người phối hợp (Collaborators)
                  </span>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {selectedTask.collaborators.length > 0 ? (
                      selectedTask.collaborators.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]"
                        >
                          <div className="w-4 h-4 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-[8px]">
                            {c.name[0]}
                          </div>
                          <span className="font-medium text-[var(--color-foreground)]">{c.name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[11px] text-[var(--color-muted-foreground)] italic mt-1 block">
                        Chưa có người phối hợp
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Checklist Subtasks */}
              {selectedTask.subtasks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--color-foreground)] flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-[var(--color-primary)]" />
                      <span>Các bước quy trình (Checklist)</span>
                    </span>
                    <span className="text-[11px] text-[var(--color-muted-foreground)] font-semibold">
                      {selectedTask.subtasks.filter((s) => s.isCompleted).length} / {selectedTask.subtasks.length} hoàn thành
                    </span>
                  </div>

                  <div className="space-y-2 border border-[var(--color-border)] rounded-xl p-3 bg-[var(--color-card)]">
                    {selectedTask.subtasks.map((st) => (
                      <label
                        key={st.id}
                        className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-[var(--color-muted)]/40 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={st.isCompleted}
                          onChange={() => handleToggleSubtask(selectedTask.id, st.id)}
                          className="mt-0.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-0"
                        />
                        <div className="flex-1">
                          <span className={`text-xs ${st.isCompleted ? 'line-through text-[var(--color-muted-foreground)]' : 'text-[var(--color-foreground)] font-medium'}`}>
                            {st.title}
                          </span>
                          {st.assigneeName && (
                            <span className="ml-2 text-[10px] bg-[var(--color-muted)] text-[var(--color-muted-foreground)] px-1.5 py-0.2 rounded">
                              {st.assigneeName}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments & Discussion (F128) */}
              <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--color-foreground)] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>Trao đổi & Tệp đính kèm (F128)</span>
                  </span>
                  <span className="text-[11px] text-[var(--color-muted-foreground)]">
                    {(commentsMap[selectedTask.id] || []).length} bình luận
                  </span>
                </div>

                {/* Comment list */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {(commentsMap[selectedTask.id] || []).map((comm) => (
                    <div key={comm.id} className="p-3 rounded-xl bg-[var(--color-muted)]/20 border border-[var(--color-border)] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px]">
                            {comm.authorAvatar ? (
                              <img src={comm.authorAvatar} alt="author" className="w-full h-full object-cover" />
                            ) : (
                              comm.authorName[0]
                            )}
                          </div>
                          <span className="font-semibold text-[var(--color-foreground)] text-xs">
                            {comm.authorName}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--color-muted-foreground)]">
                          {new Date(comm.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Content with mention styling */}
                      <p className="text-xs text-[var(--color-foreground)] leading-relaxed pl-8">
                        {comm.content.split(' ').map((word, i) => {
                          if (word.startsWith('@')) {
                            return (
                              <span key={i} className="font-bold text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded mr-1">
                                {word}{' '}
                              </span>
                            );
                          }
                          return word + ' ';
                        })}
                      </p>

                      {/* Attachments */}
                      {comm.attachments && comm.attachments.length > 0 && (
                        <div className="pl-8 flex items-center gap-2 flex-wrap">
                          {comm.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-[11px] text-[var(--color-foreground)] transition-colors"
                            >
                              <Paperclip className="w-3 h-3 text-[var(--color-primary)]" />
                              <span className="font-medium underline">{att.name}</span>
                              <span className="text-[9px] text-[var(--color-muted-foreground)]">
                                ({Math.round(att.size / 1024 / 1024 * 10) / 10} MB)
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {(!commentsMap[selectedTask.id] || commentsMap[selectedTask.id].length === 0) && (
                    <div className="text-center py-6 text-xs text-[var(--color-muted-foreground)] italic">
                      Chưa có trao đổi nào. Hãy là người đầu tiên để lại ghi chú!
                    </div>
                  )}
                </div>

                {/* Comment Input Box */}
                <form onSubmit={handleAddComment} className="space-y-2 pt-2">
                  <div className="relative">
                    <textarea
                      rows={2}
                      placeholder="Viết phản hồi... Gõ @ để nhắc tên đồng đội..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-foreground)] resize-none"
                    />
                  </div>

                  {/* Mention quick buttons & Attachment input */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[var(--color-muted-foreground)] flex items-center gap-1">
                        <AtSign className="w-3 h-3" />
                        <span>Tag nhanh:</span>
                      </span>
                      {teamMembers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setNewCommentText((prev) => `${prev} @${m.name} `)}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--color-muted)] hover:bg-indigo-500/10 hover:text-indigo-400 text-[var(--color-muted-foreground)] transition-colors"
                        >
                          @{m.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Tên tệp đính kèm (vd: banner.png)"
                        value={mockAttachmentName}
                        onChange={(e) => setMockAttachmentName(e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[10px] w-48 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-95 text-xs font-semibold shadow-sm transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-end bg-[var(--color-muted)]/20">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-xs font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CREATE NEW TASK MODAL */}
      {/* ==================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--color-foreground)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Tạo công việc mới</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-foreground)]">
                  Tiêu đề công việc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sản xuất video review sản phẩm TikTok"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-foreground)] text-xs"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-foreground)]">Mô tả chi tiết</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú yêu cầu chất lượng, đường dẫn tài liệu..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-foreground)] text-xs resize-none"
                />
              </div>

              {/* Priority & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">Mức độ ưu tiên</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                  >
                    <option value="LOW">Thấp (Low)</option>
                    <option value="MEDIUM">Trung bình (Medium)</option>
                    <option value="HIGH">Ưu tiên cao (High)</option>
                    <option value="URGENT">Khẩn cấp (Urgent)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">Hạn hoàn thành (Due Date)</label>
                  <input
                    type="datetime-local"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Assignee & Collaborators (F124) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)] flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Người phụ trách chính (Assignee)</span>
                  </label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Người phối hợp (Collaborators)</span>
                  </label>
                  <div className="space-y-1 p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] max-h-24 overflow-y-auto">
                    {teamMembers.map((m) => (
                      <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--color-muted)]/30 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={newCollaboratorIds.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewCollaboratorIds([...newCollaboratorIds, m.id]);
                            } else {
                              setNewCollaboratorIds(newCollaboratorIds.filter((id) => id !== m.id));
                            }
                          }}
                          className="rounded border-[var(--color-border)] text-[var(--color-primary)]"
                        />
                        <span className="text-[11px] text-[var(--color-foreground)]">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recurring Task Option (F129) */}
              <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsRecurring}
                    onChange={(e) => setNewIsRecurring(e.target.checked)}
                    className="rounded border-[var(--color-border)] text-indigo-500 focus:ring-0"
                  />
                  <span className="font-semibold text-[var(--color-foreground)] flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Lặp lại công việc tự động theo chu kỳ (F129)</span>
                  </span>
                </label>

                {newIsRecurring && (
                  <div className="pl-6 pt-1 flex items-center gap-2">
                    <span className="text-[11px] text-[var(--color-muted-foreground)]">Tần suất lặp:</span>
                    <select
                      value={newRecurRule}
                      onChange={(e) => setNewRecurRule(e.target.value as RecurFrequency)}
                      className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)]"
                    >
                      <option value="DAILY">Hàng ngày (Daily)</option>
                      <option value="WEEKLY">Hàng tuần (Weekly)</option>
                      <option value="BIWEEKLY">Mỗi 2 tuần (Bi-weekly)</option>
                      <option value="MONTHLY">Hàng tháng (Monthly)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Task Template Option (F130) */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-foreground)] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Áp dụng Mẫu quy trình chuẩn hóa (F130)</span>
                </label>
                <select
                  value={newSelectedTemplateId}
                  onChange={(e) => setNewSelectedTemplateId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                >
                  <option value="">-- Tự thiết lập checklist thủ công --</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.steps.length} bước){tpl.isCustom ? ' [Tùy chỉnh]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtask checklist if not template */}
              {!newSelectedTemplateId && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-[var(--color-foreground)] flex items-center justify-between">
                    <span>Danh sách Checklist việc nhỏ</span>
                    <button
                      type="button"
                      onClick={() => setNewSubtaskInputs([...newSubtaskInputs, ''])}
                      className="text-[11px] text-[var(--color-primary)] font-medium hover:underline"
                    >
                      + Thêm bước
                    </button>
                  </label>
                  <div className="space-y-1.5">
                    {newSubtaskInputs.map((sub, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Bước ${i + 1}...`}
                          value={sub}
                          onChange={(e) => {
                            const updated = [...newSubtaskInputs];
                            updated[i] = e.target.value;
                            setNewSubtaskInputs(updated);
                          }}
                          className="flex-1 p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs focus:outline-none"
                        />
                        {newSubtaskInputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewSubtaskInputs(newSubtaskInputs.filter((_, idx) => idx !== i))}
                            className="p-1 text-[var(--color-muted-foreground)] hover:text-rose-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-95 text-xs font-semibold shadow-sm"
                >
                  Tạo công việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* EDIT TASK MODAL */}
      {/* ==================================================================== */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--color-foreground)] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-500" />
                <span>Chỉnh sửa công việc: {editingTask.title}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-foreground)]">Tiêu đề công việc *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-foreground)] font-medium"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-foreground)]">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-foreground)] resize-none"
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">Độ ưu tiên</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] focus:outline-none"
                  >
                    <option value="LOW">🟢 Thấp (Low)</option>
                    <option value="MEDIUM">🟡 Trung bình (Medium)</option>
                    <option value="HIGH">🟠 Cao (High)</option>
                    <option value="URGENT">🔴 Khẩn cấp (Urgent)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">Trạng thái tiến độ</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] focus:outline-none"
                  >
                    <option value="TODO">Cần làm (TODO)</option>
                    <option value="IN_PROGRESS">Đang thực hiện (IN_PROGRESS)</option>
                    <option value="REVIEW">Chờ duyệt (REVIEW)</option>
                    <option value="DONE">Đã hoàn thành (DONE)</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Assignee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">Hạn hoàn thành (Deadline)</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">Người phụ trách chính</label>
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] focus:outline-none"
                  >
                    <option value="">Chưa phân công</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Collaborators */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-foreground)]">Người cùng phối hợp</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {teamMembers.map((m) => {
                    const isSelected = editCollaboratorIds.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => {
                          if (isSelected) {
                            setEditCollaboratorIds(editCollaboratorIds.filter((id) => id !== m.id));
                          } else {
                            setEditCollaboratorIds([...editCollaboratorIds, m.id]);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/20 text-indigo-500 font-semibold'
                            : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-[8px]">
                          {m.name[0]}
                        </div>
                        <span>{m.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-indigo-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recurring Task Options */}
              <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold text-xs text-[var(--color-foreground)]">Lặp lại chu kỳ công việc</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editIsRecurring}
                    onChange={(e) => setEditIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--color-border)] text-indigo-600"
                  />
                </div>
                {editIsRecurring && (
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-[11px] text-[var(--color-muted-foreground)]">Tần suất lặp:</span>
                    <select
                      value={editRecurRule}
                      onChange={(e) => setEditRecurRule(e.target.value as RecurFrequency)}
                      className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] focus:outline-none"
                    >
                      <option value="DAILY">Hàng ngày (Daily)</option>
                      <option value="WEEKLY">Hàng tuần (Weekly)</option>
                      <option value="BIWEEKLY">Mỗi 2 tuần (Bi-weekly)</option>
                      <option value="MONTHLY">Hàng tháng (Monthly)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Cập nhật công việc</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREATE TASK TEMPLATE (F130) */}
      {/* ==================================================================== */}
      {isCreateTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-foreground)]">
                    Tạo Mẫu Quy Trình Mới (F130)
                  </h3>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    Định nghĩa quy trình chuẩn hóa gồm các bước checklist phân vai và thời gian hoàn thành
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTemplateModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateTemplate} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Template Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">
                    Tên mẫu quy trình <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Quy trình Livestream Bán hàng Đa kênh"
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-foreground)] text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">Phân loại</label>
                  <select
                    value={tplCategory}
                    onChange={(e) => setTplCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                  >
                    <option value="CONTENT">Nội dung (CONTENT)</option>
                    <option value="CSKH">CSKH (CSKH)</option>
                    <option value="CAMPAIGN">Chiến dịch (CAMPAIGN)</option>
                    <option value="ONBOARDING">Nhân sự (ONBOARDING)</option>
                    <option value="CUSTOM">Tùy biến (CUSTOM)</option>
                  </select>
                </div>
              </div>

              {/* Estimated Days & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <label className="font-semibold text-[var(--color-foreground)] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dự kiến (ngày)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={tplEstimatedDays}
                    onChange={(e) => setTplEstimatedDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <label className="font-semibold text-[var(--color-foreground)]">Mô tả quy trình</label>
                  <input
                    type="text"
                    placeholder="Quy chuẩn từng bước để phối hợp nhịp nhàng giữa các phòng ban..."
                    value={tplDescription}
                    onChange={(e) => setTplDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none text-[var(--color-foreground)] text-xs"
                  />
                </div>
              </div>

              {/* Steps Checklist Builder */}
              <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-semibold text-[var(--color-foreground)]">
                      Các bước quy trình chuẩn hóa ({tplSteps.length} bước)
                    </label>
                    <p className="text-[11px] text-[var(--color-muted-foreground)]">
                      Mỗi bước sẽ tự động chuyển thành checklist việc con kèm vai trò khi áp dụng 1-click
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setTplSteps([
                        ...tplSteps,
                        {
                          title: '',
                          defaultRole: 'Thành viên thực hiện',
                          relativeDueDays: tplSteps.length + 1,
                        },
                      ])
                    }
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 font-medium text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm bước</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {tplSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0 self-center">
                        {idx + 1}
                      </div>

                      <input
                        type="text"
                        required
                        placeholder={`Tiêu đề bước ${idx + 1} (VD: Viết kịch bản, Quay video...)`}
                        value={step.title}
                        onChange={(e) => {
                          const updated = [...tplSteps];
                          updated[idx].title = e.target.value;
                          setTplSteps(updated);
                        }}
                        className="flex-1 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-xs focus:outline-none text-[var(--color-foreground)]"
                      />

                      <input
                        type="text"
                        placeholder="Vai trò (VD: Content Creator)"
                        value={step.defaultRole}
                        onChange={(e) => {
                          const updated = [...tplSteps];
                          updated[idx].defaultRole = e.target.value;
                          setTplSteps(updated);
                        }}
                        className="w-full sm:w-36 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-xs focus:outline-none text-[var(--color-foreground)]"
                      />

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-[var(--color-muted-foreground)] whitespace-nowrap">
                          Ngày +
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={step.relativeDueDays}
                          onChange={(e) => {
                            const updated = [...tplSteps];
                            updated[idx].relativeDueDays = parseInt(e.target.value) || 0;
                            setTplSteps(updated);
                          }}
                          className="w-12 p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-xs text-center focus:outline-none text-[var(--color-foreground)]"
                        />
                      </div>

                      {tplSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTplSteps(tplSteps.filter((_, i) => i !== idx))}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0 self-center"
                          title="Xóa bước này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-95 text-xs font-semibold shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Lưu & Kích hoạt mẫu quy trình</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
