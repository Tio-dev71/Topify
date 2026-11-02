import { NextRequest } from 'next/server';
import { GET } from '@/app/api/keywords/detail/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import * as rapidClient from '@/lib/rapidapi/client';
import { 
  cleanCoreTitle, 
  normalizeUrl, 
  analyzeVietnameseSentiment, 
  deduplicateMentions 
} from '@/lib/keywords/utils';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    keywordTracker: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    mentionAlert: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
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

vi.mock('@/lib/rapidapi/client', () => ({
  getKeywordInsights: vi.fn(),
  getRealTimeNews: vi.fn(),
}));

describe('Keyword Detail API & Mention Enrichment - F109', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Deduplication & Sentiment Utilities', () => {
    it('normalizes titles by stripping common prefixes and punctuation', () => {
      const t1 = 'Nóng 24h ngày 31/10: Bị cáo Nguyễn Hòa Bình (Shark Bình) khai gì về Mr Pips?';
      const t2 = 'Bị cáo Nguyễn Hòa Bình (Shark Bình) khai gì về Mr Pips?';
      expect(cleanCoreTitle(t1)).toBe(cleanCoreTitle(t2));

      const v1 = '[Video] Shark Bình thừa nhận sai phạm trong hành vi “rửa tiền”';
      const v2 = 'Vụ án Mr Pips: Shark Bình thừa nhận sai phạm trong hành vi “rửa tiền”';
      expect(cleanCoreTitle(v1)).toBe(cleanCoreTitle(v2));
    });

    it('deduplicates mentions list with identical titles or URLs', () => {
      const items = [
        {
          id: '1',
          title: 'Nóng 24h ngày 31/10: Bị cáo Nguyễn Hòa Bình (Shark Bình) khai gì về Mr Pips?',
          sourceUrl: 'https://24h.com.vn/tin-tuc-trong-ngay/1.html'
        },
        {
          id: '2',
          title: 'Nóng 24h ngày 31/10: Bị cáo Nguyễn Hòa Bình (Shark Bình) khai gì về Mr Pips?',
          sourceUrl: 'https://vov.gov.vn/nong-24h/2.html'
        },
        {
          id: '3',
          title: 'Shark Bình: Bị cáo hoan hỉ đi tù, biết là có tội',
          sourceUrl: 'https://vnexpress.net/shark-binh.html'
        }
      ];

      const deduplicated = deduplicateMentions(items);
      expect(deduplicated).toHaveLength(2);
      expect(deduplicated[0].id).toBe('1');
      expect(deduplicated[1].id).toBe('3');
    });

    it('accurately identifies Vietnamese negative sentiment for crime/court/trial', () => {
      expect(analyzeVietnameseSentiment('Shark Bình: Bị cáo đi tù là chắc rồi')).toBe('negative');
      expect(analyzeVietnameseSentiment('[Video] Shark Bình thừa nhận sai phạm trong hành vi rửa tiền')).toBe('negative');
      expect(analyzeVietnameseSentiment('Ngày thứ 3 xét xử vụ án Mr Pips lừa đảo chiếm đoạt tài sản')).toBe('negative');
    });

    it('accurately identifies Vietnamese positive sentiment for growth/investment', () => {
      expect(analyzeVietnameseSentiment('Tập đoàn NextTech công bố tăng trưởng doanh thu vượt bậc và gọi vốn thành công')).toBe('positive');
      expect(analyzeVietnameseSentiment('Shark Bình vinh danh các startup công nghệ xuất sắc tại diễn đàn đầu tư')).toBe('positive');
    });

    it('classifies informative neutral news correctly', () => {
      expect(analyzeVietnameseSentiment('Những chiếc xe từng xuất hiện cùng Shark Bình')).toBe('neutral');
      expect(analyzeVietnameseSentiment('Thời sự tổng hợp tình hình kinh tế sáng 31/10')).toBe('neutral');
    });
  });

  describe('GET /api/keywords/detail', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost:3000/api/keywords/detail?keyword=Shark%20Bình');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 when both id and keyword are missing', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user_1' } } as any);
      const req = new NextRequest('http://localhost:3000/api/keywords/detail');
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it('enriches mentions to >= 20 items, removes duplicates, and classifies sentiment', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user_1' } } as any);

      vi.mocked(prisma.keywordTracker.findFirst).mockResolvedValue({
        id: 'kw_shark',
        keyword: 'Shark Bình',
        volume: 60500,
        trend: 'DOWN',
        workspaceId: null,
        createdAt: new Date('2026-10-31'),
        updatedAt: new Date('2026-10-31')
      } as any);

      vi.mocked(rapidClient.getKeywordInsights).mockResolvedValue([
        { text: 'shark bình', volume: 60500, trend: -5.34, competition_level: 'MEDIUM', competition_index: 25 },
        { text: 'bình shark', volume: 30 },
        { text: 'bình nexttech', volume: 10 }
      ]);

      // Database initially has only 2 duplicate articles
      vi.mocked(prisma.mentionAlert.findMany).mockResolvedValue([
        {
          id: 'm_1',
          title: 'Nóng 24h ngày 31/10: Bị cáo Nguyễn Hòa Bình (Shark Bình) khai gì về Mr Pips?',
          message: 'Tin từ 24h',
          sourceUrl: 'https://24h.com.vn/article1.html',
          keyword: 'Shark Bình',
          createdAt: new Date('2026-10-31T08:00:00Z')
        },
        {
          id: 'm_2',
          title: 'Nóng 24h ngày 31/10: Bị cáo Nguyễn Hòa Bình (Shark Bình) khai gì về Mr Pips?',
          message: 'Tin từ VOV lặp lại',
          sourceUrl: 'https://vov.gov.vn/article2.html',
          keyword: 'Shark Bình',
          createdAt: new Date('2026-10-31T08:05:00Z')
        }
      ] as any);

      vi.mocked(prisma.mentionAlert.deleteMany).mockResolvedValue({ count: 1 });

      let createdCounter = 100;
      (prisma.mentionAlert.create as any).mockImplementation(async (args: any) => {
        createdCounter++;
        return {
          id: `m_created_${createdCounter}`,
          ...args.data,
          createdAt: args.data.createdAt || new Date()
        } as any;
      });

      // RapidAPI returns 25 items
      const mockNews = Array.from({ length: 25 }, (_, idx) => ({
        title: idx === 0
          ? 'Shark Bình lý giải nụ cười tại tòa'
          : idx === 1
          ? 'Shark Bình nói 2 cấp dưới vô tình phạm tội, xin cứu xét nữ nhân viên bị ung thư'
          : `Tin tức sự kiện tài chính số ${idx + 2} liên quan Shark Bình`,
        snippet: 'Nội dung tóm tắt chi tiết',
        link: `https://news-outlet-${idx}.vn/post-${idx}.html`,
        published_datetime_utc: new Date(Date.now() - idx * 3600000).toISOString()
      }));

      vi.mocked(rapidClient.getRealTimeNews).mockResolvedValue({ data: mockNews } as any);

      const req = new NextRequest('http://localhost:3000/api/keywords/detail?keyword=Shark%20B%C3%ACnh');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.keyword).toBe('Shark Bình');
      expect(data.volume).toBe(60500);
      expect(data.mentions.length).toBeGreaterThanOrEqual(20);

      // Verify no duplicates in the returned mentions
      const titles = data.mentions.map((m: any) => cleanCoreTitle(m.title));
      const uniqueTitles = new Set(titles);
      expect(titles.length).toBe(uniqueTitles.size);

      // Verify sentiment stats are present and valid
      expect(data.stats.totalMentions).toBe(data.mentions.length);
      expect(data.stats.totalMentions).toBe(data.stats.positiveCount + data.stats.negativeCount + data.stats.neutralCount);
      // Shark Bình trial news should have negative classifications
      expect(data.stats.negativeCount).toBeGreaterThan(0);
    });
  });
});
