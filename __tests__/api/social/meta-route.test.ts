import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/social/meta/route';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', role: 'ADMIN' } })
}));

vi.mock('@/lib/credentials', () => ({
  getCredentials: vi.fn().mockResolvedValue({
    META_APP_ID: 'test-meta-id'
  })
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn()
  })
}));

describe('Meta OAuth Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to Meta OAuth with CSRF state', async () => {
    const req = new NextRequest('http://localhost:3000/api/social/meta');
    const res = await GET(req);
    
    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).toContain('https://www.facebook.com/v19.0/dialog/oauth');
    expect(location).toContain('client_id=test-meta-id');
    expect(location).toContain('state=');
  });
});
