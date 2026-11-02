import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface HeicConversionResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  size: number;
}

/**
 * Checks if a filename or MIME type indicates a HEIC/HEIF image.
 */
export function isHeicFormat(fileName?: string | null, mimeType?: string | null): boolean {
  const ext = (fileName?.split('.').pop() || '').toLowerCase();
  if (ext === 'heic' || ext === 'heif') return true;
  if (mimeType && (mimeType.toLowerCase().includes('heic') || mimeType.toLowerCase().includes('heif'))) return true;
  return false;
}

/**
 * Converts a HEIC/HEIF buffer to JPEG using heif-convert (Linux) or sips (macOS).
 * Returns converted buffer and metadata, or null if conversion tools are unavailable or fail.
 */
export async function convertHeicToJpeg(
  buffer: Buffer,
  originalFileName: string
): Promise<HeicConversionResult | null> {
  const tempDir = os.tmpdir();
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tempInput = path.join(tempDir, `input-${uniqueId}.heic`);
  const tempOutput = path.join(tempDir, `output-${uniqueId}.jpg`);

  try {
    await fs.promises.writeFile(tempInput, buffer);

    // 1. Try heif-convert (standard on Linux / Ubuntu with libheif-examples)
    try {
      await execAsync(`heif-convert -q 92 "${tempInput}" "${tempOutput}"`);
    } catch {
      // 2. Try sips fallback (standard on macOS)
      try {
        await execAsync(`sips -s format jpeg "${tempInput}" --out "${tempOutput}"`);
      } catch {
        // Neither tool available or failed to decode
      }
    }

    let finalOutputPath = tempOutput;
    if (!fs.existsSync(finalOutputPath)) {
      // heif-convert might append -1.jpg if the HEIC has multiple frames or auxiliary/burst photos
      const dirFiles = await fs.promises.readdir(tempDir).catch(() => []);
      const match = dirFiles.find((f) => f.startsWith(`output-${uniqueId}`) && f.endsWith('.jpg'));
      if (match) {
        finalOutputPath = path.join(tempDir, match);
      }
    }

    if (fs.existsSync(finalOutputPath)) {
      const convertedBuffer = await fs.promises.readFile(finalOutputPath);
      const baseName = originalFileName.replace(/\.(heic|heif)$/i, '');
      const newFileName = `${baseName || 'image'}.jpg`;

      return {
        buffer: convertedBuffer,
        fileName: newFileName,
        mimeType: 'image/jpeg',
        size: convertedBuffer.length,
      };
    }

    return null;
  } catch (err) {
    console.warn('[HEIC] Conversion exception:', err);
    return null;
  } finally {
    // Clean up temporary files
    fs.promises.unlink(tempInput).catch(() => {});
    fs.promises.unlink(tempOutput).catch(() => {});
    fs.promises.readdir(tempDir).then((dirFiles) => {
      for (const f of dirFiles) {
        if (f.startsWith(`output-${uniqueId}`) && f.endsWith('.jpg')) {
          fs.promises.unlink(path.join(tempDir, f)).catch(() => {});
        }
      }
    }).catch(() => {});
  }
}
