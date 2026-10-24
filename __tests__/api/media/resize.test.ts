import { describe, it, expect } from 'vitest';
import {
  ASPECT_RATIO_PROFILES,
  calculateResizeTransform,
  AspectRatio,
  ResizeMode,
} from '@/lib/media/studio';
import { GET, POST } from '@/app/api/media/resize/route';
import { NextRequest } from 'next/server';

describe('F113 Multi-Platform Resize Engine & API', () => {
  describe('ASPECT_RATIO_PROFILES', () => {
    it('should have required profiles for Facebook, IG, TikTok, Shorts', () => {
      expect(ASPECT_RATIO_PROFILES['9:16']).toBeDefined();
      expect(ASPECT_RATIO_PROFILES['9:16'].width).toBe(1080);
      expect(ASPECT_RATIO_PROFILES['9:16'].height).toBe(1920);
      expect(ASPECT_RATIO_PROFILES['9:16'].platforms).toContain('TikTok');
      expect(ASPECT_RATIO_PROFILES['9:16'].platforms).toContain('YouTube Shorts');

      expect(ASPECT_RATIO_PROFILES['1:1']).toBeDefined();
      expect(ASPECT_RATIO_PROFILES['1:1'].width).toBe(1080);
      expect(ASPECT_RATIO_PROFILES['1:1'].height).toBe(1080);
      expect(ASPECT_RATIO_PROFILES['1:1'].platforms).toContain('Facebook Feed');
      expect(ASPECT_RATIO_PROFILES['1:1'].platforms).toContain('Instagram Post');

      expect(ASPECT_RATIO_PROFILES['16:9']).toBeDefined();
      expect(ASPECT_RATIO_PROFILES['16:9'].width).toBe(1920);
      expect(ASPECT_RATIO_PROFILES['16:9'].height).toBe(1080);

      expect(ASPECT_RATIO_PROFILES['4:5']).toBeDefined();
      expect(ASPECT_RATIO_PROFILES['4:5'].width).toBe(1080);
      expect(ASPECT_RATIO_PROFILES['4:5'].height).toBe(1350);
    });
  });

  describe('calculateResizeTransform', () => {
    it('calculates FIT_BLUR transform for 16:9 source to 9:16 target', () => {
      const transform = calculateResizeTransform({
        sourceWidth: 1920,
        sourceHeight: 1080,
        targetRatio: '9:16',
        mode: 'FIT_BLUR',
      });

      expect(transform.targetWidth).toBe(1080);
      expect(transform.targetHeight).toBe(1920);
      expect(transform.scale).toBeCloseTo(1080 / 1920, 2);
      expect(transform.offsetX).toBe(0);
      expect(transform.offsetY).toBeGreaterThan(0); // Centered vertically
      expect(transform.mode).toBe('FIT_BLUR');
    });

    it('calculates CENTER_CROP transform for 16:9 source to 9:16 target', () => {
      const transform = calculateResizeTransform({
        sourceWidth: 1920,
        sourceHeight: 1080,
        targetRatio: '9:16',
        mode: 'CENTER_CROP',
      });

      expect(transform.targetWidth).toBe(1080);
      expect(transform.targetHeight).toBe(1920);
      expect(transform.scale).toBeCloseTo(1920 / 1080, 2);
      expect(transform.offsetX).toBeLessThan(0); // Cropped horizontally
      expect(transform.offsetY).toBe(0);
      expect(transform.mode).toBe('CENTER_CROP');
    });

    it('calculates transform for 16:9 source to 1:1 target', () => {
      const transformCrop = calculateResizeTransform({
        sourceWidth: 1920,
        sourceHeight: 1080,
        targetRatio: '1:1',
        mode: 'CENTER_CROP',
      });

      expect(transformCrop.targetWidth).toBe(1080);
      expect(transformCrop.targetHeight).toBe(1080);
      expect(transformCrop.scale).toBe(1); // 1080 / 1080
      expect(transformCrop.offsetX).toBe((1080 - 1920) / 2); // -420
      expect(transformCrop.offsetY).toBe(0);
    });

    it('calculates transform for 16:9 source to 4:5 target', () => {
      const transform = calculateResizeTransform({
        sourceWidth: 1920,
        sourceHeight: 1080,
        targetRatio: '4:5',
        mode: 'FIT_BLUR',
      });

      expect(transform.targetWidth).toBe(1080);
      expect(transform.targetHeight).toBe(1350);
      expect(transform.scale).toBeCloseTo(1080 / 1920, 2);
      expect(transform.offsetY).toBeGreaterThan(0);
    });
  });

  describe('API Endpoints', () => {
    it('GET /api/media/resize returns all aspect ratio profiles', async () => {
      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profiles).toBeDefined();
      expect(data.profiles['9:16']).toBeDefined();
    });

    it('POST /api/media/resize returns calculated transform', async () => {
      const req = new NextRequest('http://localhost:3000/api/media/resize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceWidth: 1920,
          sourceHeight: 1080,
          targetRatio: '9:16',
          mode: 'FIT_BLUR',
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transform.targetWidth).toBe(1080);
      expect(data.transform.targetHeight).toBe(1920);
      expect(data.targetProfile.platforms).toContain('TikTok');
    });
  });
});
