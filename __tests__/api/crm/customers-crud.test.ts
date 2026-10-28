import { NextRequest } from 'next/server';
import { GET, PATCH, PUT, DELETE } from '@/app/api/crm/customers/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    customer: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
    conversation: {
      findMany: vi.fn(),
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

describe('CRM Customers CRUD API - /api/crm/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH & PUT /api/crm/customers (Chỉnh sửa khách hàng)', () => {
    it('returns 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/crm/customers', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'c1', name: 'Nguyễn Minh Anh' }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 if customer ID is missing', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      const req = new NextRequest('http://localhost/api/crm/customers', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Nguyễn Minh Anh' }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Customer ID is required');
    });

    it('returns 404 if customer not found in workspace', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/crm/customers', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'c_non_existent', name: 'Nguyễn Minh Anh' }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(404);
    });

    it('successfully updates customer fields via PATCH', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: 'c1',
        workspaceId: 'ws1',
        name: 'Nguyễn Minh Anh',
        phone: '09983746222',
        email: 'minhanhnguyen@mail.com',
      } as any);

      const updatedCustomer = {
        id: 'c1',
        workspaceId: 'ws1',
        name: 'Nguyễn Minh Anh (Cập nhật)',
        phone: '0988112233',
        email: 'minhanh.new@gmail.com',
        source: 'FACEBOOK',
        tags: 'VIP, Khách sỉ',
        notes: 'Khách hàng có nhu cầu nhập sỉ 50 áo khoác',
        deals: [],
      };
      vi.mocked(prisma.customer.update).mockResolvedValue(updatedCustomer as any);

      const req = new NextRequest('http://localhost/api/crm/customers', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'c1',
          name: 'Nguyễn Minh Anh (Cập nhật)',
          phone: '0988112233',
          email: 'minhanh.new@gmail.com',
          source: 'FACEBOOK',
          tags: 'VIP, Khách sỉ',
          notes: 'Khách hàng có nhu cầu nhập sỉ 50 áo khoác',
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe('Nguyễn Minh Anh (Cập nhật)');
      expect(data.phone).toBe('0988112233');
      expect(data.notes).toBe('Khách hàng có nhu cầu nhập sỉ 50 áo khoác');

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: {
          name: 'Nguyễn Minh Anh (Cập nhật)',
          phone: '0988112233',
          email: 'minhanh.new@gmail.com',
          source: 'FACEBOOK',
          tags: 'VIP, Khách sỉ',
          notes: 'Khách hàng có nhu cầu nhập sỉ 50 áo khoác',
        },
        include: { deals: { select: { id: true, title: true, value: true, status: true } } },
      });
    });

    it('supports PUT as an alias to PATCH', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: 'c1',
        workspaceId: 'ws1',
      } as any);

      vi.mocked(prisma.customer.update).mockResolvedValue({
        id: 'c1',
        name: 'Nguyễn Minh Anh (PUT)',
      } as any);

      const req = new NextRequest('http://localhost/api/crm/customers', {
        method: 'PUT',
        body: JSON.stringify({ id: 'c1', name: 'Nguyễn Minh Anh (PUT)' }),
      });

      const res = await PUT(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe('Nguyễn Minh Anh (PUT)');
    });
  });

  describe('GET /api/crm/customers (Xem chi tiết / Lọc theo ID)', () => {
    it('supports finding single customer by ?id=...', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      const mockCustomer = {
        id: 'c1',
        workspaceId: 'ws1',
        name: 'Nguyễn Minh Anh',
        phone: '09983746222',
        email: 'minhanhnguyen@mail.com',
        tags: 'Sỉ',
        source: 'FACEBOOK',
        notes: '',
        createdAt: new Date().toISOString(),
        deals: [],
        activities: [],
      };

      vi.mocked(prisma.customer.findMany).mockResolvedValue([mockCustomer] as any);
      vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

      const req = new NextRequest('http://localhost/api/crm/customers?id=c1');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.customers).toHaveLength(1);
      expect(data.customers[0].id).toBe('c1');
      expect(data.customers[0].name).toBe('Nguyễn Minh Anh');
      expect(data.customers[0].leadScore).toBe(30);
      expect(data.customers[0].temperature).toBe('COLD');
    });
  });
});
