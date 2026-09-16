import { POST } from '@/app/api/automation/stop/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { browserManager } from '@/lib/automation/browserManager';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db', () => {
  const mockPrisma = {
    automationTask: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    facebookAccount: {
      findUnique: vi.fn(),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/automation/browserManager', () => ({
  browserManager: {
    stopTask: vi.fn(),
  },
}));

describe('POST /api/automation/stop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost/api/automation/stop', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  it('should return 401 if unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = createRequest({ taskId: 'task-1' });
    
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 if taskId is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const req = createRequest({});
    
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Task ID is required');
  });

  it('should return 404 if task is not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.automationTask.findUnique).mockResolvedValue(null);
    
    const req = createRequest({ taskId: 'task-1' });
    
    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Task not found');
  });

  it('should stop task and return 200 on success', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.automationTask.findUnique).mockResolvedValue({
      id: 'task-1',
      profileIds: ['profile-1', 'profile-2'],
    } as any);

    vi.mocked(prisma.facebookAccount.findUnique)
      .mockResolvedValueOnce({ id: 'acc-1', profileId: 'browser-profile-1' } as any)
      .mockResolvedValueOnce({ id: 'acc-2', profileId: 'browser-profile-2' } as any);
    
    const req = createRequest({ taskId: 'task-1' });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Task stopped');

    // Assertions
    expect(browserManager.stopTask).toHaveBeenCalledWith('browser-profile-1');
    expect(browserManager.stopTask).toHaveBeenCalledWith('browser-profile-2');
    expect(prisma.automationTask.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { status: 'DONE' }
    });
  });

  it('should handle internal server errors gracefully', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.automationTask.findUnique).mockRejectedValue(new Error('DB Error'));
    
    const req = createRequest({ taskId: 'task-1' });
    
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Internal Server Error');
  });
});
