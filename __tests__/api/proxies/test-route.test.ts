import { NextRequest } from 'next/server';
import { POST } from '@/app/api/proxies/test/route';
import { auth } from '@/lib/auth';
import fetch from 'node-fetch';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

vi.mock('https-proxy-agent', () => ({
  HttpsProxyAgent: class HttpsProxyAgent {}
}));

vi.mock('socks-proxy-agent', () => ({
  SocksProxyAgent: class SocksProxyAgent {}
}));

describe('Proxies Test API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns 401 if unauthorized and no fallback token', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/proxies/test', {
        method: 'POST',
        body: JSON.stringify({ host: '127.0.0.1', port: 8080 })
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 if host or port missing', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      const req = new NextRequest('http://localhost/api/proxies/test', {
        method: 'POST',
        body: JSON.stringify({ host: '127.0.0.1' }) // port missing
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns success when fetch succeeds', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ ip: '8.8.8.8' }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const req = new NextRequest('http://localhost/api/proxies/test', {
        method: 'POST',
        body: JSON.stringify({ host: '127.0.0.1', port: 8080 })
      });
      
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.ip).toBe('8.8.8.8');
      expect(typeof json.ping).toBe('number');
      expect(fetch).toHaveBeenCalled();
    });

    it('allows access with Bearer token fallback', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ ip: '8.8.8.8' }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const req = new NextRequest('http://localhost/api/proxies/test', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer fake-token'
        },
        body: JSON.stringify({ host: '127.0.0.1', port: 8080 })
      });
      
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('returns 500 when fetch fails', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      
      vi.mocked(fetch).mockRejectedValue(new Error('Connection refused'));

      const req = new NextRequest('http://localhost/api/proxies/test', {
        method: 'POST',
        body: JSON.stringify({ host: '127.0.0.1', port: 8080 })
      });
      
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Connection refused');
    });
  });
});
