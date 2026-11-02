import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from '@/app/api/tasks/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

vi.mock('@/lib/audit-log', () => ({
  recordAuditLog: vi.fn(),
}));

describe('Work & Tasks API (F124-F131) - /api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('returns task list from DB and memory store', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.task.findMany).mockResolvedValue([
        {
          id: 'task_db_1',
          title: 'Tạo công việc',
          description: 'Mô tả công việc kiểm thử',
          priority: 'HIGH',
          status: 'TODO',
          dueDate: new Date(),
          assigneeId: 'u1',
          assignee: { id: 'u1', name: 'yến ngô', email: 'nhim300997@gmail.com', image: null },
          isRecurring: false,
          recurRule: null,
          children: [],
          _count: { comments: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ]);

      const req = new NextRequest('http://localhost/api/tasks');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.tasks)).toBe(true);
      expect(data.tasks.some((t: any) => t.title === 'Tạo công việc')).toBe(true);
    });
  });

  describe('POST /api/tasks', () => {
    it('validates empty title and returns 400', async () => {
      const req = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: '' }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Tiêu đề công việc không được để trống');
    });

    it('creates a task and saves to DB and memory store', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1' } as any);
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: 'task_created_123',
        title: 'Tạo công việc mới',
        priority: 'HIGH',
        status: 'TODO',
      } as any);

      const req = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Tạo công việc mới',
          description: 'Kiểm thử lưu công việc',
          priority: 'HIGH',
          status: 'TODO',
          assigneeId: 'u1',
          collaboratorIds: ['u2'],
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.task.title).toBe('Tạo công việc mới');
      expect(data.task.priority).toBe('HIGH');
      expect(data.task.status).toBe('TODO');
    });
  });

  describe('PATCH /api/tasks', () => {
    it('updates status of task', async () => {
      vi.mocked(prisma.task.update).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost/api/tasks', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'task_created_123',
          status: 'IN_PROGRESS',
        }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('DELETE /api/tasks', () => {
    it('deletes task by id', async () => {
      vi.mocked(prisma.task.delete).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost/api/tasks?id=task_created_123', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Đã xóa công việc thành công');
    });
  });

  describe('Persistence across tab navigation simulation', () => {
    it('ensures created task remains accessible on subsequent GET calls', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1' } as any);
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: 'task_persisted_999',
        title: 'Công việc kiểm thử lưu khi chuyển tab',
        priority: 'HIGH',
        status: 'TODO',
      } as any);

      // Step 1: Create task
      const postReq = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Công việc kiểm thử lưu khi chuyển tab',
          priority: 'HIGH',
          status: 'TODO',
        }),
      });
      const postRes = await POST(postReq);
      expect(postRes.status).toBe(201);

      // Step 2: Simulate navigating away and coming back (GET /api/tasks)
      const getReq = new NextRequest('http://localhost/api/tasks');
      const getRes = await GET(getReq);
      const getData = await getRes.json();

      expect(getRes.status).toBe(200);
      expect(getData.tasks.some((t: any) => t.title === 'Công việc kiểm thử lưu khi chuyển tab')).toBe(true);
    });
  });
});
