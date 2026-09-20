import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
// @ts-expect-error - no types available
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Ensure fluent-ffmpeg uses the installed binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

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
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(rawVideoPath, buffer);
  
  console.log(`[Watermark] Adding watermark "${text}"...`);

  // Step 2: Apply watermark using ffmpeg
  return new Promise((resolve, reject) => {
    ffmpeg(rawVideoPath)
      .outputOptions([
        // Place text at top left (10px from edge). White text, black shadow for visibility.
        `-vf`, `drawtext=fontfile='/System/Library/Fonts/Helvetica.ttc':text='${text}':x=20:y=20:fontsize=32:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2`,
        '-c:a copy', // Copy audio without re-encoding
        '-preset fast'
      ])
      .save(outputVideoPath)
      .on('end', () => {
        console.log(`[Watermark] Successfully created ${outputVideoPath}`);
        // Optionally clean up the raw video
        if (fs.existsSync(rawVideoPath)) {
          fs.unlinkSync(rawVideoPath);
        }
        resolve(outputVideoPath);
      })
      .on('error', (err: unknown) => {
        console.error(`[Watermark] Error applying watermark:`, err);
        // Clean up partial files
        if (fs.existsSync(rawVideoPath)) fs.unlinkSync(rawVideoPath);
        if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath);
        reject(err);
      });
  });
}
