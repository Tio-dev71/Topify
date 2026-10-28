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
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    videoAsset: {
      findUnique: vi.fn(),
    },
    socialAccount: {
      findMany: vi.fn(),
    },
    facebookAccount: {
      count: vi.fn(),
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

      const mockPosts = [{ 
        id: '1', 
        title: 'Test',
        platforms: [],
        videoAsset: {
          originalFileName: 'Test',
          storageUrl: '',
        }
      }];
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
        take: 100,
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

    it('returns 400 if video asset is a draft placeholder', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);

      const req = new NextRequest('http://localhost/api/posts', { 
        method: 'POST', 
        body: JSON.stringify({
          title: 'Test AI Draft',
          videoAssetId: 'draft_1792078349216',
          platforms: ['FACEBOOK_REELS'],
          publishMode: 'now'
        }) 
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('bản thảo AI');
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

    it('returns 400 if user has no connected accounts for requested platforms', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);
      vi.mocked(prisma.videoAsset.findUnique).mockResolvedValue({ id: 'video-1', workspaceId: 'ws-1' } as any);
      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue([]);
      vi.mocked(prisma.facebookAccount.count).mockResolvedValue(0);

      const req = new NextRequest('http://localhost/api/posts', { 
        method: 'POST', 
        body: JSON.stringify({
          title: 'Test',
          videoAssetId: 'video-1',
          platforms: ['FACEBOOK_REELS', 'TIKTOK_VIDEO'],
          publishMode: 'now'
        }) 
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain('Vui lòng kết nối tài khoản');
      expect(json.error).toContain('Facebook');
      expect(json.error).toContain('TikTok');
    });

    it('creates post and enqueues publish if mode is now', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);
      vi.mocked(prisma.videoAsset.findUnique).mockResolvedValue({ id: 'video-1', workspaceId: 'ws-1' } as any);
      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue([{ provider: 'META' } as any]);
      
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
      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue([{ provider: 'META' } as any]);
      
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

    it('creates post and schedules publish if mode is random_window (F022)', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);
      vi.mocked(prisma.videoAsset.findUnique).mockResolvedValue({ id: 'video-1', workspaceId: 'ws-1' } as any);
      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue([{ provider: 'META' } as any]);
      
      const mockPost = { id: 'post-random-1', status: 'SCHEDULED' };
      vi.mocked(prisma.post.create).mockResolvedValue(mockPost as any);

      const futureStart = new Date(Date.now() + 3600 * 1000).toISOString();
      const futureEnd = new Date(Date.now() + 7200 * 1000).toISOString();

      const req = new NextRequest('http://localhost/api/posts', { 
        method: 'POST', 
        body: JSON.stringify({
          title: 'Test Random Window Post',
          videoAssetId: 'video-1',
          platforms: ['FACEBOOK_REELS'],
          publishMode: 'random_window',
          randomWindowStart: futureStart,
          randomWindowEnd: futureEnd,
        }) 
      });
      const res = await POST(req);
      
      expect(res.status).toBe(201);
      expect(schedulePublish).toHaveBeenCalledWith('post-random-1', expect.any(Date));
    });

    it('rejects random_window post creation if window end is in the past (F022)', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);
      vi.mocked(prisma.videoAsset.findUnique).mockResolvedValue({ id: 'video-1', workspaceId: 'ws-1' } as any);
      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue([{ provider: 'META' } as any]);

      const pastStart = new Date(Date.now() - 7200 * 1000).toISOString();
      const pastEnd = new Date(Date.now() - 3600 * 1000).toISOString();

      const req = new NextRequest('http://localhost/api/posts', { 
        method: 'POST', 
        body: JSON.stringify({
          title: 'Test Past Random Window Post',
          videoAssetId: 'video-1',
          platforms: ['FACEBOOK_REELS'],
          publishMode: 'random_window',
          randomWindowStart: pastStart,
          randomWindowEnd: pastEnd,
        }) 
      });
      const res = await POST(req);
      const json = await res.json();
      
      expect(res.status).toBe(400);
      expect(json.error).toContain('đã kết thúc trong quá khứ');
    });

    it('re-randomizes into remaining future time when window is in progress (start < now < end)', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);
      vi.mocked(prisma.videoAsset.findUnique).mockResolvedValue({ id: 'video-1', workspaceId: 'ws-1' } as any);
      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue([{ provider: 'META' } as any]);

      const mockPost = { id: 'post-random-progress', status: 'SCHEDULED' };
      vi.mocked(prisma.post.create).mockResolvedValue(mockPost as any);

      // Window started 1 hour ago, ends 2 hours in future (in progress)
      const windowStart = new Date(Date.now() - 3600 * 1000).toISOString();
      const windowEnd = new Date(Date.now() + 7200 * 1000).toISOString();
      // Client previously tried to send a past timestamp
      const pastScheduledAt = new Date(Date.now() - 1800 * 1000).toISOString();

      const req = new NextRequest('http://localhost/api/posts', { 
        method: 'POST', 
        body: JSON.stringify({
          title: 'Test In Progress Window Post',
          videoAssetId: 'video-1',
          platforms: ['FACEBOOK_REELS'],
          publishMode: 'random_window',
          scheduledAt: pastScheduledAt,
          randomWindowStart: windowStart,
          randomWindowEnd: windowEnd,
        }) 
      });
      const res = await POST(req);
      
      expect(res.status).toBe(201);
      // Scheduled date must be strictly in the future (> Date.now())
      const scheduledArg = vi.mocked(schedulePublish).mock.calls.find(c => c[0] === 'post-random-progress')?.[1];
      expect(scheduledArg).toBeInstanceOf(Date);
      expect(scheduledArg!.getTime()).toBeGreaterThan(Date.now());
    });

    it('allows YouTube Shorts post creation when video duration > 180s and returns warning', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);
      vi.mocked(prisma.videoAsset.findUnique).mockResolvedValue({ id: 'video-bts-1', workspaceId: 'ws-1', duration: 211 } as any);
      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue([{ provider: 'YOUTUBE' } as any]);

      const mockPost = { id: 'post-bts-1', status: 'SCHEDULED' };
      vi.mocked(prisma.post.create).mockResolvedValue(mockPost as any);

      const req = new NextRequest('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: "[SPECIAL CLIP] BTS 'Life Goes On'",
          videoAssetId: 'video-bts-1',
          platforms: ['YOUTUBE_SHORTS'],
          publishMode: 'schedule',
          scheduledAt: '2026-10-28T20:26:00.000Z',
        }),
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.warning).toBeDefined();
      expect(json.warning).toContain('211s');
      expect(json.warning).toContain('video thường');
      expect(schedulePublish).toHaveBeenCalledWith('post-bts-1', expect.any(Date));
    });

    it('safely cleans lone surrogate characters from title and caption without throwing error', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);
      vi.mocked(prisma.videoAsset.findUnique).mockResolvedValue({ id: 'video-grandma-1', workspaceId: 'ws-1', duration: 30 } as any);
      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue([{ provider: 'YOUTUBE' } as any]);

      const mockPost = { id: 'post-grandma-1', status: 'PUBLISHING' };
      vi.mocked(prisma.post.create).mockResolvedValue(mockPost as any);

      const badTitle = 'Mom Took My Money... Then Grandma Arrived #funnycats #grandma \uD800';
      const badCaption = '✨ Caption with spin variant and lone surrogate \uD83D\uD83D here!';

      const req = new NextRequest('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: badTitle,
          caption: badCaption,
          videoAssetId: 'video-grandma-1',
          platforms: ['YOUTUBE_SHORTS'],
          publishMode: 'now',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);

      // Verify that prisma.post.create was called with sanitized strings without lone surrogates
      expect(prisma.post.create).toHaveBeenCalled();
      const callData = vi.mocked(prisma.post.create).mock.calls[0][0].data;
      expect(callData.title).not.toContain('\uD800');
      expect(callData.caption).not.toContain('\uD83D\uD83D');
      expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(callData.title as string)).toBe(false);
      expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(callData.caption as string)).toBe(false);
    });

    it('recovers from Prisma lone leading surrogate invocation error via automatic deep sanitization retry', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);
      vi.mocked(prisma.videoAsset.findUnique).mockResolvedValue({ id: 'video-retry-1', workspaceId: 'ws-1', duration: 15 } as any);
      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue([{ provider: 'YOUTUBE' } as any]);

      const mockPost = { id: 'post-retry-1', status: 'PUBLISHING' };
      // First call throws the exact Prisma lone leading surrogate error
      // Second call (retry) succeeds
      vi.mocked(prisma.post.create)
        .mockRejectedValueOnce(new Error('Invalid `prisma.post.create()` invocation: lone leading surrogate in hex escape at line 1 column 262'))
        .mockResolvedValueOnce(mockPost as any);

      const req = new NextRequest('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Mom Took My Money... Then Grandma Arrived #funnycats #catmemes #grandma.mp4',
          caption: '🔥 Bí quyết triệu view #grandma',
          videoAssetId: 'video-retry-1',
          platforms: ['YOUTUBE_SHORTS'],
          publishMode: 'now',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('post-retry-1');
      expect(prisma.post.create).toHaveBeenCalledTimes(2);
    });

    it('creates post with publishMode now and isEvergreen: true, enqueues immediate publish and pre-schedules recycled child post', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' }, expires: '1' } as any);
      vi.mocked(prisma.videoAsset.findUnique).mockResolvedValue({ id: 'video-1', workspaceId: 'ws-1', duration: 30 } as any);
      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue([{ provider: 'META' } as any]);

      const mockParentPost = {
        id: 'parent-eg-1',
        title: 'Evergreen Video',
        status: 'PUBLISHING',
        isEvergreen: true,
        recycleIntervalDays: 2,
        platforms: [{ platform: 'FACEBOOK_REELS', status: 'PENDING' }],
      };
      const mockChildPost = {
        id: 'child-recycled-1',
        title: 'Evergreen Video',
        status: 'SCHEDULED',
        originalPostId: 'parent-eg-1',
        isEvergreen: false,
        platforms: [{ platform: 'FACEBOOK_REELS', status: 'PENDING' }],
      };

      vi.mocked(prisma.post.create)
        .mockResolvedValueOnce(mockParentPost as any)
        .mockResolvedValueOnce(mockChildPost as any);

      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        ...mockParentPost,
        status: 'PUBLISHED',
      } as any);

      const req = new NextRequest('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Evergreen Video',
          videoAssetId: 'video-1',
          platforms: ['FACEBOOK_REELS'],
          publishMode: 'now',
          isEvergreen: true,
          recycleIntervalDays: 2,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('parent-eg-1');
      expect(json.status).toBe('PUBLISHED');
      expect(enqueuePublish).toHaveBeenCalledWith('parent-eg-1');
      expect(schedulePublish).toHaveBeenCalledWith(
        'child-recycled-1',
        expect.any(Date)
      );
      expect(prisma.post.create).toHaveBeenCalledTimes(2);
    });
  });
});
