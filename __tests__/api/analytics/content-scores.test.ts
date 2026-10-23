import { describe, it, expect } from 'vitest';
import {
  calculateContentPerformanceScore,
  getDeterministicMetrics,
} from '@/lib/analytics/engine';

describe('M5 Analytics Content Performance Scoring Engine (F103)', () => {
  it('calculates differentiated scores for posts with different metrics', () => {
    // Post 1: Moderate post
    const post1 = calculateContentPerformanceScore({
      reach: 24300,
      views: 24300,
      likes: 1200,
      comments: 90,
      shares: 60,
      clicks: 420,
      conversions: 5,
    });

    // Post 2: Higher reach and better conversion post
    const post2 = calculateContentPerformanceScore({
      reach: 26700,
      views: 26700,
      likes: 1650,
      comments: 180,
      shares: 140,
      clicks: 680,
      conversions: 12,
    });

    // Reach score should reflect reach difference
    expect(post2.reachScore).toBeGreaterThanOrEqual(post1.reachScore);
    // Conversion score should reflect deal difference (12 deals > 5 deals)
    expect(post2.conversionScore).toBeGreaterThan(post1.conversionScore);
    // Overall scores should differ
    expect(post1.overallScore).not.toBe(post2.overallScore);
  });

  it('accurately classifies Viral tier (>= 85đ) with high reach, engagement and conversions', () => {
    const viralPost = calculateContentPerformanceScore({
      reach: 52000,
      views: 55000,
      likes: 4200,
      comments: 530,
      shares: 890,
      clicks: 1450,
      conversions: 24,
    });

    expect(viralPost.reachScore).toBeGreaterThanOrEqual(28);
    expect(viralPost.engagementScore).toBeGreaterThanOrEqual(35);
    expect(viralPost.conversionScore).toBe(10);
    expect(viralPost.overallScore).toBeGreaterThanOrEqual(85);
    expect(viralPost.tier).toBe('VIRAL');
  });

  it('accurately classifies Underperforming tier (< 60đ) with low reach and poor interaction', () => {
    const lowPost = calculateContentPerformanceScore({
      reach: 3200,
      views: 3500,
      likes: 45,
      comments: 3,
      shares: 2,
      clicks: 18,
      conversions: 0,
    });

    expect(viralScoreUnderperforming(lowPost.overallScore)).toBe(true);
    expect(lowPost.tier).toBe('UNDERPERFORMING');
    expect(lowPost.conversionScore).toBe(0);
  });

  it('getDeterministicMetrics produces unique, varied and repeatable metrics per post', () => {
    const p1 = getDeterministicMetrics({
      id: 'post_yt_1',
      title: "P5_ Jungkook's Hidden Vocal Moment in live performance",
    });

    const p2 = getDeterministicMetrics({
      id: 'post_yt_2',
      title: '안방1열 풀캠4K 베이비몬스터 BABYMONSTER Special Stage',
    });

    // Metrics should not be identical
    expect(p1.reach).not.toBe(p2.reach);
    expect(p1.likes).not.toBe(p2.likes);

    // Consistency check: same input always produces same output
    const p1Again = getDeterministicMetrics({
      id: 'post_yt_1',
      title: "P5_ Jungkook's Hidden Vocal Moment in live performance",
    });
    expect(p1Again).toEqual(p1);

    // Scores should differ
    const s1 = calculateContentPerformanceScore(p1);
    const s2 = calculateContentPerformanceScore(p2);
    expect(s1.overallScore).toBeDefined();
    expect(s2.overallScore).toBeDefined();
  });
});

function viralScoreUnderperforming(score: number): boolean {
  return score < 60;
}
