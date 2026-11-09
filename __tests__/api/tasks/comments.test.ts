import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tasks/comments/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    taskComment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    workspace: {
      findFirst: vi.fn(),
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

describe('Task Comments API (F128) - /api/tasks/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/tasks/comments', () => {
    it('validates missing taskId and returns 400', async () => {
      const req = new NextRequest('http://localhost/api/tasks/comments');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('taskId là bắt buộc');
    });

    it('returns persisted comments from DB with structured metadata and author resolution', async () => {
      vi.mocked(prisma.taskComment.findMany).mockResolvedValue([
        {
          id: 'comm_db_1',
          taskId: 'task_test_123',
          content: JSON.stringify({
            text: 'Đã hoàn thành review banner đính kèm',
            mentions: ['yến ngô'],
            attachments: [{ id: 'att_1', name: 'banner.png', size: 1000, url: '#', type: 'image/png', uploadedAt: new Date().toISOString() }],
          }),
          createdById: 'u_admin',
          createdAt: new Date('2026-11-09T20:00:00.000Z'),
          createdBy: {
            id: 'u_admin',
            name: 'yến ngô',
            email: 'nhim300997@gmail.com',
            image: 'https://avatar.url/img.png',
          },
        } as any,
      ]);

      const req = new NextRequest('http://localhost/api/tasks/comments?taskId=task_test_123');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.comments.length).toBe(1);
      expect(data.comments[0].content).toBe('Đã hoàn thành review banner đính kèm');
      expect(data.comments[0].authorName).toBe('yến ngô');
      expect(data.comments[0].attachments.length).toBe(1);
      expect(data.comments[0].attachments[0].name).toBe('banner.png');
    });
  });

  describe('POST /api/tasks/comments', () => {
    it('validates empty content or taskId', async () => {
      const req = new NextRequest('http://localhost/api/tasks/comments', {
        method: 'POST',
        body: JSON.stringify({ taskId: '', content: '' }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Nội dung bình luận và taskId không được để trống');
    });

    it('creates a comment, ensures DB persistence, and updates task timestamp', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u_admin', name: 'yến ngô', email: 'nhim300997@gmail.com' },
      } as any);

      vi.mocked(prisma.task.findUnique).mockResolvedValue({ id: 'task_test_123' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u_admin', name: 'yến ngô' } as any);
      vi.mocked(prisma.taskComment.create).mockResolvedValue({
        id: 'comm_created_999',
        taskId: 'task_test_123',
        content: 'Test trao đổi mới',
        createdById: 'u_admin',
        createdAt: new Date(),
        createdBy: { id: 'u_admin', name: 'yến ngô', email: 'nhim300997@gmail.com', image: null },
      } as any);
      vi.mocked(prisma.task.update).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost/api/tasks/comments', {
        method: 'POST',
        body: JSON.stringify({
          taskId: 'task_test_123',
          content: 'Test trao đổi mới',
          authorName: 'yến ngô',
          authorEmail: 'nhim300997@gmail.com',
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.comment.id).toBe('comm_created_999');
      expect(data.comment.content).toBe('Test trao đổi mới');
      expect(prisma.taskComment.create).toHaveBeenCalled();
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task_test_123' },
        })
      );
    });

    it('falls back to finding user in DB when session is empty (Desktop App mode)', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      vi.mocked(prisma.task.findUnique).mockResolvedValue({ id: 'task_test_123' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u_fallback', name: 'yến ngô' } as any);
      vi.mocked(prisma.taskComment.create).mockResolvedValue({
        id: 'comm_created_fallback',
        taskId: 'task_test_123',
        content: 'Bình luận không có session',
        createdById: 'u_fallback',
        createdAt: new Date(),
      } as any);
      vi.mocked(prisma.task.update).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost/api/tasks/comments', {
        method: 'POST',
        body: JSON.stringify({
          taskId: 'task_test_123',
          content: 'Bình luận không có session',
          authorEmail: 'nhim300997@gmail.com',
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.comment.id).toBe('comm_created_fallback');
      expect(prisma.taskComment.create).toHaveBeenCalled();
    });
  });
});
