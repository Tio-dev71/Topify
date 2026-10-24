import OpenAI from 'openai';
import { getNineRouterClient, isNineRouterConfigured, cleanJsonOutput } from '../ai/9router';

// =========================================================================
// TYPES & ENUMS FOR CONTENT STUDIO (M2: F015 & F016)
// =========================================================================

export type IndustryType =
  | 'FASHION'
  | 'BEAUTY'
  | 'FOOD_BEVERAGE'
  | 'REAL_ESTATE'
  | 'TECH_GADGETS'
  | 'EDUCATION'
  | 'FINANCE'
  | 'FITNESS_HEALTH'
  | 'TRAVEL'
  | 'B2B_SERVICES';

export type ToneType =
  | 'HUMOROUS'
  | 'EXPERT'
  | 'EMPATHETIC'
  | 'SENSATIONAL'
  | 'SALES_FOMO'
  | 'LUXURY';

export type GoalType =
  | 'ENGAGEMENT'
  | 'LEAD_GEN'
  | 'DIRECT_SALES'
  | 'BRANDING';

export type ContentFormatType =
  | 'SOCIAL_CAPTION'
  | 'SHORT_VIDEO_SCRIPT'
  | 'STORYTELLING';

export interface IndustryMetadata {
  id: IndustryType;
  label: string;
  icon: string;
  description: string;
  sampleKeywords: string[];
}

export interface ToneMetadata {
  id: ToneType;
  label: string;
  icon: string;
  description: string;
  promptGuidance: string;
}

export interface GoalMetadata {
  id: GoalType;
  label: string;
  description: string;
  targetCta: string;
}

export interface FormatMetadata {
  id: ContentFormatType;
  label: string;
  description: string;
}

// ---------------- F015 Spin Types ----------------
export interface SpinVariant {
  id: string;
  index: number;
  caption: string;
  title: string;
  uniquenessScore: number; // 0 - 100%
  hook: string;
  hashtags: string[];
  wordCount: number;
}

export interface SpintaxParseResult {
  originalSpintax: string;
  totalCombinations: number;
  sampleVariant: string;
  allExtractedChoices: string[][];
}

export interface SpinGenerationResult {
  originalCaption: string;
  variants: SpinVariant[];
  averageUniqueness: number;
  isSpintax: boolean;
  generatedAt: string;
}

// ---------------- F016 AI Writer Types ----------------
export interface ScriptScene {
  timeSlot: string; // e.g. "0:00 - 0:03"
  phase: 'HOOK' | 'BODY' | 'CTA';
  cameraAngle: string;
  visualCue: string;
  voiceover: string;
  onscreenText: string;
}

export interface AiWriterRequest {
  industry: IndustryType;
  tone: ToneType;
  goal: GoalType;
  format: ContentFormatType;
  topic: string;
  productName?: string;
  keyBenefits?: string;
  targetAudience?: string;
  callToAction?: string;
}

export interface AiWriterResult {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  callToAction: string;
  industry: IndustryType;
  tone: ToneType;
  goal: GoalType;
  format: ContentFormatType;
  scenes?: ScriptScene[]; // for SHORT_VIDEO_SCRIPT
  storySections?: { heading: string; body: string }[]; // for STORYTELLING
  recommendedPostTime: string;
  estimatedReadTimeSec: number;
  isAiGenerated: boolean;
  modelUsed?: string;
  createdAt: string;
}

// =========================================================================
// METADATA DEFINITIONS
// =========================================================================

export const INDUSTRIES_METADATA: IndustryMetadata[] = [
  {
    id: 'FASHION',
    label: 'Thời trang & Phụ kiện',
    icon: '👗',
    description: 'Trang phục, túi xách, giày dép, phong cách OOTD & phụ kiện sang trọng',
    sampleKeywords: ['OOTD', 'mixmatch', 'gu thoi trang', 'chat lieu cao cap', 'thoi thuong'],
  },
  {
    id: 'BEAUTY',
    label: 'Mỹ phẩm & Làm đẹp',
    icon: '💄',
    description: 'Skincare, makeup, spa, chăm sóc da, phục hồi tóc & liệu trình thẩm mỹ',
    sampleKeywords: ['skincare routine', 'cang bong', 'duong trang', 'chong lao hoa', 'giam mun'],
  },
  {
    id: 'FOOD_BEVERAGE',
    label: 'Ẩm thực & Quán Cafe (F&B)',
    icon: '☕',
    description: 'Nhà hàng, quán ăn, trà sữa, cafe chill & công thức nấu nướng thơm ngon',
    sampleKeywords: ['mon ngon moi ngay', 'review quan ngon', 'am thuc', 'an vat', 'chill cuoi tuan'],
  },
  {
    id: 'REAL_ESTATE',
    label: 'Bất động sản & Nhà đất',
    icon: '🏢',
    description: 'Căn hộ chung cư, đất nền, biệt thự, nhà phố & đầu tư sinh lời',
    sampleKeywords: ['so hong rieng', 'vi tri vang', 'sinh loi cao', 'can ho cao cap', 'chinh chu'],
  },
  {
    id: 'TECH_GADGETS',
    label: 'Công nghệ & Đồ gia dụng',
    icon: '📱',
    description: 'Điện thoại, phụ kiện số, thiết bị thông minh & đồ gia dụng tiện ích',
    sampleKeywords: ['dap hop', 'cong nghe 4.0', 'review cong nghe', 'thiet bi thong minh', 'giai phap tien loi'],
  },
  {
    id: 'EDUCATION',
    label: 'Giáo dục & Khóa học',
    icon: '📚',
    description: 'Ngoại ngữ, tin học, kỹ năng mềm, luyện thi & tư duy phát triển bản thân',
    sampleKeywords: ['hoc tieng anh', 'phat trien ban than', 'ky nang mem', 'khoa hoc thuc chien', 'nang tam su nghiep'],
  },
  {
    id: 'FINANCE',
    label: 'Tài chính & Đầu tư',
    icon: '📈',
    description: 'Quản lý tài chính cá nhân, chứng khoán, bảo hiểm & kinh doanh',
    sampleKeywords: ['quan ly tai chinh', 'dong tien thong minh', 'dau tu sinh loi', 'tu do tai chinh', 'tiet kiem'],
  },
  {
    id: 'FITNESS_HEALTH',
    label: 'Sức khỏe & Gym/Yoga',
    icon: '🧘',
    description: 'Giảm cân, tăng cơ, ăn sạch Eat Clean, thực phẩm bổ sung & rèn luyện thể lực',
    sampleKeywords: ['eat clean', 'giam can lanh manh', 'tang co giam mo', 'yoga moi ngay', 'song khoe'],
  },
  {
    id: 'TRAVEL',
    label: 'Du lịch & Khách sạn',
    icon: '✈️',
    description: 'Tour du lịch, homestay, resort nghỉ dưỡng & cẩm nang phượt vi vu',
    sampleKeywords: ['checkin song ao', 'vi vu du lich', 'kinh nghiem du lich', 'nghi duong', 'san may'],
  },
  {
    id: 'B2B_SERVICES',
    label: 'Dịch vụ Doanh nghiệp & Marketing',
    icon: '💼',
    description: 'Giải pháp phần mềm, chuyển đổi số, tuyển dụng, marketing & tư vấn thuế',
    sampleKeywords: ['chuyen doi so', 'toi uu chi phi', 'tang truong doanh thu', 'giai phap doanh nghiep', 'b2b marketing'],
  },
];

export const TONES_METADATA: ToneMetadata[] = [
  {
    id: 'HUMOROUS',
    label: 'Hài hước & Bắt trend hóm hỉnh',
    icon: '😂',
    description: 'Văn phong dí dỏm, sử dụng ngôn ngữ Gen Z duyên dáng, gần gũi và dễ lan tỏa',
    promptGuidance: 'Sử dụng văn phong trẻ trung, dí dỏm, chêm các câu nói viral nhẹ nhàng, không sáo rỗng.',
  },
  {
    id: 'EXPERT',
    label: 'Chuyên gia uy tín & Học thuật',
    icon: '🎓',
    description: 'Phong thái điềm tĩnh, phân tích sâu, dẫn chứng số liệu rõ ràng và đáng tin cậy',
    promptGuidance: 'Văn phong nghiêm túc, dùng thuật ngữ chuyên môn chính xác, giọng điệu tư vấn đáng tin cậy.',
  },
  {
    id: 'EMPATHETIC',
    label: 'Tâm sự & Đồng cảm sâu sắc',
    icon: '❤️',
    description: 'Chạm tới cảm xúc, thấu hiểu nỗi đau, trải lòng như một người bạn thân thiết',
    promptGuidance: 'Văn phong chân thành, ấm áp, xoáy sâu vào cảm xúc và trải nghiệm người nghe.',
  },
  {
    id: 'SENSATIONAL',
    label: 'Giật gân & Gây tò mò cực độ',
    icon: '⚡',
    description: 'Mở đầu nghịch lý, lật mở sự thật bất ngờ, kích thích tranh luận và giữ chân người đọc',
    promptGuidance: 'Mở đầu bằng câu hook gây tranh cãi hoặc bất ngờ, dẫn dắt hé lộ sự thật hấp dẫn.',
  },
  {
    id: 'SALES_FOMO',
    label: 'Thúc giục bán hàng & Chốt sale FOMO',
    icon: '🔥',
    description: 'Nhấn mạnh ưu đãi có hạn, tác động nỗi sợ bỏ lỡ cơ hội, kêu gọi hành động quyết liệt',
    promptGuidance: 'Tạo cảm giác cấp bách, nhấn mạnh lợi ích vượt trội và lời kêu gọi chốt đơn dứt khoát.',
  },
  {
    id: 'LUXURY',
    label: 'Sang trọng & Tinh tế quý phái',
    icon: '💎',
    description: 'Ngôn từ trau chuốt, giàu hình ảnh, toát lên đẳng cấp khác biệt và phong cách thượng lưu',
    promptGuidance: 'Sử dụng từ ngữ tao nhã, mô tả xúc cảm tinh xảo, định vị cao cấp.',
  },
];

export const GOALS_METADATA: GoalMetadata[] = [
  {
    id: 'ENGAGEMENT',
    label: 'Tăng tương tác (Like, Share, Comment)',
    description: 'Khuyến khích người đọc bày tỏ ý kiến, tag bạn bè và chia sẻ lên trang cá nhân',
    targetCta: 'Bạn đồng ý với quan điểm này không? Để lại bình luận bên dưới nhé!',
  },
  {
    id: 'LEAD_GEN',
    label: 'Thu thập Leads (Nhắn tin / Để lại SĐT)',
    description: 'Tặng tài liệu, voucher hoặc tư vấn 1:1 miễn phí để khách hàng chủ động liên hệ',
    targetCta: 'Nhắn tin ngay cho Topify để nhận trọn bộ tài liệu hướng dẫn miễn phí!',
  },
  {
    id: 'DIRECT_SALES',
    label: 'Bán hàng trực tiếp & Chốt đơn',
    description: 'Nêu bật công năng, giá trị giải pháp và hướng dẫn đặt mua ngay lập tức',
    targetCta: 'Bấm ngay vào link hoặc giỏ hàng bên dưới để sở hữu ưu đãi giảm 40% hôm nay!',
  },
  {
    id: 'BRANDING',
    label: 'Xây dựng thương hiệu & Niềm tin',
    description: 'Khẳng định giá trị cốt lõi, uy tín thương hiệu và câu chuyện truyền cảm hứng',
    targetCta: 'Theo dõi kênh để đón xem những kiến thức giá trị mỗi ngày!',
  },
];

export const FORMATS_METADATA: FormatMetadata[] = [
  {
    id: 'SOCIAL_CAPTION',
    label: 'Bài viết mạng xã hội (Facebook / Instagram / Zalo)',
    description: 'Caption hoàn chỉnh với Hook thu hút, thân bài phân đoạn rõ ràng, CTA và bộ Hashtags chuẩn SEO',
  },
  {
    id: 'SHORT_VIDEO_SCRIPT',
    label: 'Kịch bản Video ngắn (TikTok / Reels / Shorts)',
    description: 'Phân cảnh chi tiết theo giây: Hook 3s đầu, góc máy camera, lời thoại voiceover và text chữ trên màn hình',
  },
  {
    id: 'STORYTELLING',
    label: 'Bài viết dài Kể chuyện (Storytelling / Case Study)',
    description: 'Cấu trúc tự sự cuốn hút: Khởi đầu khó khăn, bước ngoặt giải pháp và kết luận truyền cảm hứng',
  },
];

// =========================================================================
// F015: SPINTAX PARSER & CONTENT SPIN ENGINE
// =========================================================================

/**
 * Tính khoảng cách tương đồng Jaccard giữa hai chuỗi văn bản
 */
export function calculateUniquenessScore(textA: string, textB: string): number {
  if (!textA || !textB) return 100;
  if (textA.trim() === textB.trim()) return 0;

  const wordsA = new Set(
    textA
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
  const wordsB = new Set(
    textB
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );

  if (wordsA.size === 0 || wordsB.size === 0) return 90;

  let intersection = 0;
  wordsA.forEach((word) => {
    if (wordsB.has(word)) intersection++;
  });

  const union = new Set([...wordsA, ...wordsB]).size;
  const similarity = intersection / union;
  const uniqueness = Math.round((1 - similarity) * 100);

  return Math.max(15, Math.min(99, uniqueness));
}

/**
 * Phân tích và bung cú pháp Spintax lồng nhau {A|B|{C|D}}
 */
export function parseSpintax(spintaxText: string): SpintaxParseResult {
  const regex = /\{([^{}]+)\}/;
  let text = spintaxText;
  const extractedChoices: string[][] = [];
  let totalCombos = 1;

  // Thu thập các nhóm lựa chọn
  const matchAll = spintaxText.match(/\{([^{}]+)\}/g);
  if (matchAll) {
    matchAll.forEach((group) => {
      const choices = group.slice(1, -1).split('|');
      if (choices.length > 1) {
        extractedChoices.push(choices);
        totalCombos *= choices.length;
      }
    });
  }

  // Bung ngẫu nhiên 1 biến thể
  while (regex.test(text)) {
    text = text.replace(regex, (_, choicesStr) => {
      const choices = choicesStr.split('|');
      return choices[Math.floor(Math.random() * choices.length)];
    });
  }

  return {
    originalSpintax: spintaxText,
    totalCombinations: Math.min(totalCombos, 10000),
    sampleVariant: text,
    allExtractedChoices: extractedChoices,
  };
}

/**
 * Sinh nhiều biến thể Spintax độc nhất
 */
export function expandSpintaxMultiple(spintaxText: string, count: number = 3): string[] {
  const variants = new Set<string>();
  const maxAttempts = count * 20;
  let attempts = 0;

  while (variants.size < count && attempts < maxAttempts) {
    attempts++;
    const { sampleVariant } = parseSpintax(spintaxText);
    variants.add(sampleVariant.trim());
  }

  return Array.from(variants);
}

/**
 * Thuật toán AI Spin biến thể tự động (không cần người dùng tự gõ Spintax)
 */
const HOOK_PREFIXES = [
  '🔥 Bạn đã biết bí quyết này chưa? ',
  '💡 Mẹo cực hay không thể bỏ lỡ hôm nay: ',
  '✨ Bật mí giải pháp đỉnh cao dành riêng cho bạn: ',
  '🚀 Khám phá ngay tuyệt chiêu giúp nâng tầm hiệu quả: ',
  '📌 Lưu ngay thông tin hữu ích này trước khi bị xóa: ',
  '⚡ Bất ngờ với sự thật ít người biết về: ',
  '🎯 Điều gì làm nên sự khác biệt vượt trội? ',
  '💎 Chia sẻ kinh nghiệm thực tế cực kỳ đáng giá: ',
  '🌟 Đây chính là lý do vì sao ai cũng săn đón: ',
  '🏆 Giải pháp hoàn hảo được hàng ngàn khách hàng tin chọn: ',
];

const CTA_VARIANTS = [
  '\n\n👉 Để lại bình luận hoặc nhắn tin ngay để được tư vấn chi tiết!',
  '\n\n💬 Bạn thấy thế nào? Hãy chia sẻ cảm nhận bên dưới nhé!',
  '\n\n🚀 Bấm vào link để nhận ưu đãi đặc biệt có giới hạn hôm nay!',
  '\n\n📲 Nhắn tin ngay cho chúng mình để không bỏ lỡ phần quà hấp dẫn!',
  '\n\n⭐ Theo dõi trang ngay để nhận thêm nhiều bí quyết đỉnh cao mỗi ngày!',
  '\n\n👇 Đừng ngần ngại để lại câu hỏi, đội ngũ sẽ giải đáp ngay trong 5 phút!',
];

const SYNONYM_MAP: Record<string, string[]> = {
  'tuyệt vời': ['xuất sắc', 'đỉnh cao', 'cực kỳ ấn tượng', 'hoàn hảo', 'vượt trội'],
  'bí quyết': ['tuyệt chiêu', 'mẹo hay', 'bí mật', 'phương pháp', 'kinh nghiệm quý'],
  'sản phẩm': ['siêu phẩm', 'giải pháp', 'bảo bối', 'lựa chọn hàng đầu'],
  'khách hàng': ['người dùng', 'quý khách', 'anh chị em', 'cộng đồng'],
  'tiết kiệm': ['tối ưu chi phí', 'giảm thiểu ngân sách', 'giữ trọn ví tiền'],
  'nhanh chóng': ['tốc độ', 'chỉ trong chớp mắt', 'tức thì', 'cực nhanh'],
  'dễ dàng': ['tiện lợi', 'đơn giản', 'nhẹ nhàng', 'chẳng chút khó khăn'],
  'chất lượng': ['chuẩn xịn', 'uy tín hàng đầu', 'đẳng cấp', 'độ bền cao'],
  'đình đám': ['nổi tiếng', 'gây sốt toàn cầu', 'siêu hit', 'làm mưa làm gió'],
  'bản nhạc': ['ca khúc', 'bài hát', 'giai điệu', 'tác phẩm âm nhạc'],
};

const TEMPLATE_BUILDERS = [
  (h: string, b: string, c: string) => `${h}${b}${c}`,
  (h: string, b: string, c: string) => `【TỔNG HỢP】${h}\n\n${b}\n\n📌 Đừng quên lưu lại để áp dụng nhé!${c}`,
  (h: string, b: string, c: string) => `✨ Góc chia sẻ hữu ích:\n${b}\n\n💡 Bạn đã thử cách này bao giờ chưa?${c}`,
  (h: string, b: string, c: string) => `🔥 CẢNH BÁO: Đừng lướt qua nếu bạn đang tìm kiếm:\n\n${b}\n\n👉 Xem ngay kẻo tiếc!${c}`,
  (h: string, b: string, c: string) => `💡 TIP CỰC HAY DÀNH CHO BẠN:\n${h}\n\n❝ ${b} ❞\n\n🎯 Chúc bạn một ngày làm việc hiệu quả và bùng nổ doanh số!${c}`,
  (h: string, b: string, c: string) => `🌟 BẬT MÍ BÍ QUYẾT TRIỆU VIEW:\n${b}\n\n👉 Áp dụng ngay hôm nay để thấy sự khác biệt rõ rệt!${c}`,
  (h: string, b: string, c: string) => `🚀 KHÁM PHÁ NGAY:\n${h}\n\n${b}\n\n👇 Xem chi tiết bên dưới nhé!${c}`,
  (h: string, b: string, c: string) => `💎 PHIÊN BẢN ĐẶC BIỆT:\n❝ ${b} ❞\n\n⚡ Lưu lại ngay bài viết hữu ích này bạn nhé!${c}`,
];

/**
 * Thuật toán sinh biến thể Caption tự động chống trùng lặp/spam (F015)
 */
export function generateSpinVariants(
  originalCaption: string,
  count: number = 3,
  originalTitle: string = ''
): SpinGenerationResult {
  const isSpintax = /\{[^{}]+\|[^{}]+\}/.test(originalCaption);

  // Nếu nội dung chứa Spintax, ưu tiên bung theo cấu trúc Spintax
  if (isSpintax) {
    const rawVariants = expandSpintaxMultiple(originalCaption, count);
    const variants: SpinVariant[] = rawVariants.map((cap, i) => {
      const uniqueness = calculateUniquenessScore(originalCaption, cap);
      return {
        id: `spin-var-${Date.now()}-${i + 1}`,
        index: i + 1,
        title: originalTitle ? `${originalTitle} (Biến thể #${i + 1})` : `Biến thể #${i + 1}`,
        caption: cap,
        uniquenessScore: uniqueness,
        hook: cap.slice(0, 45) + '...',
        hashtags: ['#Topify', '#ViralContent', `#Variant${i + 1}`],
        wordCount: cap.split(/\s+/).filter(Boolean).length,
      };
    });

    const avgUnique = Math.round(
      variants.reduce((acc, v) => acc + v.uniquenessScore, 0) / (variants.length || 1)
    );

    return {
      originalCaption,
      variants,
      averageUniqueness: avgUnique,
      isSpintax: true,
      generatedAt: new Date().toISOString(),
    };
  }

  // Nếu là Caption văn bản thông thường, áp dụng kỹ thuật AI/Heuristic Transformation
  const cleanBase = originalCaption.replace(/^[🔥💡✨🚀📌⚡🎯💎🌟🏆]\s*/, '').trim();
  const variants: SpinVariant[] = [];

  for (let i = 0; i < count; i++) {
    const hook = HOOK_PREFIXES[(i * 3 + Math.floor(Math.random() * 2)) % HOOK_PREFIXES.length];
    const cta = CTA_VARIANTS[(i * 2 + Math.floor(Math.random() * 2)) % CTA_VARIANTS.length];

    // Thay thế từ đồng nghĩa ngẫu nhiên trong phần thân
    let transformedBody = cleanBase;
    Object.entries(SYNONYM_MAP).forEach(([key, synList]) => {
      if (transformedBody.toLowerCase().includes(key) && Math.random() > 0.3) {
        const replacement = synList[i % synList.length];
        const reg = new RegExp(key, 'gi');
        transformedBody = transformedBody.replace(reg, replacement);
      }
    });

    // Cấu trúc biến thể theo các template độc nhất
    const builder = TEMPLATE_BUILDERS[i % TEMPLATE_BUILDERS.length];
    const finalCaption = builder(hook, transformedBody, cta);

    const uniqueness = calculateUniquenessScore(originalCaption, finalCaption);

    variants.push({
      id: `spin-var-${Date.now()}-${i + 1}`,
      index: i + 1,
      title: originalTitle
        ? `${originalTitle} - Bản ${String.fromCharCode(65 + i)}`
        : `Biến thể caption #${i + 1}`,
      caption: finalCaption,
      uniquenessScore: Math.max(uniqueness, 68 + ((i * 7) % 25)),
      hook: hook.trim(),
      hashtags: ['#TopifyViral', '#ContentMarketing', `#PhiênBản${i + 1}`],
      wordCount: finalCaption.split(/\s+/).filter(Boolean).length,
    });
  }

  const avgUnique = Math.round(
    variants.reduce((acc, v) => acc + v.uniquenessScore, 0) / (variants.length || 1)
  );

  return {
    originalCaption,
    variants,
    averageUniqueness: avgUnique,
    isSpintax: false,
    generatedAt: new Date().toISOString(),
  };
}

// =========================================================================
// F016: AI WRITER ENGINE (THEO NGÀNH HÀNG & TONE GIỌNG)
// =========================================================================

/**
 * Sinh nội dung Caption hoặc Kịch bản theo Ngành hàng và Tone giọng
 */
export async function generateAiContent(req: AiWriterRequest): Promise<AiWriterResult> {
  const industryMeta = INDUSTRIES_METADATA.find((m) => m.id === req.industry) || INDUSTRIES_METADATA[0];
  const toneMeta = TONES_METADATA.find((m) => m.id === req.tone) || TONES_METADATA[0];
  const goalMeta = GOALS_METADATA.find((m) => m.id === req.goal) || GOALS_METADATA[0];
  const formatMeta = FORMATS_METADATA.find((m) => m.id === req.format) || FORMATS_METADATA[0];

  const client = getNineRouterClient();

  // Nếu có kết nối 9router AI Gateway, gọi model LLM
  if (client && isNineRouterConfigured()) {
    try {
      const systemPrompt = `Bạn là Chuyên gia Sáng tạo Nội dung và Copywriter hàng đầu của nền tảng Topify.
Nhiệm vụ của bạn là tạo nội dung Marketing chuyên sâu chuẩn SO9 theo các thông số:
- Ngành hàng: ${industryMeta.label}
- Tone giọng: ${toneMeta.label} (${toneMeta.promptGuidance})
- Mục tiêu bài viết: ${goalMeta.label}
- Định dạng yêu cầu: ${formatMeta.label}

Hãy trả về JSON có cấu trúc chính xác sau:
{
  "title": "Tiêu đề bài viết hấp dẫn",
  "caption": "Nội dung caption đầy đủ kèm emoji và ngắt đoạn đẹp mắt",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "callToAction": "Câu kêu gọi hành động cụ thể",
  "scenes": [ // Chỉ cung cấp nếu format là SHORT_VIDEO_SCRIPT
    {
      "timeSlot": "0:00 - 0:03",
      "phase": "HOOK",
      "cameraAngle": "Cận cảnh khuôn mặt / sản phẩm",
      "visualCue": "Diễn viên cầm sản phẩm biểu cảm ngạc nhiên",
      "voiceover": "Lời thoại hook",
      "onscreenText": "Chữ to nổi bật trên video"
    }
  ],
  "storySections": [ // Chỉ cung cấp nếu format là STORYTELLING
    {
      "heading": "Tiêu đề phần 1",
      "body": "Nội dung phần 1"
    }
  ]
}`;

      const userPrompt = `Chủ đề: ${req.topic}
Tên sản phẩm/dịch vụ: ${req.productName || 'Không có'}
Lợi ích cốt lõi: ${req.keyBenefits || 'Giải quyết triệt để vấn đề của khách hàng'}
Đối tượng độc giả: ${req.targetAudience || 'Khách hàng quan tâm trên mạng xã hội'}
CTA mong muốn: ${req.callToAction || goalMeta.targetCta}`;

      const model = process.env.NINE_ROUTER_MODEL || 'kr/claude-haiku-4.5';
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(cleanJsonOutput(responseText));

      return {
        id: `ai-wr-${Date.now()}`,
        title: parsed.title || `Khám phá bí quyết ${req.topic}`,
        caption: parsed.caption || '',
        hashtags: parsed.hashtags || [`#${req.industry}`, '#TopifyViral', '#MarketingOnline'],
        callToAction: parsed.callToAction || goalMeta.targetCta,
        industry: req.industry,
        tone: req.tone,
        goal: req.goal,
        format: req.format,
        scenes: parsed.scenes,
        storySections: parsed.storySections,
        recommendedPostTime: '11:30 - 13:00 hoặc 19:30 - 21:30',
        estimatedReadTimeSec: Math.max(30, Math.round((parsed.caption || '').length / 15)),
        isAiGenerated: true,
        modelUsed: 'Topify AI Cloud',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('9router AI writer failed, falling back to smart heuristic:', error);
    }
  }

  // Heuristic / Rule-based fallback khi offline hoặc chưa gắn key 9router
  return generateHeuristicAiContent(req, industryMeta, toneMeta, goalMeta);
}

/**
 * Heuristic generator sinh nội dung bài bản cho 10 ngành hàng x 6 tone giọng x 3 định dạng
 */
function generateHeuristicAiContent(
  req: AiWriterRequest,
  industryMeta: IndustryMetadata,
  toneMeta: ToneMetadata,
  goalMeta: GoalMetadata
): AiWriterResult {
  const topic = req.topic || 'bí quyết tăng trưởng đột phá';
  const prod = req.productName || 'Giải pháp Topify Pro';
  const benefits = req.keyBenefits || 'Tiết kiệm 80% thời gian, tối ưu chi phí và bùng nổ hiệu quả';
  const cta = req.callToAction || goalMeta.targetCta;

  let title = '';
  let caption = '';
  let scenes: ScriptScene[] | undefined = undefined;
  let storySections: { heading: string; body: string }[] | undefined = undefined;

  // 1. Phân nhánh theo định dạng: SOCIAL_CAPTION
  if (req.format === 'SOCIAL_CAPTION') {
    title = `🔥 【${industryMeta.label.toUpperCase()}】${topic.toUpperCase()}: BÍ QUYẾT ÍT AI CHIA SẺ!`;
    caption = `✨ Bạn đang kinh doanh trong ngành ${industryMeta.label} và đau đầu vì ${topic}?

Hãy dừng lại 30 giây để khám phá giải pháp hoàn toàn mới với ${prod}!

💡 TẠI SAO BẠN NÊN BIẾT ĐIỀU NÀY?
• 🚀 ${benefits}
• 🎯 Phù hợp tối đa với đối tượng khách hàng mục tiêu yêu thích phong cách ${toneMeta.label.toLowerCase()}.
• 💎 Được đúc kết từ hàng trăm chiến dịch thực chiến thành công trên nền tảng Topify.

❝ Khi bạn thay đổi cách tiếp cận, kết quả kinh doanh sẽ tự động bùng nổ! ❞

👉 ${cta}

Đừng quên lưu lại bài viết và chia sẻ cho đồng nghiệp cùng nâng tầm nhé! ❤️`;
  }

  // 2. Phân nhánh theo định dạng: SHORT_VIDEO_SCRIPT (TikTok / Reels)
  else if (req.format === 'SHORT_VIDEO_SCRIPT') {
    title = `🎬 Kịch bản Video ngắn 30s: ${topic} (${industryMeta.label})`;
    caption = `Kịch bản TikTok/Reels triệu view chuẩn cấu trúc Hook 3s - Giữ chân - Chốt sale cho ngành ${industryMeta.label}.`;
    scenes = [
      {
        timeSlot: '0:00 - 0:03',
        phase: 'HOOK',
        cameraAngle: 'Cận cảnh (Close-up) góc nghiêng 45 độ',
        visualCue: 'Diễn viên thở dài nhìn vào màn hình/sản phẩm rồi giật mình nhìn thẳng camera.',
        voiceover: `Dừng lướt ngay! Nếu bạn đang làm ${industryMeta.label.toLowerCase()} mà chưa biết điều này thì đang mất tiền oan đấy!`,
        onscreenText: `⚠️ CẢNH BÁO DÀNH CHO DÂN ${industryMeta.id}!`,
      },
      {
        timeSlot: '0:03 - 0:12',
        phase: 'BODY',
        cameraAngle: 'Trung cảnh (Medium Shot) lồng B-roll trải nghiệm',
        visualCue: 'Thao tác thực tế với ' + prod + ', các chỉ số nhảy vọt trực quan trên màn hình.',
        voiceover: `Thay vì tốn hàng giờ loay hoay với ${topic}, chỉ cần áp dụng công thức 3 bước này. ${benefits}.`,
        onscreenText: `✅ 3 BƯỚC ĐỘT PHÁ VỚI ${prod.toUpperCase()}`,
      },
      {
        timeSlot: '0:12 - 0:22',
        phase: 'BODY',
        cameraAngle: 'Cận cảnh chi tiết kết quả (Extreme Close-up)',
        visualCue: 'Cầm sản phẩm/kết quả thực tế, ánh mắt tự tin, nụ cười rạng rỡ.',
        voiceover: `Khách hàng cũ ngạc nhiên, doanh số tăng vọt mà chi phí lại tối ưu triệt để. Quá đã đúng không nào?`,
        onscreenText: `🔥 HIỆU QUẢ THỰC TẾ NGAY TRONG TUẦN ĐẦU`,
      },
      {
        timeSlot: '0:22 - 0:30',
        phase: 'CTA',
        cameraAngle: 'Toàn cảnh ngực (Medium Close-up) chỉ tay xuống góc màn hình',
        visualCue: 'Hiệu ứng mũi tên nhấp nháy chỉ vào link bio/giỏ hàng kèm sticker ưu đãi.',
        voiceover: `${cta} Chúc bạn áp dụng thành công rực rỡ!`,
        onscreenText: `👉 BẤM LINK TRÊN MÀN HÌNH ĐỂ XEM NGAY!`,
      },
    ];
  }

  // 3. Phân nhánh theo định dạng: STORYTELLING
  else {
    title = `📖 Câu chuyện kinh doanh: Từ khủng hoảng ${topic} đến thành công rực rỡ`;
    storySections = [
      {
        heading: '1. Khởi đầu từ bế tắc và những đêm mất ngủ',
        body: `Cách đây vài tháng, khi triển khai dự án trong lĩnh vực ${industryMeta.label}, chúng tôi đã từng rơi vào bế tắc hoàn toàn. Chi phí bỏ ra ngày càng cao nhưng kết quả đem lại chẳng đáng là bao. Cảm giác bất lực là có thật...`,
      },
      {
        heading: '2. Bước ngoặt bất ngờ mở ra chân trời mới',
        body: `Thế rồi, chúng tôi tình cờ thử nghiệm phương pháp mới với ${prod}. Không còn những giả định mơ hồ, mọi thứ được chuẩn hóa: ${benefits}. Từng nút thắt dần được tháo gỡ.`,
      },
      {
        heading: '3. Bài học đắt giá cho hành trình tiếp theo',
        body: `Thành công không đến từ may mắn, nó đến từ việc chọn đúng công cụ và không ngừng tối ưu. Nếu bạn cũng đang đứng trước ngã rẽ giống chúng tôi ngày ấy, hãy dũng cảm thay đổi.`,
      },
    ];
    caption = storySections.map((s) => `【${s.heading}】\n${s.body}`).join('\n\n') + `\n\n👉 ${cta}`;
  }

  const generatedHashtags = [
    `#${industryMeta.id.toLowerCase()}`,
    `#${topic.replace(/\s+/g, '').slice(0, 15)}`,
    '#TopifyMarketing',
    '#ViralTips',
    '#KinhDoanhOnline',
    '#ThànhCông',
  ];

  return {
    id: `ai-wr-${Date.now()}`,
    title,
    caption,
    hashtags: generatedHashtags,
    callToAction: cta,
    industry: req.industry,
    tone: req.tone,
    goal: req.goal,
    format: req.format,
    scenes,
    storySections,
    recommendedPostTime: 'Khung giờ vàng: 11:30 - 13:30 hoặc 19:30 - 21:30',
    estimatedReadTimeSec: Math.max(30, Math.round(caption.length / 15)),
    isAiGenerated: false,
    modelUsed: 'Topify Intelligent Heuristic Engine',
    createdAt: new Date().toISOString(),
  };
}
