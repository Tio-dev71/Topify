import { GET, POST, DELETE, PATCH } from '@/app/api/facebook-accounts/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrGenerateFingerprint } from '@/lib/automation/fingerprint';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    facebookAccount: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
    proxy: {
      findMany: vi.fn(),
    }
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/automation/fingerprint', () => ({
  getOrGenerateFingerprint: vi.fn(),
}));

describe('/api/facebook-accounts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (method: string, url: string, body?: any) => {
    return new NextRequest(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  describe('GET', () => {
    it('should return 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = createRequest('GET', 'http://localhost/api/facebook-accounts');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('should return list of facebook accounts', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      vi.mocked(prisma.facebookAccount.findMany).mockResolvedValue([{ id: 'acc1' }, { id: 'acc2' }] as any);
      
      const req = createRequest('GET', 'http://localhost/api/facebook-accounts');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(2);
      expect(prisma.facebookAccount.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
    });

    it('should return 500 on db error', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      vi.mocked(prisma.facebookAccount.findMany).mockRejectedValue(new Error('db err'));
      
      const req = createRequest('GET', 'http://localhost/api/facebook-accounts');
      const res = await GET(req);
      expect(res.status).toBe(500);
    });
  });

  describe('POST', () => {
    it('should return 400 if rawAccounts is missing', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      const req = createRequest('POST', 'http://localhost/api/facebook-accounts', {});
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should parse and create accounts with random proxy', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      vi.mocked(prisma.proxy.findMany).mockResolvedValue([
        { protocol: 'http', host: '127.0.0.1', port: 8080, username: 'u', password: 'p' }
      ] as any);
      vi.mocked(prisma.facebookAccount.create).mockResolvedValue({ id: 'new-acc' } as any);

      const rawAccounts = "uid1|pass1|2fa1|cookie1\nuid2|pass2|2fa2|cookie2";
      const req = createRequest('POST', 'http://localhost/api/facebook-accounts', { rawAccounts });
      
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(2);
      
      expect(prisma.facebookAccount.create).toHaveBeenCalledTimes(2);
      expect(getOrGenerateFingerprint).toHaveBeenCalledTimes(2);
    });
  });

  describe('DELETE', () => {
    it('should return 400 if id is missing', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      const req = createRequest('DELETE', 'http://localhost/api/facebook-accounts');
      const res = await DELETE(req);
      expect(res.status).toBe(400);
    });

    it('should delete account successfully', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      vi.mocked(prisma.facebookAccount.delete).mockResolvedValue({} as any);
      
      const req = createRequest('DELETE', 'http://localhost/api/facebook-accounts?id=acc1');
      const res = await DELETE(req);
      expect(res.status).toBe(200);
      expect(prisma.facebookAccount.delete).toHaveBeenCalledWith({ where: { id: 'acc1' } });
    });
  });

  describe('PATCH', () => {
    it('should return 400 if ids is missing or empty', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      
      let req = createRequest('PATCH', 'http://localhost/api/facebook-accounts', { ids: [] });
      let res = await PATCH(req);
      expect(res.status).toBe(400);

      req = createRequest('PATCH', 'http://localhost/api/facebook-accounts', {});
      res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('should update proxies for accounts', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
      vi.mocked(prisma.facebookAccount.updateMany).mockResolvedValue({ count: 2 } as any);
      
      const req = createRequest('PATCH', 'http://localhost/api/facebook-accounts', {
        ids: ['acc1', 'acc2'],
        proxy: 'http://newproxy:80'
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(2);
      
      expect(prisma.facebookAccount.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['acc1', 'acc2'] } },
        data: { proxy: 'http://newproxy:80' }
      });
    });
  });
});
