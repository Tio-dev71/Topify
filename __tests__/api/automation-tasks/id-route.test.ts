/* eslint-disable @typescript-eslint/no-explicit-any */
import { DELETE, PUT } from '@/app/api/automation-tasks/[id]/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    automationTask: {
      delete: vi.fn(),
      update: vi.fn(),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('/api/automation-tasks/[id] API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (method: string, url: string, body?: any) => {
    return new NextRequest(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  describe('DELETE', () => {
    it('should return 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = createRequest('DELETE', 'http://localhost/api/automation-tasks/1');
      const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(401);
    });

    it('should delete task successfully', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      vi.mocked(prisma.automationTask.delete).mockResolvedValue({} as any);
      
      const req = createRequest('DELETE', 'http://localhost/api/automation-tasks/1');
      const res = await DELETE(req, { params: Promise.resolve({ id: 't1' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      
      expect(prisma.automationTask.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });

    it('should return 500 on db error', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      vi.mocked(prisma.automationTask.delete).mockRejectedValue(new Error('err'));
      
      const req = createRequest('DELETE', 'http://localhost/api/automation-tasks/1');
      const res = await DELETE(req, { params: Promise.resolve({ id: 't1' }) });
      expect(res.status).toBe(500);
    });
  });

  describe('PUT', () => {
    it('should return 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = createRequest('PUT', 'http://localhost/api/automation-tasks/1', {});
      const res = await PUT(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(401);
    });

    it('should update task successfully', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      const updatedTask = { id: 't1', name: 'N' };
      vi.mocked(prisma.automationTask.update).mockResolvedValue(updatedTask as any);
      
      const body = { name: 'N', type: 'T', config: { a: 1 }, profileIds: ['p1'] };
      const req = createRequest('PUT', 'http://localhost/api/automation-tasks/1', body);
      const res = await PUT(req, { params: Promise.resolve({ id: 't1' }) });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(updatedTask);
      
      expect(prisma.automationTask.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: {
          name: 'N',
          type: 'T',
          config: { a: 1 },
          profileIds: ['p1']
        }
      });
    });

    it('should return 500 on db error', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      vi.mocked(prisma.automationTask.update).mockRejectedValue(new Error('err'));
      
      const req = createRequest('PUT', 'http://localhost/api/automation-tasks/1', {});
      const res = await PUT(req, { params: Promise.resolve({ id: 't1' }) });
      expect(res.status).toBe(500);
    });
  });
});
