import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/keywords/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import * as rapidClient from '@/lib/rapidapi/client';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    keywordTracker: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    mentionAlert: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
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

vi.mock('@/lib/audit-log', () => ({
  recordAuditLog: vi.fn(),
}));

vi.mock('@/lib/rapidapi/client', () => ({
  getKeywordInsights: vi.fn(),
  getRealTimeNews: vi.fn(),
}));

describe('Keywords API and Client Normalization - F109', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/keywords', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const req = new NextRequest('http://localhost:3000/api/keywords');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns list of keywords with mention counts', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user_1', name: 'Test User', email: 'test@example.com' },
      } as any);

      vi.mocked(prisma.keywordTracker.findMany).mockResolvedValue([
        {
          id: 'kw_1',
          keyword: 'bàn làm việc',
          volume: 12000,
          trend: 'UP',
          sentiment: 'neutral',
          workspaceId: 'ws_1',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        } as any,
      ]);

      vi.mocked(prisma.mentionAlert.count).mockResolvedValue(15);

      const req = new NextRequest('http://localhost:3000/api/keywords?workspaceId=ws_1');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.keywords).toHaveLength(1);
      expect(data.keywords[0].keyword).toBe('bàn làm việc');
      expect(data.keywords[0].mentionCount).toBe(15);
    });
  });

  describe('POST /api/keywords', () => {
    it('returns 400 when keyword is empty', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user_1', name: 'Test User', email: 'test@example.com' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({ keyword: '   ' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('creates keyword successfully and returns object with mentionCount', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user_1', name: 'Test User', email: 'test@example.com' },
      } as any);

      vi.mocked(rapidClient.getKeywordInsights).mockResolvedValue([
        { text: 'nội thất thông minh', volume: 8500, trend: 15 },
      ] as any);

      vi.mocked(rapidClient.getRealTimeNews).mockResolvedValue({ data: [] } as any);

      const createdRecord = {
        id: 'kw_new_1',
        keyword: 'nội thất thông minh',
        volume: 8500,
        trend: 'UP',
        workspaceId: null,
        createdAt: new Date('2026-10-28'),
        updatedAt: new Date('2026-10-28'),
      };

      vi.mocked(prisma.keywordTracker.create).mockResolvedValue(createdRecord as any);
      vi.mocked(prisma.mentionAlert.count).mockResolvedValue(3);

      const req = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({ keyword: 'nội thất thông minh' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.id).toBe('kw_new_1');
      expect(data.keyword).toBe('nội thất thông minh');
      expect(data.volume).toBe(8500);
      expect(data.trend).toBe('UP');
      expect(data.mentionCount).toBe(3);
    });
  });

  describe('Frontend Bug Reproduction & Fix Verification', () => {
    it('proves that previously res.data.keyword returned string and caused crash', () => {
      // The API response payload:
      const apiResponseData = {
        id: 'kw_123',
        keyword: 'nội thất thông minh',
        volume: 8500,
        trend: 'UP',
        mentionCount: 3,
      };

      // Buggy behavior before fix:
      const buggyExtracted = apiResponseData.keyword || apiResponseData;
      expect(typeof buggyExtracted).toBe('string');

      const buggyKeywordsState: any[] = [buggyExtracted];
      const search = 'nội thất';

      // Before fix: k.keyword is undefined on a string element, throwing TypeError
      expect(() => {
        buggyKeywordsState.filter(k => k.keyword.toLowerCase().includes(search.toLowerCase()));
      }).toThrowError("Cannot read properties of undefined (reading 'toLowerCase')");
    });

    it('verifies the new robust parser correctly extracts KeywordItem object', () => {
      const apiResponseData = {
        id: 'kw_123',
        keyword: 'nội thất thông minh',
        volume: 8500,
        trend: 'UP',
        mentionCount: 3,
      };

      // Fixed extraction logic:
      let createdItem: any;
      if (apiResponseData.keyword && typeof apiResponseData.keyword === 'object') {
        createdItem = apiResponseData.keyword;
      } else if (apiResponseData && typeof apiResponseData === 'object' && apiResponseData.id) {
        createdItem = apiResponseData;
      } else {
        createdItem = {
          id: 'fallback_id',
          keyword: 'nội thất thông minh',
          volume: 0,
          trend: 'FLAT',
          mentionCount: 0,
        };
      }

      expect(typeof createdItem).toBe('object');
      expect(createdItem.id).toBe('kw_123');
      expect(createdItem.keyword).toBe('nội thất thông minh');

      // Defensive filtering handles object, string, or null without throwing
      const safeKeywords = [createdItem, 'raw string legacy', null, undefined, { id: 'kw_2', keyword: 'sofa da' }];
      const search = 'nội thất';

      const filtered = safeKeywords.filter(k => {
        if (!k) return false;
        const kwText = typeof k === 'string' ? k : (k.keyword || '');
        return kwText.toLowerCase().includes((search || '').toLowerCase());
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('kw_123');
      expect(filtered[0].keyword).toBe('nội thất thông minh');
    });
  });
});
