import { NextRequest } from 'next/server';
import { GET, POST, PUT, PATCH, DELETE, OPTIONS } from '@/app/api/content/templates/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    contentTemplate: {
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

describe('Content Templates API (F076) - /api/content/templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OPTIONS /api/content/templates', () => {
    it('returns 204 with CORS preflight headers', async () => {
      const res = await OPTIONS();
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('PATCH');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
    });
  });

  describe('GET /api/content/templates', () => {
    it('returns 401 if unauthorized and in test env without mock user', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/content/templates');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns templates list for workspace', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      const mockTemplates = [
        {
          id: 't1',
          name: 'Mẫu Khuyến Mãi',
          description: 'Mẫu bài viết sale cuối tuần',
          postType: 'FEED',
          caption: 'Giảm giá 50%!',
          hashtags: '#sale',
          cta: 'Mua ngay!',
          platform: 'FACEBOOK_POST',
          workspaceId: 'ws1',
        },
      ];

      vi.mocked(prisma.contentTemplate.findMany).mockResolvedValue(mockTemplates as any);

      const req = new NextRequest('http://localhost/api/content/templates');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.templates).toHaveLength(1);
      expect(data.templates[0].name).toBe('Mẫu Khuyến Mãi');
    });
  });

  describe('POST /api/content/templates', () => {
    it('creates a new template', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.contentTemplate.create).mockResolvedValue({
        id: 'new_t1',
        name: 'Mẫu Mới',
        description: 'Mô tả',
        postType: 'FEED',
        caption: 'Caption',
        hashtags: '#test',
        cta: 'CTA',
        platform: 'FACEBOOK_POST',
        workspaceId: 'ws1',
      } as any);

      const req = new NextRequest('http://localhost/api/content/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Mẫu Mới',
          description: 'Mô tả',
          caption: 'Caption',
          hashtags: '#test',
          cta: 'CTA',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBe('new_t1');
    });

    it('returns 400 if name is missing', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      const req = new NextRequest('http://localhost/api/content/templates', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('PUT / PATCH /api/content/templates', () => {
    it('updates an existing template', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.contentTemplate.findUnique).mockResolvedValue({
        id: 't1',
        name: 'Tên cũ',
        workspaceId: 'ws1',
      } as any);

      vi.mocked(prisma.contentTemplate.update).mockResolvedValue({
        id: 't1',
        name: 'Tên mới',
        workspaceId: 'ws1',
      } as any);

      const req = new NextRequest('http://localhost/api/content/templates', {
        method: 'PUT',
        body: JSON.stringify({
          id: 't1',
          name: 'Tên mới',
        }),
      });

      const res = await PUT(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe('Tên mới');
    });

    it('creates template if id is not found (e.g. formula template override)', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.contentTemplate.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.contentTemplate.create).mockResolvedValue({
        id: 'created_from_formula',
        name: 'Công thức AIDA tùy biến',
        workspaceId: 'ws1',
      } as any);

      const req = new NextRequest('http://localhost/api/content/templates', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'formula_aida',
          name: 'Công thức AIDA tùy biến',
          caption: 'Caption mới',
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe('Công thức AIDA tùy biến');
    });
  });

  describe('DELETE /api/content/templates', () => {
    it('deletes an existing template', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.contentTemplate.findUnique).mockResolvedValue({
        id: 't1',
        workspaceId: 'ws1',
      } as any);

      vi.mocked(prisma.contentTemplate.delete).mockResolvedValue({ id: 't1' } as any);

      const req = new NextRequest('http://localhost/api/content/templates?id=t1', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
