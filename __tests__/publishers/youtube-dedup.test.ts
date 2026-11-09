import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    post: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    postPlatform: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    publishLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-1' }),
    },
    socialAccount: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/publishers', () => ({
  getPublisher: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { getPublisher } from '@/lib/publishers';
import { publishPostDirectly } from '@/lib/queue/publisher-service';

describe('YouTube Publishing - De-duplication and Concurrency Safety (TDD)', () => {
  const mockPostId = 'post-yt-123';
  const mockPlatformId = 'post-platform-yt-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('RED: Atomic lock prevents duplicate publishing when publishPostDirectly is called concurrently', async () => {
    const mockPost = {
      id: mockPostId,
      title: 'Shorts Video Test',
      caption: 'Awesome video caption',
      firstComment: 'Subscribe to my channel!',
      hashtags: '#Shorts #Trending',
      postType: 'REEL',
      createdById: 'user-1',
      workspaceId: 'ws-1',
      status: 'PENDING',
      videoAsset: {
        id: 'asset-1',
        storageUrl: 'https://storage.local/test.mp4',
        mimeType: 'video/mp4',
        duration: 30,
        size: 5000000,
      },
      platforms: [
        {
          id: mockPlatformId,
          platform: 'YOUTUBE_SHORTS',
          status: 'PENDING',
          customTitle: null,
          customCaption: null,
          customFirstComment: null,
          externalPostId: null,
        },
      ],
    };

    (prisma.post.findUnique as any).mockResolvedValue(mockPost);
    (prisma.post.update as any).mockResolvedValue({ ...mockPost, status: 'PUBLISHING' });
    let claimed = false;
    (prisma.postPlatform.updateMany as any).mockImplementation(async () => {
      if (!claimed) {
        claimed = true;
        return { count: 1 };
      }
      return { count: 0 };
    });
    (prisma.socialAccount.findFirst as any).mockResolvedValue({
      id: 'social-yt-1',
      provider: 'YOUTUBE',
      status: 'CONNECTED',
      youtubeChannelId: 'channel-1',
      accessToken: 'encrypted_token',
      userId: 'user-1',
      workspaceId: 'ws-1',
    });

    const mockPublishReel = vi.fn().mockImplementation(async () => {
      // Simulate 50ms upload delay
      await new Promise((r) => setTimeout(r, 50));
      return { success: true, externalPostId: 'yt_uploaded_video_999' };
    });

    (getPublisher as any).mockReturnValue({
      publishReel: mockPublishReel,
    });

    // SIMULATE CONCURRENT INVOCATIONS (e.g. Next.js fallback + BullMQ worker)
    // In our new design, the atomic lock on postPlatform (updateMany where status in [PENDING, FAILED])
    // or post level must ensure only ONE call succeeds in acquiring the lock.
    // Let's test calling publishPostDirectly concurrently:
    const [call1, call2] = await Promise.all([
      publishPostDirectly(mockPostId),
      publishPostDirectly(mockPostId),
    ]);

    // EXPECTATION: mockPublishReel should ONLY be called ONCE across both concurrent calls
    expect(mockPublishReel).toHaveBeenCalledTimes(1);
    expect(call1.success || call2.success).toBe(true);
  });

  it('RED: Does not re-upload if postPlatform already has externalPostId', async () => {
    const mockPostWithExistingExternalId = {
      id: mockPostId,
      title: 'Shorts Video Test',
      caption: 'Awesome video caption',
      firstComment: 'My first comment',
      hashtags: '#Shorts',
      postType: 'REEL',
      createdById: 'user-1',
      workspaceId: 'ws-1',
      status: 'PUBLISHING',
      videoAsset: {
        id: 'asset-1',
        storageUrl: 'https://storage.local/test.mp4',
        mimeType: 'video/mp4',
        duration: 30,
      },
      platforms: [
        {
          id: mockPlatformId,
          platform: 'YOUTUBE_SHORTS',
          status: 'PUBLISHING',
          externalPostId: 'already_uploaded_yt_id_123',
        },
      ],
    };

    (prisma.post.findUnique as any).mockResolvedValue(mockPostWithExistingExternalId);
    (prisma.socialAccount.findFirst as any).mockResolvedValue({
      id: 'social-yt-1',
      provider: 'YOUTUBE',
      status: 'CONNECTED',
    });

    const mockPublishReel = vi.fn();
    (getPublisher as any).mockReturnValue({
      publishReel: mockPublishReel,
    });

    const result = await publishPostDirectly(mockPostId);

    // Because externalPostId already exists, it must not call publishReel again!
    expect(mockPublishReel).not.toHaveBeenCalled();
    expect(result.status).toBe('PUBLISHED');
  });

  it('RED: Preserves and passes firstComment to YouTube publisher', async () => {
    const commentText = '🔥 Link mua hàng tại bio mọi người nhé!';
    const mockPostWithComment = {
      id: mockPostId,
      title: 'Shorts Video with Comment',
      caption: 'Awesome video',
      firstComment: commentText,
      hashtags: '#Shorts',
      postType: 'REEL',
      createdById: 'user-1',
      workspaceId: 'ws-1',
      status: 'PENDING',
      videoAsset: {
        id: 'asset-1',
        storageUrl: 'https://storage.local/test.mp4',
        mimeType: 'video/mp4',
        duration: 30,
      },
      platforms: [
        {
          id: mockPlatformId,
          platform: 'YOUTUBE_SHORTS',
          status: 'PENDING',
          customTitle: null,
          customCaption: null,
          customFirstComment: null,
          externalPostId: null,
        },
      ],
    };

    (prisma.post.findUnique as any).mockResolvedValue(mockPostWithComment);
    (prisma.post.update as any).mockResolvedValue({ ...mockPostWithComment, status: 'PUBLISHING' });
    (prisma.postPlatform.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.socialAccount.findFirst as any).mockResolvedValue({
      id: 'social-yt-1',
      provider: 'YOUTUBE',
      status: 'CONNECTED',
      youtubeChannelId: 'channel-1',
    });

    const mockPublishReel = vi.fn().mockResolvedValue({
      success: true,
      externalPostId: 'yt_video_with_comment_777',
    });

    (getPublisher as any).mockReturnValue({
      publishReel: mockPublishReel,
    });

    await publishPostDirectly(mockPostId);

    expect(mockPublishReel).toHaveBeenCalledTimes(1);
    const passedPost = mockPublishReel.mock.calls[0][0];
    expect(passedPost.firstComment).toBe(commentText);
  });
});
