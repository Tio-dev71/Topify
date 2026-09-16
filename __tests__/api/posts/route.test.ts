import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/posts/route';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { enqueuePublish, schedulePublish } from '@/lib/queue';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db', () => {
  const mockPrisma = {
    post: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    videoAsset: {
      findUnique: vi.fn(),
    }
  };
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/queue', () => ({
  enqueuePublish: vi.fn(),
  schedulePublish: vi.fn(),
}));

describe('Posts API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/posts');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns posts for authorized admin user', async () => {
      vi.mocked(auth).mockResolvedValue({ 
        user: { id: 'admin-1', role: 'ADMIN', workspaceId: 'ws-1' }, 
        expires: '1' 
      } as any);

      const mockPosts = [{ id: '1', title: 'Test' }];
      vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);

      const req = new NextRequest('http://localhost/api/posts?status=PUBLISHED&limit=10');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.posts).toEqual(mockPosts);
      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1', status: 'PUBLISHED' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });

    it('filters posts for staff user', async () => {
      vi.mocked(auth).mockResolvedValue({ 
        user: { id: 'staff-1', role: 'STAFF', workspaceId: 'ws-1' }, 
        expires: '1' 
      } as any);

      vi.mocked(prisma.post.findMany).mockResolvedValue([]);

      const req = new NextRequest('http://localhost/api/posts');
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1', createdById: 'staff-1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  describe('POST', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/posts', { method: 'POST', body: JSON.stringify({}) });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 if validation fails', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      const req = new NextRequest('http://localhost/api/posts', { 
        method: 'POST', 
        body: JSON.stringify({ title: '' }) 
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 404 if video asset not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);
      vi.mocked(prisma.videoAsset.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/posts', { 
        method: 'POST', 
        body: JSON.stringify({
          title: 'Test',
          videoAssetId: 'video-1',
          platforms: ['FACEBOOK_REELS'],
          publishMode: 'now'
        }) 
      });
      const res = await POST(req);
      expect(res.status).toBe(404);
    });

    it('creates post and enqueues publish if mode is now', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);
      vi.mocked(prisma.videoAsset.findUnique).mockResolvedValue({ id: 'video-1', workspaceId: 'ws-1' } as any);
      
      const mockPost = { id: 'post-1' };
      vi.mocked(prisma.post.create).mockResolvedValue(mockPost as any);

      const req = new NextRequest('http://localhost/api/posts', { 
        method: 'POST', 
        body: JSON.stringify({
          title: 'Test',
          videoAssetId: 'video-1',
          platforms: ['FACEBOOK_REELS'],
          publishMode: 'now'
        }) 
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json).toEqual(mockPost);
      expect(enqueuePublish).toHaveBeenCalledWith('post-1');
    });

    it('creates post and schedules publish if mode is schedule', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);
      vi.mocked(prisma.videoAsset.findUnique).mockResolvedValue({ id: 'video-1', workspaceId: 'ws-1' } as any);
      
      const mockPost = { id: 'post-1' };
      vi.mocked(prisma.post.create).mockResolvedValue(mockPost as any);

      const req = new NextRequest('http://localhost/api/posts', { 
        method: 'POST', 
        body: JSON.stringify({
          title: 'Test',
          videoAssetId: 'video-1',
          platforms: ['FACEBOOK_REELS'],
          publishMode: 'schedule',
          scheduledAt: '2025-01-01T00:00:00Z'
        }) 
      });
      const res = await POST(req);
      
      expect(res.status).toBe(201);
      expect(schedulePublish).toHaveBeenCalledWith('post-1', expect.any(Date));
    });
  });
});
