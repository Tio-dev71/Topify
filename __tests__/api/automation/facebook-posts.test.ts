import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  GET,
  POST,
  DELETE,
  LIKE_UNIT_PRICE,
  COMMENT_UNIT_PRICE,
  calculateBilling,
} from '@/app/api/automation/facebook-posts/route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: 'test_user_fb_auto',
      email: 'user@topify.vn',
      role: 'ADMIN',
      workspaceId: 'ws_fb_auto_test',
    },
  }),
}));

// In-memory mock database store
const mockTasks: any[] = [];
let mockWallet: any = {
  id: 'wallet_123',
  userId: 'test_user_fb_auto',
  balance: 1000000,
  pending: 0,
  withdrawn: 0,
};
const mockTransactions: any[] = [];

vi.mock('@/lib/db', () => ({
  prisma: {
    automationTask: {
      findMany: vi.fn().mockImplementation(() => Promise.resolve(mockTasks)),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        const found = mockTasks.find(t => t.id === where.id);
        return Promise.resolve(found || null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const newTask = { ...data, id: `task_${Date.now()}_${Math.random()}`, createdAt: new Date() };
        mockTasks.push(newTask);
        return Promise.resolve(newTask);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const idx = mockTasks.findIndex(t => t.id === where.id);
        if (idx !== -1) {
          mockTasks[idx] = { ...mockTasks[idx], ...data };
          return Promise.resolve(mockTasks[idx]);
        }
        return Promise.resolve(null);
      }),
      delete: vi.fn().mockImplementation(({ where }) => {
        const idx = mockTasks.findIndex(t => t.id === where.id);
        if (idx !== -1) mockTasks.splice(idx, 1);
        return Promise.resolve({ id: where.id });
      }),
    },
    competitorPost: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    wallet: {
      findUnique: vi.fn().mockImplementation(() => Promise.resolve(mockWallet)),
      create: vi.fn().mockImplementation(({ data }) => {
        mockWallet = { ...data, id: 'wallet_new' };
        return Promise.resolve(mockWallet);
      }),
      update: vi.fn().mockImplementation(({ data }) => {
        if (data.balance?.decrement) {
          mockWallet.balance -= data.balance.decrement;
        } else if (data.balance !== undefined) {
          mockWallet.balance = data.balance;
        }
        return Promise.resolve(mockWallet);
      }),
    },
    walletTransaction: {
      create: vi.fn().mockImplementation(({ data }) => {
        const newTx = { ...data, id: `tx_${Date.now()}`, createdAt: new Date() };
        mockTransactions.push(newTx);
        return Promise.resolve(newTx);
      }),
    },
  },
  default: {
    competitorPost: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('@/lib/audit-log', () => ({
  recordAuditLog: vi.fn().mockResolvedValue(true),
}));

describe('Facebook Automation: Scan Latest Posts & Auto Like (50đ) / Comment (70đ)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTasks.length = 0;
    mockTransactions.length = 0;
    mockWallet = {
      id: 'wallet_123',
      userId: 'test_user_fb_auto',
      balance: 1000000,
      pending: 0,
      withdrawn: 0,
    };
  });

  describe('Pricing calculation logic', () => {
    it('calculates like at 50 VND and comment at 70 VND correctly', () => {
      expect(LIKE_UNIT_PRICE).toBe(50);
      expect(COMMENT_UNIT_PRICE).toBe(70);

      // 10 likes, 5 comments
      const bill1 = calculateBilling(10, 5);
      expect(bill1.likeCost).toBe(500); // 10 * 50
      expect(bill1.commentCost).toBe(350); // 5 * 70
      expect(bill1.totalCost).toBe(850); // 500 + 350
    });

    it('multiplies up dynamically as like and comment quantities increase', () => {
      // 100 likes, 50 comments
      const bill2 = calculateBilling(100, 50);
      expect(bill2.likeCost).toBe(5000); // 100 * 50
      expect(bill2.commentCost).toBe(3500); // 50 * 70
      expect(bill2.totalCost).toBe(8500); // 5000 + 3500

      // 1000 likes, 200 comments
      const bill3 = calculateBilling(1000, 200);
      expect(bill3.likeCost).toBe(50000);
      expect(bill3.commentCost).toBe(14000);
      expect(bill3.totalCost).toBe(64000);
    });

    it('handles negative or invalid numbers safely', () => {
      const bill = calculateBilling(-5, -10);
      expect(bill.likeCost).toBe(0);
      expect(bill.commentCost).toBe(0);
      expect(bill.totalCost).toBe(0);
    });
  });

  describe('GET /api/automation/facebook-posts', () => {
    it('returns system pricing, aggregate stats, and empty task list initially', async () => {
      const req = new NextRequest('http://localhost:3000/api/automation/facebook-posts');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pricing.likePrice).toBe(50);
      expect(data.pricing.commentPrice).toBe(70);
      expect(data.stats.totalPostsScanned).toBe(0);
      expect(Array.isArray(data.tasks)).toBe(true);
    });
  });

  describe('POST /api/automation/facebook-posts action=scan', () => {
    it('scans latest posts for a Fanpage and returns formatted post list', async () => {
      const req = new NextRequest('http://localhost:3000/api/automation/facebook-posts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'scan',
          targetUrl: 'https://www.facebook.com/tintucvtv24',
          limit: 5,
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.posts)).toBe(true);
      expect(data.posts.length).toBeGreaterThan(0);
      expect(data.posts[0]).toHaveProperty('url');
      expect(data.posts[0]).toHaveProperty('content');
      expect(data.posts[0]).toHaveProperty('likesCount');
      expect(data.posts[0]).toHaveProperty('commentsCount');
    });

    it('rejects scanning without targetUrl or pageId', async () => {
      const req = new NextRequest('http://localhost:3000/api/automation/facebook-posts', {
        method: 'POST',
        body: JSON.stringify({ action: 'scan' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/automation/facebook-posts action=start', () => {
    it('creates a new automation campaign with correct multi-post billing', async () => {
      const testPosts = [
        { id: 'p1', url: 'https://facebook.com/vtv24/posts/1', content: 'Tin tức 1' },
        { id: 'p2', url: 'https://facebook.com/vtv24/posts/2', content: 'Tin tức 2' },
      ];

      // 2 posts, 20 likes/post, 10 comments/post
      // Total likes = 40 (2000đ), Total comments = 20 (1400đ) -> Total = 3400đ
      const req = new NextRequest('http://localhost:3000/api/automation/facebook-posts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'start',
          name: 'Chiến dịch Test FB Auto',
          targetUrl: 'https://facebook.com/tintucvtv24',
          posts: testPosts,
          likesPerPost: 20,
          commentsPerPost: 10,
          accountIds: ['acc_1', 'acc_2'],
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.billing.likesCount).toBe(40);
      expect(data.billing.commentsCount).toBe(20);
      expect(data.billing.likeCost).toBe(2000); // 40 * 50
      expect(data.billing.commentCost).toBe(1400); // 20 * 70
      expect(data.billing.totalCost).toBe(3400); // 2000 + 1400

      expect(mockTasks.length).toBe(1);
      expect(mockTasks[0].type).toBe('fb_auto_posts_interact');
    });

    it('rejects start when posts array is empty', async () => {
      const req = new NextRequest('http://localhost:3000/api/automation/facebook-posts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'start',
          posts: [],
          likesPerPost: 10,
          commentsPerPost: 5,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/automation/facebook-posts action=update_progress', () => {
    it('updates executed count and recalculates billing in real time', async () => {
      // First create a task
      mockTasks.push({
        id: 'task_running_1',
        name: 'Task 1',
        type: 'fb_auto_posts_interact',
        status: 'RUNNING',
        config: {
          posts: [{ url: 'http://fb.com/1' }],
          billing: {
            likesCount: 50,
            commentsCount: 20,
            likeCost: 2500,
            commentCost: 1400,
            totalCost: 3900,
            executedLikes: 0,
            executedComments: 0,
            executedCost: 0,
          },
        },
      });

      // Update with 30 executed likes and 10 executed comments
      // Accrued: (30 * 50) + (10 * 70) = 1500 + 700 = 2200đ
      const req = new NextRequest('http://localhost:3000/api/automation/facebook-posts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_progress',
          taskId: 'task_running_1',
          executedLikes: 30,
          executedComments: 10,
          status: 'RUNNING',
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.billing.executedLikes).toBe(30);
      expect(data.billing.executedComments).toBe(10);
      expect(data.billing.executedCost).toBe(2200);
    });
  });

  describe('POST /api/automation/facebook-posts action=pay', () => {
    it('deducts payment from user wallet and records transaction', async () => {
      mockTasks.push({
        id: 'task_to_pay',
        name: 'Task To Pay',
        type: 'fb_auto_posts_interact',
        status: 'COMPLETED',
        config: {
          billing: {
            likesCount: 100,
            commentsCount: 50,
            executedLikes: 100,
            executedComments: 50,
            executedCost: 8500, // (100 * 50) + (50 * 70) = 5000 + 3500 = 8500đ
            isPaid: false,
          },
        },
      });

      const req = new NextRequest('http://localhost:3000/api/automation/facebook-posts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'pay',
          taskId: 'task_to_pay',
          amount: 8500,
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockWallet.balance).toBe(1000000 - 8500);
      expect(mockTransactions.length).toBe(1);
      expect(mockTransactions[0].amount).toBe(8500);
      expect(mockTransactions[0].type).toBe('EXPENSE');
    });

    it('rejects payment if wallet balance is insufficient', async () => {
      mockWallet.balance = 1000; // only 1000đ

      mockTasks.push({
        id: 'task_insufficient',
        config: {
          billing: { executedCost: 50000 },
        },
      });

      const req = new NextRequest('http://localhost:3000/api/automation/facebook-posts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'pay',
          taskId: 'task_insufficient',
          amount: 50000,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('không đủ');
    });
  });

  describe('DELETE /api/automation/facebook-posts', () => {
    it('deletes task by id', async () => {
      mockTasks.push({ id: 'task_del', name: 'Delete me' });

      const req = new NextRequest('http://localhost:3000/api/automation/facebook-posts?id=task_del', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockTasks.find(t => t.id === 'task_del')).toBeUndefined();
    });
  });
});

