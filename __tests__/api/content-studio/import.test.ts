import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  parseExcelOrCsvBuffer,
  generateSampleExcelTemplate,
  parseScheduleDateTime,
} from '@/lib/content-studio/import-engine';

describe('Content Studio Bulk Import Engine (F019)', () => {
  it('generates a valid sample Excel template buffer', () => {
    const buffer = generateSampleExcelTemplate();
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);

    // Verify it can be parsed back with XLSX
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    expect(workbook.SheetNames).toContain('Mau_Import_Bai_Viet');
    const sheet = workbook.Sheets['Mau_Import_Bai_Viet'];
    const data = XLSX.utils.sheet_to_json(sheet);
    expect(data.length).toBeGreaterThan(0);
  });

  it('normalizes Vietnamese headers and parses valid rows from Excel buffer', () => {
    const rows = [
      {
        'Tiêu đề bài viết': 'Bí Quyết Kinh Doanh 2026',
        'Nội dung caption': 'Caption cực hay dành cho chủ shop...',
        'Bình luận đầu': 'Inbox ngay để nhận ưu đãi',
        'Hashtags': '#topify #kinhdoanh #viral',
        'Kênh đăng': 'tiktok, facebook',
        'Thời gian đăng': '2026-11-01 10:30',
        'Link video / ảnh': 'https://storage.topify.vn/videos/clip1.mp4',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const result = parseExcelOrCsvBuffer(buffer, 'EXCEL');
    expect(result.success).toBe(true);
    expect(result.totalRows).toBe(1);
    expect(result.validRows).toBe(1);

    const first = result.rows[0];
    expect(first.title).toBe('Bí Quyết Kinh Doanh 2026');
    expect(first.caption).toBe('Caption cực hay dành cho chủ shop...');
    expect(first.firstComment).toBe('Inbox ngay để nhận ưu đãi');
    expect(first.hashtags).toContain('#topify');
    expect(first.platforms).toContain('TIKTOK_VIDEO');
    expect(first.platforms).toContain('FACEBOOK_REELS');
    expect(first.isValid).toBe(true);
  });

  it('marks row invalid if title is missing', () => {
    const rows = [
      {
        'Nội dung caption': 'Chỉ có caption không có tiêu đề',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const result = parseExcelOrCsvBuffer(buffer, 'EXCEL');
    expect(result.success).toBe(true);
    expect(result.invalidRows).toBe(1);
    expect(result.rows[0].isValid).toBe(false);
    expect(result.rows[0].errors[0]).toContain('Thiếu tiêu đề bài viết');
  });

  it('marks row invalid when platform TikTok is not connected (account only has YouTube)', () => {
    const rows = [
      {
        'Tiêu đề': 'Top 3 bí quyết xây kênh TikTok',
        'Nội dung': 'Kịch bản chi tiết 3 bước giữ chân...',
        'Nền tảng': 'TIKTOK, YOUTUBE_SHORTS',
        'Thời gian': '2026-10-26 19:30',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // User only connected YouTube
    const connectedProviders = new Set(['YOUTUBE', 'GOOGLE']);
    const result = parseExcelOrCsvBuffer(buffer, 'EXCEL', connectedProviders);

    expect(result.success).toBe(true);
    expect(result.totalRows).toBe(1);
    expect(result.validRows).toBe(0);
    expect(result.invalidRows).toBe(1);

    const first = result.rows[0];
    expect(first.isValid).toBe(false);
    expect(first.unconnectedPlatforms).toContain('TIKTOK_VIDEO');
    expect(first.errors.some((e) => e.includes('TikTok') && e.includes('chưa được kết nối'))).toBe(true);
  });

  it('marks row valid when all platforms in the row are connected', () => {
    const rows = [
      {
        'Tiêu đề': 'Video Shorts Triệu View',
        'Nội dung': 'Cách làm video ngắn YouTube...',
        'Nền tảng': 'YOUTUBE_SHORTS',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const connectedProviders = new Set(['YOUTUBE', 'GOOGLE']);
    const result = parseExcelOrCsvBuffer(buffer, 'EXCEL', connectedProviders);

    expect(result.success).toBe(true);
    expect(result.validRows).toBe(1);
    expect(result.invalidRows).toBe(0);
    expect(result.rows[0].isValid).toBe(true);
    expect(result.rows[0].unconnectedPlatforms).toBeUndefined();
  });

  it('allows YouTube Shorts with duration > 180s as valid with a warning instead of blocking', () => {
    const rows = [
      {
        'Tiêu đề': "[SPECIAL CLIP] BTS 'Life Goes On'",
        'Nội dung': 'Special clip Life Goes On',
        'Nền tảng': 'YOUTUBE_SHORTS',
        'Thời lượng': '211s',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const connectedProviders = new Set(['YOUTUBE', 'GOOGLE']);
    const result = parseExcelOrCsvBuffer(buffer, 'EXCEL', connectedProviders);

    expect(result.success).toBe(true);
    expect(result.validRows).toBe(1);
    expect(result.invalidRows).toBe(0);

    const first = result.rows[0];
    expect(first.isValid).toBe(true);
    expect(first.warnings.some((w) => w.includes('YouTube') && w.toLowerCase().includes('video thông thường'))).toBe(true);
  });

  it('defaults to publish now (valid with 0 warnings) when scheduled time is empty', () => {
    const rows = [
      {
        'Tiêu đề': 'Top 3 bí quyết xây kênh TikTok 1',
        'Nội dung': 'Kịch bản chi tiết 3 bước giữ chân người xem...',
        'Nền tảng': 'FACEBOOK',
        'Thời gian': '',
      },
      {
        'Tiêu đề': 'Chiến lược tối ưu kịch bản video',
        'Nội dung': 'Review góc quay và bố cục món ăn chuẩn viral...',
        'Nền tảng': 'FACEBOOK',
        'Thời gian': '',
      },
      {
        'Tiêu đề': 'Bí mật tăng tương tác tự nhiên k',
        'Nội dung': 'Cách đặt câu hỏi kích thích thảo luận...',
        'Nền tảng': 'FACEBOOK',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const connectedProviders = new Set(['FACEBOOK', 'META']);
    const result = parseExcelOrCsvBuffer(buffer, 'EXCEL', connectedProviders);

    expect(result.success).toBe(true);
    expect(result.totalRows).toBe(3);
    expect(result.validRows).toBe(3);
    expect(result.warningRows).toBe(0);
    expect(result.invalidRows).toBe(0);

    for (const row of result.rows) {
      expect(row.isValid).toBe(true);
      expect(row.warnings.length).toBe(0);
      expect(row.scheduledAt).toBeNull();
    }
  });

  it('treats "now" and "đăng ngay" as valid publish now without draft warnings', () => {
    const rows = [
      {
        'Tiêu đề': 'Bài viết đăng ngay 1',
        'Nội dung': 'Nội dung bài viết 1',
        'Nền tảng': 'FACEBOOK',
        'Thời gian': 'now',
      },
      {
        'Tiêu đề': 'Bài viết đăng ngay 2',
        'Nội dung': 'Nội dung bài viết 2',
        'Nền tảng': 'FACEBOOK',
        'Thời gian': 'Đăng ngay',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const connectedProviders = new Set(['FACEBOOK', 'META']);
    const result = parseExcelOrCsvBuffer(buffer, 'EXCEL', connectedProviders);

    expect(result.success).toBe(true);
    expect(result.validRows).toBe(2);
    expect(result.warningRows).toBe(0);
    expect(result.invalidRows).toBe(0);

    expect(result.rows[0].warnings.length).toBe(0);
    expect(result.rows[1].warnings.length).toBe(0);
  });

  it('marks row invalid immediately when schedule time has an invalid format or is in the past', () => {
    const rows = [
      {
        'Tiêu đề': 'Bài viết lỗi ngày 1',
        'Nội dung': 'Thời gian không đúng cú pháp',
        'Nền tảng': 'FACEBOOK',
        'Thời gian': 'sai-dinh-dang-ngay',
      },
      {
        'Tiêu đề': 'Bài viết lỗi ngày 2',
        'Nội dung': 'Thời gian ở quá khứ',
        'Nền tảng': 'FACEBOOK',
        'Thời gian': '01/01/2020 09:00',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const connectedProviders = new Set(['FACEBOOK', 'META']);
    const result = parseExcelOrCsvBuffer(buffer, 'EXCEL', connectedProviders);

    expect(result.success).toBe(true);
    expect(result.validRows).toBe(0);
    expect(result.invalidRows).toBe(2);

    expect(result.rows[0].isValid).toBe(false);
    expect(result.rows[0].errors.some((e) => e.includes('Thời gian sai định dạng'))).toBe(true);

    expect(result.rows[1].isValid).toBe(false);
    expect(result.rows[1].errors.some((e) => e.includes('quá khứ'))).toBe(true);
  });

  it('marks row invalid immediately when platform is missing or unsupported', () => {
    const rows = [
      {
        'Tiêu đề': 'Bài viết thiếu platform',
        'Nội dung': 'Cột nền tảng để trống',
        'Nền tảng': '',
      },
      {
        'Tiêu đề': 'Bài viết sai platform',
        'Nội dung': 'Nền tảng không hỗ trợ',
        'Nền tảng': 'UNKNOWN_NETWORK_XYZ',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const connectedProviders = new Set(['FACEBOOK', 'META']);
    const result = parseExcelOrCsvBuffer(buffer, 'EXCEL', connectedProviders);

    expect(result.success).toBe(true);
    expect(result.validRows).toBe(0);
    expect(result.invalidRows).toBe(2);

    expect(result.rows[0].isValid).toBe(false);
    expect(result.rows[0].errors.some((e) => e.includes('Thiếu nền tảng'))).toBe(true);

    expect(result.rows[1].isValid).toBe(false);
    expect(result.rows[1].errors.some((e) => e.includes('không hợp lệ hoặc không được hỗ trợ'))).toBe(true);
  });

  it('reports all 3 records as invalid (Hợp lệ = 0, Không hợp lệ = 3) when records have missing required fields or invalid data', () => {
    const rows = [
      {
        'Tiêu đề': '', // Missing title
        'Nội dung': 'Bài viết 1 thiếu tiêu đề',
        'Nền tảng': 'FACEBOOK',
        'Thời gian': '',
      },
      {
        'Tiêu đề': 'Bài viết 2',
        'Nội dung': 'Bài viết 2 thiếu nền tảng',
        'Nền tảng': '', // Missing platform
        'Thời gian': '',
      },
      {
        'Tiêu đề': 'Bài viết 3',
        'Nội dung': 'Bài viết 3 sai thời gian',
        'Nền tảng': 'FACEBOOK',
        'Thời gian': 'gio-dang-khong-hop-le', // Invalid schedule time
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const connectedProviders = new Set(['FACEBOOK', 'META']);
    const result = parseExcelOrCsvBuffer(buffer, 'EXCEL', connectedProviders);

    expect(result.success).toBe(true);
    expect(result.totalRows).toBe(3);
    expect(result.validRows).toBe(0);
    expect(result.invalidRows).toBe(3);
    expect(result.warningRows).toBe(0);

    // Record 1: missing title
    expect(result.rows[0].isValid).toBe(false);
    expect(result.rows[0].errors.some((e) => e.includes('Thiếu tiêu đề'))).toBe(true);

    // Record 2: missing platform
    expect(result.rows[1].isValid).toBe(false);
    expect(result.rows[1].errors.some((e) => e.includes('Thiếu nền tảng'))).toBe(true);

    // Record 3: invalid time
    expect(result.rows[2].isValid).toBe(false);
    expect(result.rows[2].errors.some((e) => e.includes('Thời gian sai định dạng'))).toBe(true);
  });

  it('parses schedule date with formats "11:59 11/11", "11/11 11:59", and Date objects without error or warning', () => {
    // 1. Time first: "11:59 11/11"
    const res1 = parseScheduleDateTime('11:59 11/11');
    expect(res1.error).toBeUndefined();
    expect(res1.warning).toBeUndefined();
    expect(res1.iso).toBeDefined();
    expect(typeof res1.iso).toBe('string');
    const parsedDate1 = new Date(res1.iso!);
    expect(parsedDate1.getDate()).toBe(11);
    expect(parsedDate1.getMonth()).toBe(10); // November is month 10 (0-indexed)
    expect(parsedDate1.getHours()).toBe(11);
    expect(parsedDate1.getMinutes()).toBe(59);

    // 2. Date first: "11/11 11:59"
    const res2 = parseScheduleDateTime('11/11 11:59');
    expect(res2.error).toBeUndefined();
    expect(res2.warning).toBeUndefined();
    expect(res2.iso).toBeDefined();

    // 3. Date object (e.g. from XLSX cellDates: true)
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const res3 = parseScheduleDateTime(futureDate);
    expect(res3.error).toBeUndefined();
    expect(res3.warning).toBeUndefined();
    expect(res3.iso).toBe(futureDate.toISOString());

    // 4. Empty or now
    const res4 = parseScheduleDateTime('');
    expect(res4.iso).toBeNull();
    expect(res4.isNow).toBe(true);
    expect(res4.warning).toBeUndefined();
    expect(res4.error).toBeUndefined();
  });

  it('imports 3 Facebook records (record 1 with 11:59 11/11, records 2 and 3 with empty time) as 100% valid with 0 warnings', () => {
    const rows = [
      {
        'Tiêu đề bài viết': 'Top 3 bí quyết xây kênh TikTok 1',
        'Nội dung (Caption)': 'Kịch bản chi tiết 3 bước giữ chân người xem trong 3 giây đầu tiên. Áp dụng ngay để nhân 5...',
        'Nền tảng': 'FACEBOOK',
        'Thời gian': '11:59 11/11',
      },
      {
        'Tiêu đề bài viết': 'Chiến lược tối ưu kịch bản video',
        'Nội dung (Caption)': 'Review góc quay và bố cục món ăn chuẩn viral. Đầy đủ phân cảnh hook, thân bài và kêu...',
        'Nền tảng': 'FACEBOOK',
        'Thời gian': '',
      },
      {
        'Tiêu đề bài viết': 'Bí mật tăng tương tác tự nhiên k',
        'Nội dung (Caption)': 'Cách đặt câu hỏi kích thích thảo luận và tận dụng tính năng Spin biến thể để tránh trùng...',
        'Nền tảng': 'FACEBOOK',
        'Thời gian': '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const connectedProviders = new Set(['FACEBOOK', 'META']);
    const result = parseExcelOrCsvBuffer(buffer, 'EXCEL', connectedProviders);

    expect(result.success).toBe(true);
    expect(result.totalRows).toBe(3);
    expect(result.validRows).toBe(3);
    expect(result.warningRows).toBe(0); // Expected: 0 warnings!
    expect(result.invalidRows).toBe(0);

    // Record 1: Scheduled with 11:59 11/11 -> Valid, 0 warnings
    expect(result.rows[0].isValid).toBe(true);
    expect(result.rows[0].warnings).toEqual([]);
    expect(result.rows[0].errors).toEqual([]);
    expect(result.rows[0].scheduledAt).not.toBeNull();
    const d1 = new Date(result.rows[0].scheduledAt!);
    expect(d1.getDate()).toBe(11);
    expect(d1.getMonth()).toBe(10); // Nov
    expect(d1.getHours()).toBe(11);
    expect(d1.getMinutes()).toBe(59);

    // Record 2: Empty time -> Valid, 0 warnings, scheduledAt null (Publish Now)
    expect(result.rows[1].isValid).toBe(true);
    expect(result.rows[1].warnings).toEqual([]);
    expect(result.rows[1].errors).toEqual([]);
    expect(result.rows[1].scheduledAt).toBeNull();

    // Record 3: Empty time -> Valid, 0 warnings, scheduledAt null (Publish Now)
    expect(result.rows[2].isValid).toBe(true);
    expect(result.rows[2].warnings).toEqual([]);
    expect(result.rows[2].errors).toEqual([]);
    expect(result.rows[2].scheduledAt).toBeNull();
  });
});

