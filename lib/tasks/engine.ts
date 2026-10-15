/**
 * M9. Work & Task Core Engine
 * Manages Task Templates (F130), Recurring Calculation (F129), and Workload & Productivity (F131)
 */

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type RecurFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface TaskCollaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'OWNER' | 'COLLABORATOR';
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: number;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface TaskCommentItem {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  mentions: string[]; // member emails or names mentioned
  attachments: TaskAttachment[];
  createdAt: string;
}

export interface SubtaskItem {
  id: string;
  title: string;
  isCompleted: boolean;
  assigneeName?: string;
}

export interface TaskTemplateStep {
  title: string;
  description?: string;
  relativeDueDays: number;
  defaultRole?: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  category: 'CONTENT' | 'CSKH' | 'CAMPAIGN' | 'ONBOARDING';
  description: string;
  estimatedDays: number;
  icon: string;
  steps: TaskTemplateStep[];
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
  onTimeRate: number; // Percentage 0 - 100
  productivityScore: number; // 0 - 100
  isOverloaded: boolean; // Overload threshold (e.g. >= 6 active tasks or >= 3 urgent)
}

// ============================================================================
// F130: BUILT-IN TASK TEMPLATES LIBRARY
// ============================================================================
export const BUILT_IN_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tpl_content_video',
    name: 'Quy trình Sản xuất Video Content (TikTok/Reels/Shorts)',
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
    name: 'Quy trình Xử lý Khiếu nại & Chăm sóc Khách hàng (CSKH)',
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
    name: 'Quy trình Triển khai Chiến dịch Marketing & Mở bán',
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
    name: 'Quy trình Tiếp nhận & Đào tạo Nhân sự mới (Onboarding)',
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

// ============================================================================
// F129: RECURRING TASK HELPERS
// ============================================================================
export function calculateNextRecurringDueDate(fromDate: Date, frequency: RecurFrequency): Date {
  const next = new Date(fromDate);
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      next.setDate(next.getDate() + 7);
  }
  return next;
}

// ============================================================================
// F131: WORKLOAD & PRODUCTIVITY CALCULATOR
// ============================================================================
export function evaluateMemberProductivity(
  userId: string,
  userName: string,
  userEmail: string,
  userRole: string,
  tasks: Array<{
    assigneeId?: string | null;
    collaboratorIds?: string[];
    status: TaskStatus;
    dueDate?: string | Date | null;
    priority: TaskPriority;
  }>
): MemberProductivityMetric {
  const now = new Date().getTime();

  // Tasks where user is primary assignee or collaborator
  const myTasks = tasks.filter(
    (t) => t.assigneeId === userId || (t.collaboratorIds && t.collaboratorIds.includes(userId))
  );

  const totalAssigned = myTasks.length;
  const activeTasks = myTasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'REVIEW');
  const completedTasks = myTasks.filter((t) => t.status === 'DONE');

  const overdueTasks = activeTasks.filter((t) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).getTime() < now;
  });

  const urgentActiveCount = activeTasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length;

  const activeCount = activeTasks.length;
  const completedCount = completedTasks.length;
  const overdueCount = overdueTasks.length;

  // On-time rate
  const onTimeRate = totalAssigned > 0 
    ? Math.max(0, Math.min(100, Math.round(((totalAssigned - overdueCount) / totalAssigned) * 100))) 
    : 100;

  // Productivity score: based on completed count + onTimeRate - overdue penalty
  let productivityScore = 70;
  if (totalAssigned > 0) {
    const completionWeight = (completedCount / totalAssigned) * 50;
    const onTimeWeight = (onTimeRate / 100) * 40;
    const overduePenalty = (overdueCount / totalAssigned) * 30;
    productivityScore = Math.max(20, Math.min(100, Math.round(completionWeight + onTimeWeight - overduePenalty + 10)));
  }

  // Overloaded if active tasks >= 5 or urgent tasks >= 3
  const isOverloaded = activeCount >= 5 || urgentActiveCount >= 3;

  return {
    userId,
    name: userName,
    email: userEmail,
    role: userRole,
    totalAssigned,
    activeCount,
    completedCount,
    overdueCount,
    onTimeRate,
    productivityScore,
    isOverloaded,
  };
}
