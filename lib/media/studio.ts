/**
 * M7. Media Studio Engine (F113, F114, F115)
 * Helpers for Multi-Platform Video Resizing, Repurposing & Subtitles
 */

export type AspectRatio = '9:16' | '1:1' | '16:9' | '4:5';
export type ResizeMode = 'FIT_BLUR' | 'CENTER_CROP' | 'LETTERBOX';

export interface AspectRatioProfile {
  ratio: AspectRatio;
  label: string;
  width: number;
  height: number;
  platforms: string[];
  description: string;
}

export const ASPECT_RATIO_PROFILES: Record<AspectRatio, AspectRatioProfile> = {
  '9:16': {
    ratio: '9:16',
    label: '9:16 Dọc (Vertical)',
    width: 1080,
    height: 1920,
    platforms: ['TikTok', 'FB Reels', 'IG Reels', 'YouTube Shorts'],
    description: 'Tỷ lệ vàng cho định dạng video ngắn toàn màn hình điện thoại',
  },
  '1:1': {
    ratio: '1:1',
    label: '1:1 Vuông (Square)',
    width: 1080,
    height: 1080,
    platforms: ['Facebook Feed', 'Instagram Post', 'LinkedIn'],
    description: 'Chuẩn bài đăng dạng lưới và bài viết quảng cáo feed',
  },
  '16:9': {
    ratio: '16:9',
    label: '16:9 Ngang (Landscape)',
    width: 1920,
    height: 1080,
    platforms: ['YouTube Video Dài', 'Facebook Watch', 'Web'],
    description: 'Định dạng chuẩn cho video dài, phỏng vấn, máy tính/TV',
  },
  '4:5': {
    ratio: '4:5',
    label: '4:5 Dọc Lửng (Portrait)',
    width: 1080,
    height: 1350,
    platforms: ['Instagram Feed', 'Facebook Feed'],
    description: 'Chiếm diện tích hiển thị lớn nhất trên bảng tin di động',
  },
};

export function calculateResizeTransform(params: {
  sourceWidth: number;
  sourceHeight: number;
  targetRatio: AspectRatio;
  mode: ResizeMode;
}) {
  const { sourceWidth, sourceHeight, targetRatio, mode } = params;
  const targetProfile = ASPECT_RATIO_PROFILES[targetRatio];
  const targetAspect = targetProfile.width / targetProfile.height;
  const sourceAspect = sourceWidth / sourceHeight;

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  if (mode === 'CENTER_CROP') {
    if (sourceAspect > targetAspect) {
      // Source wider than target -> crop sides
      scale = targetProfile.height / sourceHeight;
      const scaledWidth = sourceWidth * scale;
      offsetX = (targetProfile.width - scaledWidth) / 2;
    } else {
      // Source taller than target -> crop top/bottom
      scale = targetProfile.width / sourceWidth;
      const scaledHeight = sourceHeight * scale;
      offsetY = (targetProfile.height - scaledHeight) / 2;
    }
  } else {
    // FIT_BLUR or LETTERBOX
    if (sourceAspect > targetAspect) {
      // Fit to width
      scale = targetProfile.width / sourceWidth;
      const scaledHeight = sourceHeight * scale;
      offsetY = (targetProfile.height - scaledHeight) / 2;
    } else {
      // Fit to height
      scale = targetProfile.height / sourceHeight;
      const scaledWidth = sourceWidth * scale;
      offsetX = (targetProfile.width - scaledWidth) / 2;
    }
  }

  return {
    targetWidth: targetProfile.width,
    targetHeight: targetProfile.height,
    scale: Math.round(scale * 1000) / 1000,
    offsetX: Math.round(offsetX),
    offsetY: Math.round(offsetY),
    mode,
    ratio: targetRatio,
  };
}
