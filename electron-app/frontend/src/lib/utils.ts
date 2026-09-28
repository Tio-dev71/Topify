import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date safely without throwing RangeError: Invalid time value
 */
export function safeFormatDate(
  dateValue: string | number | Date | null | undefined,
  formatStr: string,
  fallback: string = '--'
): string {
  if (!dateValue) return fallback;
  try {
    const d = typeof dateValue === 'string' || typeof dateValue === 'number' 
      ? new Date(dateValue) 
      : dateValue;
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return fallback;
    }
    return format(d, formatStr);
  } catch {
    return fallback;
  }
}

export interface NormalizedPlatform {
  platform: string;
  status: string;
  externalPostId?: string | null;
  errorMessage?: string | null;
}

/**
 * Normalize platform object or string to guarantee safe property access
 */
export function normalizePlatform(p: any): NormalizedPlatform {
  if (typeof p === 'string') {
    return { platform: p, status: 'UNKNOWN' };
  }
  if (p && typeof p === 'object') {
    return {
      platform: typeof p.platform === 'string' ? p.platform : 'UNKNOWN',
      status: typeof p.status === 'string' ? p.status : 'UNKNOWN',
      externalPostId: p.externalPostId || null,
      errorMessage: p.errorMessage || null,
    };
  }
  return { platform: 'UNKNOWN', status: 'UNKNOWN' };
}

/**
 * Normalize hashtags to string to prevent TypeError on .toLowerCase() or .split()
 */
export function normalizeHashtags(hashtags: any): string {
  if (!hashtags) return '';
  if (typeof hashtags === 'string') return hashtags;
  if (Array.isArray(hashtags)) return hashtags.filter(Boolean).join(' ');
  return String(hashtags);
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
  TIKTOK_VIDEO: {
    name: 'TikTok Video',
    color: '#000000',
    icon: 'tiktok',
  },
  FACEBOOK_POST: {
    name: 'Facebook Post',
    color: '#1877F2',
    icon: 'facebook',
  },
  INSTAGRAM_CAROUSEL: {
    name: 'Instagram Carousel',
    color: '#E4405F',
    icon: 'instagram',
  },
  INSTAGRAM_STORY: {
    name: 'Instagram Story',
    color: '#E4405F',
    icon: 'instagram',
  },
  ZALO_POST: {
    name: 'Zalo Post',
    color: '#0068FF',
    icon: 'zalo',
  },
  ZALO_ARTICLE: {
    name: 'Zalo Article',
    color: '#0068FF',
    icon: 'zalo',
  },
} as const;

/**
 * Status display config
 */
export const STATUS_CONFIG = {
  DRAFT: { label: 'Bản nháp', color: 'bg-gray-100 text-gray-700' },
  SCHEDULED: { label: 'Đã lên lịch', color: 'bg-blue-50 text-blue-700' },
  PUBLISHING: { label: 'Đang đăng', color: 'bg-amber-50 text-amber-700' },
  PUBLISHED: { label: 'Đã đăng', color: 'bg-emerald-50 text-emerald-700' },
  FAILED: { label: 'Thất bại', color: 'bg-red-50 text-red-700' },
  PARTIAL_FAILED: { label: 'Thất bại 1 phần', color: 'bg-orange-50 text-orange-700' },
  PENDING: { label: 'Chờ xử lý', color: 'bg-gray-100 text-gray-700' },
} as const;

