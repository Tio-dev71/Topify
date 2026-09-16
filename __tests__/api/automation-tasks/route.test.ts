import { GET, POST, PATCH } from '@/app/api/automation-tasks/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    automationTask: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('/api/automation-tasks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (method: string, url: string, body?: any) => {
    return new NextRequest(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  describe('GET', () => {
    it('should return 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = createRequest('GET', 'http://localhost/api/automation-tasks');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('should return tasks list', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      const tasks = [{ id: 't1' }, { id: 't2' }];
      vi.mocked(prisma.automationTask.findMany).mockResolvedValue(tasks as any);
      
      const req = createRequest('GET', 'http://localhost/api/automation-tasks');
      const res = await GET(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(tasks);
      expect(prisma.automationTask.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
    });

    it('should return 500 on db error', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      vi.mocked(prisma.automationTask.findMany).mockRejectedValue(new Error('db err'));
      
      const req = createRequest('GET', 'http://localhost/api/automation-tasks');
      const res = await GET(req);
      expect(res.status).toBe(500);
    });
  });

  describe('POST', () => {
    it('should return 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = createRequest('POST', 'http://localhost/api/automation-tasks', {});
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid payload', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      
      const payloads = [
        {},
        { name: 'Task' },
        { name: 'Task', type: 't' },
        { name: 'Task', type: 't', profileIds: 'not-array' }
      ];

      for (const p of payloads) {
        const req = createRequest('POST', 'http://localhost/api/automation-tasks', p);
        const res = await POST(req);
        expect(res.status).toBe(400);
      }
    });

    it('should create task successfully', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      const newTask = { id: 't1', name: 'Task', type: 'T', config: { x: 1 }, profileIds: ['p1'] };
      vi.mocked(prisma.automationTask.create).mockResolvedValue(newTask as any);
      
      const req = createRequest('POST', 'http://localhost/api/automation-tasks', {
        name: 'Task', type: 'T', config: { x: 1 }, profileIds: ['p1']
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(newTask);
      expect(prisma.automationTask.create).toHaveBeenCalledWith({
        data: {
          name: 'Task',
          type: 'T',
          config: { x: 1 },
          profileIds: ['p1'],
          status: 'IDLE',
        }
      });
    });
  });

  describe('PATCH', () => {
    // Note: The implementation of PATCH in route.ts does NOT check for auth! 
    // We are testing its current behavior.
    it('should return 400 if id is missing', async () => {
      const req = createRequest('PATCH', 'http://localhost/api/automation-tasks', {});
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('should update task successfully', async () => {
      const updatedTask = { id: 't1', status: 'DONE' };
      vi.mocked(prisma.automationTask.update).mockResolvedValue(updatedTask as any);
      
      const req = createRequest('PATCH', 'http://localhost/api/automation-tasks', {
        id: 't1',
        status: 'DONE',
        name: 'New Name'
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(updatedTask);
      expect(prisma.automationTask.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { status: 'DONE', name: 'New Name' }
      });
    });

    it('should return 500 on db error', async () => {
      vi.mocked(prisma.automationTask.update).mockRejectedValue(new Error('err'));
      
      const req = createRequest('PATCH', 'http://localhost/api/automation-tasks', { id: 't1' });
      const res = await PATCH(req);
      expect(res.status).toBe(500);
    });
  });
});
