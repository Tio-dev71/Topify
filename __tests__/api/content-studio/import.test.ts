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

  it('parses an in-memory CSV buffer correctly', () => {
    const csvContent =
      'title,caption,platforms,scheduledAt\n' +
      'Tiêu đề test 1,Nội dung test 1,"TIKTOK,FACEBOOK",2026-11-05 09:00\n' +
      'Tiêu đề test 2,Nội dung test 2,INSTAGRAM,';

    const buffer = Buffer.from(csvContent, 'utf-8');
    const result = parseExcelOrCsvBuffer(buffer, 'CSV');

    expect(result.success).toBe(true);
    expect(result.totalRows).toBe(2);
    expect(result.validRows).toBe(2);
    expect(result.rows[0].title).toBe('Tiêu đề test 1');
    expect(result.rows[0].platforms).toContain('TIKTOK_VIDEO');
    expect(result.rows[1].title).toBe('Tiêu đề test 2');
    expect(result.rows[1].scheduledAt).toBeNull(); // Draft
  });
});
