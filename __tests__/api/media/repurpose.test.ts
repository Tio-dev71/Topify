import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, OPTIONS } from '@/app/api/media/repurpose/route';
import { generateVideoRepurposeHighlights } from '@/lib/ai/9router';
import { processVideoRepurposeCut } from '@/lib/media/studio';

// Mock dependencies
vi.mock('@/lib/db', () => {
  const mockPrisma = {
    user: {
      findFirst: vi.fn().mockResolvedValue({ id: 'user-1', workspaceId: 'ws-1' }),
      findUnique: vi.fn().mockResolvedValue({ id: 'user-1' }),
    },
    workspace: {
      findUnique: vi.fn().mockResolvedValue({ id: 'ws-1' }),
    },
    videoAsset: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'asset-source-1',
        storageUrl: '/api/uploads/source.mp4',
        originalFileName: 'source.mp4',
      }),
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'asset-cut-1',
          ...data,
        })
      ),
    },
  };
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'user-1', role: 'ADMIN', workspaceId: 'ws-1' },
  }),
}));

vi.mock('@/lib/storage', () => ({
  getStorage: vi.fn(() => ({
    upload: vi.fn().mockResolvedValue('/api/uploads/highlight-cut-1.mp4'),
    getBuffer: vi.fn().mockResolvedValue(Buffer.from('mock video buffer data')),
  })),
}));

vi.mock('@/lib/media/studio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/media/studio')>();
  return {
    ...actual,
    processVideoRepurposeCut: vi.fn().mockResolvedValue({
      outputBuffer: Buffer.from('mock cut video buffer'),
      outputFileName: 'Highlight_Opening_0s_35s.mp4',
      mimeType: 'video/mp4',
      duration: 35,
      width: 1080,
      height: 1920,
    }),
  };
});

describe('Media Repurpose API Route (/api/media/repurpose)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles OPTIONS preflight correctly', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('handles GET capabilities query', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.capabilities).toContain('cut');
    expect(json.capabilities).toContain('analyze');
  });

  it('analyzes video and returns dynamic highlight clips based on title and duration', async () => {
    const req = new NextRequest('http://localhost/api/media/repurpose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'analyze',
        title: 'Bí Quyết Bán Hàng TikTok Triệu View',
        durationSeconds: 150,
        transcriptText: 'Bản ghi thoại hướng dẫn bán hàng trên TikTok',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.clips.length).toBeGreaterThanOrEqual(2);
    // Dynamic title should contain custom video title
    expect(json.data.clips[0].title).toContain('Bí Quyết Bán Hàng TikTok Triệu View');
    expect(json.data.clips[0].startTime).toBe(0);
    expect(json.data.clips[0].endTime).toBeLessThanOrEqual(150);
  });

  it('cuts video highlight segment using FFmpeg and creates VideoAsset in database', async () => {
    const req = new NextRequest('http://localhost/api/media/repurpose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cut',
        mediaUrl: '/api/uploads/source.mp4',
        startTime: 10,
        endTime: 45,
        clipTitle: 'Đoạn Mở Đầu Bán Hàng',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.clipUrl).toBe('/api/uploads/highlight-cut-1.mp4');
    expect(json.asset.id).toBe('asset-cut-1');
    expect(processVideoRepurposeCut).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: 10,
        endTime: 45,
        clipTitle: 'Đoạn Mở Đầu Bán Hàng',
      })
    );
  });

  it('heuristic generator produces properly bounded clips for short video (<60s)', async () => {
    const result = await generateVideoRepurposeHighlights({
      title: 'Mẹo Ngắn 30 Giây',
      durationSeconds: 30,
    });

    expect(result.clips.length).toBe(2);
    expect(result.clips[0].startTime).toBe(0);
    expect(result.clips[1].endTime).toBe(30);
    expect(result.clips[0].title).toContain('Mẹo Ngắn 30 Giây');
  });

  it('heuristic generator produces 4 clips for long video (>=180s)', async () => {
    const result = await generateVideoRepurposeHighlights({
      title: 'Khoá Học Kinh Doanh Toàn Diện',
      durationSeconds: 240,
    });

    expect(result.clips.length).toBe(4);
    expect(result.clips[0].startTime).toBe(0);
    expect(result.clips[3].endTime).toBe(240);
    expect(result.clips[2].title).toContain('Bí Quyết Đột Phá');
  });
});
