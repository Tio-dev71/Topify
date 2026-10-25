import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/media/route';
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/media/[id]/route';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

// Mock dependencies
vi.mock('@/lib/db', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
    mediaAsset: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

vi.mock('@/lib/storage', () => ({
  getStorage: vi.fn(() => ({
    upload: vi.fn().mockResolvedValue('/api/uploads/unique-uuid.mp4'),
    delete: vi.fn().mockResolvedValue(undefined),
    getBuffer: vi.fn().mockResolvedValue(Buffer.from('')),
  })),
}));

describe('Media Library API Routes (/api/media)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createFormDataRequest = (fields: Record<string, any>) => {
    const req = new NextRequest('http://localhost/api/media', {
      method: 'POST',
    });
    req.formData = vi.fn().mockResolvedValue({
      get: vi.fn().mockImplementation((name: string) => fields[name] ?? null),
    });
    return req;
  };

  const createMockFile = (name: string, type: string, size = 2048000) => {
    return {
      name,
      type,
      size,
      arrayBuffer: async () => Buffer.from('fake content'),
    } as unknown as File;
  };

  describe('POST /api/media', () => {
    it('returns 401 if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const file = createMockFile('test.mp4', 'video/mp4');
      const req = createFormDataRequest({ file });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('returns 400 if no file is provided in FormData', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN', workspaceId: 'ws-1' },
      } as any);

      const req = createFormDataRequest({});

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('No file provided');
    });

    it('successfully uploads video and sets mediaType: VIDEO with correct storage URL', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN', workspaceId: 'ws-1' },
      } as any);

      const mockAsset = {
        id: 'asset-1',
        fileName: 'demo_video.mp4',
        storageUrl: '/api/uploads/unique-uuid.mp4',
        mimeType: 'video/mp4',
        size: 2048000,
        mediaType: 'VIDEO',
        tags: 'promo, reels',
        alt: null,
        createdById: 'user-1',
        workspaceId: 'ws-1',
        createdAt: new Date().toISOString(),
      };
      vi.mocked(prisma.mediaAsset.create).mockResolvedValue(mockAsset as any);

      const file = createMockFile('demo_video.mp4', 'video/mp4');
      const req = createFormDataRequest({ file, tags: 'promo, reels' });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('asset-1');
      expect(json.fileName).toBe('demo_video.mp4');
      expect(json.mediaType).toBe('VIDEO');
      expect(prisma.mediaAsset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fileName: 'demo_video.mp4',
          mimeType: 'video/mp4',
          mediaType: 'VIDEO',
          tags: 'promo, reels',
          createdById: 'user-1',
          workspaceId: 'ws-1',
        }),
      });
    });

    it('infers VIDEO mediaType from file extension if browser MIME is empty or application/octet-stream', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', role: 'USER', workspaceId: 'ws-1' },
      } as any);

      vi.mocked(prisma.mediaAsset.create).mockImplementation(async (args: any) => ({
        id: 'asset-vid-fallback',
        ...args.data,
      }));

      // Simulate browser sending empty type or application/octet-stream
      const file = createMockFile('camera_clip.mov', '');
      const req = createFormDataRequest({ file });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(prisma.mediaAsset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fileName: 'camera_clip.mov',
          mimeType: 'video/quicktime',
          mediaType: 'VIDEO',
        }),
      });
    });

    it('resolves workspaceId from user database record if session.user has no workspaceId', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-no-ws', role: 'USER' },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        workspaceId: 'ws-from-db-123',
      } as any);

      vi.mocked(prisma.mediaAsset.create).mockImplementation(async (args: any) => ({
        id: 'asset-ws',
        ...args.data,
      }));

      const file = createMockFile('banner.png', 'image/png');
      const req = createFormDataRequest({ file });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-no-ws' },
        select: { workspaceId: true },
      });
      expect(prisma.mediaAsset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-from-db-123',
          mediaType: 'IMAGE',
        }),
      });
    });
  });

  describe('GET /api/media', () => {
    it('returns media assets and total count for workspace', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', role: 'USER', workspaceId: 'ws-1' },
      } as any);

      const mockAssets = [
        { id: '1', fileName: 'vid1.mp4', mediaType: 'VIDEO', size: 1000 },
        { id: '2', fileName: 'img1.png', mediaType: 'IMAGE', size: 500 },
      ];
      vi.mocked(prisma.mediaAsset.findMany).mockResolvedValue(mockAssets as any);
      vi.mocked(prisma.mediaAsset.count).mockResolvedValue(2);

      const req = new NextRequest('http://localhost/api/media?type=VIDEO&search=vid');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.assets).toHaveLength(2);
      expect(json.total).toBe(2);
      expect(prisma.mediaAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: 'ws-1',
            mediaType: 'VIDEO',
          }),
        })
      );
    });
  });

  describe('GET, PUT, DELETE /api/media/[id]', () => {
    it('GET /api/media/[id] returns asset if user is in same workspace', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', role: 'USER', workspaceId: 'ws-1' },
      } as any);

      const mockAsset = {
        id: 'asset-1',
        fileName: 'demo.mp4',
        workspaceId: 'ws-1',
        createdById: 'user-1',
      };
      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockAsset as any);

      const req = new NextRequest('http://localhost/api/media/asset-1');
      const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'asset-1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe('asset-1');
    });

    it('DELETE /api/media/[id] removes asset if authorized', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', role: 'USER', workspaceId: 'ws-1' },
      } as any);

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue({
        id: 'asset-1',
        workspaceId: 'ws-1',
        createdById: 'user-1',
      } as any);
      vi.mocked(prisma.mediaAsset.delete).mockResolvedValue({ id: 'asset-1' } as any);

      const req = new NextRequest('http://localhost/api/media/asset-1', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'asset-1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(prisma.mediaAsset.delete).toHaveBeenCalledWith({ where: { id: 'asset-1' } });
    });

    it('DELETE /api/media/[id] returns 404 if asset belongs to another workspace', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', role: 'USER', workspaceId: 'ws-1' },
      } as any);

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue({
        id: 'asset-2',
        workspaceId: 'ws-other',
        createdById: 'user-other',
      } as any);

      const req = new NextRequest('http://localhost/api/media/asset-2', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'asset-2' }) });
      expect(res.status).toBe(404);
    });
  });
});
