import { GET } from '@/app/api/social/status/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { getCredentials } from '@/lib/credentials';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    socialAccount: {
      findMany: vi.fn(),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/credentials', () => ({
  getCredentials: vi.fn(),
}));

describe('/api/social/status API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/social/status');
    const res = await GET(req as any); // GET takes no args but NextJS passes it sometimes, signature here has no args
    expect(res.status).toBe(401);
  });

  it('should return status of social connections', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', workspaceId: 'w1' } } as any);
    
    const accounts = [
      { id: 'acc1', provider: 'META', accountName: 'Meta Page' },
      { id: 'acc2', provider: 'GOOGLE', accountName: 'YT Channel' },
    ];
    vi.mocked(prisma.socialAccount.findMany).mockResolvedValue(accounts as any);
    
    vi.mocked(getCredentials).mockResolvedValue({
      META_APP_ID: 'm-id',
      META_APP_SECRET: '',
      GOOGLE_CLIENT_ID: 'g-id',
      GOOGLE_CLIENT_SECRET: 'g-sec',
    } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(prisma.socialAccount.findMany).toHaveBeenCalledWith({
      where: { workspaceId: 'w1' },
      select: {
        id: true,
        provider: true,
        accountName: true,
        pageId: true,
        instagramBusinessId: true,
        youtubeChannelId: true,
        expiresAt: true,
      }
    });
    
    expect(data.connected).toBe(2);
    expect(data.connections[0].connected).toBe(true);
    expect(data.envStatus).toEqual({
      META_APP_ID: true,
      META_APP_SECRET: false,
      GOOGLE_CLIENT_ID: true,
      GOOGLE_CLIENT_SECRET: true,
    });
  });

  it('should handle internal errors gracefully', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', workspaceId: 'w1' } } as any);
    vi.mocked(prisma.socialAccount.findMany).mockRejectedValue(new Error('db err'));

    const res = await GET();
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('db err');
  });
});
