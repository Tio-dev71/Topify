import { GET } from '@/app/api/social/google/callback/route';
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

describe('/api/social/google/callback API', () => {
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

    const req = createRequest('http://localhost/api/social/google/callback?code=abc&state=wrong-csrf::google_token');
    const res = await GET(req);
    expect(res.status).toBe(307); // Redirect
    expect(res.headers.get('location')).toContain('error=csrf_validation_failed');
  });

  it('should redirect to login if no userId in session or state', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'csrf-token' })
    } as any);
    vi.mocked(auth).mockResolvedValue(null);

    const req = createRequest('http://localhost/api/social/google/callback?code=abc&state=csrf-token::some_state');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('should redirect to settings error if no code', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'csrf-token' })
    } as any);
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);

    const req = createRequest('http://localhost/api/social/google/callback?state=csrf-token::some_state');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('error=google_auth_failed');
  });

  it('should handle successful youtube oauth flow and upsert account', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'csrf-token' })
    } as any);
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', workspaceId: 'w1' } } as any);
    vi.mocked(getCredentials).mockResolvedValue({
      GOOGLE_CLIENT_ID: 'cid',
      GOOGLE_CLIENT_SECRET: 'csec',
    } as any);

    // Mock fetch calls: 1 for token, 1 for channel
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ access_token: 'atoken', refresh_token: 'rtoken', expires_in: 3600 })
      } as any)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ items: [{ id: 'yt1', snippet: { title: 'My Channel' } }] })
      } as any);

    const req = createRequest('http://localhost/api/social/google/callback?code=code123&state=csrf-token::youtube_xxx');
    
    // We need jwt verify to succeed for desktop client or not fail
    vi.mocked(jwt.verify).mockReturnValue({ id: 'u1', email: 'test@test.com' } as any);

    const res = await GET(req);
    expect(res.status).toBe(200); // Because it detects DesktopClient when jwt is verified from state
    
    expect(prisma.socialAccount.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_provider: { userId: 'u1', provider: 'YOUTUBE' } },
      create: expect.objectContaining({
        provider: 'YOUTUBE',
        accountName: 'My Channel',
        youtubeChannelId: 'yt1',
        accessToken: 'encrypted_atoken',
        refreshToken: 'encrypted_rtoken'
      }),
      update: expect.objectContaining({
        accountName: 'My Channel',
        youtubeChannelId: 'yt1',
        accessToken: 'encrypted_atoken'
      })
    }));
  });

  it('should handle google drive oauth flow', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'csrf-token' })
    } as any);
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', workspaceId: 'w1' } } as any);
    vi.mocked(getCredentials).mockResolvedValue({
      GOOGLE_CLIENT_ID: 'cid',
      GOOGLE_CLIENT_SECRET: 'csec',
    } as any);

    // Mock fetch calls: 1 for token, 1 for userinfo
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ access_token: 'atoken', expires_in: 3600 }) // no refresh token
      } as any)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ name: 'Drive User' })
      } as any);

    // Provide a state not matching youtube or google_drive with jwt, meaning regular web flow
    const req = createRequest('http://localhost/api/social/google/callback?code=code123&state=csrf-token::google_drive');
    
    const res = await GET(req);
    expect(res.status).toBe(307); // Redirect to settings on web flow
    expect(res.headers.get('location')).toContain('success=google_drive');
    
    expect(prisma.socialAccount.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_provider: { userId: 'u1', provider: 'GOOGLE_DRIVE' } },
      create: expect.objectContaining({
        provider: 'GOOGLE_DRIVE',
        accountName: 'Drive User',
        accessToken: 'encrypted_atoken',
        refreshToken: null
      })
    }));
  });
});
