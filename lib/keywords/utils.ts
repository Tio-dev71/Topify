/**
 * Keyword & Mention processing utilities: deduplication, normalization, and Vietnamese sentiment analysis.
 */

export function cleanCoreTitle(t: string | null | undefined): string {
  if (!t) return '';
  return t
    .replace(/^\[(video|hình ảnh|ảnh|nóng|trực tiếp|bản tin|phóng sự)\]\s*/i, '')
    .replace(/^(vụ án|vụ việc|vụ)\s+[^:：\-–—]+[:：\-–—]\s*/i, '')
    .replace(/^(nóng|tin nóng)\s*(24h|hôm nay)?(\s*ngày\s*\d+[\/\-]\d+)?[:：\-–—]\s*/i, '')
    .replace(/^thời sự\s*(sáng|trưa|tối|ngày)?\s*(\d+[\/\-]\d+)?[:：\-–—]\s*/i, '')
    .replace(/^ngày\s*(thứ\s*\w+|\d+)\s*(xét xử|phiên tòa|hầu tòa)[^:：\-–—]*[:：\-–—]\s*/i, '')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\"\'“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const cleanParams = new URLSearchParams();
    for (const [key, val] of parsed.searchParams.entries()) {
      if (!key.startsWith('utm_') && key !== 'ref' && key !== 'source' && key !== 'fbclid' && key !== 'gidzl') {
        cleanParams.append(key, val);
      }
    }
    parsed.search = cleanParams.toString();
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return (url || '').split('?')[0].replace(/\/$/, '').trim();
  }
}

export const VIETNAMESE_POSITIVE_KEYWORDS = [
  'tốt', 'tăng', 'thành công', 'đột phá', 'vượt', 'lợi nhuận', 'phát triển',
  'tăng trưởng', 'đầu tư', 'thắng lớn', 'vinh danh', 'giải thưởng', 'khen ngợi',
  'xuất sắc', 'hợp tác', 'cam kết', 'triển vọng', 'dẫn đầu', 'tiên phong',
  'hiệu quả', 'bứt phá', 'khởi sắc', 'ủng hộ', 'từ thiện', 'đóng góp',
  'hồi phục', 'sôi động', 'tin vui', 'tích cực', 'kỷ lục', 'yêu thích',
  'gọi vốn', 'khắc phục hậu quả', 'giảm nhẹ', 'xin cứu xét', 'khắc phục toàn bộ',
  'được khen', 'đạt chuẩn', 'mở rộng', 'tiềm năng', 'uy tín', 'doanh thu cao',
  'bội thu', 'lãi ròng', 'lạc quan', 'thành tựu', 'triệu usd', 'tỷ đồng'
];

export const VIETNAMESE_NEGATIVE_KEYWORDS = [
  'bị cáo', 'đi tù', 'ở tù', 'rửa tiền', 'sai phạm', 'vi phạm', 'tội danh',
  'khởi tố', 'bắt giam', 'tạm giam', 'hầu tòa', 'xét xử', 'cáo trạng',
  'thủ đoạn', 'lừa đảo', 'chiếm đoạt', 'thua lỗ', 'phá sản', 'cảnh báo',
  'khiếu nại', 'tố cáo', 'bê bối', 'scandal', 'đình chỉ', 'thu hồi',
  'hủy bỏ', 'tranh cãi', 'sa sút', 'phạt', 'án phạt', 'án tù', 'giam giữ',
  'thiệt hại', 'bất ổn', 'khủng hoảng', 'suy thoái', 'tiêu cực', 'đổ vỡ',
  'nguy cơ', 'tẩy chay', 'cấm thi đấu', 'gian lận', 'trốn thuế', 'đối phó công an',
  'bị hại', 'khách hàng xấu', 'làm khó công an', 'nhận tội', 'có tội',
  'chết', 'tai nạn', 'cháy nổ', 'nạn nhân', 'thao túng', 'bắt bớ', 'kết án',
  'tuyên phạt', 'buộc tội', 'tội phạm', 'xâm phạm', 'suy tàn'
];

export function analyzeVietnameseSentiment(title: string | null | undefined, message: string | null | undefined = ''): 'positive' | 'negative' | 'neutral' {
  const text = `${title || ''} ${message || ''}`.toLowerCase();
  
  let posHits = 0;
  for (const p of VIETNAMESE_POSITIVE_KEYWORDS) {
    if (text.includes(p)) posHits++;
  }
  
  let negHits = 0;
  for (const n of VIETNAMESE_NEGATIVE_KEYWORDS) {
    if (text.includes(n)) negHits++;
  }
  
  if (negHits > posHits && negHits > 0) return 'negative';
  if (posHits > negHits && posHits > 0) return 'positive';
  return 'neutral';
}

export function deduplicateMentions<T extends { title?: string | null; sourceUrl?: string | null }>(items: T[]): T[] {
  const seenTitles = new Set<string>();
  const seenUrls = new Set<string>();
  const results: T[] = [];

  for (const item of items) {
    if (!item) continue;
    const title = item.title || '';
    const cleanTitle = cleanCoreTitle(title);
    const cleanUrl = normalizeUrl(item.sourceUrl);

    if (cleanTitle && seenTitles.has(cleanTitle)) {
      continue;
    }
    if (cleanUrl && seenUrls.has(cleanUrl)) {
      continue;
    }

    if (cleanTitle) seenTitles.add(cleanTitle);
    if (cleanUrl) seenUrls.add(cleanUrl);
    results.push(item);
  }

  return results;
}

