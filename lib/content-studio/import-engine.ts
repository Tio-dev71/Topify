import * as XLSX from 'xlsx';

export interface ParsedImportRow {
  rowNumber: number;
  title: string;
  caption: string;
  firstComment: string;
  hashtags: string;
  platforms: string[];
  scheduledAt: string | null;
  mediaUrl: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  unconnectedPlatforms?: string[];
}

export interface ImportParseResult {
  success: boolean;
  source: 'EXCEL' | 'CSV' | 'GOOGLE_SHEETS';
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;
  rows: ParsedImportRow[];
  error?: string;
  connectedProviders?: string[];
}

export const PLATFORM_PROVIDER_INFO: Record<string, { name: string; provider: string }> = {
  FACEBOOK_REELS: { name: 'Facebook Reels', provider: 'META' },
  FACEBOOK_POST: { name: 'Facebook Post', provider: 'META' },
  FACEBOOK: { name: 'Facebook', provider: 'META' },
  INSTAGRAM_REELS: { name: 'Instagram Reels', provider: 'META' },
  INSTAGRAM_CAROUSEL: { name: 'Instagram Carousel', provider: 'META' },
  INSTAGRAM_STORY: { name: 'Instagram Story', provider: 'META' },
  INSTAGRAM: { name: 'Instagram', provider: 'META' },
  YOUTUBE_SHORTS: { name: 'YouTube Shorts', provider: 'YOUTUBE' },
  YOUTUBE: { name: 'YouTube', provider: 'YOUTUBE' },
  TIKTOK_VIDEO: { name: 'TikTok', provider: 'TIKTOK' },
  TIKTOK: { name: 'TikTok', provider: 'TIKTOK' },
  ZALO_POST: { name: 'Zalo Post', provider: 'ZALO' },
  ZALO_ARTICLE: { name: 'Zalo Article', provider: 'ZALO' },
  ZALO: { name: 'Zalo', provider: 'ZALO' },
  TELEGRAM: { name: 'Telegram', provider: 'TELEGRAM' },
};

export function isPlatformProviderConnected(platform: string, connectedSet: Set<string>): boolean {
  if (!connectedSet) return false;
  const clean = String(platform || '').trim().toUpperCase();
  const info =
    PLATFORM_PROVIDER_INFO[clean] ||
    PLATFORM_PROVIDER_INFO[`${clean}_VIDEO`] ||
    PLATFORM_PROVIDER_INFO[`${clean}_POST`] ||
    PLATFORM_PROVIDER_INFO[`${clean}_REELS`] ||
    PLATFORM_PROVIDER_INFO[`${clean}_SHORTS`];

  if (!info) {
    if (clean.includes('TIKTOK')) return connectedSet.has('TIKTOK');
    if (clean.includes('YOUTUBE') || clean.includes('SHORTS')) return connectedSet.has('YOUTUBE') || connectedSet.has('GOOGLE');
    if (clean.includes('META') || clean.includes('FB') || clean.includes('FACEBOOK') || clean.includes('INSTA')) {
      return connectedSet.has('META') || connectedSet.has('FACEBOOK') || connectedSet.has('INSTAGRAM');
    }
    if (clean.includes('ZALO')) return connectedSet.has('ZALO');
    if (clean.includes('TELEGRAM')) return connectedSet.has('TELEGRAM');
    return false;
  }

  const provider = info.provider;
  if (connectedSet.has(provider)) return true;
  if (provider === 'META' && (connectedSet.has('FACEBOOK') || connectedSet.has('INSTAGRAM') || connectedSet.has('META'))) return true;
  if (provider === 'YOUTUBE' && (connectedSet.has('GOOGLE') || connectedSet.has('YOUTUBE'))) return true;
  if (provider === 'TIKTOK' && connectedSet.has('TIKTOK')) return true;
  if (provider === 'ZALO' && connectedSet.has('ZALO')) return true;
  if (provider === 'TELEGRAM' && connectedSet.has('TELEGRAM')) return true;
  return false;
}

const VALID_PLATFORMS = [
  'FACEBOOK_REELS',
  'FACEBOOK_POST',
  'INSTAGRAM_REELS',
  'INSTAGRAM_CAROUSEL',
  'INSTAGRAM_STORY',
  'YOUTUBE_SHORTS',
  'TIKTOK_VIDEO',
  'ZALO_POST',
  'ZALO_ARTICLE',
  'TELEGRAM',
];

const HEADER_ALIASES = {
  title: [
    'tiêu đề bài viết', 'tieu de bai viet', 'tiêu đề', 'tieu de', 'title',
    'tên bài viết', 'ten bai viet', 'headline', 'name', 'chủ đề', 'chu de',
    'topic', 'tên clip', 'ten clip', 'tiêu đề video', 'tieu de video',
    'tên video', 'ten video'
  ],
  caption: [
    'nội dung caption', 'noi dung caption', 'nội dung bài viết', 'noi dung bai viet',
    'nội dung', 'noi dung', 'caption', 'mô tả', 'mo ta', 'content',
    'description', 'bài viết', 'bai viet', 'body'
  ],
  firstComment: [
    'bình luận đầu', 'binh luan dau', 'first comment', 'comment đầu',
    'comment dau', 'bình luận', 'binh luan', 'comment'
  ],
  hashtags: ['hashtags', 'hashtag', 'thẻ', 'the', 'tag', 'tags', 'bộ hashtag'],
  platforms: [
    'nền tảng', 'nen tang', 'platform', 'platforms', 'kênh đăng bài', 'kenh dang bai',
    'kênh xuất bản', 'kenh xuat ban', 'kênh phân phối', 'kenh phan phoi', 'kênh đăng', 'kenh dang',
    'kênh', 'kenh', 'mạng xã hội', 'mang xa hoi', 'social'
  ],
  scheduledAt: [
    'thời gian lên lịch', 'thoi gian len lich', 'thời gian đăng bài', 'thoi gian dang bai',
    'thời gian đăng', 'thoi gian dang', 'thời điểm đăng', 'thoi diem dang',
    'thời gian xuất bản', 'thoi gian xuat ban', 'lịch đăng bài', 'lich dang bai',
    'lịch đăng', 'lich dang', 'ngày giờ đăng', 'ngay gio dang', 'ngày giờ', 'ngay gio',
    'hẹn giờ đăng', 'hen gio dang', 'hẹn giờ', 'hen gio', 'lịch', 'lich',
    'ngày đăng', 'ngay dang', 'giờ đăng', 'gio dang', 'thời gian', 'thoi gian',
    'scheduled at', 'scheduled time', 'time', 'schedule'
  ],
  mediaUrl: [
    'đường dẫn media', 'duong dan media', 'media url', 'media', 'video url',
    'video', 'ảnh', 'anh', 'image url', 'link video', 'link media', 'tệp media'
  ],
  duration: [
    'thời lượng video', 'thoi luong video', 'thời lượng', 'thoi luong',
    'duration', 'độ dài', 'do dai'
  ],
};

function normalizeKey(rawKey: string): string {
  const clean = String(rawKey || '')
    .trim()
    .toLowerCase()
    .replace(/[\uFEFF\u200B\u200C\u200D]/g, '')
    .replace(/[\t\r\n*():]/g, ' ')
    .replace(/\s+/g, ' ');

  for (const [standardKey, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some(alias => clean === alias || clean.startsWith(alias) || clean.includes(alias))) {
      return standardKey;
    }
  }
  return clean;
}

export function parsePlatformList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const text = String(raw).toUpperCase().replace(/[;/|]/g, ',');
  const parts = text.split(',').map(s => s.trim()).filter(Boolean);
  const matched: string[] = [];

  for (const part of parts) {
    if (VALID_PLATFORMS.includes(part)) {
      matched.push(part);
      continue;
    }
    // Fuzzy matching aliases
    if (part.includes('TIKTOK')) matched.push('TIKTOK_VIDEO');
    else if (part.includes('YOUTUBE') || part.includes('SHORTS')) matched.push('YOUTUBE_SHORTS');
    else if (part.includes('INSTAGRAM') || part.includes('INSTA')) matched.push('INSTAGRAM_REELS');
    else if (part.includes('ZALO')) matched.push('ZALO_POST');
    else if (part.includes('FACEBOOK') || part.includes('FB')) matched.push('FACEBOOK_REELS');
    else if (part.includes('TELEGRAM')) matched.push('TELEGRAM');
  }

  const unique = Array.from(new Set(matched));
  return unique;
}

export function parseScheduleDateTime(val: any): { iso: string | null; warning?: string; error?: string; isNow?: boolean; isDraft?: boolean } {
  if (val === undefined || val === null || val === '') return { iso: null, isNow: true };

  // Handle Date objects (e.g. from XLSX cellDates: true)
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      let dateObj = val;
      if (dateObj.getFullYear() < 1970) {
        const now = new Date();
        dateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), val.getHours(), val.getMinutes(), val.getSeconds());
      }
      if (dateObj.getTime() <= Date.now()) {
        return { iso: null, error: 'Thời gian lên lịch đã qua trong quá khứ, vui lòng chọn thời điểm trong tương lai.' };
      }
      return { iso: dateObj.toISOString() };
    }
    return { iso: null, error: 'Thời gian không hợp lệ.' };
  }

  // Handle Excel serial date numbers
  if (typeof val === 'number') {
    try {
      const dateObj = new Date((val - 25569) * 86400 * 1000);
      if (!isNaN(dateObj.getTime())) {
        if (dateObj.getTime() <= Date.now()) {
          return { iso: null, error: 'Thời gian lên lịch đã qua trong quá khứ, vui lòng chọn thời điểm trong tương lai.' };
        }
        return { iso: dateObj.toISOString() };
      }
    } catch {
      // fallback
    }
  }

  const str = String(val).trim();
  if (!str) return { iso: null, isNow: true };

  const lower = str.toLowerCase();
  if (
    lower === 'now' ||
    lower === 'đăng ngay' ||
    lower === 'dang ngay' ||
    lower === 'đăng luôn' ||
    lower === 'dang luon' ||
    lower === 'publish now' ||
    lower === 'immediate'
  ) {
    return { iso: null, isNow: true };
  }

  if (
    lower === 'draft' ||
    lower === 'bản thảo' ||
    lower === 'ban thao' ||
    lower === 'bản nháp' ||
    lower === 'ban nhap'
  ) {
    return { iso: null, isDraft: true };
  }

  const currentYear = new Date().getFullYear();

  // Pattern 1: Time first, then date (e.g. "11:59 11/11", "11:59 (11/11)", "11:59 11/11/2026", "11:59 11-11")
  const timeFirstMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+[\(]?(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?[\)]?$/);
  if (timeFirstMatch) {
    const hour = parseInt(timeFirstMatch[1], 10);
    const min = parseInt(timeFirstMatch[2], 10);
    const sec = timeFirstMatch[3] ? parseInt(timeFirstMatch[3], 10) : 0;
    const day = parseInt(timeFirstMatch[4], 10);
    const month = parseInt(timeFirstMatch[5], 10) - 1;
    const hasExplicitYear = Boolean(timeFirstMatch[6]);
    let year = hasExplicitYear ? parseInt(timeFirstMatch[6], 10) : currentYear;

    if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
      let dateObj = new Date(year, month, day, hour, min, sec);
      if (!isNaN(dateObj.getTime()) && dateObj.getDate() === day && dateObj.getMonth() === month) {
        if (!hasExplicitYear && dateObj.getTime() <= Date.now()) {
          const nextYearObj = new Date(year + 1, month, day, hour, min, sec);
          if (nextYearObj.getTime() > Date.now()) {
            dateObj = nextYearObj;
          }
        }
        if (dateObj.getTime() <= Date.now()) {
          return { iso: null, error: 'Thời gian lên lịch đã qua trong quá khứ, vui lòng chọn thời điểm trong tương lai.' };
        }
        return { iso: dateObj.toISOString() };
      }
    }
    return { iso: null, error: `Thời gian sai định dạng: "${str}" hoặc ngày không tồn tại.` };
  }

  // Pattern 2: Date first (DD/MM/YYYY or DD/MM), then time (optional) (e.g. "11/11/2026 11:59", "11/11 11:59", "11/11/2026", "11/11")
  const dateFirstMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dateFirstMatch) {
    const day = parseInt(dateFirstMatch[1], 10);
    const month = parseInt(dateFirstMatch[2], 10) - 1;
    const hasExplicitYear = Boolean(dateFirstMatch[3]);
    let year = hasExplicitYear ? parseInt(dateFirstMatch[3], 10) : currentYear;
    const hour = dateFirstMatch[4] ? parseInt(dateFirstMatch[4], 10) : 9;
    const min = dateFirstMatch[5] ? parseInt(dateFirstMatch[5], 10) : 0;
    const sec = dateFirstMatch[6] ? parseInt(dateFirstMatch[6], 10) : 0;

    if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
      let dateObj = new Date(year, month, day, hour, min, sec);
      if (!isNaN(dateObj.getTime()) && dateObj.getDate() === day && dateObj.getMonth() === month) {
        if (!hasExplicitYear && dateObj.getTime() <= Date.now()) {
          const nextYearObj = new Date(year + 1, month, day, hour, min, sec);
          if (nextYearObj.getTime() > Date.now()) {
            dateObj = nextYearObj;
          }
        }
        if (dateObj.getTime() <= Date.now()) {
          return { iso: null, error: 'Thời gian lên lịch đã qua trong quá khứ, vui lòng chọn thời điểm trong tương lai.' };
        }
        return { iso: dateObj.toISOString() };
      }
    }
    return { iso: null, error: `Thời gian sai định dạng: "${str}" hoặc ngày không tồn tại.` };
  }

  // Pattern 3: ISO / YYYY-MM-DD or YYYY/MM/DD (e.g. "2026-11-11 11:59", "2026-11-11T11:59:00", "2026/11/11 11:59")
  const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hour = isoMatch[4] ? parseInt(isoMatch[4], 10) : 9;
    const min = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
    const sec = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;

    if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
      const dateObj = new Date(year, month, day, hour, min, sec);
      if (!isNaN(dateObj.getTime()) && dateObj.getDate() === day && dateObj.getMonth() === month) {
        if (dateObj.getTime() <= Date.now()) {
          return { iso: null, error: 'Thời gian lên lịch đã qua trong quá khứ, vui lòng chọn thời điểm trong tương lai.' };
        }
        return { iso: dateObj.toISOString() };
      }
    }
    return { iso: null, error: `Thời gian sai định dạng: "${str}" hoặc ngày không tồn tại.` };
  }

  // ISO / Standard JS Date fallback parsing
  const hasDateStructure = /\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(str) || /\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/.test(str);
  if (hasDateStructure) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      if (parsed.getTime() <= Date.now()) {
        return { iso: null, error: 'Thời gian lên lịch đã qua trong quá khứ, vui lòng chọn thời điểm trong tương lai.' };
      }
      return { iso: parsed.toISOString() };
    }
  }

  return { iso: null, error: `Thời gian sai định dạng: "${str}" (Ví dụ đúng: 11:59 11/11, 28/10/2026 20:30 hoặc 2026-10-28 20:30).` };
}

/**
 * Format raw error messages into clean, user-friendly Vietnamese messages.
 * Prevents technical ORM/database queries, IDs, and stack traces from leaking to end users.
 */
export function formatFriendlyImportError(rawError: any, fallbackMessage: string = 'Lỗi phân tích tệp bảng tính.'): string {
  if (!rawError) return fallbackMessage;
  const msg = typeof rawError === 'string' ? rawError : String(rawError?.message || rawError);
  const lower = msg.toLowerCase();

  // 1. Detect internal database / ORM / query / model / stack trace leakage
  if (
    lower.includes('prisma') ||
    lower.includes('findmany') ||
    lower.includes('findunique') ||
    lower.includes('findfirst') ||
    lower.includes('invocation') ||
    lower.includes('socialaccountstatus') ||
    lower.includes('invalid value for argument') ||
    lower.includes('workspaceid') ||
    lower.includes('userid') ||
    lower.includes('syntax error') ||
    lower.includes('relation') ||
    lower.includes('foreign key') ||
    lower.includes('unique constraint') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('assertionerror') ||
    lower.includes('undici') ||
    lower.includes('webidl') ||
    lower.includes('typeerror') ||
    lower.includes('rangeerror') ||
    lower.includes('cannot read propert') ||
    lower.includes('internal server error') ||
    lower.includes('500') ||
    lower.includes('cmu') // CUID prefix
  ) {
    return 'Hệ thống gặp sự cố kỹ thuật khi kết nối cơ sở dữ liệu. Vui lòng thử lại sau giây lát hoặc liên hệ hỗ trợ.';
  }

  // 2. Google Sheets errors
  if (lower.includes('google sheet') || lower.includes('spreadsheets') || lower.includes('docs.google.com')) {
    if (lower.includes('403') || lower.includes('permission') || lower.includes('quyền') || lower.includes('private')) {
      return 'Không có quyền truy cập Google Sheets. Vui lòng bật quyền "Bất kỳ ai có đường liên kết đều có thể xem" (Viewer) và thử lại.';
    }
    if (lower.includes('404') || lower.includes('not found') || lower.includes('không tìm thấy')) {
      return 'Không tìm thấy liên kết Google Sheets. Vui lòng kiểm tra lại đường dẫn chia sẻ.';
    }
    if (lower.includes('fetch') || lower.includes('network') || lower.includes('kết nối')) {
      return 'Không thể kết nối đến Google Sheets. Vui lòng kiểm tra lại đường truyền mạng và đường dẫn công khai.';
    }
  }

  // 3. File corrupted / wrong format errors
  if (lower.includes('corrupt') || lower.includes('central directory') || lower.includes('end of stream') || lower.includes('zip') || lower.includes('hỏng')) {
    return 'Tệp dữ liệu bị hỏng, bị khóa mật khẩu hoặc không đúng chuẩn Excel/CSV. Vui lòng kiểm tra và lưu lại tệp.';
  }

  // 4. Empty / missing rows
  if (lower.includes('empty') || lower.includes('rỗng')) {
    return 'Tệp bảng tính không có dữ liệu hàng bài viết. Vui lòng điền nội dung vào tệp mẫu rồi tải lên lại.';
  }

  return msg.trim() || fallbackMessage;
}

/**
 * Parse an Excel or CSV buffer into structured, validated post rows
 */
export function parseExcelOrCsvBuffer(
  buffer: Buffer,
  source: 'EXCEL' | 'CSV' = 'EXCEL',
  connectedProviders?: Set<string> | string[]
): ImportParseResult {
  try {
    const connectedSet = connectedProviders
      ? new Set(Array.from(connectedProviders).map(p => String(p).toUpperCase()))
      : null;

    const workbook = source === 'CSV'
      ? XLSX.read(buffer.toString('utf-8'), { type: 'string' })
      : XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        source,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        warningRows: 0,
        rows: [],
        error: 'Tệp không chứa bảng tính (sheet) nào. Vui lòng kiểm tra lại file.',
      };
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return {
        success: false,
        source,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        warningRows: 0,
        rows: [],
        error: 'Tệp rỗng hoặc không có dữ liệu hàng bài viết. Vui lòng tải "File mẫu Excel (.xlsx)" để điền nội dung chuẩn.',
      };
    }

    // Verify if spreadsheet contains at least one standard recognizable column
    const sampleRow = rawRows[0] || {};
    const normalizedKeys = Object.keys(sampleRow).map(normalizeKey);
    const hasRecognizedColumn = normalizedKeys.some(k => ['title', 'caption', 'platforms', 'scheduledAt'].includes(k));

    if (!hasRecognizedColumn) {
      return {
        success: false,
        source,
        totalRows: rawRows.length,
        validRows: 0,
        invalidRows: rawRows.length,
        warningRows: 0,
        rows: [],
        error: 'Tệp bảng tính không đúng mẫu quy định. Không tìm thấy các cột bắt buộc: "Tiêu đề", "Nền tảng", "Thời gian đăng". Vui lòng tải "File mẫu Excel (.xlsx)" để điền đúng định dạng.',
      };
    }

    const rows: ParsedImportRow[] = [];
    let validRows = 0;
    let invalidRows = 0;
    let warningRows = 0;

    rawRows.forEach((rawRow, index) => {
      const normalizedRow: Record<string, any> = {};
      for (const [key, val] of Object.entries(rawRow)) {
        normalizedRow[normalizeKey(key)] = val;
      }

      const title = String(normalizedRow.title || '').trim();
      const caption = String(normalizedRow.caption || '').trim();
      const firstComment = String(normalizedRow.firstComment || '').trim();
      const hashtags = String(normalizedRow.hashtags || '').trim();
      const mediaUrl = String(normalizedRow.mediaUrl || '').trim();

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!title) {
        errors.push('Thiếu tiêu đề bài viết (Bắt buộc).');
      }

      const rawPlatformStr = normalizedRow.platforms !== undefined && normalizedRow.platforms !== null
        ? String(normalizedRow.platforms).trim()
        : '';
      const platforms = parsePlatformList(rawPlatformStr);

      if (!rawPlatformStr) {
        errors.push('Thiếu nền tảng đăng bài (Bắt buộc).');
      } else if (platforms.length === 0) {
        errors.push(`Nền tảng "${rawPlatformStr}" không hợp lệ hoặc không được hỗ trợ.`);
      }

      // Check if platforms are connected with the user's account
      const unconnectedPlatforms: string[] = [];
      if (connectedSet) {
        for (const p of platforms) {
          if (!isPlatformProviderConnected(p, connectedSet)) {
            unconnectedPlatforms.push(p);
            const info = PLATFORM_PROVIDER_INFO[p];
            errors.push(`Nền tảng ${info?.name || p} chưa được kết nối với tài khoản.`);
          }
        }
      }

      const rawScheduleStr = normalizedRow.scheduledAt !== undefined && normalizedRow.scheduledAt !== null
        ? String(normalizedRow.scheduledAt).trim()
        : '';
      const { iso: scheduledAtIso, error: dateError, warning: dateWarning, isNow, isDraft } = parseScheduleDateTime(normalizedRow.scheduledAt);
      if (dateError) {
        errors.push(dateError);
      } else if (dateWarning) {
        warnings.push(dateWarning);
      }

      const scheduledAt = dateError ? rawScheduleStr : isDraft ? 'DRAFT' : isNow ? 'NOW' : scheduledAtIso;

      // YouTube Shorts duration > 180s: add warning, do NOT block
      if (platforms.includes('YOUTUBE_SHORTS') && normalizedRow.duration) {
        const durNum = parseInt(String(normalizedRow.duration).replace(/[^\d]/g, ''), 10);
        if (!isNaN(durNum) && durNum > 180) {
          warnings.push(`Video YouTube Shorts dài ${durNum}s (> 180s) sẽ được YouTube tự động xuất bản dưới dạng Video thông thường.`);
        }
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validRows++;
        if (warnings.length > 0) warningRows++;
      } else {
        invalidRows++;
      }

      rows.push({
        rowNumber: index + 1,
        title,
        caption,
        firstComment,
        hashtags,
        platforms,
        scheduledAt,
        mediaUrl,
        isValid,
        errors,
        warnings,
        unconnectedPlatforms: unconnectedPlatforms.length > 0 ? unconnectedPlatforms : undefined,
      });
    });

    return {
      success: true,
      source,
      totalRows: rows.length,
      validRows,
      invalidRows,
      warningRows,
      rows,
      connectedProviders: connectedSet ? Array.from(connectedSet) : undefined,
    };
  } catch (err: any) {
    console.error('[import-engine] Lỗi đọc tệp bảng tính:', err);
    return {
      success: false,
      source,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      warningRows: 0,
      rows: [],
      error: formatFriendlyImportError(err, 'Không thể đọc nội dung tệp. Tệp có thể bị hỏng, bị khóa hoặc không đúng định dạng .xlsx, .xls, .csv.'),
    };
  }
}

/**
 * Fetch public Google Sheets export CSV and parse
 */
export async function fetchAndParseGoogleSheet(
  sheetUrl: string,
  connectedProviders?: Set<string> | string[]
): Promise<ImportParseResult> {
  try {
    let cleanUrl = String(sheetUrl || '').trim();
    if (!cleanUrl) {
      return {
        success: false,
        source: 'GOOGLE_SHEETS',
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        warningRows: 0,
        rows: [],
        error: 'Vui lòng nhập đường dẫn Google Sheets hợp lệ.',
      };
    }

    let csvExportUrl = cleanUrl;
    const match = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    } else if (cleanUrl.includes('/pub') && !cleanUrl.includes('output=csv')) {
      csvExportUrl = cleanUrl.includes('?') ? `${cleanUrl}&output=csv` : `${cleanUrl}?output=csv`;
    }

    const response = await fetch(csvExportUrl, {
      headers: {
        'User-Agent': 'Topify-Automation-Importer/1.0',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        source: 'GOOGLE_SHEETS',
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        warningRows: 0,
        rows: [],
        error: `Không thể tải dữ liệu từ Google Sheets (Mã lỗi ${response.status}). Vui lòng đảm bảo bạn đã bật quyền chia sẻ "Bất kỳ ai có liên kết đều có thể xem" (Viewer).`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return parseExcelOrCsvBuffer(buffer, 'CSV', connectedProviders);
  } catch (err: any) {
    console.error('[import-engine] Lỗi kết nối Google Sheets:', err);
    return {
      success: false,
      source: 'GOOGLE_SHEETS',
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      warningRows: 0,
      rows: [],
      error: formatFriendlyImportError(err, 'Lỗi kết nối Google Sheets. Hãy kiểm tra kết nối mạng và quyền chia sẻ tệp.'),
    };
  }
}

/**
 * Generate standard sample template in Excel format
 */
export function generateSampleExcelTemplate(): Buffer {
  const headers = [
    'Tiêu đề',
    'Nội dung (Caption)',
    'Bình luận đầu (First Comment)',
    'Hashtags',
    'Nền tảng',
    'Thời gian lên lịch (YYYY-MM-DD HH:mm)',
    'Đường dẫn Media',
  ];

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowStr = `${tomorrow.toISOString().slice(0, 10)} 19:30`;

  const sampleData = [
    [
      'Top 3 bí quyết xây kênh TikTok triệu view 2026',
      'Kịch bản chi tiết 3 bước giữ chân người xem trong 3 giây đầu tiên. Áp dụng ngay để nhân 5 lần lượng chuyển đổi!',
      'Đừng quên lưu lại video và bình luận nhận checklist miễn phí nhé cả nhà!',
      '#topify #tiktoktips #videomarketing #automation',
      'TIKTOK_VIDEO, FACEBOOK_REELS',
      tomorrowStr,
      'https://storage.topify.vn/samples/sample_reel_1.mp4',
    ],
    [
      'Chiến lược tối ưu kịch bản video ngắn cho F&B',
      'Review góc quay và bố cục món ăn chuẩn viral. Đầy đủ phân cảnh hook, thân bài và kêu gọi hành động CTA rõ ràng.',
      'Inbox fanpage hoặc liên hệ hotline 1900-xxxx để nhận ưu đãi bàn đặt!',
      '#fb #foodreview #marketing #viralreels',
      'FACEBOOK_REELS, INSTAGRAM_REELS',
      `${tomorrow.toISOString().slice(0, 10)} 12:00`,
      '',
    ],
    [
      'Bí mật tăng tương tác tự nhiên không tốn tiền ads',
      'Cách đặt câu hỏi kích thích thảo luận và tận dụng tính năng Spin biến thể để tránh trùng lặp nội dung đa kênh.',
      'Dùng thử Topify Automation hoàn toàn miễn phí ngay hôm nay!',
      '#topify #marketingstrategy #growthhacks',
      'TIKTOK_VIDEO, YOUTUBE_SHORTS',
      '',
      '',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

  // Set column widths
  ws['!cols'] = [
    { wch: 35 }, // Title
    { wch: 50 }, // Caption
    { wch: 35 }, // First Comment
    { wch: 30 }, // Hashtags
    { wch: 25 }, // Platforms
    { wch: 30 }, // Scheduled At
    { wch: 40 }, // Media URL
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Import_Bai_Viet');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
