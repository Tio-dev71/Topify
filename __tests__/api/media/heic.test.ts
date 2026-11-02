import { describe, it, expect } from 'vitest';
import { isHeicFormat, convertHeicToJpeg } from '@/lib/media/heic';

describe('HEIC Format Utilities', () => {
  it('identifies HEIC files by extension or mimeType', () => {
    expect(isHeicFormat('photo.heic')).toBe(true);
    expect(isHeicFormat('IMG_0007.HEIC')).toBe(true);
    expect(isHeicFormat('sample.heif')).toBe(true);
    expect(isHeicFormat('sample.jpg', 'image/heic')).toBe(true);
    expect(isHeicFormat('sample.png', 'image/heif')).toBe(true);

    expect(isHeicFormat('sample.jpg', 'image/jpeg')).toBe(false);
    expect(isHeicFormat('sample.png', 'image/png')).toBe(false);
    expect(isHeicFormat('video.mp4', 'video/mp4')).toBe(false);
  });

  it('handles invalid buffer gracefully without crashing', async () => {
    const invalidBuffer = Buffer.from('not-a-real-heic-file');
    const result = await convertHeicToJpeg(invalidBuffer, 'corrupted.heic');
    // Should return null gracefully
    expect(result).toBeNull();
  });
});
