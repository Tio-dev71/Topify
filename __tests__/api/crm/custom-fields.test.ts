import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/crm/custom-fields/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    workspace: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    customer: {
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

describe('CRM Custom Fields API (F099) - /api/crm/custom-fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/crm/custom-fields', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/crm/custom-fields');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns custom field definitions and stats', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        settings: {
          crmCustomFields: [
            { id: 'cf_industry', key: 'industry', name: 'Lĩnh vực kinh doanh', type: 'SELECT' },
          ],
        },
      } as any);

      vi.mocked(prisma.customer.count).mockResolvedValue(5);

      const req = new NextRequest('http://localhost/api/crm/custom-fields');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.fields).toHaveLength(1);
      expect(data.customersWithCustomData).toBe(5);
    });
  });

  describe('POST /api/crm/custom-fields', () => {
    it('adds a new custom field definition', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        settings: {},
      } as any);

      vi.mocked(prisma.workspace.update).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost/api/crm/custom-fields', {
        method: 'POST',
        body: JSON.stringify({
          key: 'contract_number',
          name: 'Số hợp đồng kinh tế',
          type: 'TEXT',
          required: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.field.key).toBe('contract_number');
      expect(data.field.name).toBe('Số hợp đồng kinh tế');
      expect(prisma.workspace.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/crm/custom-fields', () => {
    it('removes a custom field definition', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        settings: {
          crmCustomFields: [
            { id: '1', key: 'to_delete', name: 'Trường xóa' },
          ],
        },
      } as any);

      vi.mocked(prisma.workspace.update).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost/api/crm/custom-fields?key=to_delete', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      expect(res.status).toBe(200);
      expect(prisma.workspace.update).toHaveBeenCalled();
    });
  });
});

