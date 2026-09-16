import { POST } from '@/app/api/automation/run/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { AutomationEngine } from '@/lib/automation/engine';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db', () => {
  const mockPrisma = {
    automationTask: {
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

vi.mock('@/lib/automation/engine', () => ({
  AutomationEngine: {
    runTask: vi.fn(),
  },
}));

describe('POST /api/automation/run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost/api/automation/run', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  it('should return 401 if unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = createRequest({ accountIds: ['acc-1'], config: { type: 'some_type' } });
    
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 if accountIds or config is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    
    let req = createRequest({ config: { type: 'some_type' } }); // missing accountIds
    let res = await POST(req);
    expect(res.status).toBe(400);

    req = createRequest({ accountIds: [], config: { type: 'some_type' } }); // empty accountIds
    res = await POST(req);
    expect(res.status).toBe(400);

    req = createRequest({ accountIds: ['acc-1'] }); // missing config
    res = await POST(req);
    expect(res.status).toBe(400);
    
    req = createRequest({ accountIds: ['acc-1'], config: {} }); // missing config.type
    res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 if targetUrl is missing for group tasks', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    
    const req1 = createRequest({ accountIds: ['acc-1'], config: { type: 'fb_add_friends_group', targetUrl: '' } });
    const res1 = await POST(req1);
    expect(res1.status).toBe(400);
    expect(await res1.json()).toEqual({ error: 'Vui lòng điền Target URL (Link Group) vào kịch bản này trước khi chạy!' });

    const req2 = createRequest({ accountIds: ['acc-1'], config: { type: 'fb_invite_to_group' } });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });

  it('should start background automation and update task status if taskId is provided', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.automationTask.update).mockResolvedValue({} as any);

    // Provide fake accounts for background processing
    vi.mocked(prisma.facebookAccount.findUnique)
      .mockResolvedValue({ id: 'acc-1', name: 'Test', profileId: 'profile-1' } as any);

    vi.mocked(AutomationEngine.runTask).mockResolvedValue();

    const req = createRequest({
      accountIds: ['acc-1'],
      config: { type: 'test_task' },
      taskId: 'task-1'
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    
    expect(prisma.automationTask.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { status: 'RUNNING' }
    });

    // Wait a tick for background promises to resolve
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(prisma.facebookAccount.findUnique).toHaveBeenCalledWith({ where: { id: 'acc-1' } });
    expect(AutomationEngine.runTask).toHaveBeenCalledWith('profile-1', { type: 'test_task' });

    // The background process should also mark the task as DONE
    expect(prisma.automationTask.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { status: 'DONE' }
    });
  });

  it('should handle background processing even if findUnique returns null', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.facebookAccount.findUnique).mockResolvedValue(null);

    const req = createRequest({
      accountIds: ['acc-1'],
      config: { type: 'test_task' }
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Wait a tick
    await new Promise(resolve => setTimeout(resolve, 0));

    // The engine should not be called since account wasn't found
    expect(AutomationEngine.runTask).not.toHaveBeenCalled();
  });

  it('should handle internal server errors during API route sync execution', async () => {
    vi.mocked(auth).mockRejectedValue(new Error('Some Auth Error'));
    
    const req = createRequest({ accountIds: ['acc-1'], config: { type: 'some_type' } });
    
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Internal Server Error');
  });
});
