import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/proxies/route';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db', () => {
  const mockPrisma = {
    proxy: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
    }
  };
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('Proxies API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/proxies');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns proxies for authorized user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      const mockProxies = [{ id: '1', host: '127.0.0.1' }];
      vi.mocked(prisma.proxy.findMany).mockResolvedValue(mockProxies as any);

      const req = new NextRequest('http://localhost/api/proxies');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockProxies);
      expect(prisma.proxy.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
    });
  });

  describe('POST', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/proxies', { method: 'POST', body: JSON.stringify({}) });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('creates single proxy correctly', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      const mockProxy = { host: '127.0.0.1', port: '8080' };
      vi.mocked(prisma.proxy.create).mockResolvedValue(mockProxy as any);

      const req = new NextRequest('http://localhost/api/proxies', { method: 'POST', body: JSON.stringify(mockProxy) });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockProxy);
      expect(prisma.proxy.create).toHaveBeenCalledWith({
        data: { protocol: 'http', host: '127.0.0.1', port: 8080, username: null, password: null }
      });
    });

    it('creates multiple proxies correctly', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      const mockProxies = [
        { host: '127.0.0.1', port: '8080' },
        { protocol: 'socks5', host: '192.168.1.1', port: '9000', username: 'user', password: 'pwd' }
      ];
      vi.mocked(prisma.proxy.createMany).mockResolvedValue({ count: 2 } as any);

      const req = new NextRequest('http://localhost/api/proxies', { method: 'POST', body: JSON.stringify(mockProxies) });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.count).toBe(2);
      expect(prisma.proxy.createMany).toHaveBeenCalledWith({
        data: [
          { protocol: 'http', host: '127.0.0.1', port: 8080, username: null, password: null },
          { protocol: 'socks5', host: '192.168.1.1', port: 9000, username: 'user', password: 'pwd' }
        ]
      });
    });
  });

  describe('DELETE', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/proxies?id=1', { method: 'DELETE' });
      const res = await DELETE(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 if id is missing', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      const req = new NextRequest('http://localhost/api/proxies', { method: 'DELETE' });
      const res = await DELETE(req);
      expect(res.status).toBe(400);
    });

    it('deletes proxy successfully', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      vi.mocked(prisma.proxy.delete).mockResolvedValue({ id: '1' } as any);

      const req = new NextRequest('http://localhost/api/proxies?id=1', { method: 'DELETE' });
      const res = await DELETE(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.proxy.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
