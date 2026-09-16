import { POST } from '@/app/api/facebook-accounts/check-live/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    facebookAccount: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('POST /api/facebook-accounts/check-live', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost/api/facebook-accounts/check-live', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  it('should return 401 if unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = createRequest({ id: 'acc1' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 if id is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
    const req = createRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 404 if account not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
    vi.mocked(prisma.facebookAccount.findUnique).mockResolvedValue(null);
    const req = createRequest({ id: 'acc1' });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('should mark as DEAD if response is 302 to rsrc.php', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
    vi.mocked(prisma.facebookAccount.findUnique).mockResolvedValue({ id: 'acc1', uid: '123' } as any);
    
    vi.mocked(global.fetch).mockResolvedValue({
      status: 302,
      headers: new Headers({ location: 'https://www.facebook.com/images/rsrc.php' })
    } as any);

    const req = createRequest({ id: 'acc1' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(data.isLive).toBe(false);
    expect(data.status).toBe('DEAD');
    expect(prisma.facebookAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc1' },
      data: { status: 'DEAD' }
    });
  });

  it('should mark as LIVE if response is 302 but not to rsrc.php', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
    vi.mocked(prisma.facebookAccount.findUnique).mockResolvedValue({ id: 'acc1', uid: '123' } as any);
    
    vi.mocked(global.fetch).mockResolvedValue({
      status: 302,
      headers: new Headers({ location: 'https://some-other-location.com' })
    } as any);

    const req = createRequest({ id: 'acc1' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(data.isLive).toBe(true);
    expect(data.status).toBe('LIVE');
    expect(prisma.facebookAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc1' },
      data: { status: 'LIVE' }
    });
  });

  it('should mark as DEAD if response is 404', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
    vi.mocked(prisma.facebookAccount.findUnique).mockResolvedValue({ id: 'acc1', uid: '123' } as any);
    
    vi.mocked(global.fetch).mockResolvedValue({ status: 404 } as any);

    const req = createRequest({ id: 'acc1' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(data.isLive).toBe(false);
    expect(data.status).toBe('DEAD');
  });

  it('should mark as CHECKPOINT if response is some other status', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
    vi.mocked(prisma.facebookAccount.findUnique).mockResolvedValue({ id: 'acc1', uid: '123' } as any);
    
    vi.mocked(global.fetch).mockResolvedValue({ status: 200 } as any); // Facebook usually doesn't return 200 for picture API, but test fallback

    const req = createRequest({ id: 'acc1' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(data.isLive).toBe(false); // Default isLive is false
    expect(data.status).toBe('CHECKPOINT');
  });

  it('should handle internal errors gracefully', async () => {
    vi.mocked(auth).mockRejectedValue(new Error('Auth failed'));
    const req = createRequest({ id: 'acc1' });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
