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
 * Check if a MIME type is an allowed video type (with filename extension fallback)
 */
export function isAllowedVideoType(mimeType: string, filename?: string): boolean {
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return true;
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext)) {
      return true;
    }
  }
  return false;
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

/**
 * Safely slice a string by Unicode code points (avoiding cutting emoji surrogate pairs in half).
 */
export function safeSlice(str: string, maxLength: number): string {
  if (!str) return '';
  const safe = sanitizeUtf8(str);
  return Array.from(safe).slice(0, maxLength).join('');
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

