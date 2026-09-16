import { NextRequest } from 'next/server';
import { GET } from '@/app/api/posts/stats/route';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db', () => {
  const mockPrisma = {
    post: {
      count: vi.fn(),
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

describe('Posts Stats API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('returns stats for admin without createdById filter', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' }, expires: '1' } as any);
      
      vi.mocked(prisma.post.count)
        .mockResolvedValueOnce(5)  // scheduled
        .mockResolvedValueOnce(10) // published
        .mockResolvedValueOnce(2)  // failed
        .mockResolvedValueOnce(17); // total

      const res = await GET();
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json).toEqual({ scheduled: 5, published: 10, failed: 2, total: 17 });
      expect(prisma.post.count).toHaveBeenCalledWith({ where: { status: 'SCHEDULED' } });
    });

    it('returns stats for staff with createdById filter', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'staff-1', role: 'STAFF' }, expires: '1' } as any);
      
      vi.mocked(prisma.post.count)
        .mockResolvedValueOnce(1)  // scheduled
        .mockResolvedValueOnce(2) // published
        .mockResolvedValueOnce(0)  // failed
        .mockResolvedValueOnce(3); // total

      const res = await GET();
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json).toEqual({ scheduled: 1, published: 2, failed: 0, total: 3 });
      expect(prisma.post.count).toHaveBeenCalledWith({ where: { createdById: 'staff-1', status: 'SCHEDULED' } });
    });
  });
});
