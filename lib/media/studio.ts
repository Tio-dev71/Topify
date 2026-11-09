/**
 * M7. Media Studio Engine (F113, F114, F115)
 * Helpers for Multi-Platform Video Resizing, Repurposing & Subtitles
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
  const targetProfile = ASPECT_RATIO_PROFILES[targetRatio] || ASPECT_RATIO_PROFILES['16:9'];
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

/**
 * Transcode and resize video or image to the target aspect ratio profile
 * using FFmpeg with FIT_BLUR, CENTER_CROP, or LETTERBOX modes.
 */
export async function processMediaResize(params: {
  inputBuffer: Buffer;
  originalFileName: string;
  mimeType?: string;
  targetRatio: AspectRatio;
  mode: ResizeMode;
  customScale?: number;
}): Promise<{
  outputBuffer: Buffer;
  outputFileName: string;
  mimeType: string;
  width: number;
  height: number;
  duration?: number;
}> {
  const { inputBuffer, originalFileName, mimeType, targetRatio, mode } = params;

  // 1. Detect if media is video or image
  const isVideo =
    (mimeType && mimeType.startsWith('video/')) ||
    /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(originalFileName);

  // 2. Resolve ffmpeg binary path
  let ffmpegPath = ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg'].find(p =>
    fs.existsSync(p)
  );
  if (!ffmpegPath) {
    try {
      const ffmpegInstaller: any = await import('@ffmpeg-installer/ffmpeg' as any);
      ffmpegPath = ffmpegInstaller?.default?.path || ffmpegInstaller?.path;
    } catch {}
  }
  if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    ffmpegPath = 'ffmpeg';
  }

  // 3. Resolve target profile
  const profile = ASPECT_RATIO_PROFILES[targetRatio] || ASPECT_RATIO_PROFILES['16:9'];
  const tw = profile.width;
  const th = profile.height;

  // 4. Determine filter graph
  let filter = '';
  if (mode === 'FIT_BLUR') {
    filter = `[0:v]scale=${tw}:${th}:force_original_aspect_ratio=increase,crop=${tw}:${th},boxblur=20:5[bg];[0:v]scale=${tw}:${th}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1`;
  } else if (mode === 'CENTER_CROP') {
    filter = `scale=${tw}:${th}:force_original_aspect_ratio=increase,crop=${tw}:${th},setsar=1`;
  } else {
    // LETTERBOX
    filter = `scale=${tw}:${th}:force_original_aspect_ratio=decrease,pad=${tw}:${th}:(ow-iw)/2:(oh-ih)/2:black,setsar=1`;
  }

  // 5. Setup temp files
  const tempDir = os.tmpdir();
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const inputExt = path.extname(originalFileName) || (isVideo ? '.mp4' : '.png');
  const inputTempPath = path.join(tempDir, `topify_resize_in_${uniqueId}${inputExt}`);
  const outputExt = isVideo ? '.mp4' : '.png';
  const outputTempPath = path.join(tempDir, `topify_resize_out_${uniqueId}${outputExt}`);

  try {
    await fs.promises.writeFile(inputTempPath, inputBuffer);

    let ffmpegCmd = '';
    if (isVideo) {
      ffmpegCmd = `"${ffmpegPath}" -y -i "${inputTempPath}" -filter_complex "${filter}" -map 0:a? -c:v libx264 -preset veryfast -c:a aac -b:a 192k "${outputTempPath}"`;
    } else {
      ffmpegCmd = `"${ffmpegPath}" -y -i "${inputTempPath}" -filter_complex "${filter}" -vframes 1 "${outputTempPath}"`;
    }

    const { stderr } = await execAsync(ffmpegCmd, { maxBuffer: 10 * 1024 * 1024 });

    // Parse duration from stderr if available
    let duration: number | undefined;
    const durMatch = (stderr || '').match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
    if (durMatch) {
      const hours = parseFloat(durMatch[1]);
      const minutes = parseFloat(durMatch[2]);
      const seconds = parseFloat(durMatch[3]);
      duration = hours * 3600 + minutes * 60 + seconds;
    }

    const outputBuffer = await fs.promises.readFile(outputTempPath);
    const safeRatioName = targetRatio.replace(':', '_');
    const baseName = path.basename(originalFileName, path.extname(originalFileName));
    const outputFileName = `Resized_${safeRatioName}_${baseName}${outputExt}`;

    return {
      outputBuffer,
      outputFileName,
      mimeType: isVideo ? 'video/mp4' : 'image/png',
      width: tw,
      height: th,
      duration,
    };
  } finally {
    // Clean up temporary files
    if (fs.existsSync(inputTempPath)) {
      await fs.promises.unlink(inputTempPath).catch(() => {});
    }
    if (fs.existsSync(outputTempPath)) {
      await fs.promises.unlink(outputTempPath).catch(() => {});
    }
  }
}

/**
 * Extract / Cut a video highlight clip segment using FFmpeg.
 * Takes inputBuffer, startTime, endTime and outputs the clipped MP4.
 */
export async function processVideoRepurposeCut(params: {
  inputBuffer: Buffer;
  originalFileName?: string;
  startTime: number;
  endTime: number;
  clipTitle?: string;
}): Promise<{
  outputBuffer: Buffer;
  outputFileName: string;
  mimeType: string;
  duration: number;
  width?: number;
  height?: number;
}> {
  const { inputBuffer, originalFileName = 'video.mp4', startTime, endTime, clipTitle } = params;

  // 1. Resolve ffmpeg binary path
  let ffmpegPath = ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg'].find(p =>
    fs.existsSync(p)
  );
  if (!ffmpegPath) {
    try {
      const ffmpegInstaller: any = await import('@ffmpeg-installer/ffmpeg' as any);
      ffmpegPath = ffmpegInstaller?.default?.path || ffmpegInstaller?.path;
    } catch {}
  }
  if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    ffmpegPath = 'ffmpeg';
  }

  // 2. Setup temp files
  const tempDir = os.tmpdir();
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const inputExt = path.extname(originalFileName) || '.mp4';
  const inputTempPath = path.join(tempDir, `topify_cut_in_${uniqueId}${inputExt}`);
  const outputTempPath = path.join(tempDir, `topify_cut_out_${uniqueId}.mp4`);

  const clipDuration = Math.max(1, Math.round(endTime - startTime));
  const safeTitle = (clipTitle || 'Highlight')
    .replace(/[^\p{L}\p{N}\-_]+/gu, '_')
    .substring(0, 30);

  try {
    await fs.promises.writeFile(inputTempPath, inputBuffer);

    // Fast and frame-accurate cut using -ss before -i and re-encoding with libx264 & aac
    const ffmpegCmd = `"${ffmpegPath}" -y -ss ${startTime} -to ${endTime} -i "${inputTempPath}" -c:v libx264 -preset veryfast -c:a aac -b:a 192k -movflags +faststart "${outputTempPath}"`;

    const { stderr } = await execAsync(ffmpegCmd, { maxBuffer: 10 * 1024 * 1024 });

    // Parse dimensions from stderr if available
    let width = 1080;
    let height = 1920;
    const resMatch = (stderr || '').match(/Video:.*?(\d{3,4})x(\d{3,4})/);
    if (resMatch) {
      width = parseInt(resMatch[1], 10);
      height = parseInt(resMatch[2], 10);
    }

    const outputBuffer = await fs.promises.readFile(outputTempPath);
    const outputFileName = `Highlight_${safeTitle}_${startTime}s_${endTime}s.mp4`;

    return {
      outputBuffer,
      outputFileName,
      mimeType: 'video/mp4',
      duration: clipDuration,
      width,
      height,
    };
  } finally {
    if (fs.existsSync(inputTempPath)) {
      await fs.promises.unlink(inputTempPath).catch(() => {});
    }
    if (fs.existsSync(outputTempPath)) {
      await fs.promises.unlink(outputTempPath).catch(() => {});
    }
  }
}
