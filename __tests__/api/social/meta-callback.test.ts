import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/social/meta/callback/route';

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
    META_APP_ID: 'test-meta-id',
    META_APP_SECRET: 'test-meta-secret'
  })
}));
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn((name) => {
      if (name === 'oauth_state_meta') return { value: 'test-csrf-token' };
      return undefined;
    }),
    set: vi.fn()
  })
}));

// Mock global fetch
global.fetch = vi.fn();

describe('Meta OAuth Callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to settings with error if CSRF validation fails', async () => {
    const req = new NextRequest('http://localhost:3000/api/social/meta/callback?code=auth_code&state=wrong-token::meta');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toContain('error=csrf_validation_failed');
  });

  it('redirects to settings with error if no code is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/social/meta/callback?error=access_denied&state=test-csrf-token::meta');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toContain('error=meta_auth_failed');
  });

  it('exchanges code for token and upserts social account', async () => {
    // Mock token exchange (short-lived)
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ access_token: 'short_token' }),
      })
    );
    // Mock long-lived token exchange
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ access_token: 'long_token' }),
      })
    );
    // Mock pages fetch
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ data: [{ id: 'page-1', name: 'My Page', access_token: 'page_token' }] }),
      })
    );
    // Mock IG business fetch
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ instagram_business_account: { id: 'ig-1' } }),
      })
    );

    const req = new NextRequest('http://localhost:3000/api/social/meta/callback?code=auth_code&state=test-csrf-token::meta');
    const res = await GET(req);
    
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toContain('success=meta');
  });
});
