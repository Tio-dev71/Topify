import { describe, it, expect } from 'vitest';
import {
  GOLDEN_HOUR_PRESETS,
  isPresetDisabled,
  getWindowStatus,
  computeRandomWindowTimes,
  getLocalDateString,
} from '@/lib/content-studio/random-window';

describe('Random Time Window (F022) Logic', () => {
  // Fix reference date/time matching user's reproduction: Sun 25 Oct 2026 21:14:00 GMT+7
  const fixedNow = new Date('2026-10-25T21:14:00');
  const todayStr = '2026-10-25';

  describe('isPresetDisabled', () => {
    it('disables presets that have already passed when date is today', () => {
      const morning = GOLDEN_HOUR_PRESETS.find((p) => p.id === 'morning')!;
      const noon = GOLDEN_HOUR_PRESETS.find((p) => p.id === 'noon')!;
      const afternoon = GOLDEN_HOUR_PRESETS.find((p) => p.id === 'afternoon')!;
      const evening = GOLDEN_HOUR_PRESETS.find((p) => p.id === 'evening')!;
      const custom = GOLDEN_HOUR_PRESETS.find((p) => p.id === 'custom')!;

      // At 21:14, 08:30-11:30, 12:00-13:45, and 16:00-18:00 have ended
      expect(isPresetDisabled(morning, todayStr, fixedNow)).toBe(true);
      expect(isPresetDisabled(noon, todayStr, fixedNow)).toBe(true);
      expect(isPresetDisabled(afternoon, todayStr, fixedNow)).toBe(true);

      // Evening (19:30 - 22:30) is currently in progress (ends 22:30 > 21:14) -> NOT disabled
      expect(isPresetDisabled(evening, todayStr, fixedNow)).toBe(false);

      // Custom is never preset-disabled
      expect(isPresetDisabled(custom, todayStr, fixedNow)).toBe(false);
    });

    it('disables evening preset if current time is past 22:30 on today', () => {
      const lateNight = new Date('2026-10-25T22:35:00');
      const evening = GOLDEN_HOUR_PRESETS.find((p) => p.id === 'evening')!;

      expect(isPresetDisabled(evening, todayStr, lateNight)).toBe(true);
    });

    it('enables all presets when date is in the future (e.g. tomorrow)', () => {
      const tomorrowStr = '2026-10-26';
      for (const preset of GOLDEN_HOUR_PRESETS) {
        expect(isPresetDisabled(preset, tomorrowStr, fixedNow)).toBe(false);
      }
    });

    it('disables all standard presets when date is in the past', () => {
      const yesterdayStr = '2026-10-24';
      const morning = GOLDEN_HOUR_PRESETS.find((p) => p.id === 'morning')!;
      expect(isPresetDisabled(morning, yesterdayStr, fixedNow)).toBe(true);
    });
  });

  describe('getWindowStatus', () => {
    it('detects window in progress when start < now < end', () => {
      const status = getWindowStatus(todayStr, '19:30', '22:30', fixedNow);

      expect(status.isExpired).toBe(false);
      expect(status.isInProgress).toBe(true);
      // Effective start must be at least now + 60s
      expect(status.effectiveStartMs).toBeGreaterThanOrEqual(fixedNow.getTime() + 60000);
      expect(status.endMs).toBe(new Date('2026-10-25T22:30:00').getTime());
      expect(status.remainingDurationMs).toBeGreaterThan(0);
    });

    it('detects expired window when end <= now', () => {
      const status = getWindowStatus(todayStr, '16:00', '18:00', fixedNow);

      expect(status.isExpired).toBe(true);
      expect(status.isInProgress).toBe(false);
      expect(status.remainingDurationMs).toBe(0);
    });

    it('handles future window cleanly without modifying startMs', () => {
      const status = getWindowStatus('2026-10-26', '08:30', '11:30', fixedNow);

      expect(status.isExpired).toBe(false);
      expect(status.isInProgress).toBe(false);
      expect(status.effectiveStartMs).toBe(new Date('2026-10-26T08:30:00').getTime());
    });
  });

  describe('computeRandomWindowTimes (QA Reproduction Verification)', () => {
    it('generates random times strictly GREATER than current time (21:14) during in-progress evening window (19:30-22:30)', () => {
      const nowMs = fixedNow.getTime();
      const endMs = new Date('2026-10-25T22:30:00').getTime();

      // Test across multiple shuffle iterations (keys 0 to 25)
      for (let key = 0; key < 25; key++) {
        const result = computeRandomWindowTimes({
          randomDate: todayStr,
          startTime: '19:30',
          endTime: '22:30',
          itemIds: ['video-1'],
          shuffleKey: key,
          currentTime: fixedNow,
        });

        const scheduledTime = result['video-1'];
        expect(scheduledTime).toBeDefined();

        const scheduledMs = scheduledTime.getTime();
        // MUST NEVER be <= 21:14 (e.g. 20:29 in bug report is impossible)
        expect(scheduledMs).toBeGreaterThan(nowMs);
        expect(scheduledMs).toBeLessThanOrEqual(endMs);
      }
    });

    it('distributes multiple videos evenly within the remaining window time', () => {
      const nowMs = fixedNow.getTime();
      const endMs = new Date('2026-10-25T22:30:00').getTime();
      const videoIds = ['vid-1', 'vid-2', 'vid-3'];

      const result = computeRandomWindowTimes({
        randomDate: todayStr,
        startTime: '19:30',
        endTime: '22:30',
        itemIds: videoIds,
        isEvenlySpaced: true,
        shuffleKey: 1,
        currentTime: fixedNow,
      });

      expect(Object.keys(result)).toHaveLength(3);

      for (const id of videoIds) {
        const timeMs = result[id].getTime();
        expect(timeMs).toBeGreaterThan(nowMs);
        expect(timeMs).toBeLessThanOrEqual(endMs);
      }

      // Check strictly ascending order
      expect(result['vid-1'].getTime()).toBeLessThan(result['vid-2'].getTime());
      expect(result['vid-2'].getTime()).toBeLessThan(result['vid-3'].getTime());
    });

    it('returns empty result when window has already passed', () => {
      const result = computeRandomWindowTimes({
        randomDate: todayStr,
        startTime: '08:30',
        endTime: '11:30',
        itemIds: ['video-1'],
        currentTime: fixedNow,
      });

      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});
