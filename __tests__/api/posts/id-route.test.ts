import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '@/app/api/posts/[id]/route';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db', () => {
  const mockPrisma = {
    post: {
      findUnique: vi.fn(),
      update: vi.fn(),
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

describe('Posts [id] API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/posts/1');
      const res = await GET(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(401);
    });

    it('returns 404 if post not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/posts/1');
      const res = await GET(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(404);
    });

    it('returns 403 if staff tries to view other users post', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'staff-1', role: 'STAFF' }, expires: '1' } as any);
      vi.mocked(prisma.post.findUnique).mockResolvedValue({ id: '1', createdById: 'other-user' } as any);

      const req = new NextRequest('http://localhost/api/posts/1');
      const res = await GET(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(403);
    });

    it('returns 200 with post data', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' }, expires: '1' } as any);
      
      const mockPost = { id: '1', createdById: 'other-user' };
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost as any);

      const req = new NextRequest('http://localhost/api/posts/1');
      const res = await GET(req, { params: Promise.resolve({ id: '1' }) });
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json).toEqual(mockPost);
    });
  });

  describe('PATCH', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/posts/1', { method: 'PATCH', body: JSON.stringify({}) });
      const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(401);
    });

    it('returns 404 if post not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/posts/1', { method: 'PATCH', body: JSON.stringify({}) });
      const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(404);
    });

    it('returns 403 if staff tries to edit other users post', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'staff-1', role: 'STAFF' }, expires: '1' } as any);
      vi.mocked(prisma.post.findUnique).mockResolvedValue({ id: '1', createdById: 'other-user' } as any);

      const req = new NextRequest('http://localhost/api/posts/1', { method: 'PATCH', body: JSON.stringify({}) });
      const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(403);
    });

    it('updates post data correctly', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', role: 'STAFF' }, expires: '1' } as any);
      vi.mocked(prisma.post.findUnique).mockResolvedValue({ id: '1', createdById: 'user-1', status: 'SCHEDULED' } as any);
      vi.mocked(prisma.post.update).mockResolvedValue({ id: '1', title: 'New Title', status: 'DRAFT' } as any);

      const req = new NextRequest('http://localhost/api/posts/1', { 
        method: 'PATCH', 
        body: JSON.stringify({ title: 'New Title', status: 'DRAFT' }) 
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.title).toBe('New Title');
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { title: 'New Title', status: 'DRAFT', scheduledAt: null }
      });
    });
  });

  describe('DELETE', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/posts/1', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(401);
    });

    it('returns 404 if post not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' }, expires: '1' });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/posts/1', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(404);
    });

    it('returns 403 if staff tries to delete other users post', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'staff-1', role: 'STAFF' }, expires: '1' } as any);
      vi.mocked(prisma.post.findUnique).mockResolvedValue({ id: '1', createdById: 'other-user' } as any);

      const req = new NextRequest('http://localhost/api/posts/1', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(403);
    });

    it('deletes post successfully', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', role: 'STAFF' }, expires: '1' } as any);
      vi.mocked(prisma.post.findUnique).mockResolvedValue({ id: '1', createdById: 'user-1' } as any);
      vi.mocked(prisma.post.delete).mockResolvedValue({ id: '1' } as any);

      const req = new NextRequest('http://localhost/api/posts/1', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
