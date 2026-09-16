import { NextRequest } from 'next/server';
import { POST, PATCH } from '@/app/api/facebook-accounts/login/route';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    facebookAccount: {
      update: vi.fn(),
    }
  }
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('Facebook Accounts Login API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns 400 with deprecation message', async () => {
      const req = new NextRequest('http://localhost/api/facebook-accounts/login', {
        method: 'POST'
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain('chuyển sang Desktop App');
    });
  });

  describe('PATCH', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/facebook-accounts/login', {
        method: 'PATCH',
        body: JSON.stringify({ id: '1', status: 'LIVE' })
      });
      const res = await PATCH(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 if id or status is missing', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      const req = new NextRequest('http://localhost/api/facebook-accounts/login', {
        method: 'PATCH',
        body: JSON.stringify({ id: '1' }) // Missing status
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('updates status successfully', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      vi.mocked(prisma.facebookAccount.update).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost/api/facebook-accounts/login', {
        method: 'PATCH',
        body: JSON.stringify({ id: '1', status: 'DEAD' })
      });
      const res = await PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.facebookAccount.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'DEAD' }
      });
    });
  });
});
