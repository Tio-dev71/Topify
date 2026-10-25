import { NextRequest } from 'next/server';
import { GET } from '@/app/api/content/evergreen/route';
import { POST as recyclePost } from '@/app/api/content/evergreen/recycle/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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

vi.mock('@/lib/queue/publisher-service', () => ({
  checkAndPublishDuePosts: vi.fn(),
}));

vi.mock('@/lib/audit-log', () => ({
  recordAuditLog: vi.fn(),
}));

describe('Evergreen & Recycle Content API (F083)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/content/evergreen', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/content/evergreen');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('identifies overdue posts for suggestions queue', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user_1', workspaceId: 'ws_1' },
      } as any);

      // Post published 45 days ago, interval is 30 days -> overdue!
      const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.post.findMany).mockResolvedValue([
        {
          id: 'post_evergreen_1',
          title: 'Bài viết kinh điển cần tái bản',
          caption: 'Nội dung luôn luôn đúng theo năm tháng.',
          status: 'PUBLISHED',
          isEvergreen: true,
          recycleIntervalDays: 30,
          publishedAt: fortyFiveDaysAgo,
          lastRecycledAt: null,
          createdAt: fortyFiveDaysAgo,
          recycleCount: 0,
          media: [],
          platforms: [{ platform: 'FACEBOOK_POST', status: 'PUBLISHED' }],
          createdBy: { name: 'Admin', email: 'admin@test.com' },
        },
      ] as any);

      const req = new NextRequest('http://localhost/api/content/evergreen?tab=all');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.metrics.totalEvergreen).toBe(1);
      expect(data.metrics.dueCount).toBe(1);
      expect(data.suggestions.length).toBe(1);
      expect(data.suggestions[0].id).toBe('post_evergreen_1');
      expect(data.suggestions[0].isDue).toBe(true);
      expect(data.suggestions[0].daysOverdue).toBeGreaterThanOrEqual(14);
      expect(data.suggestions[0].nextRecycleDate).toBeDefined();
    });

    it('calculates nextRecycleDate and daysUntilRecycle for newly published 2-day evergreen post', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user_1', workspaceId: 'ws_1' },
      } as any);

      const now = new Date();

      // Post published today with 2-day recycle interval
      vi.mocked(prisma.post.findMany)
        .mockResolvedValueOnce([
          {
            id: 'post_evergreen_new',
            title: 'Bài viết đăng ngay kèm Evergreen 2 ngày',
            caption: 'Nội dung luôn tươi mới',
            status: 'PUBLISHED',
            isEvergreen: true,
            recycleIntervalDays: 2,
            publishedAt: now,
            lastRecycledAt: null,
            createdAt: now,
            recycleCount: 0,
            media: [],
            platforms: [{ platform: 'TIKTOK_VIDEO', status: 'PUBLISHED' }],
            createdBy: { name: 'Admin', email: 'admin@test.com' },
          },
        ] as any)
        .mockResolvedValueOnce([] as any); // no recycled children yet

      const req = new NextRequest('http://localhost/api/content/evergreen?tab=all');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.metrics.totalEvergreen).toBe(1);
      expect(data.metrics.dueCount).toBe(0);
      expect(data.library.length).toBe(1);
      expect(data.library[0].id).toBe('post_evergreen_new');
      expect(data.library[0].isDue).toBe(false);
      expect(data.library[0].daysUntilRecycle).toBe(2);
      expect(data.library[0].nextRecycleDate).toBeDefined();
      const nextDate = new Date(data.library[0].nextRecycleDate);
      expect(nextDate.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('POST /api/content/evergreen/recycle', () => {
    it('creates a cloned post and updates original recycle count', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user_1', workspaceId: 'ws_1' },
      } as any);

      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        id: 'post_orig',
        title: 'Bài viết gốc',
        caption: 'Caption ban đầu',
        firstComment: 'Comment 1',
        hashtags: '#test',
        videoAssetId: 'video_1',
        postType: 'REEL',
        workspaceId: 'ws_1',
        platforms: [{ platform: 'FACEBOOK_REELS', status: 'PUBLISHED' }],
        media: [],
      } as any);

      vi.mocked(prisma.post.create).mockResolvedValue({
        id: 'post_cloned_new',
        title: 'Bài viết gốc (Tái bản)',
        caption: 'Caption đã được tối ưu mới',
        status: 'SCHEDULED',
        originalPostId: 'post_orig',
      } as any);

      const req = new NextRequest('http://localhost/api/content/evergreen/recycle', {
        method: 'POST',
        body: JSON.stringify({
          postId: 'post_orig',
          newTitle: 'Bài viết gốc (Tái bản)',
          newCaption: 'Caption đã được tối ưu mới',
          newScheduledAt: '2026-10-20T09:00:00Z',
          publishMode: 'schedule',
        }),
      });

      const res = await recyclePost(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'post_orig' },
          data: expect.objectContaining({
            recycleCount: { increment: 1 },
          }),
        })
      );
    });
  });
});
