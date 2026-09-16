import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/social/google/route';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', role: 'ADMIN' } })
}));

vi.mock('@/lib/credentials', () => ({
  getCredentials: vi.fn().mockResolvedValue({
    GOOGLE_CLIENT_ID: 'test-client-id'
  })
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn()
  })
}));

describe('Google OAuth Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to Google OAuth with CSRF state', async () => {
    const req = new NextRequest('http://localhost:3000/api/social/google');
    const res = await GET(req);
    
    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(location).toContain('client_id=test-client-id');
    expect(location).toContain('state=');
    expect(location).toContain('youtube');
  });

  it('handles drive scope correctly', async () => {
    const req = new NextRequest('http://localhost:3000/api/social/google?scope=drive');
    const res = await GET(req);
    
    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).toContain('drive.readonly');
  });
});
