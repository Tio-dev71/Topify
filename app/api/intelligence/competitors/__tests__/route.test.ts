import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => ({
  default: {
    competitorPage: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('Competitors API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null);
      const req = new NextRequest('http://localhost/api/intelligence/competitors');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns competitors list', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: '1' } } as any);
      const mockData = [{ id: '1', name: 'Test' }];
      vi.mocked(prisma.competitorPage.findMany).mockResolvedValueOnce(mockData as any);
      
      const req = new NextRequest('http://localhost/api/intelligence/competitors?workspaceId=w1');
      const res = await GET(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json).toEqual(mockData);
      expect(prisma.competitorPage.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'w1' },
        include: { _count: { select: { posts: true } } },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('POST', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null);
      const req = new NextRequest('http://localhost/api/intelligence/competitors', {
        method: 'POST',
        body: JSON.stringify({ url: 'http://test.com', name: 'Test', workspaceId: 'w1' })
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 if url is missing', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: '1' } } as any);
      const req = new NextRequest('http://localhost/api/intelligence/competitors', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' })
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('creates new competitor page', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: '1' } } as any);
      const mockData = { id: '1', url: 'http://test.com', name: 'Test' };
      vi.mocked(prisma.competitorPage.create).mockResolvedValueOnce(mockData as any);

      const req = new NextRequest('http://localhost/api/intelligence/competitors', {
        method: 'POST',
        body: JSON.stringify({ url: 'http://test.com', name: 'Test', workspaceId: 'w1' })
      });
      const res = await POST(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json).toEqual(mockData);
    });

    it('handles unique constraint violation', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: '1' } } as any);
      const error = new Error('Unique constraint failed');
      (error as any).code = 'P2002';
      vi.mocked(prisma.competitorPage.create).mockRejectedValueOnce(error);

      const req = new NextRequest('http://localhost/api/intelligence/competitors', {
        method: 'POST',
        body: JSON.stringify({ url: 'http://test.com', name: 'Test', workspaceId: 'w1' })
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("This page is already being tracked.");
    });
  });
});
