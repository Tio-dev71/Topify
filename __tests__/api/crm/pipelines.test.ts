import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from '@/app/api/crm/pipelines/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    user: {
      findFirst: vi.fn(),
    },
    pipeline: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    pipelineStage: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    deal: {
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

describe('CRM Pipelines API - /api/crm/pipelines', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/crm/pipelines', () => {
    it('returns pipelines and auto-creates default pipeline if empty', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      // First call findMany returns empty, triggers create
      vi.mocked(prisma.pipeline.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.pipeline.create).mockResolvedValue({
        id: 'pipe-1',
        name: 'Quy trình chuẩn',
        isDefault: true,
        workspaceId: 'ws1',
        stages: [
          { id: 's1', name: 'Khách hàng mới', sortOrder: 1, color: '#3B82F6' },
          { id: 's2', name: 'Đang liên hệ', sortOrder: 2, color: '#EAB308' },
        ],
      } as any);

      const req = new NextRequest('http://localhost/api/crm/pipelines');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.pipelines).toBeDefined();
      expect(prisma.pipeline.create).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/crm/pipelines', () => {
    it('updates a single stage directly using stageId, name, color, sortOrder', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.pipelineStage.update).mockResolvedValue({
        id: 's1',
        name: 'Khách hàng VIP đã liên hệ',
        color: '#10B981',
        sortOrder: 2,
        pipelineId: 'pipe-1',
      } as any);

      const req = new NextRequest('http://localhost/api/crm/pipelines', {
        method: 'PATCH',
        body: JSON.stringify({
          stageId: 's1',
          name: 'Khách hàng VIP đã liên hệ',
          color: '#10B981',
          sortOrder: 2,
        }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stage.name).toBe('Khách hàng VIP đã liên hệ');
      expect(prisma.pipelineStage.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: {
          name: 'Khách hàng VIP đã liên hệ',
          color: '#10B981',
          sortOrder: 2,
        },
      });
    });

    it('updates entire pipeline stages array and reorders them', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.pipeline.findFirst).mockResolvedValue({
        id: 'pipe-1',
        name: 'Quy trình chuẩn',
        workspaceId: 'ws1',
        stages: [
          { id: 's1', name: 'Khách hàng mới', sortOrder: 1, color: '#3B82F6', pipelineId: 'pipe-1' },
          { id: 's2', name: 'Đang liên hệ', sortOrder: 2, color: '#EAB308', pipelineId: 'pipe-1' },
        ],
      } as any);

      vi.mocked(prisma.pipeline.findUnique).mockResolvedValue({
        id: 'pipe-1',
        name: 'Quy trình chuẩn',
        stages: [
          { id: 's2', name: 'Đang liên hệ', sortOrder: 1, color: '#EAB308', pipelineId: 'pipe-1' },
          { id: 's1', name: 'Khách hàng mới', sortOrder: 2, color: '#3B82F6', pipelineId: 'pipe-1' },
        ],
        _count: { deals: 0 },
      } as any);

      const req = new NextRequest('http://localhost/api/crm/pipelines', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'pipe-1',
          stages: [
            { id: 's2', name: 'Đang liên hệ', sortOrder: 1, color: '#EAB308' },
            { id: 's1', name: 'Khách hàng mới', sortOrder: 2, color: '#3B82F6' },
          ],
        }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.stages).toBeDefined();
      expect(prisma.pipelineStage.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /api/crm/pipelines', () => {
    it('creates a new pipeline with custom stages', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'u1', workspaceId: 'ws1' },
      } as any);

      vi.mocked(prisma.pipeline.create).mockResolvedValue({
        id: 'pipe-b2b',
        name: 'Quy trình B2B',
        workspaceId: 'ws1',
        stages: [
          { id: 's1', name: 'Khách hàng mới', sortOrder: 1, color: '#3B82F6' },
        ],
      } as any);

      const req = new NextRequest('http://localhost/api/crm/pipelines', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Quy trình B2B',
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.id).toBe('pipe-b2b');
    });
  });
});
