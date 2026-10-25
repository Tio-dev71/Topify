import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  parseExcelOrCsvBuffer,
  generateSampleExcelTemplate,
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
});

