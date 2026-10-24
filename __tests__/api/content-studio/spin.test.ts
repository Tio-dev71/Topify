import { describe, it, expect } from 'vitest';
import {
  generateSpinVariants,
  parseSpintax,
  expandSpintaxMultiple,
  calculateUniquenessScore,
} from '@/lib/content-studio/content-studio-engine';
import { POST } from '@/app/api/content-studio/spin/route';
import { NextRequest } from 'next/server';

describe('Content Studio F015 Spin & Anti-Spam Engine', () => {
  const originalCaption = 'Bản nhạc đình đám của BTS';

  it('generates 3 unique variants from normal caption', () => {
    const result = generateSpinVariants(originalCaption, 3);
    expect(result.variants).toHaveLength(3);
    expect(result.averageUniqueness).toBeGreaterThanOrEqual(70);
    expect(result.isSpintax).toBe(false);

    // Verify all 3 variants are unique
    const captions = result.variants.map((v) => v.caption);
    const uniqueCaptions = new Set(captions);
    expect(uniqueCaptions.size).toBe(3);

    // Verify structure
    result.variants.forEach((v, idx) => {
      expect(v.index).toBe(idx + 1);
      expect(v.uniquenessScore).toBeGreaterThanOrEqual(60);
      expect(v.wordCount).toBeGreaterThan(5);
      expect(v.hashtags.length).toBeGreaterThan(0);
    });
  });

  it('generates 5 unique variants from normal caption', () => {
    const result = generateSpinVariants(originalCaption, 5);
    expect(result.variants).toHaveLength(5);
    const uniqueCaptions = new Set(result.variants.map((v) => v.caption));
    expect(uniqueCaptions.size).toBe(5);
  });

  it('generates 8 unique variants from normal caption', () => {
    const result = generateSpinVariants(originalCaption, 8);
    expect(result.variants).toHaveLength(8);
    const uniqueCaptions = new Set(result.variants.map((v) => v.caption));
    expect(uniqueCaptions.size).toBe(8);
  });

  it('parses Spintax syntax correctly with combinations count and random variant', () => {
    const spintax = '{Xin chào|Hi cả nhà|Chào các bạn}, {hôm nay|ngày đẹp trời} mình {chia sẻ|bật mí} {bí quyết|tuyệt chiêu} {tuyệt vời|đỉnh cao} này nhé!';
    const parsed = parseSpintax(spintax);

    // 3 * 2 * 2 * 2 * 2 = 48 combinations
    expect(parsed.totalCombinations).toBe(48);
    expect(parsed.allExtractedChoices).toHaveLength(5);
    expect(parsed.sampleVariant).not.toContain('{');
    expect(parsed.sampleVariant).not.toContain('}');
    expect(parsed.sampleVariant).not.toContain('|');
    expect(parsed.sampleVariant.length).toBeGreaterThan(20);
  });

  it('parses simple {A|B|C} spintax correctly', () => {
    const spintax = '{A|B|C}';
    const parsed = parseSpintax(spintax);

    expect(parsed.totalCombinations).toBe(3);
    expect(['A', 'B', 'C']).toContain(parsed.sampleVariant);
  });

  it('expands multiple unique variants from spintax text', () => {
    const spintax = '{Xin chào|Hi cả nhà|Chào các bạn} {mọi người|anh em|bạn hữu}';
    const multiple = expandSpintaxMultiple(spintax, 3);
    expect(multiple.length).toBe(3);
    const uniqueSet = new Set(multiple);
    expect(uniqueSet.size).toBe(3);
  });

  it('calculates uniqueness score between two strings', () => {
    const s1 = 'Bản nhạc đình đám của BTS';
    const s2 = 'Góc chia sẻ hữu ích: Bản nhạc đình đám của BTS. Bạn đã nghe chưa?';
    const score = calculateUniquenessScore(s1, s2);
    expect(score).toBeGreaterThanOrEqual(25);
    expect(score).toBeLessThanOrEqual(100);
  });

  describe('API Route POST /api/content-studio/spin', () => {
    it('returns 400 when text is empty', async () => {
      const req = new NextRequest('http://localhost:3000/api/content-studio/spin', {
        method: 'POST',
        body: JSON.stringify({ text: '' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('returns 200 and 3 variants for valid text', async () => {
      const req = new NextRequest('http://localhost:3000/api/content-studio/spin', {
        method: 'POST',
        body: JSON.stringify({ text: originalCaption, count: 3 }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.variants).toHaveLength(3);
      expect(json.data.averageUniqueness).toBeGreaterThan(60);
    });

    it('returns 200 and spintax analysis when testSpintaxOnly is true', async () => {
      const req = new NextRequest('http://localhost:3000/api/content-studio/spin', {
        method: 'POST',
        body: JSON.stringify({ text: '{A|B|C}', testSpintaxOnly: true }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.totalCombinations).toBe(3);
      expect(['A', 'B', 'C']).toContain(json.data.sampleVariant);
    });
  });
});
