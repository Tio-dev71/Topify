import { describe, it, expect } from 'vitest';
import {
  calculateGrowth,
  generatePeriodComparison,
} from '@/lib/analytics/engine';

describe('M5 Analytics Period Comparison Engine (F050)', () => {
  it('calculates positive growth rate correctly', () => {
    const growth = calculateGrowth(120, 100);
    expect(growth.current).toBe(120);
    expect(growth.prior).toBe(100);
    expect(growth.difference).toBe(20);
    expect(growth.growthRate).toBe(20);
    expect(growth.isPositive).toBe(true);
  });

  it('calculates negative growth rate correctly', () => {
    const growth = calculateGrowth(80, 100);
    expect(growth.difference).toBe(-20);
    expect(growth.growthRate).toBe(-20);
    expect(growth.isPositive).toBe(false);
  });

  it('handles zero prior base gracefully', () => {
    const growthFromZero = calculateGrowth(50, 0);
    expect(growthFromZero.growthRate).toBe(100);
    expect(growthFromZero.isPositive).toBe(true);

    const zeroBoth = calculateGrowth(0, 0);
    expect(zeroBoth.growthRate).toBe(0);
    expect(zeroBoth.isPositive).toBe(true);
  });

  it('generates period comparison with 7d timeframe', () => {
    const result = generatePeriodComparison({ timeframe: '7d' });
    expect(result.timeframe).toBe('7d');
    expect(result.currentPeriodLabel).toContain('7 ngày qua');
    expect(result.priorPeriodLabel).toContain('7 ngày trước đó');

    expect(result.metrics.views).toBeDefined();
    expect(result.metrics.views.current).toBeGreaterThan(0);
    expect(result.metrics.views.prior).toBeGreaterThan(0);
    expect(result.metrics.reach).toBeDefined();
    expect(result.metrics.engagements).toBeDefined();
    expect(result.metrics.leads).toBeDefined();

    expect(result.trajectory.length).toBe(7);
    expect(result.trajectory[0].currentViews).toBeDefined();
    expect(result.trajectory[0].priorViews).toBeDefined();
  });

  it('generates period comparison with 30d timeframe and dual-line trajectory', () => {
    const result = generatePeriodComparison({ timeframe: '30d' });
    expect(result.timeframe).toBe('30d');
    expect(result.currentPeriodLabel).toContain('30 ngày qua');
    expect(result.priorPeriodLabel).toContain('30 ngày trước đó');
    expect(result.trajectory.length).toBeGreaterThan(5);

    // Verify all trajectory points have valid coordinates
    for (const pt of result.trajectory) {
      expect(pt.currentDate).toBeDefined();
      expect(pt.priorDate).toBeDefined();
      expect(pt.currentViews).toBeGreaterThanOrEqual(0);
      expect(pt.priorViews).toBeGreaterThanOrEqual(0);
    }
  });
});
