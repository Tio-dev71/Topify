// Topify Automation Flow Engine (M11. Automation: F141 - F145)
// Core types, condition evaluation, action execution, logs & retry, templates

export type AutomationTriggerType = 'COMMENT' | 'MESSAGE' | 'LEAD' | 'TIME' | 'WEBHOOK';

export interface AutomationTrigger {
  type: AutomationTriggerType;
  config: {
    channel?: 'ALL' | 'FACEBOOK' | 'TIKTOK' | 'SHOPEE' | 'YOUTUBE' | 'INSTAGRAM';
    event?: string;
    cronSchedule?: string; // e.g. "0 9 * * *"
    webhookSecret?: string;
    source?: string;
    postTarget?: string;
  };
}

export type ConditionField = 'keyword' | 'tag' | 'source' | 'status' | 'owner' | 'time' | 'message_contains';
export type ConditionOperator = 'equals' | 'contains' | 'starts_with' | 'in' | 'not_equals';

export interface AutomationCondition {
  field: ConditionField;
  operator: ConditionOperator;
  value: string | string[];
}

export type AutomationActionType = 'MESSAGE' | 'TAG' | 'LEAD' | 'TASK' | 'ASSIGN' | 'NOTIFY';

export interface AutomationAction {
  type: AutomationActionType;
  config: {
    templateText?: string;
    tag?: string;
    leadStatus?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'VIP';
    taskTitle?: string;
    taskPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assigneeName?: string;
    assigneeId?: string;
    notificationTitle?: string;
    notificationBody?: string;
  };
}

export interface AutomationRuleItem {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  workspaceId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AutomationExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerType: AutomationTriggerType;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING' | 'SKIPPED';
  inputPayload: Record<string, any>;
  outputPayload: Record<string, any>;
  error?: string;
  retryCount: number;
  maxRetries: number;
  idempotencyKey: string;
  executionDurationMs: number;
  executedAt: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'MARKETING' | 'CSKH' | 'CRM' | 'OPERATIONS';
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  icon: string;
  recommendedFor: string;
}

// ============================================
// Condition Evaluation Engine (F142)
// ============================================

export function evaluateConditions(conditions: AutomationCondition[], context: Record<string, any>): boolean {
  if (!conditions || conditions.length === 0) return true;

  for (const condition of conditions) {
    const rawVal = context[condition.field] ?? context.text ?? '';
    const textVal = String(rawVal).toLowerCase().trim();
    const condVal = Array.isArray(condition.value) 
      ? condition.value.map(v => String(v).toLowerCase().trim())
      : String(condition.value).toLowerCase().trim();

    let matched = false;

    switch (condition.operator) {
      case 'contains':
        if (Array.isArray(condVal)) {
          matched = condVal.some(v => textVal.includes(v));
        } else {
          matched = textVal.includes(condVal);
        }
        break;
      case 'equals':
        matched = textVal === condVal;
        break;
      case 'not_equals':
        matched = textVal !== condVal;
        break;
      case 'starts_with':
        matched = typeof condVal === 'string' && textVal.startsWith(condVal);
        break;
      case 'in':
        if (Array.isArray(condVal)) {
          matched = condVal.includes(textVal);
        } else {
          matched = textVal.includes(condVal);
        }
        break;
      default:
        matched = false;
    }

    if (!matched) return false;
  }

  return true;
}

// ============================================
// Action Executor (F143)
// ============================================

export function executeActions(actions: AutomationAction[], context: Record<string, any>): Record<string, any> {
  const results: Record<string, any> = { executedActions: [] };

  for (const action of actions) {
    const actionResult: Record<string, any> = { type: action.type, timestamp: new Date().toISOString() };

    switch (action.type) {
      case 'MESSAGE':
        actionResult.sentMessage = action.config.templateText || 'Cảm ơn bạn đã liên hệ!';
        actionResult.recipient = context.senderName || context.senderId || 'Khách hàng';
        break;
      case 'TAG':
        actionResult.appliedTag = action.config.tag || 'Moi_Quan_Tam';
        actionResult.target = context.senderId || 'contact_target';
        break;
      case 'LEAD':
        actionResult.createdLead = {
          name: context.senderName || 'Khách hàng mới',
          status: action.config.leadStatus || 'NEW',
          source: context.channel || 'AUTOMATION',
        };
        break;
      case 'TASK':
        actionResult.createdTask = {
          title: action.config.taskTitle || 'Chăm sóc khách hàng tự động',
          priority: action.config.taskPriority || 'HIGH',
          assignee: action.config.assigneeName || 'Unassigned',
        };
        break;
      case 'ASSIGN':
        actionResult.assignedTo = action.config.assigneeName || 'Chuyên viên CSKH';
        break;
      case 'NOTIFY':
        actionResult.notification = {
          title: action.config.notificationTitle || 'Thông báo tự động',
          body: action.config.notificationBody || 'Có hành động mới được kích hoạt.',
        };
        break;
    }

    results.executedActions.push(actionResult);
  }

  return results;
}

// ============================================
// Automation Templates Library (F145)
// ============================================

export const INITIAL_AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'tpl_auto_comment_reply',
    name: 'Tự động trả lời comment hỏi giá & Gắn tag Lead tiềm năng',
    description: 'Bắt các bình luận chứa từ khóa "giá", "bao nhiêu", "ib" trên TikTok & Facebook để gửi câu trả lời và gắn thẻ Khach_Hoi_Gia vào CRM.',
    category: 'MARKETING',
    icon: 'MessageSquare',
    recommendedFor: 'Bán lẻ & E-commerce, livestream',
    trigger: {
      type: 'COMMENT',
      config: {
        channel: 'ALL',
        event: 'NEW_COMMENT',
      },
    },
    conditions: [
      {
        field: 'keyword',
        operator: 'contains',
        value: 'giá, bao nhiêu, ib, tư vấn, ship',
      },
    ],
    actions: [
      {
        type: 'MESSAGE',
        config: {
          templateText: 'Dạ Topify chào bạn! Shop đã gửi bảng giá chi tiết kèm ưu đãi qua tin nhắn cho bạn rồi nhé ạ!',
        },
      },
      {
        type: 'TAG',
        config: {
          tag: 'Hoi_Gia_Tieng_Nang',
        },
      },
    ],
  },
  {
    id: 'tpl_vip_lead_task',
    name: 'Tạo Task khẩn cấp khi nhận VIP Lead từ Webhook Landing Page',
    description: 'Khi webhook ghi nhận khách hàng đăng ký có ngân sách cao, tự động tạo việc khẩn cấp trong Task (M9) và thông báo nội bộ.',
    category: 'CRM',
    icon: 'CheckSquare',
    recommendedFor: 'B2B, Bất động sản, Thẩm mỹ viện, Khóa học',
    trigger: {
      type: 'WEBHOOK',
      config: {
        source: 'landing_page',
        event: 'lead_form_submitted',
      },
    },
    conditions: [
      {
        field: 'tag',
        operator: 'contains',
        value: 'VIP, DoanhNghiep',
      },
    ],
    actions: [
      {
        type: 'LEAD',
        config: {
          leadStatus: 'VIP',
        },
      },
      {
        type: 'TASK',
        config: {
          taskTitle: 'Gọi điện tư vấn khách VIP trong 15 phút',
          taskPriority: 'URGENT',
          assigneeName: 'Trưởng nhóm CSKH',
        },
      },
      {
        type: 'NOTIFY',
        config: {
          notificationTitle: '🚨 Khách VIP mới đăng ký!',
          notificationBody: 'Có khách hàng tiềm năng vừa đăng ký qua Landing Page, cần chăm sóc ngay.',
        },
      },
    ],
  },
  {
    id: 'tpl_welcome_inbox_assign',
    name: 'Gửi tin nhắn chào mừng & Điều hướng nhân sự trực Inbox',
    description: 'Khi khách hàng nhắn tin lần đầu vào fanpage hoặc TikTok shop, tự động chào mừng và gán nhân viên phụ trách xoay vòng.',
    category: 'CSKH',
    icon: 'Users',
    recommendedFor: 'Mọi doanh nghiệp có kênh bán hàng đa nền tảng',
    trigger: {
      type: 'MESSAGE',
      config: {
        channel: 'ALL',
        event: 'FIRST_MESSAGE',
      },
    },
    conditions: [
      {
        field: 'status',
        operator: 'equals',
        value: 'NEW',
      },
    ],
    actions: [
      {
        type: 'MESSAGE',
        config: {
          templateText: 'Xin chào! Cảm ơn bạn đã liên hệ với Topify. Chuyên viên tư vấn sẽ hỗ trợ bạn ngay trong giây lát ạ.',
        },
      },
      {
        type: 'ASSIGN',
        config: {
          assigneeName: 'Sale Trực Ca',
        },
      },
    ],
  },
  {
    id: 'tpl_overdue_task_alert',
    name: 'Cảnh báo tự động khi công việc chiến dịch bị trễ hạn',
    description: 'Quét định kỳ hàng ngày vào 09:00 sáng, nếu có công việc chiến dịch đang trễ hạn sẽ tự động gửi cảnh báo đôn đốc.',
    category: 'OPERATIONS',
    icon: 'Clock',
    recommendedFor: 'Đội ngũ Marketing & Quản lý dự án',
    trigger: {
      type: 'TIME',
      config: {
        cronSchedule: '0 9 * * *',
        event: 'DAILY_CRON',
      },
    },
    conditions: [
      {
        field: 'status',
        operator: 'not_equals',
        value: 'DONE',
      },
    ],
    actions: [
      {
        type: 'NOTIFY',
        config: {
          notificationTitle: '⏰ Nhắc nhở: Công việc chiến dịch đến hạn',
          notificationBody: 'Bạn có các công việc cần hoàn thành trong hôm nay để không ảnh hưởng tiến độ chiến dịch.',
        },
      },
    ],
  },
  {
    id: 'tpl_phone_number_auto_tag',
    name: 'Tự động phân loại & gắn thẻ khi khách để lại Số Điện Thoại',
    description: 'Phát hiện khách hàng để lại số điện thoại trong tin nhắn hoặc bình luận $\rightarrow$ tự động gắn thẻ Co_SDT và tạo Lead CRM.',
    category: 'CRM',
    icon: 'PhoneCall',
    recommendedFor: 'Telesale & Chốt đơn trực tiếp',
    trigger: {
      type: 'MESSAGE',
      config: {
        channel: 'ALL',
        event: 'NEW_MESSAGE',
      },
    },
    conditions: [
      {
        field: 'message_contains',
        operator: 'contains',
        value: '09, 08, 07, 03, 05',
      },
    ],
    actions: [
      {
        type: 'TAG',
        config: {
          tag: 'Co_SDT_San_Sang_Goi',
        },
      },
      {
        type: 'LEAD',
        config: {
          leadStatus: 'QUALIFIED',
        },
      },
      {
        type: 'TASK',
        config: {
          taskTitle: 'Gọi xác nhận đơn hàng khách để lại SĐT',
          taskPriority: 'HIGH',
          assigneeName: 'Telesales',
        },
      },
    ],
  },
];

// ============================================
// In-Memory Sample Rules & Logs Store
// ============================================

export const memoryAutomationRules: AutomationRuleItem[] = [
  {
    id: 'rule_001',
    name: 'Tự động trả lời comment hỏi giá TikTok & FB',
    description: 'Bắt bình luận có từ khóa "giá", "inbox" để phản hồi và gắn thẻ CRM.',
    trigger: {
      type: 'COMMENT',
      config: { channel: 'ALL', event: 'NEW_COMMENT' },
    },
    conditions: [
      { field: 'keyword', operator: 'contains', value: 'giá, bao nhiêu, ib, shop ơi' },
    ],
    actions: [
      { type: 'MESSAGE', config: { templateText: 'Chào bạn! Topify đã gửi thông tin và ưu đãi riêng qua tin nhắn rồi ạ!' } },
      { type: 'TAG', config: { tag: 'Hoi_Gia_Tieng_Nang' } },
    ],
    isActive: true,
    executionCount: 142,
    lastExecutedAt: '2026-10-14T14:32:00.000Z',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'rule_002',
    name: 'Bắt VIP Lead từ Webhook Landing Page',
    description: 'Tạo Lead và Task khẩn cấp khi nhận khách hàng đăng ký từ form landing page.',
    trigger: {
      type: 'WEBHOOK',
      config: { source: 'landing_page', event: 'lead_form_submitted' },
    },
    conditions: [
      { field: 'tag', operator: 'contains', value: 'VIP, DoanhNghiep' },
    ],
    actions: [
      { type: 'LEAD', config: { leadStatus: 'VIP' } },
      { type: 'TASK', config: { taskTitle: 'Gọi tư vấn khách VIP trong 15 phút', taskPriority: 'URGENT', assigneeName: 'Nguyễn Văn A' } },
      { type: 'NOTIFY', config: { notificationTitle: '🚨 Khách VIP mới!', notificationBody: 'Vừa có khách hàng VIP đăng ký form.' } },
    ],
    isActive: true,
    executionCount: 38,
    lastExecutedAt: '2026-10-14T11:15:00.000Z',
    createdAt: '2026-10-05T09:30:00.000Z',
  },
  {
    id: 'rule_003',
    name: 'Chào mừng khách hàng mới & Gán Sale',
    description: 'Phản hồi tin nhắn đầu tiên và gán trực tiếp cho nhân viên ca trực.',
    trigger: {
      type: 'MESSAGE',
      config: { channel: 'ALL', event: 'FIRST_MESSAGE' },
    },
    conditions: [
      { field: 'status', operator: 'equals', value: 'NEW' },
    ],
    actions: [
      { type: 'MESSAGE', config: { templateText: 'Xin chào bạn! Cảm ơn bạn đã nhắn tin cho Topify. Chuyên viên sẽ hỗ trợ bạn ngay.' } },
      { type: 'ASSIGN', config: { assigneeName: 'Trần Thị B' } },
    ],
    isActive: false,
    executionCount: 89,
    lastExecutedAt: '2026-10-12T17:40:00.000Z',
    createdAt: '2026-10-08T10:00:00.000Z',
  },
];

export const memoryAutomationLogs: AutomationExecutionLog[] = [
  {
    id: 'log_001',
    ruleId: 'rule_001',
    ruleName: 'Tự động trả lời comment hỏi giá TikTok & FB',
    triggerType: 'COMMENT',
    status: 'SUCCESS',
    inputPayload: {
      author: 'Hoàng Minh',
      channel: 'TIKTOK',
      text: 'Shop ơi áo này giá bao nhiêu vậy?',
      postId: 'post_tt_102',
    },
    outputPayload: {
      executedActions: [
        { type: 'MESSAGE', sentMessage: 'Chào bạn! Topify đã gửi thông tin và ưu đãi riêng qua tin nhắn rồi ạ!', recipient: 'Hoàng Minh' },
        { type: 'TAG', appliedTag: 'Hoi_Gia_Tieng_Nang', target: 'Hoàng Minh' },
      ],
    },
    retryCount: 0,
    maxRetries: 3,
    idempotencyKey: 'idemp_comm_tt_102_001',
    executionDurationMs: 45,
    executedAt: '2026-10-14T14:32:00.000Z',
  },
  {
    id: 'log_002',
    ruleId: 'rule_002',
    ruleName: 'Bắt VIP Lead từ Webhook Landing Page',
    triggerType: 'WEBHOOK',
    status: 'SUCCESS',
    inputPayload: {
      source: 'landing_page',
      name: 'Công ty TNHH Á Châu',
      email: 'contact@achau.vn',
      tag: 'VIP, DoanhNghiep',
      budget: '50.000.000 VND',
    },
    outputPayload: {
      executedActions: [
        { type: 'LEAD', createdLead: { name: 'Công ty TNHH Á Châu', status: 'VIP' } },
        { type: 'TASK', createdTask: { title: 'Gọi tư vấn khách VIP trong 15 phút', priority: 'URGENT', assignee: 'Nguyễn Văn A' } },
        { type: 'NOTIFY', notification: { title: '🚨 Khách VIP mới!', body: 'Vừa có khách hàng VIP đăng ký form.' } },
      ],
    },
    retryCount: 0,
    maxRetries: 3,
    idempotencyKey: 'idemp_wh_achau_882',
    executionDurationMs: 120,
    executedAt: '2026-10-14T11:15:00.000Z',
  },
  {
    id: 'log_003',
    ruleId: 'rule_001',
    ruleName: 'Tự động trả lời comment hỏi giá TikTok & FB',
    triggerType: 'COMMENT',
    status: 'SKIPPED',
    inputPayload: {
      author: 'Thu Hà',
      channel: 'FACEBOOK',
      text: 'Video quay đẹp quá bạn ơi!',
      postId: 'post_fb_331',
    },
    outputPayload: {
      reason: 'Điều kiện từ khóa không khớp (không chứa "giá", "inbox", "bao nhiêu").',
    },
    retryCount: 0,
    maxRetries: 3,
    idempotencyKey: 'idemp_comm_fb_331_002',
    executionDurationMs: 12,
    executedAt: '2026-10-14T10:48:00.000Z',
  },
  {
    id: 'log_004',
    ruleId: 'rule_001',
    ruleName: 'Tự động trả lời comment hỏi giá TikTok & FB',
    triggerType: 'COMMENT',
    status: 'FAILED',
    inputPayload: {
      author: 'Quốc Bảo',
      channel: 'TIKTOK',
      text: 'Giá combo 2 chiếc bao nhiêu shop?',
      postId: 'post_tt_102',
    },
    outputPayload: {},
    error: 'TikTok Open API Rate Limit Exceeded: Mã 429 - Vượt hạn mức 100 comment/phút. Cần thử lại sau 60s.',
    retryCount: 1,
    maxRetries: 3,
    idempotencyKey: 'idemp_comm_tt_102_003',
    executionDurationMs: 310,
    executedAt: '2026-10-14T09:20:00.000Z',
  },
];
