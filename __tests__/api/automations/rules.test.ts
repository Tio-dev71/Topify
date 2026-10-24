import { describe, it, expect } from 'vitest';
import { 
  evaluateConditions, 
  executeActions, 
  INITIAL_AUTOMATION_TEMPLATES, 
  AutomationRuleItem,
  AutomationCondition,
  AutomationAction
} from '@/lib/automation/flow-engine';

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

  describe('Condition Evaluation Engine', () => {
    it('evaluates "contains" condition accurately', () => {
      const conditions: AutomationCondition[] = [
        { field: 'keyword', operator: 'contains', value: 'giá' },
      ];

      expect(evaluateConditions(conditions, { text: 'Sản phẩm này giá bao nhiêu?' })).toBe(true);
      expect(evaluateConditions(conditions, { text: 'Xin chào shop' })).toBe(false);
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
});
