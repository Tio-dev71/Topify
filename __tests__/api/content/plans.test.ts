import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE, OPTIONS } from '@/app/api/content/plans/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
    contentPillar: {
      findMany: vi.fn(),
    },
    contentPlan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('Content Plans API (F074) - /api/content/plans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OPTIONS /api/content/plans', () => {
    it('returns 204 with CORS preflight headers', async () => {
      const res = await OPTIONS();
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('GET /api/content/plans', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/content/plans');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns existing plans for workspace', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      const mockPlans = [
        {
          id: 'p1',
          title: 'Tuần 1: Nhận diện & Giáo dục',
          description: JSON.stringify({ focus: 'Focus 1', target: '10 bài', planGroup: 'Tháng 10' }),
          startDate: new Date('2026-10-01'),
          endDate: new Date('2026-10-07'),
          pillar: { id: 'pil1', name: 'Giáo dục', color: '#F59E0B' },
        },
      ];

      vi.mocked(prisma.contentPlan.findMany).mockResolvedValue(mockPlans as any);

      const req = new NextRequest('http://localhost/api/content/plans');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.plans).toHaveLength(1);
      expect(data.plans[0].title).toBe('Tuần 1: Nhận diện & Giáo dục');
    });

    it('auto-seeds default weekly plans if none exist for workspace', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      // First query returns empty, then after seed returns 4 items
      vi.mocked(prisma.contentPlan.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'seed1', title: 'Tuần 1: Nhận diện & Giáo dục' },
          { id: 'seed2', title: 'Tuần 2: Tương tác & Trải nghiệm' },
          { id: 'seed3', title: 'Tuần 3: Case Study & Niềm tin' },
          { id: 'seed4', title: 'Tuần 4: Chốt đơn & Bùng nổ' },
        ] as any);

      vi.mocked(prisma.contentPillar.findMany).mockResolvedValue([]);
      vi.mocked(prisma.contentPlan.create).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost/api/content/plans');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.plans).toHaveLength(4);
      expect(prisma.contentPlan.create).toHaveBeenCalledTimes(4);
    });
  });

  describe('POST /api/content/plans', () => {
    it('creates a new plan with structured description and pillar', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      const newPlan = {
        title: 'Tuần 5: Tri ân & Đánh giá',
        focus: 'Cảm ơn khách hàng, khảo sát chất lượng dịch vụ',
        target: '6 bài / 3 kênh',
        planGroup: 'Kế hoạch Tháng 11/2026',
        startDate: '2026-11-01',
        endDate: '2026-11-07',
        pillarId: 'pil1',
      };

      vi.mocked(prisma.contentPlan.create).mockResolvedValue({
        id: 'plan_new_1',
        title: newPlan.title,
        description: JSON.stringify({
          planGroup: newPlan.planGroup,
          focus: newPlan.focus,
          target: newPlan.target,
        }),
        startDate: new Date(newPlan.startDate),
        endDate: new Date(newPlan.endDate),
        pillarId: 'pil1',
        workspaceId: 'ws1',
        pillar: { id: 'pil1', name: 'Chăm sóc', color: '#10B981' },
      } as any);

      const req = new NextRequest('http://localhost/api/content/plans', {
        method: 'POST',
        body: JSON.stringify(newPlan),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBe('plan_new_1');
      expect(data.title).toBe('Tuần 5: Tri ân & Đánh giá');
      expect(data.pillar.name).toBe('Chăm sóc');
    });

    it('returns 400 if title is empty', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      const req = new NextRequest('http://localhost/api/content/plans', {
        method: 'POST',
        body: JSON.stringify({ title: '' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Tiêu đề');
    });
  });

  describe('PATCH /api/content/plans', () => {
    it('updates an existing plan', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.contentPlan.findUnique).mockResolvedValue({
        id: 'p1',
        workspaceId: 'ws1',
        description: JSON.stringify({ planGroup: 'Tháng 10', focus: 'Old focus', target: '5 bài' }),
      } as any);

      vi.mocked(prisma.contentPlan.update).mockResolvedValue({
        id: 'p1',
        title: 'Tuần 1: Cập nhật mới',
        description: JSON.stringify({ planGroup: 'Tháng 10', focus: 'New focus', target: '15 bài / 4 kênh' }),
        pillar: { id: 'pil2', name: 'Review', color: '#3B82F6' },
      } as any);

      const req = new NextRequest('http://localhost/api/content/plans', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'p1',
          title: 'Tuần 1: Cập nhật mới',
          focus: 'New focus',
          target: '15 bài / 4 kênh',
          pillarId: 'pil2',
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.title).toBe('Tuần 1: Cập nhật mới');
      expect(data.pillar.name).toBe('Review');
    });
  });

  describe('DELETE /api/content/plans', () => {
    it('deletes plan if owned by workspace', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.contentPlan.findUnique).mockResolvedValue({
        id: 'p1',
        workspaceId: 'ws1',
      } as any);

      vi.mocked(prisma.contentPlan.delete).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost/api/content/plans?id=p1', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
