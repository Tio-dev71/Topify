import { NextRequest } from 'next/server';
import { GET, POST, OPTIONS } from '@/app/api/crm/forms/embed/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    customer: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    workspace: {
      findFirst: vi.fn(),
    },
    crmActivity: {
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

describe('CRM Form Embed & Webhook Ingestion API (F102) - /api/crm/forms/embed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OPTIONS /api/crm/forms/embed', () => {
    it('returns CORS headers for preflight requests', async () => {
      const res = await OPTIONS();
      expect(res.status).toBe(200);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('GET /api/crm/forms/embed', () => {
    it('returns active status and endpoint information', async () => {
      const res = await GET();
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.status).toBe('active');
      expect(data.endpoint).toBe('/api/crm/forms/embed');
      expect(data.supportedFields).toContain('phone');
    });
  });

  describe('POST /api/crm/forms/embed', () => {
    it('rejects with 400 when name, phone, and email are all missing', async () => {
      const req = new NextRequest('http://localhost/api/crm/forms/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Only notes provided' }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Cần ít nhất một thông tin');
    });

    it('successfully ingests lead and uses session workspaceId when authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user_1', workspaceId: 'ws_authenticated' },
      } as any);

      vi.mocked(prisma.customer.create).mockImplementation(async ({ data }: any) => {
        return {
          id: 'cust_new_1',
          ...data,
          createdAt: new Date(),
        };
      });

      const req = new NextRequest('http://localhost/api/crm/forms/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Chị Mai Phương',
          phone: '0987654321',
          email: 'phuong@mail.com',
          notes: 'Yêu cầu báo giá khóa học marketing',
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.customer.name).toBe('Chị Mai Phương');
      expect(data.customer.workspaceId).toBe('ws_authenticated');
      expect(data.customer.source).toBe('LANDING_PAGE');
      expect(data.customer.tags).toContain('LandingPage');
      expect(data.customer.tags).toContain('F102');
      expect(data.customer.customData.isLead).toBe(true);
      expect(data.customer.customData.leadStatus).toBe('NEW');
    });

    it('prioritizes explicit workspaceId from request body or query parameter', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      vi.mocked(prisma.customer.create).mockImplementation(async ({ data }: any) => {
        return {
          id: 'cust_new_2',
          ...data,
          createdAt: new Date(),
        };
      });

      const req = new NextRequest('http://localhost/api/crm/forms/embed?workspaceId=ws_query_param', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Anh Trần Tuấn',
          phone: '0912345678',
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.customer.workspaceId).toBe('ws_query_param');
    });

    it('supports URL-encoded form submissions from external HTML forms', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      vi.mocked(prisma.workspace.findFirst).mockResolvedValue({ id: 'ws_fallback' } as any);

      vi.mocked(prisma.customer.create).mockImplementation(async ({ data }: any) => {
        return {
          id: 'cust_new_3',
          ...data,
          createdAt: new Date(),
        };
      });

      const formData = new URLSearchParams({
        name: 'Nguyễn Văn Form',
        phone: '0900112233',
        email: 'vanform@gmail.com',
        notes: 'Gửi từ thẻ HTML form',
        workspaceId: 'ws_form_tag',
      });

      const req = new NextRequest('http://localhost/api/crm/forms/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.customer.name).toBe('Nguyễn Văn Form');
      expect(data.customer.phone).toBe('0900112233');
      expect(data.customer.workspaceId).toBe('ws_form_tag');
    });
  });
});
