import { NextRequest } from 'next/server';
import { POST } from '@/app/api/competitors/posts/sync/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import * as rapidClient from '@/lib/rapidapi/client';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    competitorPage: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    competitorPost: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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

vi.mock('@/lib/audit-log', () => ({
  recordAuditLog: vi.fn(),
}));

vi.mock('@/lib/rapidapi/client', () => ({
  getFacebookDeepPosts: vi.fn(),
  getFacebookPagePosts: vi.fn(),
  getFacebookGroupPosts: vi.fn(),
  getFacebookPageInfo: vi.fn(),
  getRealTimeNews: vi.fn(),
  getTiktokUserPosts: vi.fn(),
}));

describe('Competitor Posts Sync API - /api/competitors/posts/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/competitors/posts/sync', {
      method: 'POST',
      body: JSON.stringify({ pageId: 'page-1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 if pageId is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const req = new NextRequest('http://localhost/api/competitors/posts/sync', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 if competitor page does not exist', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.competitorPage.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/competitors/posts/sync', {
      method: 'POST',
      body: JSON.stringify({ pageId: 'non-existent' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('scrapes >= 90% of posts published today using deep pagination for Facebook page', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' } } as any);

    const mockPage = {
      id: 'page-pho',
      name: 'Phở',
      url: 'https://www.facebook.com/PhoTeam',
      avatar: null,
      workspaceId: 'ws-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.competitorPage.findUnique).mockResolvedValue(mockPage as any);

    // Simulate 15 posts published today on fanpage "Phở" + 5 posts from yesterday
    const now = new Date();
    const mockPosts: any[] = [];
    for (let i = 0; i < 15; i++) {
      const postTime = new Date(now.getTime() - i * 10 * 60 * 1000); // within today (past 2.5 hours)
      mockPosts.push({
        post_id: `post-pho-today-${i}`,
        message: `Hôm nay Phở ra mắt bài viết số ${i + 1}`,
        timestamp: Math.floor(postTime.getTime() / 1000),
        reactions_count: 100 + i * 10,
        comments_count: 20 + i,
        reshare_count: 5 + i,
        image: { uri: `https://cdn.fb.com/pho-${i}.jpg` },
      });
    }
    for (let j = 0; j < 5; j++) {
      const yesterdayTime = new Date(now.getTime() - 2 * 24 * 3600 * 1000); // 2 days ago
      mockPosts.push({
        post_id: `post-pho-old-${j}`,
        message: `Bài viết cũ ${j}`,
        timestamp: Math.floor(yesterdayTime.getTime() / 1000),
        reactions_count: 50,
        comments_count: 10,
        reshare_count: 2,
      });
    }

    vi.mocked(rapidClient.getFacebookDeepPosts).mockResolvedValue({
      posts: mockPosts,
      pagesScanned: 7,
    });

    vi.mocked(prisma.competitorPost.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.competitorPost.create).mockResolvedValue({ id: 'cp-1' } as any);
    vi.mocked(prisma.competitorPost.count).mockResolvedValue(20);

    const req = new NextRequest('http://localhost/api/competitors/posts/sync', {
      method: 'POST',
      body: JSON.stringify({ pageId: 'page-pho' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.addedCount).toBe(20);
    expect(data.todayPostsCount).toBeGreaterThanOrEqual(14); // >= 90% of the 15 posts today
    expect(rapidClient.getFacebookDeepPosts).toHaveBeenCalledWith(
      'https://www.facebook.com/PhoTeam',
      expect.objectContaining({
        maxPages: 12,
        minPosts: 20,
      })
    );
    expect(data.message).toContain('Đã cào và cập nhật thành công 20 bài viết');
  });

  it('scrapes group posts properly when link is a Facebook group', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

    const mockGroupPage = {
      id: 'page-group',
      name: 'Không sợ chó',
      url: 'https://www.facebook.com/groups/170667840008977/',
      workspaceId: 'ws-1',
    };
    vi.mocked(prisma.competitorPage.findUnique).mockResolvedValue(mockGroupPage as any);

    vi.mocked(rapidClient.getFacebookDeepPosts).mockResolvedValue({
      posts: [
        {
          post_id: 'group-p1',
          message: 'Tin nóng trong group Không sợ chó',
          timestamp: Math.floor(Date.now() / 1000),
          reactions_count: 500,
          comments_count: 60,
          reshare_count: 15,
        },
      ],
      pagesScanned: 1,
    });

    vi.mocked(prisma.competitorPost.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.competitorPost.create).mockResolvedValue({ id: 'cp-group-1' } as any);
    vi.mocked(prisma.competitorPost.count).mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/competitors/posts/sync', {
      method: 'POST',
      body: JSON.stringify({ pageId: 'page-group' }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(rapidClient.getFacebookDeepPosts).toHaveBeenCalledWith(
      'https://www.facebook.com/groups/170667840008977/',
      expect.any(Object)
    );
  });

  it('deduplicates and updates engagement metrics for already existing posts', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

    const mockPage = {
      id: 'page-jk',
      name: 'Page JK',
      url: 'https://www.facebook.com/JKVN901',
      workspaceId: 'ws-1',
    };
    vi.mocked(prisma.competitorPage.findUnique).mockResolvedValue(mockPage as any);

    vi.mocked(rapidClient.getFacebookDeepPosts).mockResolvedValue({
      posts: [
        {
          post_id: 'existing-post-1',
          message: 'Nội dung bài viết',
          timestamp: Math.floor(Date.now() / 1000),
          reactions_count: 1200,
          comments_count: 350,
          reshare_count: 40,
        },
      ],
      pagesScanned: 1,
    });

    // Existing post in DB
    vi.mocked(prisma.competitorPost.findFirst).mockResolvedValue({
      id: 'db-post-1',
      externalId: 'existing-post-1',
    } as any);
    vi.mocked(prisma.competitorPost.update).mockResolvedValue({ id: 'db-post-1' } as any);
    vi.mocked(prisma.competitorPost.count).mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/competitors/posts/sync', {
      method: 'POST',
      body: JSON.stringify({ pageId: 'page-jk' }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.addedCount).toBe(0);
    expect(prisma.competitorPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'db-post-1' },
        data: expect.objectContaining({
          likesCount: 1200,
          commentsCount: 350,
          sharesCount: 40,
        }),
      })
    );
  });
});
