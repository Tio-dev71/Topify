import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { getStorage } from '@/lib/storage';
// @ts-expect-error - no types available
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Ensure fluent-ffmpeg uses system ffmpeg if available, otherwise installed binary
const systemFfmpeg = ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg'].find(p => fs.existsSync(p));
ffmpeg.setFfmpegPath(systemFfmpeg || ffmpegInstaller.path);

/**
 * Downloads a video from a URL and applies a text watermark.
 * Returns the local file path of the processed video.
 */
export async function addWatermark(videoUrl: string, text: string = 'Topmedia'): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'tmp');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileId = crypto.randomBytes(8).toString('hex');
  const rawVideoPath = path.join(uploadsDir, `${fileId}_raw.mp4`);
  const outputVideoPath = path.join(uploadsDir, `${fileId}_watermarked.mp4`);

  console.log(`[Watermark] Downloading video to ${rawVideoPath}...`);
  
  // Step 1: Download the video
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    const res = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });

    if (!res.ok) {
      throw new Error(`Không thể tải video từ nguồn (${res.status} ${res.statusText})`);
    }

    const fileStream = fs.createWriteStream(rawVideoPath);
    // @ts-ignore
    const bodyStream = Readable.fromWeb(res.body);
    await new Promise<void>((resolve, reject) => {
      bodyStream.pipe(fileStream);
      fileStream.on('finish', () => resolve());
      fileStream.on('error', reject);
    });
  } else {
    const storage = getStorage();
    const buffer = await storage.getBuffer(videoUrl);
    fs.writeFileSync(rawVideoPath, buffer);
  }

  const cleanText = (text || '').trim();
  if (!cleanText || cleanText.toLowerCase() === 'none') {
    console.log(`[Watermark] No watermark text provided, using raw video directly.`);
    return rawVideoPath;
  }
  
  console.log(`[Watermark] Adding watermark "${cleanText}"...`);

  // Step 2: Apply watermark using ffmpeg
  return new Promise((resolve, reject) => {
    // Find an existing system font or omit fontfile parameter for fallback
    const possibleFonts = [
      '/System/Library/Fonts/Supplemental/Arial.ttf',
      '/System/Library/Fonts/Helvetica.ttc',
      '/Library/Fonts/Arial.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
      '/usr/share/fonts/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/TTF/DejaVuSans.ttf',
      'C:\\Windows\\Fonts\\arial.ttf'
    ];
    const foundFont = possibleFonts.find(p => fs.existsSync(p));
    const fontParam = foundFont ? `fontfile='${foundFont}':` : '';
    const safeText = cleanText.replace(/'/g, "\\'").replace(/:/g, '\\:');

    ffmpeg(rawVideoPath)
      .outputOptions([
        `-vf`, `drawtext=${fontParam}text='${safeText}':x=20:y=20:fontsize=32:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2`,
        '-c:a copy', // Copy audio without re-encoding
        '-preset fast'
      ])
      .save(outputVideoPath)
      .on('end', () => {
        console.log(`[Watermark] Successfully created ${outputVideoPath}`);
        // Clean up the raw video
        if (fs.existsSync(rawVideoPath)) {
          fs.unlinkSync(rawVideoPath);
        }
        resolve(outputVideoPath);
      })
      .on('error', (err: unknown) => {
        console.error(`[Watermark] Error applying watermark:`, err);
        // Fallback to raw video if watermark failed, rather than crashing completely
        if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath);
        if (fs.existsSync(rawVideoPath)) {
          console.warn(`[Watermark] Fallback using raw video without watermark due to ffmpeg error.`);
          resolve(rawVideoPath);
        } else {
          reject(err);
        }
      });
  });
}
