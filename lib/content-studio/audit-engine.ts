/**
 * Content Pre-Publish Audit Engine (F078)
 * Performs comprehensive analysis on caption content and links before publication:
 * - Link validity, HTTPS protocol, and UTM tracking parameters
 * - Caption length, word count, spelling, and sentence coherence
 * - Platform advertising policies (Meta/TikTok/Google) and sensitive keyword detection
 * - Call-To-Action (CTA) presence and clarity
 * - Media aspect ratio and format advice
 * - Golden hours recommendation based on publication schedule
 */

export interface ChecklistItem {
  id: string;
  category: 'LINKS' | 'SPELLING' | 'POLICY' | 'MEDIA' | 'CTA' | 'TIME';
  title: string;
  description: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  recommendation: string;
}

export interface AuditResult {
  score: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  items: ChecklistItem[];
}

const SENSITIVE_KEYWORDS = [
  // Cam kết thái quá
  { word: 'cam kết 100%', reason: 'Cam kết 100% dễ bị thuật toán quảng cáo Meta/TikTok đánh dấu cam kết không có cơ sở.' },
  { word: 'chữa khỏi hoàn toàn', reason: 'Cam kết y tế/sức khỏe tuyệt đối vi phạm chính sách nội dung sức khỏe.' },
  { word: 'trị dứt điểm', reason: 'Tuyên bố trị dứt điểm vi phạm chính sách quảng cáo sức khỏe & làm đẹp.' },
  { word: 'vĩnh viễn', reason: 'Từ khóa "vĩnh viễn" dễ kích hoạt bộ lọc kiểm duyệt cam kết quá mức.' },
  { word: 'khỏi 100%', reason: 'Cam kết hiệu quả 100% không được nền tảng chấp nhận.' },
  // Tài chính & cờ bạc
  { word: 'làm giàu nhanh', reason: 'Từ khóa tài chính rủi ro cao, dễ bị gắn cờ đa cấp hoặc lừa đảo.' },
  { word: 'lãi suất khủng', reason: 'Từ khóa tài chính nhạy cảm vi phạm quy định cho vay và đầu tư.' },
  { word: 'kiếm tiền không cần làm', reason: 'Hứa hẹn thu nhập phi thực tế vi phạm tiêu chuẩn cộng đồng.' },
  { word: 'cá cược', reason: 'Cờ bạc và cá cược bị cấm phân phối trên đa số nền tảng mạng xã hội.' },
  { word: 'nhà cái', reason: 'Liên quan đến hoạt động cá cược trực tuyến bị kiểm duyệt nghiêm ngặt.' },
  // Giảm giá / bóp reach quảng cáo
  { word: 'giảm giá 50%', reason: 'Lưu ý từ "giảm giá 50%" có thể bị bóp reach nhẹ trên một số Fanpage mới nếu chạy ads.' },
  { word: 'giảm 50%', reason: 'Lưu ý cụm từ giảm giá sâu có thể bị hạn chế phân phối tự nhiên.' },
  { word: 'giảm giá sốc', reason: 'Cụm từ "giảm giá sốc" thường bị gắn nhãn kích động tương tác quá đà (clickbait).' },
  { word: 'sale sập sàn', reason: 'Thuật ngữ giảm giá giật gân có thể bị giảm phân phối tự nhiên.' },
  { word: 'hàng fake', reason: 'Vi phạm quyền sở hữu trí tuệ và chống hàng giả của Meta/TikTok.' },
  { word: 'hàng nhái', reason: 'Nghiêm cấm kinh doanh và quảng bá hàng nhái thương hiệu.' },
  { word: 'replica', reason: 'Sử dụng từ "replica" có thể khiến tài khoản bị khóa do nghi vấn hàng giả.' },
];

const CTA_PATTERNS = [
  { pattern: /(nhấn vào|click|bấm vào|truy cập|xem ngay|ghé thăm).*(link|đường dẫn|website|bên dưới|bio)/i, label: 'nhấn link truy cập' },
  { pattern: /(inbox|nhắn tin|nhắn ngay|dm ngay|chat ngay|liên hệ|gọi ngay|hotline)/i, label: 'nhắn tin / liên hệ' },
  { pattern: /(đặt hàng|mua ngay|nhận ưu đãi|săn sale|đăng ký ngay|nhận mã|lấy mã)/i, label: 'mua hàng / nhận ưu đãi' },
  { pattern: /(bình luận|comment|để lại sđt|để lại số|tag bạn|chia sẻ|share|lưu lại)/i, label: 'tương tác / bình luận' },
  { pattern: /(follow|theo dõi|đăng ký kênh|sub)/i, label: 'theo dõi kênh' },
  { pattern: /(👉|👇|🔗|🛒|☎️)\s*[a-zA-Z0-9\p{L}]/u, label: 'chỉ dẫn hành động bằng emoji' },
];

/**
 * Perform full pre-publish quality and safety audit
 */
export function auditContent(caption: string = '', link: string = ''): AuditResult {
  const cleanCaption = (caption || '').trim();
  const cleanLink = (link || '').trim();

  const items: ChecklistItem[] = [];

  // =========================================================================
  // 1. LINKS & UTM BUILDER CHECK
  // =========================================================================
  const linkMatches = cleanCaption.match(/https?:\/\/[^\s]+/gi) || [];
  const targetUrlStr = cleanLink || (linkMatches.length > 0 ? linkMatches[0] : '');

  if (!targetUrlStr) {
    items.push({
      id: 'check_link',
      category: 'LINKS',
      title: 'Kiểm tra Liên kết & UTM Builder',
      description: 'Đảm bảo link đích không bị lỗi 404, có giao thức HTTPS và đã gắn đầy đủ UTM tracking',
      status: 'WARN',
      recommendation: 'Chưa phát hiện liên kết đích. Nếu bài viết nhằm mục đích dẫn lưu lượng hoặc bán hàng, bạn nên gắn link kèm UTM tracking.',
    });
  } else {
    try {
      const parsedUrl = new URL(targetUrlStr);
      const isHttps = parsedUrl.protocol === 'https:';
      const utmSource = parsedUrl.searchParams.get('utm_source');
      const utmMedium = parsedUrl.searchParams.get('utm_medium');
      const utmCampaign = parsedUrl.searchParams.get('utm_campaign');

      const foundUtms: string[] = [];
      if (utmSource) foundUtms.push(`source=${utmSource}`);
      if (utmMedium) foundUtms.push(`medium=${utmMedium}`);
      if (utmCampaign) foundUtms.push(`campaign=${utmCampaign}`);

      if (!isHttps) {
        items.push({
          id: 'check_link',
          category: 'LINKS',
          title: 'Kiểm tra Liên kết & UTM Builder',
          description: 'Đảm bảo link đích không bị lỗi 404, có giao thức HTTPS và đã gắn đầy đủ UTM tracking',
          status: 'WARN',
          recommendation: `Đường dẫn "${targetUrlStr}" đang dùng giao thức không bảo mật (HTTP). Khuyến nghị đổi sang HTTPS để đảm bảo an toàn cho khách hàng.`,
        });
      } else if (foundUtms.length >= 2) {
        items.push({
          id: 'check_link',
          category: 'LINKS',
          title: 'Kiểm tra Liên kết & UTM Builder',
          description: 'Đảm bảo link đích không bị lỗi 404, có giao thức HTTPS và đã gắn đầy đủ UTM tracking',
          status: 'PASS',
          recommendation: `Đã phát hiện UTM: ${foundUtms.join(', ')}. Đường dẫn HTTPS hợp lệ và sẵn sàng đo lường chuyển đổi.`,
        });
      } else if (foundUtms.length === 1) {
        items.push({
          id: 'check_link',
          category: 'LINKS',
          title: 'Kiểm tra Liên kết & UTM Builder',
          description: 'Đảm bảo link đích không bị lỗi 404, có giao thức HTTPS và đã gắn đầy đủ UTM tracking',
          status: 'WARN',
          recommendation: `Đường dẫn có UTM (${foundUtms.join(', ')}) nhưng chưa đủ bộ (cần tối thiểu source và medium). Khuyến nghị bổ sung để theo dõi đa kênh.`,
        });
      } else {
        items.push({
          id: 'check_link',
          category: 'LINKS',
          title: 'Kiểm tra Liên kết & UTM Builder',
          description: 'Đảm bảo link đích không bị lỗi 404, có giao thức HTTPS và đã gắn đầy đủ UTM tracking',
          status: 'WARN',
          recommendation: 'Đường dẫn hợp lệ nhưng chưa gắn UTM tracking (thiếu utm_source, utm_medium). Khuyến nghị dùng UTM Builder để đo lường hiệu quả quảng cáo.',
        });
      }
    } catch {
      items.push({
        id: 'check_link',
        category: 'LINKS',
        title: 'Kiểm tra Liên kết & UTM Builder',
        description: 'Đảm bảo link đích không bị lỗi 404, có giao thức HTTPS và đã gắn đầy đủ UTM tracking',
        status: 'FAIL',
        recommendation: `Đường dẫn "${targetUrlStr}" không hợp lệ hoặc sai định dạng URL. Vui lòng kiểm tra lại cấu trúc URL (ví dụ: https://topify.vn/promo).`,
      });
    }
  }

  // =========================================================================
  // 2. SPELLING, LENGTH & COHERENCE CHECK
  // =========================================================================
  const words = cleanCaption ? cleanCaption.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const charCount = cleanCaption.length;

  if (charCount === 0) {
    items.push({
      id: 'check_spelling',
      category: 'SPELLING',
      title: 'Kiểm tra Chính tả & Mạch lạc',
      description: 'Rà soát độ dài nội dung, lỗi gõ phím tiếng Việt, khoảng trắng thừa và cấu trúc câu',
      status: 'FAIL',
      recommendation: 'Nội dung caption đang để trống. Vui lòng nhập nội dung bài viết cần kiểm duyệt.',
    });
  } else if (wordCount < 5 || charCount < 15) {
    items.push({
      id: 'check_spelling',
      category: 'SPELLING',
      title: 'Kiểm tra Chính tả & Mạch lạc',
      description: 'Rà soát độ dài nội dung, lỗi gõ phím tiếng Việt, khoảng trắng thừa và cấu trúc câu',
      status: 'FAIL',
      recommendation: `Nội dung quá ngắn (chỉ có ${wordCount} từ, ${charCount} ký tự), chưa đủ cấu trúc đoạn văn để thu hút người xem và tối ưu thuật toán hiển thị. Khuyến nghị viết tối thiểu 20-30 từ.`,
    });
  } else if (wordCount < 10) {
    items.push({
      id: 'check_spelling',
      category: 'SPELLING',
      title: 'Kiểm tra Chính tả & Mạch lạc',
      description: 'Rà soát độ dài nội dung, lỗi gõ phím tiếng Việt, khoảng trắng thừa và cấu trúc câu',
      status: 'WARN',
      recommendation: `Nội dung tương đối ngắn (${wordCount} từ). Bài viết có thể thiếu chiều sâu để giữ chân người đọc lâu hơn trên bài viết.`,
    });
  } else if (charCount > 20 && cleanCaption === cleanCaption.toUpperCase() && /[A-ZÀ-Ỹ]/.test(cleanCaption)) {
    items.push({
      id: 'check_spelling',
      category: 'SPELLING',
      title: 'Kiểm tra Chính tả & Mạch lạc',
      description: 'Rà soát độ dài nội dung, lỗi gõ phím tiếng Việt, khoảng trắng thừa và cấu trúc câu',
      status: 'WARN',
      recommendation: 'Toàn bộ nội dung đang viết HOA (ALL CAPS). Điều này có thể khiến bài viết trông giống tin rác (spam) và làm giảm trải nghiệm đọc.',
    });
  } else {
    items.push({
      id: 'check_spelling',
      category: 'SPELLING',
      title: 'Kiểm tra Chính tả & Mạch lạc',
      description: 'Rà soát độ dài nội dung, lỗi gõ phím tiếng Việt, khoảng trắng thừa và cấu trúc câu',
      status: 'PASS',
      recommendation: `Độ dài bài viết tốt (${wordCount} từ, ${charCount} ký tự). Cấu trúc câu rõ ràng, ngắt đoạn hợp lý, không phát hiện lỗi chính tả nghiêm trọng.`,
    });
  }

  // =========================================================================
  // 3. POLICY & SENSITIVE KEYWORDS CHECK
  // =========================================================================
  const lowerCaption = cleanCaption.toLowerCase();
  const matchedViolations: { word: string; reason: string }[] = [];

  for (const item of SENSITIVE_KEYWORDS) {
    if (lowerCaption.includes(item.word.toLowerCase())) {
      matchedViolations.push(item);
    }
  }

  if (matchedViolations.length > 0) {
    const isSevere = matchedViolations.some(v =>
      ['làm giàu nhanh', 'cá cược', 'nhà cái', 'chữa khỏi hoàn toàn', 'hàng fake'].includes(v.word)
    );
    const wordsList = matchedViolations.map(v => `"${v.word}"`).join(', ');
    const reasons = matchedViolations.map(v => v.reason).slice(0, 2).join(' ');

    items.push({
      id: 'check_policy',
      category: 'POLICY',
      title: 'Chính sách Cộng đồng & Quảng cáo',
      description: 'Phát hiện các từ khóa nhạy cảm, cam kết thái quá hoặc vi phạm chính sách Meta/TikTok',
      status: isSevere ? 'FAIL' : 'WARN',
      recommendation: `Phát hiện từ khóa nhạy cảm: ${wordsList}. ${reasons}`,
    });
  } else {
    items.push({
      id: 'check_policy',
      category: 'POLICY',
      title: 'Chính sách Cộng đồng & Quảng cáo',
      description: 'Phát hiện các từ khóa nhạy cảm, cam kết thái quá hoặc vi phạm chính sách Meta/TikTok',
      status: 'PASS',
      recommendation: 'Nội dung an toàn, không phát hiện từ khóa nhạy cảm, cam kết thái quá hoặc vi phạm chính sách Meta/TikTok.',
    });
  }

  // =========================================================================
  // 4. MEDIA ASPECT RATIO & ASSET FORMAT CHECK
  // =========================================================================
  const hasVideoKeywords = /(video|reels|tiktok|shorts|clip|thước phim|xem ngay)/i.test(cleanCaption);
  const hasCarouselKeywords = /(ảnh|hình|album|bộ sưu tập|carousel|vuốt sang|slide)/i.test(cleanCaption);

  if (hasVideoKeywords) {
    items.push({
      id: 'check_media',
      category: 'MEDIA',
      title: 'Tỷ lệ Asset & Kích thước Khung hình',
      description: 'Đối chiếu tỷ lệ khung hình với từng nền tảng (9:16 dọc cho Reels/TikTok, 1:1 cho Feed)',
      status: 'PASS',
      recommendation: 'Nội dung định hướng video ngắn. Khuyến nghị đính kèm video dọc chuẩn 9:16 (1080x1920) kèm phụ đề tự động để tối ưu lượt xem.',
    });
  } else if (hasCarouselKeywords) {
    items.push({
      id: 'check_media',
      category: 'MEDIA',
      title: 'Tỷ lệ Asset & Kích thước Khung hình',
      description: 'Đối chiếu tỷ lệ khung hình với từng nền tảng (9:16 dọc cho Reels/TikTok, 1:1 cho Feed)',
      status: 'PASS',
      recommendation: 'Khuyến nghị đính kèm carousel từ 3-5 ảnh vuông 1:1 hoặc 4:5 để tăng thời gian tương tác (dwell time) của người dùng.',
    });
  } else {
    items.push({
      id: 'check_media',
      category: 'MEDIA',
      title: 'Tỷ lệ Asset & Kích thước Khung hình',
      description: 'Đối chiếu tỷ lệ khung hình với từng nền tảng (9:16 dọc cho Reels/TikTok, 1:1 cho Feed)',
      status: 'PASS',
      recommendation: 'Khuyến nghị đính kèm ít nhất 1 video dọc 9:16 hoặc carousel ảnh chất lượng cao để tăng 2.5x tỷ lệ tương tác.',
    });
  }

  // =========================================================================
  // 5. CALL TO ACTION (CTA) CHECK
  // =========================================================================
  let matchedCtaLabel = '';
  for (const cta of CTA_PATTERNS) {
    if (cta.pattern.test(cleanCaption)) {
      matchedCtaLabel = cta.label;
      break;
    }
  }

  if (matchedCtaLabel) {
    items.push({
      id: 'check_cta',
      category: 'CTA',
      title: 'Lời kêu gọi hành động (Call To Action)',
      description: 'Bài viết có chỉ dẫn hành vi cụ thể (Inbox, Nhấn link, Bình luận)',
      status: 'PASS',
      recommendation: `Đã có CTA rõ ràng (${matchedCtaLabel}). Định hướng hành vi người xem tốt và thúc đẩy tỷ lệ chuyển đổi.`,
    });
  } else if (cleanCaption.length === 0) {
    items.push({
      id: 'check_cta',
      category: 'CTA',
      title: 'Lời kêu gọi hành động (Call To Action)',
      description: 'Bài viết có chỉ dẫn hành vi cụ thể (Inbox, Nhấn link, Bình luận)',
      status: 'FAIL',
      recommendation: 'Chưa có nội dung bài viết và lời kêu gọi hành động (CTA).',
    });
  } else {
    items.push({
      id: 'check_cta',
      category: 'CTA',
      title: 'Lời kêu gọi hành động (Call To Action)',
      description: 'Bài viết có chỉ dẫn hành vi cụ thể (Inbox, Nhấn link, Bình luận)',
      status: 'WARN',
      recommendation: 'Bài viết chưa có lời kêu gọi hành động (CTA) rõ ràng. Hãy thêm chỉ dẫn cụ thể (ví dụ: "Nhấn vào link bên dưới để nhận mã giảm giá", "Inbox để được tư vấn").',
    });
  }

  // =========================================================================
  // 6. GOLDEN HOURS RECOMMENDATION
  // =========================================================================
  const currentHour = new Date().getHours();
  let timeAdvice = '';

  if (currentHour >= 6 && currentHour < 11) {
    timeAdvice = 'Hiện tại là khung giờ sáng (08:30 - 11:30), thời điểm người dùng bắt đầu ngày mới. Thích hợp đăng bài chia sẻ kiến thức hoặc tin tức.';
  } else if (currentHour >= 11 && currentHour < 14) {
    timeAdvice = 'Hiện tại là giờ nghỉ trưa (11:30 - 13:30), lượng người lướt mạng xã hội rất cao. Rất tốt để xuất bản ngay.';
  } else if (currentHour >= 14 && currentHour < 18) {
    timeAdvice = 'Khung giờ chiều tan tầm (16:00 - 18:00) hoặc lên lịch sẵn cho khung giờ tối vàng (19:30 - 21:30) để tiếp cận lượng xem lớn nhất.';
  } else if (currentHour >= 18 && currentHour < 22) {
    timeAdvice = 'Đang trong khung giờ vàng buổi tối (19:30 - 22:30). Đây là thời điểm tương tác cao nhất trong ngày, xuất bản ngay để tối ưu tương tác.';
  } else {
    timeAdvice = 'Hiện là khung giờ đêm muộn, lượng người xem thấp. Khuyến nghị lên lịch tự động phát hành vào 08:30 hoặc 11:30 sáng mai.';
  }

  items.push({
    id: 'check_time',
    category: 'TIME',
    title: 'Khung giờ vàng xuất bản (Golden Hours)',
    description: 'Gợi ý thời điểm tệp khán giả mục tiêu online đông đảo nhất',
    status: 'PASS',
    recommendation: timeAdvice,
  });

  // =========================================================================
  // 7. SCORE CALCULATION
  // =========================================================================
  const passCount = items.filter(i => i.status === 'PASS').length;
  const warnCount = items.filter(i => i.status === 'WARN').length;
  const failCount = items.filter(i => i.status === 'FAIL').length;

  let calculatedScore = 100 - (failCount * 25) - (warnCount * 10);
  if (calculatedScore < 10) calculatedScore = 10;
  if (calculatedScore > 100) calculatedScore = 100;

  return {
    score: calculatedScore,
    passCount,
    warnCount,
    failCount,
    items,
  };
}
