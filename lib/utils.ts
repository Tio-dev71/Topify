import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract a human-readable title from a video filename.
 * Example: "meo-hay-ban-hang.mp4" → "meo hay ban hang"
 */
export function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[-_.]/g, ' ')  // replace separators with spaces
    .replace(/\s+/g, ' ')    // collapse multiple spaces
    .trim();
}

/**
 * Format bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Allowed video MIME types
 */
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/webm',
];

/**
 * Check if a MIME type is an allowed video type
 */
export function isAllowedVideoType(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(mimeType);
}

/**
 * Max file size in bytes
 */
export function getMaxFileSize(): number {
  const mb = parseInt(process.env.MAX_FILE_SIZE_MB || '2000', 10);
  return mb * 1024 * 1024;
}

/**
 * Platform display names and colors
 */
export const PLATFORM_CONFIG = {
  FACEBOOK_REELS: {
    name: 'Facebook Reels',
    color: '#1877F2',
    icon: 'facebook',
  },
  INSTAGRAM_REELS: {
    name: 'Instagram Reels',
    color: '#E4405F',
    icon: 'instagram',
  },
  YOUTUBE_SHORTS: {
    name: 'YouTube Shorts',
    color: '#FF0000',
    icon: 'youtube',
  },
} as const;

/**
 * Status display config
 */
export const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700' },
  PUBLISHING: { label: 'Publishing', color: 'bg-amber-50 text-amber-700' },
  PUBLISHED: { label: 'Published', color: 'bg-emerald-50 text-emerald-700' },
  FAILED: { label: 'Failed', color: 'bg-red-50 text-red-700' },
  PARTIAL_FAILED: { label: 'Partial', color: 'bg-orange-50 text-orange-700' },
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
} as const;

/**
 * Sanitize a string to ensure it is valid UTF-8/UTF-16 without lone surrogates.
 * Prevents Prisma / Rust serde_json errors: "lone leading surrogate in hex escape".
 */
export function sanitizeUtf8(str: unknown): string {
  if (typeof str !== 'string') return '';
  const wellFormed = typeof str.toWellFormed === 'function' ? str.toWellFormed() : str;
  return wellFormed.replace(/\uFFFD/g, '').trim();
}

/**
 * Sanitize a nullable or optional string to ensure it is valid UTF-8/UTF-16 without lone surrogates.
 */
export function sanitizeUtf8Nullable(str: unknown): string | null {
  if (typeof str !== 'string') return null;
  const wellFormed = typeof str.toWellFormed === 'function' ? str.toWellFormed() : str;
  const cleaned = wellFormed.replace(/\uFFFD/g, '').trim();
  return cleaned || null;
}

/**
 * Safely slice a string by Unicode code points (avoiding cutting emoji surrogate pairs in half).
 */
export function safeSlice(str: string, maxLength: number): string {
  if (!str) return '';
  const wellFormed = typeof str.toWellFormed === 'function' ? str.toWellFormed() : str;
  return Array.from(wellFormed).slice(0, maxLength).join('');
}

