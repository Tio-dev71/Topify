import { POST } from '@/app/api/social/disconnect/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    socialAccount: {
      deleteMany: vi.fn(),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('/api/social/disconnect API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (url: string) => {
    return new NextRequest(url, { method: 'POST' });
  };

  it('should return 401 if unauthorized', async () => {
    // No session
    vi.mocked(auth).mockResolvedValue(null);
    const req = createRequest('http://localhost/api/social/disconnect?provider=META');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 if provider is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as any);
    const req = createRequest('http://localhost/api/social/disconnect');
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should delete social accounts for the provider and workspace', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', role: 'ADMIN', workspaceId: 'w1' } } as any);
    vi.mocked(prisma.socialAccount.deleteMany).mockResolvedValue({ count: 1 } as any);
    
    const req = createRequest('http://localhost/api/social/disconnect?provider=GOOGLE');
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    
    expect(prisma.socialAccount.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { userId: 'u1' },
          { workspaceId: 'w1' }
        ],
        provider: 'GOOGLE',
      }
    });
  });

  it('should handle internal errors gracefully', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', role: 'SUPER_ADMIN', workspaceId: 'w1' } } as any);
    vi.mocked(prisma.socialAccount.deleteMany).mockRejectedValue(new Error('db err'));

    const req = createRequest('http://localhost/api/social/disconnect?provider=META');
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('db err');
  });
});
