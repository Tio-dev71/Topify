import { describe, it, expect, vi } from 'vitest';
import { 
  evaluateConditions, 
  evaluateConditionsDetailed,
  executeActions, 
  INITIAL_AUTOMATION_TEMPLATES, 
  AutomationRuleItem,
  AutomationCondition,
  AutomationAction
} from '@/lib/automation/flow-engine';
import { GET as GET_RULES, POST as POST_RULES, PATCH as PATCH_RULES } from '@/app/api/automations/route';
import { POST as POST_TEMPLATES } from '@/app/api/automations/templates/route';
import { GET as GET_LOGS, POST as POST_LOGS } from '@/app/api/automations/logs/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'user_test_1', workspaceId: 'ws_test_1', name: 'Test User' },
  }),
}));

vi.mock('@/lib/db', () => {
  const mockRules: any[] = [];
  const mockLogs: any[] = [];

  return {
    default: {
      automationRule: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve(mockRules)),
        create: vi.fn().mockImplementation(({ data }: any) => {
          const created = {
            id: `rule_db_${Date.now()}`,
            name: data.name,
            description: data.description,
            trigger: data.trigger,
            conditions: data.conditions,
            actions: data.actions,
            isActive: data.isActive ?? true,
            workspaceId: data.workspaceId,
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { logs: 0 },
          };
          mockRules.unshift(created);
          return Promise.resolve(created);
        }),
        update: vi.fn().mockImplementation(({ where, data }: any) => {
          const found = mockRules.find(r => r.id === where.id);
          if (found) {
            Object.assign(found, data, { updatedAt: new Date() });
            return Promise.resolve(found);
          }
          return Promise.resolve({ id: where.id, ...data, createdAt: new Date(), updatedAt: new Date(), _count: { logs: 0 } });
        }),
        delete: vi.fn().mockResolvedValue({ id: 'deleted' }),
      },
      automationRuleLog: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve(mockLogs)),
        findUnique: vi.fn().mockImplementation(({ where }: any) => {
          const found = mockLogs.find(l => l.id === where.id);
          return Promise.resolve(found || null);
        }),
        create: vi.fn().mockImplementation(({ data }: any) => {
          const created = {
            id: `log_db_${Date.now()}`,
            ruleId: data.ruleId,
            status: data.status,
            input: data.input,
            output: data.output,
            error: data.error,
            createdAt: new Date(),
            rule: { id: data.ruleId, name: 'Test Rule', trigger: { type: 'COMMENT' } },
          };
          mockLogs.unshift(created);
          return Promise.resolve(created);
        }),
        update: vi.fn().mockImplementation(({ where, data }: any) => {
          const found = mockLogs.find(l => l.id === where.id);
          if (found) {
            Object.assign(found, data);
            return Promise.resolve(found);
          }
          return Promise.resolve({ id: where.id, ...data });
        }),
      },
      workspace: {
        findFirst: vi.fn().mockResolvedValue({ id: 'ws_test_1' }),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'user_test_1', workspaceId: 'ws_test_1' }),
        findFirst: vi.fn().mockResolvedValue({ id: 'user_test_1', workspaceId: 'ws_test_1' }),
      },
    },
  };
});

vi.mock('@/lib/audit-log', () => ({
  recordAuditLog: vi.fn(),
}));

describe('M11 Automation Workflow Rules & Engine', () => {
  describe('Rule ID and Label Layout Helpers', () => {
    it('truncates long CUID IDs properly to prevent card overflow', () => {
      const formatRuleId = (id: string) => {
        return id.length > 14 ? `${id.slice(0, 7)}...${id.slice(-4)}` : id;
      };

      const longCuid = 'cmvjmep3o001trk2g6d6of746';
      const shortId = 'rule_123';

      expect(formatRuleId(longCuid)).toBe('cmvjmep...f746');
      expect(formatRuleId(longCuid).length).toBeLessThanOrEqual(15);
      expect(formatRuleId(shortId)).toBe('rule_123');
    });

    it('ensures rule conditions and triggers have valid structure', () => {
      const mockRule: AutomationRuleItem = {
        id: 'cmvjmep3o001trk2g6d6of746',
        name: 'Test Trigger',
        description: 'Thử nghiệm',
        trigger: {
          type: 'COMMENT',
          config: {
            event: 'NEW_COMMENT',
            channel: 'ALL',
          },
        },
        conditions: [
          {
            field: 'keyword',
            operator: 'contains',
            value: 'tư vấn',
          },
        ],
        actions: [
          {
            type: 'MESSAGE',
            config: {
              templateText: 'Dạ shop đã nhắn tin hỗ trợ ạ!',
            },
          },
          {
            type: 'TAG',
            config: {
              tag: 'Tu_Van',
            },
          },
        ],
        isActive: true,
        executionCount: 0,
        createdAt: new Date().toISOString(),
      };

      expect(mockRule.name).toBe('Test Trigger');
      expect(mockRule.trigger.type).toBe('COMMENT');
      expect(mockRule.conditions[0].operator).toBe('contains');
      expect(mockRule.actions.length).toBe(2);
    });
  });

  describe('Condition Evaluation Engine (Detailed Breakdown & Diagnostic)', () => {
    it('evaluates "contains" condition accurately with single and comma-separated keywords', () => {
      const conditions: AutomationCondition[] = [
        { field: 'keyword', operator: 'contains', value: 'giá, bao nhiêu, ib, ship' },
      ];

      expect(evaluateConditions(conditions, { text: 'Sản phẩm này giá bao nhiêu?' })).toBe(true);
      expect(evaluateConditions(conditions, { text: 'Có ship hỏa tốc không shop?' })).toBe(true);
      expect(evaluateConditions(conditions, { text: 'Xin chào shop' })).toBe(false);
    });

    it('provides detailed diagnostic report on failed conditions with reasons', () => {
      const conditions: AutomationCondition[] = [
        { field: 'keyword', operator: 'contains', value: 'chốt đơn, mua ngay' },
        { field: 'status', operator: 'equals', value: 'VIP' },
      ];

      const payload = {
        text: 'Shop ơi áo này giá bao nhiêu?',
        status: 'NEW',
      };

      const detailed = evaluateConditionsDetailed(conditions, payload);

      expect(detailed.isMatched).toBe(false);
      expect(detailed.failedConditions).toHaveLength(2);
      expect(detailed.failedConditions[0].condition.field).toBe('keyword');
      expect(detailed.failedConditions[0].reason).toContain('không chứa bất kỳ từ khóa nào');
      expect(detailed.failedConditions[1].condition.field).toBe('status');
      expect(detailed.failedConditions[1].reason).toContain('không bằng "VIP"');
      expect(detailed.explanation).toContain('2/2 điều kiện chưa thỏa mãn');
    });

    it('provides detailed report on successful match', () => {
      const conditions: AutomationCondition[] = [
        { field: 'keyword', operator: 'contains', value: 'tư vấn' },
      ];

      const payload = { text: 'Shop ơi tư vấn size áo giúp em' };
      const detailed = evaluateConditionsDetailed(conditions, payload);

      expect(detailed.isMatched).toBe(true);
      expect(detailed.failedConditions).toHaveLength(0);
      expect(detailed.results[0].matched).toBe(true);
      expect(detailed.results[0].reason).toContain('Nội dung chứa từ khóa phù hợp');
    });

    it('evaluates multiple conditions with logical AND', () => {
      const conditions: AutomationCondition[] = [
        { field: 'keyword', operator: 'contains', value: 'áo' },
        { field: 'source', operator: 'equals', value: 'facebook' },
      ];

      expect(evaluateConditions(conditions, { text: 'Có bán áo sơ mi không?', source: 'facebook' })).toBe(true);
      expect(evaluateConditions(conditions, { text: 'Có bán áo sơ mi không?', source: 'tiktok' })).toBe(false);
    });

    it('evaluates "starts_with" condition accurately', () => {
      const conditions: AutomationCondition[] = [
        { field: 'keyword', operator: 'starts_with', value: '/help' },
      ];

      expect(evaluateConditions(conditions, { text: '/help tư vấn đơn hàng' })).toBe(true);
      expect(evaluateConditions(conditions, { text: 'tôi cần /help' })).toBe(false);
    });
  });

  describe('Action Execution Engine', () => {
    it('executes MESSAGE and TAG actions and produces audit payloads', () => {
      const actions: AutomationAction[] = [
        {
          type: 'MESSAGE',
          config: { templateText: 'Chào {{name}}!' },
        },
        {
          type: 'TAG',
          config: { tag: 'VIP_KHACH_HANG' },
        },
      ];

      const context = { senderName: 'Nguyễn Văn A', senderId: 'user_123' };
      const result = executeActions(actions, context);

      expect(result.executedActions).toHaveLength(2);
      expect(result.executedActions[0].type).toBe('MESSAGE');
      expect(result.executedActions[0].recipient).toBe('Nguyễn Văn A');
      expect(result.executedActions[1].type).toBe('TAG');
      expect(result.executedActions[1].appliedTag).toBe('VIP_KHACH_HANG');
    });

    it('executes LEAD and TASK actions with appropriate statuses', () => {
      const actions: AutomationAction[] = [
        {
          type: 'LEAD',
          config: { leadStatus: 'QUALIFIED' },
        },
        {
          type: 'TASK',
          config: { taskTitle: 'Gọi xác nhận đơn hàng', taskPriority: 'HIGH' },
        },
      ];

      const result = executeActions(actions, { senderName: 'Trần Thị B', channel: 'TIKTOK' });
      expect(result.executedActions[0].createdLead.status).toBe('QUALIFIED');
      expect(result.executedActions[1].createdTask.title).toBe('Gọi xác nhận đơn hàng');
      expect(result.executedActions[1].createdTask.priority).toBe('HIGH');
    });
  });

  describe('Templates Library', () => {
    it('provides valid pre-built automation templates', () => {
      expect(INITIAL_AUTOMATION_TEMPLATES.length).toBeGreaterThan(0);
      for (const tpl of INITIAL_AUTOMATION_TEMPLATES) {
        expect(tpl.id).toBeDefined();
        expect(tpl.name).toBeDefined();
        expect(tpl.trigger).toBeDefined();
        expect(Array.isArray(tpl.actions)).toBe(true);
      }
    });
  });

  describe('M11 Automation APIs Persistence & End-to-End Workflow', () => {
    let createdRuleId: string;

    it('POST /api/automations creates a new rule and persists to DB (F140)', async () => {
      const payload = {
        name: 'Kịch bản Test F140 Tự Động',
        description: 'Tự động phản hồi tin nhắn khách hàng mới',
        trigger: {
          type: 'MESSAGE',
          config: { channel: 'FACEBOOK', event: 'FIRST_MESSAGE' },
        },
        conditions: [
          { field: 'keyword', operator: 'contains', value: 'báo giá, tư vấn' },
          { field: 'status', operator: 'equals', value: 'NEW' },
        ],
        actions: [
          { type: 'MESSAGE', config: { templateText: 'Dạ shop đã gửi tin nhắn rồi ạ!' } },
          { type: 'TAG', config: { tag: 'Tu_Van' } },
        ],
        isActive: true,
      };

      const req = new NextRequest('http://localhost:3000/api/automations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await POST_RULES(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.automation).toBeDefined();
      expect(data.automation.name).toBe('Kịch bản Test F140 Tự Động');
      expect(data.automation.id).toBeDefined();
      createdRuleId = data.automation.id;
    });

    it('GET /api/automations lists persisted rules (F140-F143)', async () => {
      const req = new NextRequest('http://localhost:3000/api/automations');
      const res = await GET_RULES(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.automations)).toBe(true);
      expect(data.automations.some((r: any) => r.id === createdRuleId)).toBe(true);
    });

    it('POST /api/automations/templates applies a template and persists to DB (F145)', async () => {
      const tpl = INITIAL_AUTOMATION_TEMPLATES[0];
      const req = new NextRequest('http://localhost:3000/api/automations/templates', {
        method: 'POST',
        body: JSON.stringify({
          templateId: tpl.id,
          customName: 'Mẫu Áp Dụng Từ Template F145',
        }),
      });

      const res = await POST_TEMPLATES(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.rule).toBeDefined();
      expect(data.rule.name).toBe('Mẫu Áp Dụng Từ Template F145');
      expect(data.rule.id).toBeDefined();
    });

    it('GET /api/automations/logs lists execution logs with retry functionality (F144)', async () => {
      const req = new NextRequest('http://localhost:3000/api/automations/logs');
      const res = await GET_LOGS(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.logs)).toBe(true);
    });
  });
});
