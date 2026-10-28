import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from '@/app/api/crm/deals/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    deal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
      create: vi.fn(),
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

describe('CRM Deals API - /api/crm/deals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/crm/deals', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/crm/deals');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns list of deals with customer details', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.deal.findMany).mockResolvedValue([
        {
          id: 'd1',
          title: 'Hợp đồng Q4',
          value: 15000000,
          stageId: 's1',
          pipelineId: 'p1',
          customer: {
            id: 'c1',
            name: 'Nguyễn Minh Anh',
            email: 'minhanh@mail.com',
            phone: '0988776655',
            avatar: null,
          },
        },
      ] as any);

      const req = new NextRequest('http://localhost/api/crm/deals');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.deals).toHaveLength(1);
      expect(data.deals[0].customer.name).toBe('Nguyễn Minh Anh');
    });
  });

  describe('POST /api/crm/deals (Tạo Deal & Đồng bộ CRM)', () => {
    it('returns 401 if unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/crm/deals', {
        method: 'POST',
        body: JSON.stringify({ title: 'Deal test' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 if required fields are missing', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      const req = new NextRequest('http://localhost/api/crm/deals', {
        method: 'POST',
        body: JSON.stringify({ title: 'Deal test' }), // missing pipelineId, stageId
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('creates deal with existing customerId from CRM', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: 'c_existing_1',
        name: 'Nguyễn Minh Anh',
      } as any);

      vi.mocked(prisma.deal.create).mockResolvedValue({
        id: 'deal_1',
        title: 'Hợp đồng Marketing Spa',
        value: 12000000,
        customerId: 'c_existing_1',
        pipelineId: 'pipe_1',
        stageId: 'stage_1',
        customer: { id: 'c_existing_1', name: 'Nguyễn Minh Anh' },
        stage: { name: 'Tiếp cận ban đầu' },
      } as any);

      const req = new NextRequest('http://localhost/api/crm/deals', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Hợp đồng Marketing Spa',
          value: 12000000,
          pipelineId: 'pipe_1',
          stageId: 'stage_1',
          customerId: 'c_existing_1',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBe('deal_1');
      expect(data.customerId).toBe('c_existing_1');
      expect(prisma.customer.create).not.toHaveBeenCalled();
    });

    it('creates a new customer in CRM and links it to the deal when newCustomer is provided', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      // Customer creation mock
      vi.mocked(prisma.customer.create).mockResolvedValue({
        id: 'c_new_99',
        name: 'Anh Minh - Giám đốc Marketing',
        phone: '0912345678',
        email: 'minh.nguyen@company.com',
        source: 'FACEBOOK',
        notes: 'Khách hàng tạo từ cơ hội bán hàng: Hợp đồng Q4',
        workspaceId: 'ws1',
      } as any);

      vi.mocked(prisma.deal.create).mockResolvedValue({
        id: 'deal_new_1',
        title: 'Hợp đồng triển khai nội dung Q4',
        value: 15000000,
        customerId: 'c_new_99',
        pipelineId: 'pipe_1',
        stageId: 'stage_1',
        customer: {
          id: 'c_new_99',
          name: 'Anh Minh - Giám đốc Marketing',
          phone: '0912345678',
          email: 'minh.nguyen@company.com',
        },
        stage: { name: 'Tiếp cận ban đầu' },
      } as any);

      const req = new NextRequest('http://localhost/api/crm/deals', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Hợp đồng triển khai nội dung Q4',
          value: 15000000,
          pipelineId: 'pipe_1',
          stageId: 'stage_1',
          newCustomer: {
            name: 'Anh Minh - Giám đốc Marketing',
            phone: '0912345678',
            email: 'minh.nguyen@company.com',
            source: 'FACEBOOK',
          },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();

      // Verify Customer was created in CRM with correct fields
      expect(prisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Anh Minh - Giám đốc Marketing',
            phone: '0912345678',
            email: 'minh.nguyen@company.com',
            source: 'FACEBOOK',
            workspaceId: 'ws1',
          }),
        })
      );

      // Verify Deal was linked to the newly created customer
      expect(prisma.deal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 'c_new_99',
            title: 'Hợp đồng triển khai nội dung Q4',
          }),
        })
      );

      expect(data.createdCustomer).toBeDefined();
      expect(data.createdCustomer.id).toBe('c_new_99');
      expect(data.customer.name).toBe('Anh Minh - Giám đốc Marketing');
    });

    it('creates new customer in CRM when customerName is provided directly without customerId', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.customer.create).mockResolvedValue({
        id: 'c_new_100',
        name: 'Trần Văn Hoàng',
        workspaceId: 'ws1',
      } as any);

      vi.mocked(prisma.deal.create).mockResolvedValue({
        id: 'deal_2',
        title: 'Gói Chuyển Đổi Số',
        value: 8000000,
        customerId: 'c_new_100',
        pipelineId: 'p1',
        stageId: 's1',
      } as any);

      const req = new NextRequest('http://localhost/api/crm/deals', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Gói Chuyển Đổi Số',
          value: 8000000,
          pipelineId: 'p1',
          stageId: 's1',
          customerName: 'Trần Văn Hoàng',
          customerPhone: '0901234567',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(prisma.customer.create).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/crm/deals (Cập nhật giai đoạn / trạng thái)', () => {
    it('updates stage of deal', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.deal.update).mockResolvedValue({
        id: 'd1',
        title: 'Hợp đồng Q4',
        stageId: 'stage_won',
        status: 'WON',
      } as any);

      const req = new NextRequest('http://localhost/api/crm/deals', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'd1', stageId: 'stage_won', status: 'WON' }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.deal.status).toBe('WON');
    });
  });

  describe('DELETE /api/crm/deals', () => {
    it('deletes deal by id', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.deal.findFirst).mockResolvedValue({
        title: 'Deal cần xóa',
      } as any);

      vi.mocked(prisma.deal.deleteMany).mockResolvedValue({ count: 1 } as any);

      const req = new NextRequest('http://localhost/api/crm/deals?id=d1', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      expect(res.status).toBe(200);
      expect(prisma.deal.deleteMany).toHaveBeenCalledWith({
        where: { id: 'd1', workspaceId: 'ws1' },
      });
    });
  });
});
