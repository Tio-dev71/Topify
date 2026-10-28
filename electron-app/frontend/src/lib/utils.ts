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

/**
 * Sanitize a string to ensure it is valid UTF-8/UTF-16 without lone surrogates.
 * Prevents Prisma / Rust serde_json errors: "lone leading surrogate in hex escape".
 */
export function sanitizeUtf8(str: unknown): string {
  if (typeof str !== 'string') return '';
  let res = typeof str.toWellFormed === 'function' ? str.toWellFormed() : str;
  // Strip raw unpaired high or low surrogates
  res = res.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
  // Strip escaped lone surrogates (e.g. \ud83d without \udcxx)
  res = res.replace(/\\u[dD][89a-bA-B][0-9a-fA-F]{2}(?!\\u[dD][c-fC-F][0-9a-fA-F]{2})|(?<!\\u[dD][89a-bA-B][0-9a-fA-F]{2})\\u[dD][c-fC-F][0-9a-fA-F]{2}/gi, '');
  // Strip Unicode replacement char U+FFFD and null bytes U+0000
  res = res.replace(/[\uFFFD\u0000]/g, '');
  return res.trim();
}

/**
 * Sanitize a nullable or optional string to ensure it is valid UTF-8/UTF-16 without lone surrogates.
 */
export function sanitizeUtf8Nullable(str: unknown): string | null {
  if (typeof str !== 'string') return null;
  const cleaned = sanitizeUtf8(str);
  return cleaned || null;
}

export function safeSlice(str: string, maxLength: number): string {
  if (!str) return '';
  const safe = sanitizeUtf8(str);
  return Array.from(safe).slice(0, maxLength).join('');
}

/**
 * Format bytes to human-readable string (KB, MB, GB)
 */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i] || 'MB'}`;
}

/**
 * Format duration in seconds to "Xs (MM:SS)"
 */
export function formatVideoDuration(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || seconds < 0) return '0s';
  const totalSec = Math.round(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${totalSec}s (${formattedTime})`;
}

export interface ShortsCriteriaResult {
  isEligible: boolean;
  badgeText: string;
  badgeColor: string;
  description: string;
  badge: string;
  note: string;
  isOver180s: boolean;
}

/**
 * Check YouTube Shorts criteria (Duration <= 180s, Video format)
 */
export function checkShortsCriteria(duration?: number | null, mimeType?: string | null): ShortsCriteriaResult {
  const dur = typeof duration === 'number' ? duration : 0;
  if (dur > 180) {
    const text = `Video dài ${dur}s (> 180s)`;
    const desc = `Thời lượng ${dur}s vượt mức 180s (3 phút). YouTube sẽ tự động xuất bản dưới dạng Video thông thường.`;
    return {
      isEligible: false,
      badgeText: text,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description: desc,
      badge: text,
      note: desc,
      isOver180s: true,
    };
  }

  const text = dur > 0 ? `Đạt chuẩn Shorts (${dur}s ≤ 180s)` : 'Chuẩn Shorts (≤ 180s)';
  const desc = dur > 0
    ? `Thời lượng ${dur}s đáp ứng đầy đủ tiêu chí YouTube Shorts (tối đa 3 phút / 180s).`
    : 'Đáp ứng tiêu chuẩn kỹ thuật YouTube Shorts.';
  return {
    isEligible: true,
    badgeText: text,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: desc,
    badge: text,
    note: desc,
    isOver180s: false,
  };
}

export interface FriendlyErrorResult {
  reason: string;
  guide?: string;
  isDailyLimit?: boolean;
  isTokenExpired?: boolean;
  raw?: string;
}

/**
 * Parse and translate platform publishing errors into clear, friendly Vietnamese
 */
export function formatFriendlyPublishError(rawError?: string | null, platform?: string): FriendlyErrorResult {
  if (!rawError) {
    return {
      reason: 'Lỗi xuất bản không xác định từ nền tảng mạng xã hội.',
      guide: 'Vui lòng kiểm tra lại kết nối mạng xã hội trong mục Cài đặt và thử lại.',
    };
  }

  const errLower = rawError.toLowerCase();

  // 1. YouTube Daily Upload Limit Exceeded (uploadLimitExceeded)
  if (
    errLower.includes('uploadlimitexceeded') ||
    errLower.includes('exceeded the number of videos') ||
    errLower.includes('upload limit exceeded')
  ) {
    return {
      reason: 'Kênh YouTube đã đạt giới hạn số lượng video được phép tải lên trong ngày của YouTube (Daily Upload Limit).',
      guide: 'YouTube giới hạn số lượng video/Shorts có thể đăng mỗi ngày đối với kênh mới tạo hoặc chưa hoàn tất xác minh nâng cao. Vui lòng đợi 24 giờ sau để YouTube reset hạn mức, hoặc vào YouTube Studio > Cài đặt > Kênh > Đủ điều kiện sử dụng tính năng > Bật "Tính năng nâng cao" (xác minh số điện thoại/lịch sử kênh) để mở rộng hạn mức.',
      isDailyLimit: true,
      raw: rawError,
    };
  }

  // 2. YouTube Channel Missing (youtubeSignupRequired)
  if (errLower.includes('youtubesignuprequired') || errLower.includes('chưa tạo kênh youtube')) {
    return {
      reason: 'Tài khoản Google này chưa tạo Kênh YouTube (YouTube Channel).',
      guide: 'Vui lòng truy cập https://youtube.com hoặc YouTube Studio để tạo kênh cho tài khoản này trước khi đăng video.',
      raw: rawError,
    };
  }

  // 3. YouTube API Quota Exceeded (quotaExceeded)
  if (errLower.includes('quotaexceeded') || errLower.includes('quota exceeded')) {
    return {
      reason: 'Hệ thống đã đạt giới hạn truy vấn YouTube API trong ngày (Quota Exceeded).',
      guide: 'Hạn mức API sẽ tự động được đặt lại vào 14:00 giờ Việt Nam (00:00 PST). Bạn có thể thử lại sau thời điểm này.',
      raw: rawError,
    };
  }

  // 4. Token expired / Invalid grant / Auth error
  if (
    (errLower.includes('token') && (errLower.includes('expired') || errLower.includes('invalid_grant'))) ||
    errLower.includes('unauthorized') ||
    errLower.includes('status: expired') ||
    errLower.includes('hết hạn phiên đăng nhập')
  ) {
    return {
      reason: 'Phiên kết nối mạng xã hội đã hết hạn hoặc bị thu hồi quyền truy cập.',
      guide: 'Vui lòng vào mục "Cài đặt" -> "Kết nối mạng xã hội" để liên kết lại tài khoản này.',
      isTokenExpired: true,
      raw: rawError,
    };
  }

  // 5. Account not connected
  if (errLower.includes('chưa kết nối tài khoản') || errLower.includes('not connected')) {
    return {
      reason: 'Chưa kết nối tài khoản mạng xã hội tương ứng.',
      guide: 'Vui lòng vào Cài đặt để liên kết tài khoản trước khi xuất bản.',
      raw: rawError,
    };
  }

  // 6. Title too long
  if (errLower.includes('videotitletoolong') || errLower.includes('tiêu đề video vượt quá')) {
    return {
      reason: 'Tiêu đề video vượt quá độ dài tối đa cho phép của nền tảng (YouTube: tối đa 100 ký tự).',
      guide: 'Vui lòng rút ngắn tiêu đề bài viết và bấm "Thử lại".',
      raw: rawError,
    };
  }

  // 7. Video format not supported / Corrupted
  if (errLower.includes('unsupportedvideofromat') || errLower.includes('invalidvideo') || errLower.includes('corrupt')) {
    return {
      reason: 'Tệp video có định dạng không được nền tảng hỗ trợ hoặc bị lỗi dữ liệu.',
      guide: 'Vui lòng chuyển đổi video sang chuẩn MP4 (H.264 / AAC) và tải lên lại.',
      raw: rawError,
    };
  }

  // 8. General JSON extraction fallback
  try {
    const jsonMatch = rawError.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const extractedMessage = parsed.error?.message || parsed.message;
      if (extractedMessage) {
        if (extractedMessage.includes('exceeded the number of videos')) {
          return {
            reason: 'Kênh YouTube đã đạt giới hạn số lượng video được phép tải lên trong ngày của YouTube (Daily Upload Limit).',
            guide: 'Vui lòng đợi 24 giờ sau để YouTube reset hạn mức tải lên, hoặc vào YouTube Studio xác minh Kênh (Tính năng nâng cao) để tăng hạn mức.',
            isDailyLimit: true,
            raw: rawError,
          };
        }
        return {
          reason: `Thông báo từ nền tảng: ${extractedMessage}`,
          guide: 'Vui lòng kiểm tra lại thiết lập bài viết hoặc tài khoản mạng xã hội tương ứng.',
          raw: rawError,
        };
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  return {
    reason: rawError.replace(/^failed to init upload:\s*/i, '').replace(/^upload failed:\s*/i, ''),
    guide: 'Bạn có thể bấm "Thử lại" hoặc kiểm tra lại quyền của tài khoản mạng xã hội trong mục Cài đặt.',
    raw: rawError,
  };
}


