import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/social/google/callback/route';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' } })
}));
vi.mock('@/lib/db', () => ({
  default: {
    socialAccount: {
      upsert: vi.fn().mockResolvedValue({})
    }
  }
}));
vi.mock('@/lib/crypto', () => ({
  encryptToken: vi.fn((token) => `encrypted_${token}`)
}));
vi.mock('@/lib/credentials', () => ({
  getCredentials: vi.fn().mockResolvedValue({
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret'
  })
}));
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn((name) => {
      if (name === 'oauth_state_google') return { value: 'test-csrf-token' };
      return undefined;
    }),
    set: vi.fn()
  })
}));

// Mock global fetch
global.fetch = vi.fn();

describe('Google OAuth Callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to settings with error if no code is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/social/google/callback?error=access_denied&state=test-csrf-token::youtube');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toContain('error=google_auth_failed');
  });

  it('exchanges code for token and upserts social account', async () => {
    // Mock token exchange
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ access_token: 'valid_token', refresh_token: 'refresh', expires_in: 3600 }),
      })
    );
    // Mock youtube channel info
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ items: [{ id: 'channel-1', snippet: { title: 'My Channel' } }] }),
      })
    );

    const req = new NextRequest('http://localhost:3000/api/social/google/callback?code=auth_code&state=test-csrf-token::youtube');
    const res = await GET(req);
    
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toContain('success=youtube');
  });
});
