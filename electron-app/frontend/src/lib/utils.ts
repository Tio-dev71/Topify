import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
