import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Trash2,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Edit3,
  Settings,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { safeFormatDate } from '../../lib/utils';

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

const PLATFORM_PROVIDER_MAP: Record<string, string> = {
  FACEBOOK_REELS: 'META',
  FACEBOOK_POST: 'META',
  FACEBOOK: 'META',
  INSTAGRAM_REELS: 'META',
  INSTAGRAM_CAROUSEL: 'META',
  INSTAGRAM_STORY: 'META',
  INSTAGRAM: 'META',
  YOUTUBE_SHORTS: 'YOUTUBE',
  YOUTUBE: 'YOUTUBE',
  TIKTOK_VIDEO: 'TIKTOK',
  TIKTOK: 'TIKTOK',
  ZALO_POST: 'ZALO',
  ZALO_ARTICLE: 'ZALO',
  ZALO: 'ZALO',
  TELEGRAM: 'TELEGRAM',
};

const PLATFORM_NAMES: Record<string, string> = {
  FACEBOOK_REELS: 'Facebook Reels',
  FACEBOOK_POST: 'Facebook Post',
  FACEBOOK: 'Facebook',
  INSTAGRAM_REELS: 'Instagram Reels',
  INSTAGRAM_CAROUSEL: 'Instagram Carousel',
  INSTAGRAM_STORY: 'Instagram Story',
  INSTAGRAM: 'Instagram',
  YOUTUBE_SHORTS: 'YouTube Shorts',
  YOUTUBE: 'YouTube',
  TIKTOK_VIDEO: 'TikTok',
  TIKTOK: 'TikTok',
  ZALO_POST: 'Zalo Post',
  ZALO_ARTICLE: 'Zalo Article',
  ZALO: 'Zalo',
  TELEGRAM: 'Telegram',
};

function isPlatformConnected(platform: string, connectedMap: Record<string, boolean>): boolean {
  if (!connectedMap) return false;
  const clean = String(platform || '').trim().toUpperCase();
  const required =
    PLATFORM_PROVIDER_MAP[clean] ||
    (clean.includes('TIKTOK')
      ? 'TIKTOK'
      : clean.includes('YOUTUBE') || clean.includes('SHORTS')
      ? 'YOUTUBE'
      : clean.includes('ZALO')
      ? 'ZALO'
      : clean.includes('TELEGRAM')
      ? 'TELEGRAM'
      : clean.includes('FB') || clean.includes('FACEBOOK') || clean.includes('INSTA')
      ? 'META'
      : null);

  if (!required) return false;
  if (connectedMap[required]) return true;
  if (required === 'META' && (connectedMap['FACEBOOK'] || connectedMap['INSTAGRAM'] || connectedMap['META'])) return true;
  if (required === 'YOUTUBE' && (connectedMap['GOOGLE'] || connectedMap['YOUTUBE'])) return true;
  if (required === 'TIKTOK' && connectedMap['TIKTOK']) return true;
  if (required === 'ZALO' && connectedMap['ZALO']) return true;
  if (required === 'TELEGRAM' && connectedMap['TELEGRAM']) return true;
  return false;
}

function validateScheduleDate(str: string): { isValid: boolean; error?: string } {
  const clean = String(str || '').trim();
  if (!clean || clean === 'NOW' || clean === 'DRAFT') return { isValid: true };
  const lower = clean.toLowerCase();
  if (['now', 'đăng ngay', 'dang ngay', 'đăng luôn', 'dang luon', 'publish now', 'immediate', 'draft', 'bản thảo', 'ban thao', 'bản nháp', 'ban nhap'].includes(lower)) {
    return { isValid: true };
  }

  const currentYear = new Date().getFullYear();

  // Pattern 1: Time first (e.g. 11:59 11/11, 11:59 11/11/2026, 11:59 (11/11))
  const timeFirstMatch = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+[\(]?(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?[\)]?$/);
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
          if (nextYearObj.getTime() > Date.now()) dateObj = nextYearObj;
        }
        if (dateObj.getTime() <= Date.now()) {
          return { isValid: false, error: 'Thời gian lên lịch đã qua trong quá khứ, vui lòng chọn thời điểm trong tương lai.' };
        }
        return { isValid: true };
      }
    }
    return { isValid: false, error: `Thời gian sai định dạng: "${clean}" hoặc ngày không tồn tại.` };
  }

  // Pattern 2: Date first (e.g. 11/11/2026 11:59, 11/11 11:59, 11/11)
  const dateFirstMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
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
          if (nextYearObj.getTime() > Date.now()) dateObj = nextYearObj;
        }
        if (dateObj.getTime() <= Date.now()) {
          return { isValid: false, error: 'Thời gian lên lịch đã qua trong quá khứ, vui lòng chọn thời điểm trong tương lai.' };
        }
        return { isValid: true };
      }
    }
    return { isValid: false, error: `Thời gian sai định dạng: "${clean}" hoặc ngày không tồn tại.` };
  }

  // Pattern 3: ISO / Standard Date fallback
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    if (parsed.getTime() <= Date.now()) {
      return { isValid: false, error: 'Thời gian lên lịch đã qua trong quá khứ, vui lòng chọn thời điểm trong tương lai.' };
    }
    return { isValid: true };
  }

  return { isValid: false, error: `Thời gian sai định dạng: "${clean}" (Ví dụ đúng: 11:59 11/11, 28/10/2026 20:30 hoặc 2026-10-28 20:30).` };
}

/**
 * Format raw error messages into clean, user-friendly Vietnamese messages.
 * Prevents technical ORM/database queries, IDs, and stack traces from leaking to end users.
 */
function formatFriendlyImportError(rawError: any, fallbackMessage: string = 'Lỗi phân tích tệp bảng tính.'): string {
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
    lower.includes('cmu')
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

function validateRow(
  row: ParsedImportRow,
  connectedMap: Record<string, boolean>,
  hasConnectionsLoaded: boolean = true
): { isValid: boolean; errors: string[]; unconnectedPlatforms: string[] } {
  const errors: string[] = [];
  const unconnectedPlatforms: string[] = [];

  const titleStr = String(row.title || '').trim();
  if (!titleStr) {
    errors.push('Thiếu tiêu đề bài viết (Bắt buộc).');
  }

  if (!row.platforms || row.platforms.length === 0) {
    errors.push('Thiếu nền tảng đăng bài (Bắt buộc).');
  } else if (hasConnectionsLoaded) {
    for (const p of row.platforms) {
      if (!isPlatformConnected(p, connectedMap)) {
        unconnectedPlatforms.push(p);
        const name = PLATFORM_NAMES[p] || p;
        errors.push(`Nền tảng ${name} chưa được kết nối với tài khoản.`);
      }
    }
  }

  // Check scheduledAt format if provided
  if (row.scheduledAt && row.scheduledAt !== 'NOW' && row.scheduledAt !== 'DRAFT') {
    const dateCheck = validateScheduleDate(String(row.scheduledAt));
    if (!dateCheck.isValid && dateCheck.error) {
      errors.push(dateCheck.error);
    }
  }

  // Filter out any previously attached errors that are now resolved by user edit
  const prevErrors = (row.errors || []).filter((prevErr) => {
    if (titleStr && prevErr.includes('tiêu đề')) return false;
    if (row.platforms && row.platforms.length > 0 && prevErr.includes('Thiếu nền tảng')) return false;
    if (
      row.scheduledAt &&
      (row.scheduledAt === 'NOW' || row.scheduledAt === 'DRAFT' || validateScheduleDate(String(row.scheduledAt)).isValid) &&
      (prevErr.includes('Thời gian') || prevErr.includes('quá khứ') || prevErr.includes('định dạng'))
    ) {
      return false;
    }
    return true;
  });

  const combinedErrors = Array.from(new Set([...prevErrors, ...errors]));

  return {
    isValid: combinedErrors.length === 0,
    errors: combinedErrors,
    unconnectedPlatforms: Array.from(new Set([...(row.unconnectedPlatforms || []), ...unconnectedPlatforms])),
  };
}

interface ImportPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportPostsModal({ isOpen, onClose, onSuccess }: ImportPostsModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'google_sheet'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Connected social providers map
  const [connectedProviders, setConnectedProviders] = useState<Record<string, boolean>>({});
  const [hasLoadedSocialStatus, setHasLoadedSocialStatus] = useState(false);

  // Parsed result state
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[] | null>(null);
  const [selectedRowNumbers, setSelectedRowNumbers] = useState<number[]>([]);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch social status on modal open
  useEffect(() => {
    if (!isOpen) return;
    const fetchSocialStatus = async () => {
      try {
        const map: Record<string, boolean> = {};

        try {
          const res = await api.get('/social/status');
          if (res.data?.connections && Array.isArray(res.data.connections)) {
            res.data.connections.forEach((conn: any) => {
              if (conn.provider && conn.connected !== false) {
                const p = String(conn.provider).toUpperCase();
                map[p] = true;
                if (p === 'META' || p === 'FACEBOOK') {
                  map['META'] = true;
                  map['FACEBOOK'] = true;
                  map['INSTAGRAM'] = true;
                }
                if (p === 'INSTAGRAM') {
                  map['META'] = true;
                  map['INSTAGRAM'] = true;
                }
                if (p === 'GOOGLE' || p === 'YOUTUBE') {
                  map['YOUTUBE'] = true;
                  map['GOOGLE'] = true;
                }
                if (p === 'TIKTOK') {
                  map['TIKTOK'] = true;
                }
                if (p === 'ZALO') {
                  map['ZALO'] = true;
                }
                if (p === 'TELEGRAM') {
                  map['TELEGRAM'] = true;
                }
              }
            });
          }
        } catch (e) {
          console.warn('Failed to load /social/status', e);
        }

        // Secondary fallback to /workspace/social
        try {
          const wsRes = await api.get('/workspace/social');
          const wsAccounts = wsRes.data?.accounts || wsRes.data || [];
          if (Array.isArray(wsAccounts)) {
            wsAccounts.forEach((acc: any) => {
              if (acc.provider && acc.status === 'CONNECTED') {
                const p = String(acc.provider).toUpperCase();
                map[p] = true;
                if (p === 'META' || p === 'FACEBOOK') {
                  map['META'] = true;
                  map['FACEBOOK'] = true;
                  map['INSTAGRAM'] = true;
                }
                if (p === 'INSTAGRAM') {
                  map['META'] = true;
                  map['INSTAGRAM'] = true;
                }
                if (p === 'GOOGLE' || p === 'YOUTUBE') {
                  map['YOUTUBE'] = true;
                  map['GOOGLE'] = true;
                }
                if (p === 'TIKTOK') {
                  map['TIKTOK'] = true;
                }
                if (p === 'ZALO') {
                  map['ZALO'] = true;
                }
                if (p === 'TELEGRAM') {
                  map['TELEGRAM'] = true;
                }
              }
            });
          }
        } catch {
          // optional fallback
        }

        setConnectedProviders(map);
        setHasLoadedSocialStatus(true);
      } catch (e) {
        console.warn('Failed to load social status in ImportPostsModal', e);
        setHasLoadedSocialStatus(true);
      }
    };
    fetchSocialStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      handleParseFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      handleParseFile(selected);
    }
  };

  const handleParseFile = async (targetFile: File) => {
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', targetFile);

      const res = await api.post('/content-studio/import/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        // Update connected providers if returned from backend
        const map: Record<string, boolean> = { ...connectedProviders };
        if (Array.isArray(res.data.connectedProviders)) {
          res.data.connectedProviders.forEach((p: string) => {
            const prov = String(p).toUpperCase();
            map[prov] = true;
            if (prov === 'META' || prov === 'FACEBOOK') {
              map['META'] = true;
              map['FACEBOOK'] = true;
              map['INSTAGRAM'] = true;
            }
            if (prov === 'INSTAGRAM') {
              map['META'] = true;
              map['INSTAGRAM'] = true;
            }
            if (prov === 'YOUTUBE' || prov === 'GOOGLE') {
              map['YOUTUBE'] = true;
              map['GOOGLE'] = true;
            }
            if (prov === 'TIKTOK') {
              map['TIKTOK'] = true;
            }
            if (prov === 'ZALO') {
              map['ZALO'] = true;
            }
            if (prov === 'TELEGRAM') {
              map['TELEGRAM'] = true;
            }
          });
          setConnectedProviders(map);
        }

        const rawRows: ParsedImportRow[] = res.data.rows || [];
        const rows = rawRows.map((r) => {
          const validation = validateRow(r, map, true);
          return {
            ...r,
            ...validation,
          };
        });

        setParsedRows(rows);
        setSelectedRowNumbers(rows.filter((r) => r.isValid).map((r) => r.rowNumber));

        const invalidRows = rows.filter((r) => !r.isValid);
        const invalidCount = invalidRows.length;
        if (invalidCount > 0) {
          if (invalidCount === rows.length) {
            const errorDetails = invalidRows
              .slice(0, 3)
              .map((r) => `Dòng ${r.rowNumber}: ${r.errors[0] || 'Lỗi dữ liệu'}`)
              .join('; ');
            const moreText = invalidCount > 3 ? ` và ${invalidCount - 3} dòng khác` : '';
            toast.error(`Toàn bộ ${rows.length} bài viết không hợp lệ (${errorDetails}${moreText}). Vui lòng sửa lại dữ liệu hoặc tải file mẫu.`);
          } else {
            const sampleErrors = invalidRows
              .slice(0, 2)
              .map((r) => `Dòng ${r.rowNumber}: ${r.errors[0] || 'Lỗi dữ liệu'}`)
              .join('; ');
            const moreText = invalidCount > 2 ? ` và ${invalidCount - 2} dòng khác` : '';
            toast.warning(`Đã phân tích ${rows.length} bài. Có ${invalidCount} bài cần sửa lỗi (${sampleErrors}${moreText}). Vui lòng kiểm tra bảng xem trước.`);
          }
        } else {
          toast.success(`Đã phân tích thành công ${rows.length} bài viết từ tệp!`);
        }
      } else {
        toast.error(formatFriendlyImportError(res.data?.error, 'Lỗi khi phân tích tệp bảng tính.'));
      }
    } catch (err: any) {
      const raw = err.response?.data?.error || err.message || 'Không thể đọc tệp bảng tính.';
      toast.error(formatFriendlyImportError(raw, 'Không thể đọc tệp bảng tính. Vui lòng kiểm tra lại định dạng tệp.'));
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseGoogleSheet = async () => {
    if (!sheetUrl.trim()) {
      toast.error('Vui lòng dán liên kết Google Sheets.');
      return;
    }

    setIsParsing(true);
    try {
      const res = await api.post('/content-studio/import/parse', { sheetUrl: sheetUrl.trim() });
      if (res.data?.success) {
        // Update connected providers if returned from backend
        const map: Record<string, boolean> = { ...connectedProviders };
        if (Array.isArray(res.data.connectedProviders)) {
          res.data.connectedProviders.forEach((p: string) => {
            const prov = String(p).toUpperCase();
            map[prov] = true;
            if (prov === 'META' || prov === 'FACEBOOK') {
              map['META'] = true;
              map['FACEBOOK'] = true;
              map['INSTAGRAM'] = true;
            }
            if (prov === 'INSTAGRAM') {
              map['META'] = true;
              map['INSTAGRAM'] = true;
            }
            if (prov === 'YOUTUBE' || prov === 'GOOGLE') {
              map['YOUTUBE'] = true;
              map['GOOGLE'] = true;
            }
            if (prov === 'TIKTOK') {
              map['TIKTOK'] = true;
            }
            if (prov === 'ZALO') {
              map['ZALO'] = true;
            }
            if (prov === 'TELEGRAM') {
              map['TELEGRAM'] = true;
            }
          });
          setConnectedProviders(map);
        }

        const rawRows: ParsedImportRow[] = res.data.rows || [];
        const rows = rawRows.map((r) => {
          const validation = validateRow(r, map, true);
          return {
            ...r,
            ...validation,
          };
        });

        setParsedRows(rows);
        setSelectedRowNumbers(rows.filter((r) => r.isValid).map((r) => r.rowNumber));

        const invalidRows = rows.filter((r) => !r.isValid);
        const invalidCount = invalidRows.length;
        if (invalidCount > 0) {
          if (invalidCount === rows.length) {
            const errorDetails = invalidRows
              .slice(0, 3)
              .map((r) => `Dòng ${r.rowNumber}: ${r.errors[0] || 'Lỗi dữ liệu'}`)
              .join('; ');
            const moreText = invalidCount > 3 ? ` và ${invalidCount - 3} dòng khác` : '';
            toast.error(`Toàn bộ ${rows.length} bài viết không hợp lệ (${errorDetails}${moreText}). Vui lòng sửa lại dữ liệu hoặc tải file mẫu.`);
          } else {
            const sampleErrors = invalidRows
              .slice(0, 2)
              .map((r) => `Dòng ${r.rowNumber}: ${r.errors[0] || 'Lỗi dữ liệu'}`)
              .join('; ');
            const moreText = invalidCount > 2 ? ` và ${invalidCount - 2} dòng khác` : '';
            toast.warning(`Đã nạp ${rows.length} bài. Có ${invalidCount} bài cần sửa lỗi (${sampleErrors}${moreText}). Vui lòng kiểm tra bảng xem trước.`);
          }
        } else {
          toast.success(`Đã nạp ${rows.length} bài viết từ Google Sheets!`);
        }
      } else {
        toast.error(formatFriendlyImportError(res.data?.error, 'Không thể lấy dữ liệu từ Google Sheets.'));
      }
    } catch (err: any) {
      const raw = err.response?.data?.error || err.message || 'Lỗi kết nối Google Sheets.';
      toast.error(formatFriendlyImportError(raw, 'Lỗi kết nối Google Sheets. Vui lòng kiểm tra lại đường dẫn và quyền chia sẻ.'));
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/content-studio/import/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Mau_Import_Bai_Viet_Topify.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải xuống tệp mẫu Excel!');
    } catch (err: any) {
      toast.error('Không thể tải tệp mẫu');
    }
  };

  const toggleSelectAll = () => {
    if (!parsedRows) return;
    if (selectedRowNumbers.length === parsedRows.length) {
      setSelectedRowNumbers([]);
    } else {
      setSelectedRowNumbers(parsedRows.map((r) => r.rowNumber));
    }
  };

  const toggleSelectRow = (rowNum: number) => {
    setSelectedRowNumbers((prev) =>
      prev.includes(rowNum) ? prev.filter((n) => n !== rowNum) : [...prev, rowNum]
    );
  };

  const handleDeleteRow = (rowNum: number) => {
    if (!parsedRows) return;
    setParsedRows(parsedRows.filter((r) => r.rowNumber !== rowNum));
    setSelectedRowNumbers((prev) => prev.filter((n) => n !== rowNum));
  };

  const handleRemovePlatform = (rowNum: number, platformToRemove: string) => {
    if (!parsedRows) return;
    setParsedRows(
      parsedRows.map((r) => {
        if (r.rowNumber !== rowNum) return r;
        const newPlatforms = r.platforms.filter((p) => p !== platformToRemove);
        const updated = { ...r, platforms: newPlatforms };
        const validation = validateRow(updated, connectedProviders, true);
        const nextRow = {
          ...updated,
          ...validation,
        };
        // If it becomes valid and wasn't selected, auto select it
        if (nextRow.isValid && !selectedRowNumbers.includes(rowNum)) {
          setSelectedRowNumbers((prev) => [...prev, rowNum]);
        }
        return nextRow;
      })
    );
    toast.info(`Đã gỡ bỏ kênh ${PLATFORM_NAMES[platformToRemove] || platformToRemove} khỏi dòng ${rowNum}`);
  };

  const handleUpdateRowCell = (rowNum: number, field: keyof ParsedImportRow, value: any) => {
    if (!parsedRows) return;
    setParsedRows(
      parsedRows.map((r) => {
        if (r.rowNumber !== rowNum) return r;
        const updated = { ...r, [field]: value };
        const validation = validateRow(updated, connectedProviders, hasLoadedSocialStatus);
        const nextRow = {
          ...updated,
          ...validation,
        };
        if (nextRow.isValid && !selectedRowNumbers.includes(rowNum)) {
          setSelectedRowNumbers((prev) => [...prev, rowNum]);
        } else if (!nextRow.isValid && selectedRowNumbers.includes(rowNum)) {
          setSelectedRowNumbers((prev) => prev.filter((n) => n !== rowNum));
        }
        return nextRow;
      })
    );
  };

  const handleSavePosts = async (importAsDraft: boolean) => {
    if (!parsedRows || parsedRows.length === 0) return;

    const selectedPosts = parsedRows.filter((r) => selectedRowNumbers.includes(r.rowNumber));
    if (selectedPosts.length === 0) {
      toast.error('Vui lòng tích chọn ít nhất 1 bài viết để nhập.');
      return;
    }

    const invalidSelected = selectedPosts.filter((r) => !r.isValid);
    if (invalidSelected.length > 0) {
      const details = invalidSelected
        .slice(0, 3)
        .map((r) => `Dòng ${r.rowNumber} (${r.errors[0] || 'Lỗi dữ liệu'})`)
        .join(', ');
      const more = invalidSelected.length > 3 ? ` và ${invalidSelected.length - 3} bài khác` : '';
      toast.error(`Không thể lưu: có ${invalidSelected.length} bài viết chưa hợp lệ [${details}${more}]. Vui lòng sửa lỗi hoặc bỏ tích chọn các bài này.`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.post('/content-studio/import/save', {
        posts: selectedPosts.map((p) => ({
          title: p.title,
          caption: p.caption,
          firstComment: p.firstComment,
          hashtags: p.hashtags,
          platforms: p.platforms,
          scheduledAt: p.scheduledAt,
          mediaUrl: p.mediaUrl,
        })),
        importAsDraft,
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Đã nhập thành công ${selectedPosts.length} bài viết!`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(formatFriendlyImportError(res.data?.error, 'Lỗi khi lưu bài viết.'));
      }
    } catch (err: any) {
      const raw = err.response?.data?.error || err.message || 'Lỗi kết nối khi lưu bài viết.';
      toast.error(formatFriendlyImportError(raw, 'Lỗi khi lưu bài viết. Vui lòng kiểm tra lại kết nối và thử lại.'));
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = parsedRows ? parsedRows.filter((r) => r.isValid && r.warnings.length === 0).length : 0;
  const warningCount = parsedRows ? parsedRows.filter((r) => r.isValid && r.warnings.length > 0).length : 0;
  const errorCount = parsedRows ? parsedRows.filter((r) => !r.isValid).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Import Bài Viết Hàng Loạt (F019)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                  Excel & Google Drive
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Nhập kịch bản, tiêu đề, caption và lịch đăng từ file bảng tính hoặc link Google Sheets trực tiếp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!parsedRows ? (
            /* STEP 1: UPLOAD / CONNECT SHEET */
            <div className="space-y-6">
              {/* Source Tabs */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeTab === 'upload'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    Tải tệp từ máy tính (.xlsx, .csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('google_sheet')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeTab === 'google_sheet'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    Kết nối Google Drive / Sheets
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải file mẫu Excel (.xlsx)
                </button>
              </div>

              {/* Tab 1: Upload File */}
              {activeTab === 'upload' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-3xl p-10 text-center bg-purple-50/20 transition-all cursor-pointer space-y-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    {isParsing ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {isParsing
                        ? 'Đang phân tích bảng tính...'
                        : 'Kéo thả file Excel (.xlsx, .xls) hoặc .csv vào đây'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Hoặc click để chọn tệp từ máy tính của bạn (Tối đa 10MB)
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Google Sheets URL */}
              {activeTab === 'google_sheet' && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Đường dẫn Google Sheets (Chia sẻ công khai xem):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleParseGoogleSheet}
                        disabled={isParsing || !sheetUrl.trim()}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isParsing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                        Lấy Dữ Liệu
                      </button>
                    </div>
                  </div>

                  {/* Google Sheets Guide */}
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Hướng dẫn bật quyền truy cập Google Sheets:
                    </p>
                    <p>
                      1. Mở file Google Sheets của bạn trên trình duyệt.
                    </p>
                    <p>
                      2. Nhấp nút <strong>"Chia sẻ" (Share)</strong> ở góc trên bên phải.
                    </p>
                    <p>
                      3. Tại mục <em>Quyền truy cập chung</em>, chọn <strong>"Bất kỳ ai có đường liên kết đều có thể xem (Viewer)"</strong>.
                    </p>
                    <p>
                      4. Sao chép liên kết và dán vào ô bên trên để Topify đọc tự động.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: PREVIEW DATA TABLE */
            <div className="space-y-5 animate-fade-in">
              {/* Metric Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100">
                  <span className="text-[11px] font-semibold text-purple-700 uppercase">Tổng số bài</span>
                  <div className="text-xl font-black text-purple-900 mt-0.5">{parsedRows.length}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase">Hợp lệ</span>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">{validCount}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
                  <span className="text-[11px] font-semibold text-amber-700 uppercase">Có cảnh báo</span>
                  <div className="text-xl font-black text-amber-700 mt-0.5">{warningCount}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100">
                  <span className="text-[11px] font-semibold text-rose-700 uppercase">Không hợp lệ</span>
                  <div className="text-xl font-black text-rose-700 mt-0.5">{errorCount}</div>
                </div>
              </div>

              {/* Unconnected Platforms / Invalid Alert Banner */}
              {errorCount > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-rose-900 text-sm">
                          Phát hiện {errorCount} bài viết KHÔNG HỢP LỆ cần chỉnh sửa:
                        </p>
                        <p className="text-xs text-rose-700 mt-0.5">
                          Các dòng này thiếu thông tin bắt buộc, sai định dạng hoặc sử dụng kênh mạng xã hội chưa được kết nối.
                        </p>
                      </div>
                    </div>
                    <a
                      href="#/settings"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold shrink-0 transition-colors shadow-xs"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Mở Cài đặt kênh
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Chi tiết danh sách các dòng và trường lỗi cụ thể */}
                  <div className="bg-white/80 rounded-xl p-3 border border-rose-200/80 max-h-36 overflow-y-auto space-y-1.5 text-[11px]">
                    <p className="font-bold text-rose-950 uppercase tracking-wider text-[10px]">
                      Danh sách chi tiết lỗi theo từng dòng:
                    </p>
                    {parsedRows
                      .filter((r) => !r.isValid)
                      .map((r) => (
                        <div key={r.rowNumber} className="flex items-start gap-2 text-rose-900">
                          <span className="font-mono font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                            Dòng {r.rowNumber}
                          </span>
                          <span className="flex-1">
                            {r.errors.join(' • ')}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRowNumbers.length === parsedRows.length}
                            onChange={toggleSelectAll}
                            className="rounded text-purple-600 focus:ring-purple-400"
                          />
                        </th>
                        <th className="p-3 w-12 font-bold text-center">STT</th>
                        <th className="p-3 font-bold w-1/4">Tiêu đề bài viết *</th>
                        <th className="p-3 font-bold w-1/3">Nội dung (Caption)</th>
                        <th className="p-3 font-bold">Nền tảng</th>
                        <th className="p-3 font-bold">Thời gian</th>
                        <th className="p-3 font-bold text-center">Trạng thái</th>
                        <th className="p-3 font-bold text-center w-12">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRows.map((row) => {
                        const isSelected = selectedRowNumbers.includes(row.rowNumber);
                        const hasErrors = row.errors.length > 0;
                        const hasWarnings = row.warnings.length > 0;

                        return (
                          <tr
                            key={row.rowNumber}
                            className={`hover:bg-purple-50/30 transition-colors ${
                              !isSelected ? 'opacity-60 bg-gray-50/50' : hasErrors ? 'bg-rose-50/20' : ''
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRow(row.rowNumber)}
                                className="rounded text-purple-600 focus:ring-purple-400"
                              />
                            </td>
                            <td className="p-3 text-center font-mono text-gray-500 font-bold">
                              {row.rowNumber}
                            </td>
                            <td className="p-3 font-semibold text-gray-900">
                              <input
                                type="text"
                                value={row.title}
                                onChange={(e) => handleUpdateRowCell(row.rowNumber, 'title', e.target.value)}
                                className={`w-full px-2 py-1 rounded border text-xs font-semibold focus:outline-none focus:ring-1 ${
                                  !row.title.trim()
                                    ? 'border-rose-300 bg-rose-50/70 text-rose-900 placeholder:text-rose-400 focus:ring-rose-400'
                                    : hasErrors
                                    ? 'border-rose-200 bg-rose-50/30 text-gray-900 focus:ring-purple-400'
                                    : 'border-transparent hover:border-gray-300 focus:border-purple-400'
                                }`}
                                placeholder="⚠️ Bắt buộc nhập tiêu đề..."
                              />
                              {!row.title.trim() && (
                                <span className="text-[10px] text-rose-600 font-bold block mt-1">
                                  ⚠️ Lỗi: Thiếu tiêu đề (Bắt buộc)
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-gray-700">
                              <textarea
                                value={row.caption}
                                onChange={(e) => handleUpdateRowCell(row.rowNumber, 'caption', e.target.value)}
                                rows={2}
                                className="w-full px-2 py-1 rounded border border-transparent hover:border-gray-300 text-xs focus:outline-none focus:ring-1 focus:border-purple-400 resize-none bg-transparent"
                                placeholder="Nhập caption bài viết..."
                              />
                            </td>
                            <td className="p-3">
                              {row.platforms.length === 0 ? (
                                <div className="space-y-1">
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-xs cursor-help"
                                    title={row.errors.find((e) => e.includes('nền tảng') || e.includes('Nền tảng')) || 'Chưa chọn nền tảng đăng bài (Bắt buộc)'}
                                  >
                                    <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                                    Chưa chọn nền tảng
                                  </span>
                                  <span className="text-[10px] text-rose-600 font-bold block">
                                    ⚠️ Lỗi: Thiếu kênh đăng (Bắt buộc)
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {row.platforms.map((p, idx) => {
                                    const isConnected = isPlatformConnected(p, connectedProviders);
                                    return (
                                      <span
                                        key={idx}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                          isConnected
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                            : 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                                        }`}
                                        title={
                                          isConnected
                                            ? undefined
                                            : `Nền tảng ${PLATFORM_NAMES[p] || p} chưa được kết nối với tài khoản!`
                                        }
                                      >
                                        {p.replace('_REELS', '').replace('_POST', '').replace('_VIDEO', '')}
                                        {!isConnected && (
                                          <span className="text-[9px] text-rose-600 font-bold">
                                            (Chưa connect)
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemovePlatform(row.rowNumber, p);
                                          }}
                                          className="hover:text-rose-900 hover:bg-rose-200/60 rounded px-0.5 ml-0.5 font-bold leading-none"
                                          title={`Gỡ bỏ ${PLATFORM_NAMES[p] || p}`}
                                        >
                                          ×
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap text-gray-600 font-mono">
                              {row.errors.some((e) => e.includes('Thời gian') || e.includes('quá khứ') || e.includes('định dạng')) ? (
                                <div className="space-y-0.5">
                                  <span
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 cursor-help"
                                    title={row.errors.find((e) => e.includes('Thời gian') || e.includes('quá khứ') || e.includes('định dạng')) || 'Thời gian không hợp lệ'}
                                  >
                                    <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                                    <span className="max-w-[130px] truncate">{row.scheduledAt || 'Sai định dạng'}</span>
                                  </span>
                                  <span className="text-[9px] text-rose-600 font-bold block leading-tight max-w-[130px]">
                                    ⚠️ Sai định dạng thời gian
                                  </span>
                                </div>
                              ) : row.scheduledAt && row.scheduledAt !== 'NOW' && row.scheduledAt !== 'DRAFT' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700">
                                  <Calendar className="w-3 h-3 text-purple-600" />
                                  {safeFormatDate(row.scheduledAt, 'HH:mm (dd/MM)')}
                                </span>
                              ) : row.scheduledAt === 'DRAFT' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                  <FileText className="w-3 h-3 text-gray-400" />
                                  Bản thảo (Draft)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  Now (Đăng ngay)
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {hasErrors ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 cursor-help"
                                    title={row.errors.join('\n')}
                                  >
                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                    Không hợp lệ
                                  </span>
                                  <span
                                    className="text-[10px] text-rose-600 font-medium max-w-[130px] truncate block"
                                    title={row.errors.join('; ')}
                                  >
                                    {row.errors[0]}
                                  </span>
                                </div>
                              ) : hasWarnings ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 cursor-help"
                                  title={row.warnings.join('\n')}
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Có cảnh báo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Hợp lệ
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.rowNumber)}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                                title="Xóa dòng này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          {!parsedRows ? (
            <div className="text-xs text-gray-500">
              Định dạng cột hỗ trợ: Tiêu đề, Nội dung, Bình luận đầu, Hashtag, Nền tảng, Thời gian đăng
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setParsedRows(null);
                  setFile(null);
                  setSheetUrl('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                ← Chọn file khác
              </button>
              <span className="text-xs text-gray-500">
                Đã chọn <strong>{selectedRowNumbers.length}</strong> / {parsedRows.length} bài
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Đóng
            </button>

            {parsedRows && (
              <>
                <button
                  type="button"
                  onClick={() => handleSavePosts(true)}
                  disabled={isSaving || selectedRowNumbers.length === 0}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Lưu dạng Bản Thảo (Draft)
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePosts(false)}
                  disabled={isSaving || selectedRowNumbers.length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Xác Nhận Lên Lịch & Lưu Bài
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
