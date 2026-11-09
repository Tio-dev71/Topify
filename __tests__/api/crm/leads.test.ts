import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from '@/app/api/crm/leads/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    customer: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    pipeline: {
      findFirst: vi.fn(),
    },
    deal: {
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
  recordAuditLog: vi.fn().mockResolvedValue(true),
}));

describe('CRM Leads Management API (F092) - /api/crm/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/crm/leads', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/crm/leads');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns leads list and multi-channel stats (Inbox, Form, Import, Referral)', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u_1', workspaceId: 'ws_1' },
      } as any);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      const req = new NextRequest('http://localhost/api/crm/leads');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.leads)).toBe(true);
      expect(data.leads.length).toBeGreaterThan(0);

      // Verify stats contain all 4 channels
      expect(data.stats).toHaveProperty('inboxCount');
      expect(data.stats).toHaveProperty('formCount');
      expect(data.stats).toHaveProperty('importCount');
      expect(data.stats).toHaveProperty('referralCount');
      expect(data.stats).toHaveProperty('conversionRate');
      expect(data.stats.inboxCount).toBeGreaterThan(0);
      expect(data.stats.formCount).toBeGreaterThan(0);
      expect(data.stats.importCount).toBeGreaterThan(0);
      expect(data.stats.referralCount).toBeGreaterThan(0);
    });

    it('filters leads by source (e.g. INBOX, FORM, IMPORT, REFERRAL)', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u_1', workspaceId: 'ws_1' },
      } as any);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      const req = new NextRequest('http://localhost/api/crm/leads?source=FORM');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.leads.every((l: any) => l.source === 'FORM')).toBe(true);
    });

    it('filters leads by status (e.g. NEW, QUALIFIED, CONVERTED)', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u_1', workspaceId: 'ws_1' },
      } as any);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      const req = new NextRequest('http://localhost/api/crm/leads?status=NEW');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.leads.every((l: any) => l.status === 'NEW')).toBe(true);
    });

    it('searches leads by keyword query', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u_1', workspaceId: 'ws_1' },
      } as any);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      const req = new NextRequest('http://localhost/api/crm/leads?search=dung');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.leads.some((l: any) => l.name.toLowerCase().includes('dung'))).toBe(true);
    });
  });

  describe('POST /api/crm/leads - Mutations', () => {
    it('creates a new lead manually', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u_1', workspaceId: 'ws_1' },
      } as any);
      vi.mocked(prisma.customer.create).mockResolvedValue({ id: 'c_new' } as any);

      const payload = {
        action: 'create',
        name: 'Hoàng Anh Tuấn',
        phone: '0918776655',
        email: 'anhtuan@techlead.vn',
        company: 'TechLead Solutions',
        source: 'INBOX',
        sourceDetail: 'Inbox Zalo OA Doanh Nghiệp',
        demand: 'Tư vấn phần mềm quản lý tương tác và chăm sóc khách hàng',
        estimatedValue: 25000000,
        assignedTo: 'Nguyễn Văn A',
      };

      const req = new NextRequest('http://localhost/api/crm/leads', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.lead.name).toBe('Hoàng Anh Tuấn');
      expect(data.lead.phone).toBe('0918776655');
      expect(data.lead.source).toBe('INBOX');
    });

    it('rejects create lead when both name and phone are missing', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u_1', workspaceId: 'ws_1' },
      } as any);

      const req = new NextRequest('http://localhost/api/crm/leads', {
        method: 'POST',
        body: JSON.stringify({ action: 'create' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('bulk imports leads from file data (action=bulk_import)', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u_1', workspaceId: 'ws_1' },
      } as any);
      vi.mocked(prisma.customer.create).mockResolvedValue({ id: 'c_bulk' } as any);

      const payload = {
        action: 'bulk_import',
        leads: [
          {
            name: 'Phạm Hồng Thái',
            phone: '0971223344',
            email: 'hongthai@retail.vn',
            company: 'Chuỗi Cửa Hàng Thời Trang Thái',
            demand: 'Chốt đơn livestream tự động',
            estimatedValue: 20000000,
          },
          {
            name: 'Đoàn Kim Oanh',
            phone: '0962334455',
            email: 'kimoanh@spa.com',
            company: 'Oanh Beauty Spa',
            demand: 'Nhắc lịch hẹn khách hàng qua SMS',
            estimatedValue: 12000000,
          },
        ],
      };

      const req = new NextRequest('http://localhost/api/crm/leads', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.importedCount).toBe(2);
    });

    it('converts lead to official customer and deal (action=convert - 1-Click)', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u_1', workspaceId: 'ws_1' },
      } as any);

      // Create a lead first
      const createReq = new NextRequest('http://localhost/api/crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          name: 'Lead To Convert',
          phone: '0999888777',
          demand: 'Đơn hàng 100 áo polo',
          estimatedValue: 15000000,
        }),
      });
      const createRes = await POST(createReq);
      const createData = await createRes.json();
      const leadId = createData.lead.id;

      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: 'cust_converted_1' } as any);
      vi.mocked(prisma.pipeline.findFirst).mockResolvedValue({
        id: 'pipe_1',
        stages: [{ id: 'stage_1' }],
      } as any);
      vi.mocked(prisma.deal.create).mockResolvedValue({ id: 'deal_converted_1' } as any);

      const convertReq = new NextRequest('http://localhost/api/crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          action: 'convert',
          id: leadId,
          dealTitle: 'Hợp đồng đồng phục 100 áo polo',
          dealValue: 15000000,
        }),
      });

      const convertRes = await POST(convertReq);
      const convertData = await convertRes.json();

      expect(convertRes.status).toBe(200);
      expect(convertData.success).toBe(true);
      expect(convertData.lead.status).toBe('CONVERTED');
    });
  });

  describe('PATCH /api/crm/leads - Update lead', () => {
    it('updates lead status and notes', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u_1', workspaceId: 'ws_1' },
      } as any);
      vi.mocked(prisma.customer.updateMany).mockResolvedValue({ count: 1 });

      // Create lead
      const createReq = new NextRequest('http://localhost/api/crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          name: 'Lead To Update',
          phone: '0988000111',
        }),
      });
      const createRes = await POST(createReq);
      const createData = await createRes.json();
      const leadId = createData.lead.id;

      const patchReq = new NextRequest('http://localhost/api/crm/leads', {
        method: 'PATCH',
        body: JSON.stringify({
          id: leadId,
          status: 'QUALIFIED',
          notes: 'Đã gọi điện tư vấn, khách rất hài lòng',
        }),
      });

      const patchRes = await PATCH(patchReq);
      const patchData = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchData.success).toBe(true);
      expect(patchData.lead.status).toBe('QUALIFIED');
      expect(patchData.lead.notes).toBe('Đã gọi điện tư vấn, khách rất hài lòng');
    });

    it('updates full lead information (name, phone, email, company, source, demand, estimatedValue, assignedTo)', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u_1', workspaceId: 'ws_1' },
      } as any);

      // Create lead
      const createReq = new NextRequest('http://localhost/api/crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          name: 'Nguyễn Văn Cũ',
          phone: '0988111222',
        }),
      });
      const createRes = await POST(createReq);
      const createData = await createRes.json();
      const leadId = createData.lead.id;

      const patchReq = new NextRequest('http://localhost/api/crm/leads', {
        method: 'PATCH',
        body: JSON.stringify({
          id: leadId,
          name: 'Nguyễn Văn Mới',
          phone: '0988999888',
          email: 'moi.nguyen@company.com',
          company: 'Công ty Cổ phần Mới',
          source: 'REFERRAL',
          sourceDetail: 'Giới thiệu bởi Đối tác X',
          demand: 'Tư vấn phần mềm toàn diện',
          estimatedValue: 35000000,
          assignedTo: 'Trần Thị B',
          status: 'QUALIFIED',
          notes: 'Đã hoàn tất cập nhật thông tin',
        }),
      });

      const patchRes = await PATCH(patchReq);
      const patchData = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchData.success).toBe(true);
      expect(patchData.lead.name).toBe('Nguyễn Văn Mới');
      expect(patchData.lead.phone).toBe('0988999888');
      expect(patchData.lead.email).toBe('moi.nguyen@company.com');
      expect(patchData.lead.company).toBe('Công ty Cổ phần Mới');
      expect(patchData.lead.source).toBe('REFERRAL');
      expect(patchData.lead.sourceDetail).toBe('Giới thiệu bởi Đối tác X');
      expect(patchData.lead.demand).toBe('Tư vấn phần mềm toàn diện');
      expect(patchData.lead.estimatedValue).toBe(35000000);
      expect(patchData.lead.assignedTo).toBe('Trần Thị B');
      expect(patchData.lead.status).toBe('QUALIFIED');
      expect(patchData.lead.notes).toBe('Đã hoàn tất cập nhật thông tin');
    });
  });

  describe('DELETE /api/crm/leads - Delete lead', () => {
    it('deletes lead by id', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u_1', workspaceId: 'ws_1' },
      } as any);
      vi.mocked(prisma.customer.deleteMany).mockResolvedValue({ count: 1 });

      // Create lead
      const createReq = new NextRequest('http://localhost/api/crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          name: 'Lead To Delete',
          phone: '0988000222',
        }),
      });
      const createRes = await POST(createReq);
      const createData = await createRes.json();
      const leadId = createData.lead.id;

      const deleteReq = new NextRequest(`http://localhost/api/crm/leads?id=${leadId}`, {
        method: 'DELETE',
      });

      const deleteRes = await DELETE(deleteReq);
      const deleteData = await deleteRes.json();

      expect(deleteRes.status).toBe(200);
      expect(deleteData.success).toBe(true);
    });
  });
});

