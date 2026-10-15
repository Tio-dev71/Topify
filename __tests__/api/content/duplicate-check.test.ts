import { NextRequest } from 'next/server';
import { POST } from '@/app/api/content/duplicate-check/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    post: {
      findMany: vi.fn(),
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

describe('Duplicate Content Detection API (F082)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/content/duplicate-check', {
      method: 'POST',
      body: JSON.stringify({ caption: 'Sample test content' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns SAFE when input is too short or empty', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user_1', role: 'ADMIN', workspaceId: 'ws_1' },
    } as any);

    const req = new NextRequest('http://localhost/api/content/duplicate-check', {
      method: 'POST',
      body: JSON.stringify({ caption: 'Hi' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.riskLevel).toBe('SAFE');
    expect(data.hasDuplicates).toBe(false);
  });

  it('detects high text duplicate when caption matches existing post', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user_1', role: 'ADMIN', workspaceId: 'ws_1' },
    } as any);

    vi.mocked(prisma.post.findMany).mockResolvedValue([
      {
        id: 'post_old_1',
        title: 'Bí quyết kinh doanh online đỉnh cao',
        caption: 'Hôm nay chia sẻ cho mọi người 5 bí quyết kinh doanh online đỉnh cao không thể bỏ qua để bùng nổ doanh số bán hàng.',
        videoAssetId: 'video_old',
        status: 'PUBLISHED',
        createdAt: new Date('2026-09-01'),
        publishedAt: new Date('2026-09-01'),
        media: [],
      },
    ] as any);

    const req = new NextRequest('http://localhost/api/content/duplicate-check', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Bí quyết kinh doanh online đỉnh cao',
        caption: 'Hôm nay chia sẻ cho mọi người 5 bí quyết kinh doanh online đỉnh cao không thể bỏ qua để bùng nổ doanh số bán hàng.',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.hasDuplicates).toBe(true);
    expect(data.maxSimilarity).toBeGreaterThanOrEqual(75);
    expect(data.riskLevel).toBe('HIGH');
    expect(data.matches[0].postId).toBe('post_old_1');
  });

  it('flags HIGH risk and isMediaDuplicate=true when videoAssetId is reused', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user_1', role: 'ADMIN', workspaceId: 'ws_1' },
    } as any);

    vi.mocked(prisma.post.findMany).mockResolvedValue([
      {
        id: 'post_video_1',
        title: 'Video giới thiệu sản phẩm',
        caption: 'Nội dung khác hoàn toàn không trùng từ nào',
        videoAssetId: 'shared_video_asset_123',
        status: 'PUBLISHED',
        createdAt: new Date('2026-09-10'),
        publishedAt: new Date('2026-09-10'),
        media: [],
      },
    ] as any);

    const req = new NextRequest('http://localhost/api/content/duplicate-check', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Tiêu đề mới',
        caption: 'Caption hoàn toàn mới',
        videoAssetId: 'shared_video_asset_123',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.isMediaDuplicate).toBe(true);
    expect(data.riskLevel).toBe('HIGH');
  });
});
