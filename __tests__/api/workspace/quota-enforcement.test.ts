import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertQuotaLimit, PLAN_LIMITS } from '@/lib/workspace/quota';
import prisma from '@/lib/db';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    workspace: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    allowedEmail: {
      count: vi.fn(),
    },
    post: {
      count: vi.fn(),
    },
    socialAccount: {
      count: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

describe('M8 Quota Enforcement & Token Limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Post Quota Enforcement (maxPostsPerMonth)', () => {
    it('allows posting when user is within monthly limit', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        id: 'ws-free',
        plan: 'FREE',
        planExpiresAt: null,
        subscriptionStatus: 'ACTIVE',
      } as any);

      vi.mocked(prisma.post.count).mockResolvedValue(10); // 10 / 30

      const result = await assertQuotaLimit({
        workspaceId: 'ws-free',
        feature: 'posts',
        countToAdd: 1,
      });

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(10);
      expect(result.max).toBe(PLAN_LIMITS.FREE.maxPostsPerMonth);
    });

    it('strictly blocks post creation when monthly limit is reached or exceeded', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        id: 'ws-free',
        plan: 'FREE',
        planExpiresAt: null,
        subscriptionStatus: 'ACTIVE',
      } as any);

      vi.mocked(prisma.post.count).mockResolvedValue(30); // 30 / 30 reached!

      const result = await assertQuotaLimit({
        workspaceId: 'ws-free',
        feature: 'posts',
        countToAdd: 1,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('hết định mức đăng bài trong tháng (30/30 bài)');
      expect(result.error).toContain('Vui lòng nâng cấp gói cước');
    });

    it('strictly blocks bulk post creation when batch would exceed remaining quota', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        id: 'ws-pro',
        plan: 'PRO',
        planExpiresAt: null,
        subscriptionStatus: 'ACTIVE',
      } as any);

      vi.mocked(prisma.post.count).mockResolvedValue(495); // 495 / 500

      const result = await assertQuotaLimit({
        workspaceId: 'ws-pro',
        feature: 'posts',
        countToAdd: 10, // 495 + 10 = 505 > 500!
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('hết định mức đăng bài trong tháng');
    });
  });

  describe('Social Channels Quota Enforcement (maxChannels)', () => {
    it('allows connecting when channels under limit', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        id: 'ws-free',
        plan: 'FREE',
        planExpiresAt: null,
        subscriptionStatus: 'ACTIVE',
      } as any);

      vi.mocked(prisma.socialAccount.count).mockResolvedValue(2); // 2 / 3

      const result = await assertQuotaLimit({
        workspaceId: 'ws-free',
        feature: 'channels',
        countToAdd: 1,
      });

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(2);
      expect(result.max).toBe(3);
    });

    it('blocks connecting when max channels reached', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        id: 'ws-free',
        plan: 'FREE',
        planExpiresAt: null,
        subscriptionStatus: 'ACTIVE',
      } as any);

      vi.mocked(prisma.socialAccount.count).mockResolvedValue(3); // 3 / 3 reached

      const result = await assertQuotaLimit({
        workspaceId: 'ws-free',
        feature: 'channels',
        countToAdd: 1,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('giới hạn tối đa 3 kênh kết nối');
    });
  });

  describe('Seat Quota Enforcement (maxSeats)', () => {
    it('blocks inviting when seat quota reached', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        id: 'ws-free',
        plan: 'FREE',
        planExpiresAt: null,
        subscriptionStatus: 'ACTIVE',
      } as any);

      vi.mocked(prisma.allowedEmail.count).mockResolvedValue(2);
      vi.mocked(prisma.user.count).mockResolvedValue(2); // 2 / 2 seats

      const result = await assertQuotaLimit({
        workspaceId: 'ws-free',
        feature: 'seats',
        countToAdd: 1,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('giới hạn số lượng ghế nhân sự (2/2 ghế)');
    });
  });

  describe('Expired Subscription Downgrade Behavior', () => {
    it('automatically applies FREE plan limits when paid subscription has expired and not in grace', async () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 3600 * 1000); // 5 days ago
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        id: 'ws-expired-pro',
        plan: 'PRO',
        planExpiresAt: pastDate,
        subscriptionStatus: 'EXPIRED',
      } as any);

      vi.mocked(prisma.post.count).mockResolvedValue(31); // 31 posts

      const result = await assertQuotaLimit({
        workspaceId: 'ws-expired-pro',
        feature: 'posts',
        countToAdd: 1,
      });

      // Since plan expired, it was downgraded to FREE limits (max 30 posts), so 31 posts is blocked!
      expect(result.allowed).toBe(false);
      expect(result.max).toBe(PLAN_LIMITS.FREE.maxPostsPerMonth);
    });
  });
});
