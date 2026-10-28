import { POST } from '@/app/api/social/meta/connect/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    socialAccount: {
      upsert: vi.fn(),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('/api/social/meta/connect API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/social/meta/connect', {
      method: 'POST',
      body: JSON.stringify({ pageId: '123' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should require pageId', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
    const req = new NextRequest('http://localhost/api/social/meta/connect', {
      method: 'POST',
      body: JSON.stringify({ pageId: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should upsert social account for Meta and return 200', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', workspaceId: 'ws1' } } as any);
    vi.mocked(prisma.socialAccount.upsert).mockResolvedValue({
      id: 'soc1',
      provider: 'META',
      pageId: '12345678',
      accountName: 'Fashion Shop',
      status: 'CONNECTED',
    } as any);

    const req = new NextRequest('http://localhost/api/social/meta/connect', {
      method: 'POST',
      body: JSON.stringify({
        pageId: '12345678',
        pageName: 'Fashion Shop',
        accessToken: 'token_abc',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.pageId).toBe('12345678');
  });
});
