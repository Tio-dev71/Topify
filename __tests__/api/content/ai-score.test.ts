import { NextRequest } from 'next/server';
import { POST } from '@/app/api/content/ai-score/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '@/lib/auth';
import { analyzeContentScore, cleanVideoTitle, isMeaninglessOrGibberish } from '@/lib/ai/9router';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('AI Content Score (F084)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Gibberish & Meaningless Detection', () => {
    it('accurately identifies random gibberish strings', () => {
      expect(isMeaninglessOrGibberish('dsfsdfdsf').isGibberish).toBe(true);
      expect(isMeaninglessOrGibberish('asdfghjkl').isGibberish).toBe(true);
      expect(isMeaninglessOrGibberish('asdasdasd').isGibberish).toBe(true);
      expect(isMeaninglessOrGibberish('aaaaaaa').isGibberish).toBe(true);
      expect(isMeaninglessOrGibberish('1234567').isGibberish).toBe(true);
      expect(isMeaninglessOrGibberish('......').isGibberish).toBe(true);
      expect(isMeaninglessOrGibberish('test').isGibberish).toBe(true);
    });

    it('identifies valid Vietnamese and English content as non-gibberish', () => {
      expect(isMeaninglessOrGibberish('BTS biểu diễn tại concert tuyệt vời!').isGibberish).toBe(false);
      expect(isMeaninglessOrGibberish('Học cách nấu phở bò chuẩn vị tại nhà').isGibberish).toBe(false);
      expect(isMeaninglessOrGibberish('Check ngay mẹo này nhé mọi người!').isGibberish).toBe(false);
    });
  });

  describe('Video Title Cleaning', () => {
    it('strips downloader artifacts, resolution, and extension tags', () => {
      const raw = "[SPECIAL CLIP] BTS (방탄소년단) 'Life Goes On' (in the -mp4_(360p)";
      const cleaned = cleanVideoTitle(raw);
      expect(cleaned).toBe("BTS (방탄소년단) 'Life Goes On'");
      expect(cleaned).not.toContain('360p');
      expect(cleaned).not.toContain('SPECIAL CLIP');
      expect(cleaned).not.toContain('mp4');
    });
  });

  describe('Content Score Engine Behavior', () => {
    it('gives 0 scores and ZERO fake strengths for gibberish caption (dsfsdfdsf)', async () => {
      const result = await analyzeContentScore({
        title: "[SPECIAL CLIP] BTS (방탄소년단) 'Life Goes On' (in the -mp4_(360p)",
        caption: 'dsfsdfdsf',
        platform: 'TIKTOK',
      });

      // Overall score must be 0
      expect(result.overallScore).toBe(0);
      expect(result.hookScore).toBe(0);
      expect(result.ctaScore).toBe(0);
      expect(result.platformFitScore).toBe(0);

      // Must NOT contain Brand Voice when unconfigured
      expect(result.brandVoiceScore).toBeUndefined();
      expect(result.brandVoiceAnalysis).toBeUndefined();

      // Must NOT produce fake praise in strengths
      expect(result.strengths).toEqual([]);
      expect(result.strengths).not.toContain('Nội dung súc tích, đi thẳng vào vấn đề chính.');

      // Must produce clear warnings in improvements
      expect(result.improvements.length).toBeGreaterThan(0);
      expect(result.improvements.some(imp => imp.includes('vô nghĩa') || imp.includes('sơ sài'))).toBe(true);

      // Suggested caption should leverage clean title
      expect(result.suggestedCaption).toContain("BTS (방탄소년단) 'Life Goes On'");
    });

    it('sets platformFitScore to 0 when platform is unselected or ALL', async () => {
      const result = await analyzeContentScore({
        caption: 'Bí quyết nấu ăn ngon cho cả nhà, lưu lại ngay nhé!',
        platform: 'ALL',
      });

      expect(result.platformFitScore).toBe(0);
      expect(result.improvements.some(imp => imp.includes('nền tảng xuất bản'))).toBe(true);
      expect(result.platformFitAnalysis).toContain('Chưa chọn nền tảng');
    });

    it('calculates score with Brand Voice when configured', async () => {
      const result = await analyzeContentScore({
        caption: 'Bí quyết nấu ăn ngon cho cả nhà, lưu lại ngay nhé!',
        brandVoice: 'Thân thiện, trẻ trung',
        platform: 'TIKTOK',
      });

      expect(result.brandVoiceScore).toBeDefined();
      expect(typeof result.brandVoiceScore).toBe('number');
      expect(result.brandVoiceAnalysis).toBeDefined();
    });

    it('omits Brand Voice completely when unconfigured', async () => {
      const result = await analyzeContentScore({
        caption: 'Bí quyết nấu ăn ngon cho cả nhà, lưu lại ngay nhé!',
        platform: 'TIKTOK',
      });

      expect(result.brandVoiceScore).toBeUndefined();
      expect(result.brandVoiceAnalysis).toBeUndefined();
    });
  });

  describe('POST /api/content/ai-score Endpoint', () => {
    it('returns 401 if unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/content/ai-score', {
        method: 'POST',
        body: JSON.stringify({ caption: 'dsfsdfdsf' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 if caption is empty', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user_1', role: 'ADMIN', workspaceId: 'ws_1' },
      } as any);

      const req = new NextRequest('http://localhost/api/content/ai-score', {
        method: 'POST',
        body: JSON.stringify({ caption: '   ' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns low score without brand voice for gibberish caption', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user_1', role: 'ADMIN', workspaceId: 'ws_1' },
      } as any);

      const req = new NextRequest('http://localhost/api/content/ai-score', {
        method: 'POST',
        body: JSON.stringify({
          title: "[SPECIAL CLIP] BTS (방탄소년단) 'Life Goes On' (in the -mp4_(360p)",
          caption: 'dsfsdfdsf',
          platform: 'TIKTOK_VIDEO',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.overallScore).toBeLessThanOrEqual(15);
      expect(body.data.brandVoiceScore).toBeUndefined();
      expect(body.data.strengths).toEqual([]);
    });
  });
});
