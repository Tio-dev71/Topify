import { NextRequest } from 'next/server';
import { GET, POST, OPTIONS } from '@/app/api/posts/[id]/versions/route';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    post: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    postVersion: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('Post Versions (F081) API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OPTIONS', () => {
    it('returns 204 with CORS preflight headers', async () => {
      const res = await OPTIONS();
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('GET', () => {
    it('returns 401 if unauthorized in test environment', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/posts/post-1/versions');
      const res = await GET(req, { params: Promise.resolve({ id: 'post-1' }) });
      expect(res.status).toBe(401);
    });

    it('returns 404 if post is not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' } } as any);
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/posts/post-1/versions');
      const res = await GET(req, { params: Promise.resolve({ id: 'post-1' }) });
      expect(res.status).toBe(404);
    });

    it('returns version history list for the post', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' } } as any);
      vi.mocked(prisma.post.findUnique).mockResolvedValue({ id: 'post-1', workspaceId: 'ws-1' } as any);
      vi.mocked(prisma.postVersion.findMany).mockResolvedValue([
        {
          id: 'ver-1',
          postId: 'post-1',
          title: 'Version 1',
          caption: 'Caption 1',
          hashtags: '#test',
          createdAt: new Date().toISOString(),
          editedBy: { name: 'User 1', email: 'user1@example.com' },
        },
      ] as any);

      const req = new NextRequest('http://localhost/api/posts/post-1/versions');
      const res = await GET(req, { params: Promise.resolve({ id: 'post-1' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.versions).toHaveLength(1);
      expect(data.versions[0].id).toBe('ver-1');
    });
  });

  describe('POST', () => {
    it('creates a new version snapshot', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' } } as any);
      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        id: 'post-1',
        title: 'Original Title',
        caption: 'Original Caption',
        workspaceId: 'ws-1',
      } as any);
      vi.mocked(prisma.postVersion.create).mockResolvedValue({
        id: 'ver-new',
        postId: 'post-1',
        title: 'Updated Title',
        caption: 'Updated Caption',
        hashtags: '#new',
        createdAt: new Date().toISOString(),
      } as any);

      const req = new NextRequest('http://localhost/api/posts/post-1/versions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Updated Title',
          caption: 'Updated Caption',
          hashtags: '#new',
        }),
      });
      const res = await POST(req, { params: Promise.resolve({ id: 'post-1' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.version.id).toBe('ver-new');
    });

    it('restores an existing version', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', workspaceId: 'ws-1' } } as any);
      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        id: 'post-1',
        title: 'Current Title',
        caption: 'Current Caption',
        workspaceId: 'ws-1',
      } as any);
      vi.mocked(prisma.postVersion.findUnique).mockResolvedValue({
        id: 'ver-old',
        postId: 'post-1',
        title: 'Old Title',
        caption: 'Old Caption',
        hashtags: '#old',
        createdAt: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.post.update).mockResolvedValue({
        id: 'post-1',
        title: 'Old Title',
        caption: 'Old Caption',
      } as any);

      const req = new NextRequest('http://localhost/api/posts/post-1/versions', {
        method: 'POST',
        body: JSON.stringify({ versionId: 'ver-old' }),
      });
      const res = await POST(req, { params: Promise.resolve({ id: 'post-1' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.post.title).toBe('Old Title');
    });
  });
});
