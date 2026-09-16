import { GET } from '@/app/api/social/meta/callback/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { encryptToken } from '@/lib/crypto';
import { getCredentials } from '@/lib/credentials';
import { cookies } from 'next/headers';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as jwt from 'jsonwebtoken';

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

vi.mock('@/lib/crypto', () => ({
  encryptToken: vi.fn((token: string) => `encrypted_${token}`),
}));

vi.mock('@/lib/credentials', () => ({
  getCredentials: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  verify: vi.fn(),
}));

describe('/api/social/meta/callback API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    process.env.AUTH_URL = 'http://localhost';
  });

  const createRequest = (url: string) => {
    return new NextRequest(url);
  };

  it('should fail if CSRF validation fails', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'some-csrf' })
    } as any);

    const req = createRequest('http://localhost/api/social/meta/callback?code=abc&state=wrong-csrf::meta_token');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('error=csrf_validation_failed');
  });

  it('should redirect to login if no userId in session or state', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'csrf-token' })
    } as any);
    vi.mocked(auth).mockResolvedValue(null);

    const req = createRequest('http://localhost/api/social/meta/callback?code=abc&state=csrf-token::some_state');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('should redirect to settings error if no code', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'csrf-token' })
    } as any);
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);

    const req = createRequest('http://localhost/api/social/meta/callback?state=csrf-token::some_state');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('error=meta_auth_failed');
  });

  it('should handle successful meta oauth flow and upsert account for desktop client', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'csrf-token' })
    } as any);
    vi.mocked(auth).mockResolvedValue(null); // Desktop client doesn't need session if token works
    vi.mocked(getCredentials).mockResolvedValue({
      META_APP_ID: 'cid',
      META_APP_SECRET: 'csec',
    } as any);

    // Mock fetch calls: 1 short token, 1 long token, 1 pages, 1 ig
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ access_token: 'short_token' })
      } as any)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ access_token: 'long_token' })
      } as any)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ data: [{ id: 'page1', name: 'My Page', access_token: 'page_token' }] })
      } as any)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ instagram_business_account: { id: 'ig1' } })
      } as any);

    const req = createRequest('http://localhost/api/social/meta/callback?code=code123&state=csrf-token::meta_xxx');
    
    vi.mocked(jwt.verify).mockReturnValue({ id: 'u1', email: 'test@test.com', workspaceId: 'w1' } as any);

    const res = await GET(req);
    expect(res.status).toBe(200); // desktop client html response
    
    expect(prisma.socialAccount.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_provider: { userId: 'u1', provider: 'META' } },
      create: expect.objectContaining({
        provider: 'META',
        accountName: 'My Page',
        pageId: 'page1',
        instagramBusinessId: 'ig1',
        accessToken: 'encrypted_page_token',
      }),
      update: expect.objectContaining({
        accountName: 'My Page',
        pageId: 'page1',
        instagramBusinessId: 'ig1',
        accessToken: 'encrypted_page_token'
      })
    }));
  });

  it('should handle web flow correctly', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'csrf-token' })
    } as any);
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', workspaceId: 'w1' } } as any);
    vi.mocked(getCredentials).mockResolvedValue({
      META_APP_ID: 'cid',
      META_APP_SECRET: 'csec',
    } as any);

    // Mock fetch calls: 1 short token, 1 long token, 1 pages (no IG data)
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ access_token: 'short_token' })
      } as any)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ access_token: 'long_token' })
      } as any)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ data: [] }) // no pages returned
      } as any);

    const req = createRequest('http://localhost/api/social/meta/callback?code=code123&state=csrf-token::random');
    
    const res = await GET(req);
    expect(res.status).toBe(307); // web flow redirects to settings
    expect(res.headers.get('location')).toContain('success=meta');
    
    expect(prisma.socialAccount.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_provider: { userId: 'u1', provider: 'META' } },
      create: expect.objectContaining({
        provider: 'META',
        accountName: 'Meta Account', // fallback name
        accessToken: 'encrypted_long_token',
      })
    }));
  });
});
