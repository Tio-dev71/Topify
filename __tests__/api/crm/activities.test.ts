import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from '@/app/api/crm/activities/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    crmActivity: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customer: {
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

describe('CRM Activities API (F098) - /api/crm/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/crm/activities', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/crm/activities');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns activities list and stats', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.crmActivity.findMany).mockResolvedValue([
        {
          id: 'act_1',
          type: 'CALL',
          title: 'Gọi điện tư vấn báo giá sỉ',
          isDone: false,
          dueDate: new Date(),
          customer: { name: 'Nguyễn Văn Minh', phone: '0988112233' },
          createdBy: { name: 'yến ngô' },
        },
        {
          id: 'act_2',
          type: 'MEETING',
          title: 'Gặp mặt ký hợp đồng Q4',
          isDone: true,
          dueDate: new Date(),
          customer: { name: 'Trần Thị Thúy Hằng', phone: '0977445566' },
          createdBy: { name: 'yến ngô' },
        },
      ] as any);

      const req = new NextRequest('http://localhost/api/crm/activities');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.activities).toHaveLength(2);
      expect(data.stats.total).toBe(2);
      expect(data.stats.pending).toBe(1);
      expect(data.stats.done).toBe(1);
      expect(data.stats.callCount).toBe(1);
      expect(data.stats.meetingCount).toBe(1);
    });
  });

  describe('POST /api/crm/activities', () => {
    it('creates a new activity (F098)', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: 'cust_1',
        name: 'Nguyễn Văn Minh',
      } as any);

      vi.mocked(prisma.crmActivity.create).mockResolvedValue({
        id: 'act_new',
        type: 'CALL',
        title: 'Hẹn gọi lại vào 14h chiều mai',
        customerId: 'cust_1',
        isDone: false,
      } as any);

      const req = new NextRequest('http://localhost/api/crm/activities', {
        method: 'POST',
        body: JSON.stringify({
          type: 'CALL',
          title: 'Hẹn gọi lại vào 14h chiều mai',
          customerId: 'cust_1',
          dueDate: '2026-11-04T14:00:00Z',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.activity.title).toBe('Hẹn gọi lại vào 14h chiều mai');
    });

    it('returns 400 if title is empty', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      const req = new NextRequest('http://localhost/api/crm/activities', {
        method: 'POST',
        body: JSON.stringify({ type: 'CALL', title: '' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/crm/activities', () => {
    it('toggles isDone status', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.crmActivity.findFirst).mockResolvedValue({
        id: 'act_1',
        title: 'Gọi tư vấn',
      } as any);

      vi.mocked(prisma.crmActivity.update).mockResolvedValue({
        id: 'act_1',
        title: 'Gọi tư vấn',
        isDone: true,
      } as any);

      const req = new NextRequest('http://localhost/api/crm/activities', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'act_1', isDone: true }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.activity.isDone).toBe(true);
    });
  });

  describe('DELETE /api/crm/activities', () => {
    it('deletes activity by id', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.crmActivity.findFirst).mockResolvedValue({
        id: 'act_1',
        title: 'Xóa việc này',
      } as any);

      vi.mocked(prisma.crmActivity.delete).mockResolvedValue({ id: 'act_1' } as any);

      const req = new NextRequest('http://localhost/api/crm/activities?id=act_1', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      expect(res.status).toBe(200);
      expect(prisma.crmActivity.delete).toHaveBeenCalledWith({ where: { id: 'act_1' } });
    });
  });
});
