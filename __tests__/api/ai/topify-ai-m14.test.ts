import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

describe('M14 Topify AI - F159 to F162 Backend API Suite', () => {
  // =========================================================================
  // F159: AI CAMPAIGN PLANNER
  // =========================================================================
  describe('F159 AI Campaign Planner API', () => {
    it('GET /api/ai/campaign-planner returns list of structured campaign plans', async () => {
      const { GET } = await import('@/app/api/ai/campaign-planner/route');
      const req = new NextRequest('http://localhost:3000/api/ai/campaign-planner');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);

      const plan = json.data[0];
      expect(plan.id).toBeDefined();
      expect(plan.name).toBeDefined();
      expect(plan.objectives).toBeDefined();
      expect(plan.pillars).toBeDefined();
      expect(plan.contentPlan).toBeDefined();
      expect(plan.tasks).toBeDefined();
      expect(plan.estimatedROI).toBeDefined();
    });

    it('POST /api/ai/campaign-planner generates and persists new campaign plan from brief', async () => {
      const { POST } = await import('@/app/api/ai/campaign-planner/route');
      const req = new NextRequest('http://localhost:3000/api/ai/campaign-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Chiến Dịch Khai Xuân 2027 Test',
          targetAudience: 'Chủ shop thời trang online',
          budget: 50000000,
          durationDays: 30,
          channels: ['TIKTOK', 'FACEBOOK'],
          productBrief: 'Phần mềm trả lời tin nhắn tự động và chốt đơn đa kênh Topify',
          objectiveType: 'LEAD_GENERATION',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.name).toBe('Chiến Dịch Khai Xuân 2027 Test');
      expect(json.data.objectives.length).toBeGreaterThanOrEqual(3);
      expect(json.data.pillars.length).toBe(4);
      expect(json.data.contentPlan.length).toBe(4);
      expect(json.data.tasks.length).toBeGreaterThanOrEqual(4);
    });

    it('POST /api/ai/campaign-planner with action "push_to_modules" links plan to M10 & M09', async () => {
      const { POST } = await import('@/app/api/ai/campaign-planner/route');
      const req = new NextRequest('http://localhost:3000/api/ai/campaign-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'push_to_modules',
          planId: 'ai_plan_001',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain('đồng bộ thành công');
    });
  });

  // =========================================================================
  // F160: AI ANALYTICS COPILOT
  // =========================================================================
  describe('F160 AI Analytics Copilot API', () => {
    it('GET /api/ai/analytics-copilot returns metrics summary and conversation history', async () => {
      const { GET } = await import('@/app/api/ai/analytics-copilot/route');
      const req = new NextRequest('http://localhost:3000/api/ai/analytics-copilot');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.metrics).toBeDefined();
      expect(typeof json.data.metrics.totalLeads).toBe('number');
      expect(Array.isArray(json.data.messages)).toBe(true);
    });

    it('POST /api/ai/analytics-copilot answers question with real data analysis and recommendations', async () => {
      const { POST } = await import('@/app/api/ai/analytics-copilot/route');
      const req = new NextRequest('http://localhost:3000/api/ai/analytics-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Đánh giá tỷ lệ chốt deal và đề xuất tối ưu phễu bán hàng',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.assistantMessage).toBeDefined();
      expect(json.data.assistantMessage.role).toBe('assistant');
      expect(json.data.assistantMessage.content).toBeDefined();
      expect(Array.isArray(json.data.assistantMessage.recommendations)).toBe(true);
      expect(json.data.assistantMessage.recommendations.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // F161: AI SAFETY & MODERATION
  // =========================================================================
  describe('F161 AI Safety & Moderation API', () => {
    it('GET /api/ai/safety-moderation returns active policy rules and recent scans', async () => {
      const { GET } = await import('@/app/api/ai/safety-moderation/route');
      const req = new NextRequest('http://localhost:3000/api/ai/safety-moderation');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.rules)).toBe(true);
      expect(json.data.rules.length).toBeGreaterThanOrEqual(5);
      expect(Array.isArray(json.data.scans)).toBe(true);
    });

    it('POST /api/ai/safety-moderation scans text and flags policy violations with clean version', async () => {
      const { POST } = await import('@/app/api/ai/safety-moderation/route');
      const req = new NextRequest('http://localhost:3000/api/ai/safety-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan',
          text: 'Kem mờ sẹo cam kết 100% trị dứt điểm sau 3 ngày dùng!',
          targetType: 'AD_COPY',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.scanResult.status).toBe('VIOLATION');
      expect(json.data.scanResult.violationsCount).toBeGreaterThanOrEqual(2);
      expect(json.data.scanResult.safetyScore).toBeLessThan(60);
      expect(json.data.cleanText).not.toContain('cam kết 100%');
      expect(json.data.cleanText).not.toContain('trị dứt điểm');
    });

    it('POST /api/ai/safety-moderation adds a custom forbidden keyword rule', async () => {
      const { POST } = await import('@/app/api/ai/safety-moderation/route');
      const req = new NextRequest('http://localhost:3000/api/ai/safety-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_rule',
          keyword: 'tuyệt đối không lỗ',
          category: 'FINANCE_SCAM',
          severity: 'CRITICAL',
          description: 'Cấm cam kết tài chính không lỗ',
          suggestion: 'quản trị rủi ro tối ưu',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.keyword).toBe('tuyệt đối không lỗ');
      expect(json.data.isCustom).toBe(true);
    });
  });

  // =========================================================================
  // F162: AI CREDIT & COST METERING
  // =========================================================================
  describe('F162 AI Credit & Cost Metering API', () => {
    it('GET /api/ai/credit-metering returns quota, module stats, user stats and logs', async () => {
      const { GET } = await import('@/app/api/ai/credit-metering/route');
      const req = new NextRequest('http://localhost:3000/api/ai/credit-metering');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.quota).toBeDefined();
      expect(json.data.quota.totalAllocatedCredits).toBe(500000);
      expect(Array.isArray(json.data.moduleStats)).toBe(true);
      expect(json.data.moduleStats.length).toBeGreaterThanOrEqual(4);
      expect(Array.isArray(json.data.userStats)).toBe(true);
      expect(Array.isArray(json.data.logs)).toBe(true);
    });

    it('POST /api/ai/credit-metering records a new token/credit consumption event', async () => {
      const { POST } = await import('@/app/api/ai/credit-metering/route');
      const req = new NextRequest('http://localhost:3000/api/ai/credit-metering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: 'F159',
          moduleName: 'AI Campaign Planner',
          promptTokens: 1200,
          completionTokens: 1800,
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.totalTokens).toBe(3000);
      expect(json.data.creditsDeducted).toBe(300);
      expect(json.data.costVnd).toBe(150);
      expect(json.data.status).toBe('SUCCESS');
    });
  });
});

