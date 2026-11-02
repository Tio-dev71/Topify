import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getTrending } from '@/app/api/intelligence/trending/route';
import {
  GET as getAlerts,
  POST as postAlerts,
  PATCH as patchAlerts,
  DELETE as deleteAlerts,
} from '@/app/api/intelligence/alerts/route';

vi.mock('@/lib/db', () => ({
  prisma: {
    competitorPost: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
  default: {
    competitorPost: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe('M6. Social Listening - F110 & F112 APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('F110: Trending / Viral Content API (GET /api/intelligence/trending)', () => {
    it('returns a list of curated trending items with velocity scores and growth badges', async () => {
      const req = new NextRequest('http://localhost:3000/api/intelligence/trending');
      const res = await getTrending(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThan(0);

      const firstItem = data.items[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('title');
      expect(firstItem).toHaveProperty('platform');
      expect(firstItem).toHaveProperty('velocityScore');
      expect(firstItem).toHaveProperty('growthBadge');
      expect(firstItem.velocityScore).toBeGreaterThanOrEqual(50);
    });

    it('filters trending items by platform when platform query param is supplied', async () => {
      const req = new NextRequest('http://localhost:3000/api/intelligence/trending?platform=TIKTOK');
      const res = await getTrending(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.items.every((item: any) => item.platform === 'TIKTOK')).toBe(true);
    });
  });

  describe('F112: Keyword / Viral Alert API (GET /api/intelligence/alerts)', () => {
    it('returns configured rules and triggered alert events with unread count', async () => {
      const req = new NextRequest('http://localhost:3000/api/intelligence/alerts');
      const res = await getAlerts(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.rules)).toBe(true);
      expect(data.rules.length).toBeGreaterThan(0);
      expect(Array.isArray(data.alerts)).toBe(true);
      expect(Array.isArray(data.triggeredAlerts)).toBe(true);
      expect(typeof data.unreadCount).toBe('number');
    });
  });

  describe('F112: Rule & Alert Mutation Handlers (POST, PATCH, DELETE)', () => {
    it('creates a new viral alert rule via POST action=create_rule', async () => {
      const payload = {
        action: 'create_rule',
        name: 'Theo dõi Review Trải nghiệm Khách hàng',
        minViralScore: 88,
        keywords: ['Review', 'Trải nghiệm', 'Feedback'],
        notifyInApp: true,
        notifyEmail: true,
      };

      const req = new NextRequest('http://localhost:3000/api/intelligence/alerts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await postAlerts(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rule.name).toBe('Theo dõi Review Trải nghiệm Khách hàng');
      expect(data.rule.minViralScore).toBe(88);
      expect(data.rules.some((r: any) => r.id === data.rule.id)).toBe(true);
    });

    it('toggles rule active state via POST action=toggle_rule', async () => {
      const getRes = await getAlerts(new NextRequest('http://localhost:3000/api/intelligence/alerts'));
      const initialData = await getRes.json();
      const targetRule = initialData.rules[0];

      const req = new NextRequest('http://localhost:3000/api/intelligence/alerts', {
        method: 'POST',
        body: JSON.stringify({ action: 'toggle_rule', id: targetRule.id }),
      });

      const res = await postAlerts(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      const updatedRule = data.rules.find((r: any) => r.id === targetRule.id);
      expect(updatedRule.isActive).toBe(!targetRule.isActive);
    });

    it('triggers a test alert via POST action=test_trigger', async () => {
      const payload = {
        action: 'test_trigger',
        ruleName: 'Cảnh báo Kiểm thử Tự động',
        keyword: 'Test Trending',
        viralScore: 96,
        platform: 'TIKTOK',
      };

      const req = new NextRequest('http://localhost:3000/api/intelligence/alerts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await postAlerts(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alert.viralScore).toBe(96);
      expect(data.alert.platform).toBe('TIKTOK');
      expect(data.alert.isRead).toBe(false);
    });

    it('marks alerts as read via PATCH', async () => {
      const getRes = await getAlerts(new NextRequest('http://localhost:3000/api/intelligence/alerts'));
      const initialData = await getRes.json();
      const unreadAlert = initialData.triggeredAlerts.find((a: any) => !a.isRead);

      if (unreadAlert) {
        const req = new NextRequest('http://localhost:3000/api/intelligence/alerts', {
          method: 'PATCH',
          body: JSON.stringify({ id: unreadAlert.id }),
        });

        const res = await patchAlerts(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });

    it('deletes an alert event via DELETE ?alertId=...', async () => {
      // Create a test alert first
      const createReq = new NextRequest('http://localhost:3000/api/intelligence/alerts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test_trigger',
          keyword: 'AlertToDelete',
        }),
      });
      const createRes = await postAlerts(createReq);
      const createData = await createRes.json();
      const alertId = createData.alert.id;

      const deleteReq = new NextRequest(`http://localhost:3000/api/intelligence/alerts?alertId=${alertId}`, {
        method: 'DELETE',
      });
      const deleteRes = await deleteAlerts(deleteReq);
      const deleteData = await deleteRes.json();

      expect(deleteRes.status).toBe(200);
      expect(deleteData.success).toBe(true);
      expect(deleteData.triggeredAlerts.some((a: any) => a.id === alertId)).toBe(false);
    });

    it('deletes a rule via DELETE ?id=...', async () => {
      // Create rule first
      const createReq = new NextRequest('http://localhost:3000/api/intelligence/alerts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_rule',
          name: 'Rule To Delete',
          minViralScore: 90,
          keywords: ['DeleteMe'],
        }),
      });
      const createRes = await postAlerts(createReq);
      const createData = await createRes.json();
      const ruleId = createData.rule.id;

      const deleteReq = new NextRequest(`http://localhost:3000/api/intelligence/alerts?id=${ruleId}`, {
        method: 'DELETE',
      });
      const deleteRes = await deleteAlerts(deleteReq);
      const deleteData = await deleteRes.json();

      expect(deleteRes.status).toBe(200);
      expect(deleteData.success).toBe(true);
      expect(deleteData.rules.some((r: any) => r.id === ruleId)).toBe(false);
    });
  });
});

