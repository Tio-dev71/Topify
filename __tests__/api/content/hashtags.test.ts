import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE, OPTIONS } from '@/app/api/content/hashtags/route';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    hashtagLibrary: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
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

describe('Content Hashtags & CTA API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OPTIONS', () => {
    it('returns 204 with CORS preflight headers', async () => {
      const res = await OPTIONS();
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('GET', () => {
    it('returns 401 if unauthorized in test environment', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/content/hashtags');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns hashtag items list for workspace', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u-1', workspaceId: 'ws-1' },
      } as any);
      vi.mocked(prisma.hashtagLibrary.findMany).mockResolvedValue([
        {
          id: 'item-1',
          name: 'Bộ Hashtags Thời Trang',
          hashtags: '#fashion #trend #ootd',
          category: 'HASHTAG',
          workspaceId: 'ws-1',
        },
        {
          id: 'item-2',
          name: 'CTA Đặt Hàng Ngay',
          hashtags: 'Nhắn tin ngay để nhận ưu đãi hôm nay!',
          category: 'CTA',
          workspaceId: 'ws-1',
        },
      ] as any);

      const req = new NextRequest('http://localhost/api/content/hashtags');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toHaveLength(2);
      expect(data.items[0].name).toBe('Bộ Hashtags Thời Trang');
      expect(data.items[1].category).toBe('CTA');
    });
  });

  describe('POST', () => {
    it('returns 400 if name or hashtags are missing', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u-1', workspaceId: 'ws-1' },
      } as any);

      const req = new NextRequest('http://localhost/api/content/hashtags', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('creates a new hashtag library item', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u-1', workspaceId: 'ws-1' },
      } as any);
      vi.mocked(prisma.hashtagLibrary.create).mockResolvedValue({
        id: 'new-item-1',
        name: 'Chiến dịch Tết',
        hashtags: '#Tet #Sale',
        category: 'HASHTAG',
        workspaceId: 'ws-1',
      } as any);

      const req = new NextRequest('http://localhost/api/content/hashtags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Chiến dịch Tết',
          hashtags: '#Tet #Sale',
          category: 'HASHTAG',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBe('new-item-1');
    });
  });

  describe('PATCH', () => {
    it('updates an existing item', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u-1', workspaceId: 'ws-1' },
      } as any);
      vi.mocked(prisma.hashtagLibrary.findUnique).mockResolvedValue({
        id: 'item-1',
        workspaceId: 'ws-1',
      } as any);
      vi.mocked(prisma.hashtagLibrary.update).mockResolvedValue({
        id: 'item-1',
        name: 'Tên mới',
        hashtags: '#new',
        category: 'HASHTAG',
      } as any);

      const req = new NextRequest('http://localhost/api/content/hashtags', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'item-1',
          name: 'Tên mới',
          hashtags: '#new',
        }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe('Tên mới');
    });
  });

  describe('DELETE', () => {
    it('deletes an existing item', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u-1', workspaceId: 'ws-1' },
      } as any);
      vi.mocked(prisma.hashtagLibrary.findUnique).mockResolvedValue({
        id: 'item-1',
        workspaceId: 'ws-1',
      } as any);
      vi.mocked(prisma.hashtagLibrary.delete).mockResolvedValue({
        id: 'item-1',
      } as any);

      const req = new NextRequest('http://localhost/api/content/hashtags?id=item-1', {
        method: 'DELETE',
      });
      const res = await DELETE(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
