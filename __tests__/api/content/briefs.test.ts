import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE, OPTIONS } from '@/app/api/content/briefs/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
    contentBrief: {
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

describe('Content Briefs API (F077) - /api/content/briefs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OPTIONS /api/content/briefs', () => {
    it('returns 204 with CORS preflight headers', async () => {
      const res = await OPTIONS();
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('PATCH');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
    });
  });

  describe('GET /api/content/briefs', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/content/briefs');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns briefs list for workspace', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      const mockBriefs = [
        {
          id: 'brief-1',
          title: 'Giới thiệu AI',
          objective: 'Chuyển đổi',
          audience: 'Doanh nghiệp tư nhân',
          status: 'DRAFT',
          workspaceId: 'ws1',
        },
      ];
      vi.mocked(prisma.contentBrief.findMany).mockResolvedValue(mockBriefs as any);

      const req = new NextRequest('http://localhost/api/content/briefs');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.briefs).toHaveLength(1);
      expect(data.briefs[0].title).toBe('Giới thiệu AI');
    });

    it('returns single brief when id is passed', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.contentBrief.findUnique).mockResolvedValue({
        id: 'brief-1',
        title: 'Giới thiệu AI',
        workspaceId: 'ws1',
      } as any);

      const req = new NextRequest('http://localhost/api/content/briefs?id=brief-1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.brief).toBeDefined();
      expect(data.brief.title).toBe('Giới thiệu AI');
    });
  });

  describe('POST /api/content/briefs', () => {
    it('returns 400 if title is empty', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      const req = new NextRequest('http://localhost/api/content/briefs', {
        method: 'POST',
        body: JSON.stringify({ title: '  ' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('creates a new brief successfully', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.contentBrief.create).mockResolvedValue({
        id: 'new-brief-1',
        title: 'Giới thiệu AI',
        objective: 'Chuyển đổi',
        audience: 'Doanh nghiệp tư nhân',
        status: 'DRAFT',
        workspaceId: 'ws1',
        createdById: 'u1',
      } as any);

      const req = new NextRequest('http://localhost/api/content/briefs', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Giới thiệu AI',
          objective: 'Chuyển đổi',
          audience: 'Doanh nghiệp tư nhân',
          keyMessage: 'Tiết kiệm thời gian',
          cta: 'Dùng thử ngay',
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.id).toBe('new-brief-1');
      expect(prisma.contentBrief.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Giới thiệu AI',
            objective: 'Chuyển đổi',
            audience: 'Doanh nghiệp tư nhân',
            workspaceId: 'ws1',
          }),
        })
      );
    });
  });

  describe('PATCH /api/content/briefs', () => {
    it('returns 400 if id is missing', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      const req = new NextRequest('http://localhost/api/content/briefs', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('returns 404 if brief does not exist', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.contentBrief.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/content/briefs', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'non-existent', title: 'Updated' }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(404);
    });

    it('updates brief successfully', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.contentBrief.findUnique).mockResolvedValue({
        id: 'brief-1',
        title: 'Giới thiệu AI',
        workspaceId: 'ws1',
      } as any);

      vi.mocked(prisma.contentBrief.update).mockResolvedValue({
        id: 'brief-1',
        title: 'Giới thiệu AI Bản Nâng Cấp',
        objective: 'Chuyển đổi cao',
        audience: 'Doanh nghiệp B2B',
        status: 'IN_PROGRESS',
        workspaceId: 'ws1',
      } as any);

      const req = new NextRequest('http://localhost/api/content/briefs', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'brief-1',
          title: 'Giới thiệu AI Bản Nâng Cấp',
          objective: 'Chuyển đổi cao',
          audience: 'Doanh nghiệp B2B',
          status: 'IN_PROGRESS',
        }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.brief.title).toBe('Giới thiệu AI Bản Nâng Cấp');
      expect(prisma.contentBrief.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'brief-1' },
          data: expect.objectContaining({
            title: 'Giới thiệu AI Bản Nâng Cấp',
            objective: 'Chuyển đổi cao',
            audience: 'Doanh nghiệp B2B',
            status: 'IN_PROGRESS',
          }),
        })
      );
    });
  });

  describe('DELETE /api/content/briefs', () => {
    it('deletes brief successfully if owned by workspace', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.contentBrief.findUnique).mockResolvedValue({
        id: 'brief-1',
        workspaceId: 'ws1',
      } as any);

      const req = new NextRequest('http://localhost/api/content/briefs?id=brief-1', {
        method: 'DELETE',
      });
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.contentBrief.delete).toHaveBeenCalledWith({
        where: { id: 'brief-1' },
      });
    });
  });
});
