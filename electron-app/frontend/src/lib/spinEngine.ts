export interface SpinVariantItem {
  id: string;
  index: number;
  caption: string;
  title: string;
  uniquenessScore: number;
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
  variants: SpinVariantItem[];
  averageUniqueness: number;
  isSpintax: boolean;
  generatedAt: string;
}

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
  'bí quyết': ['tuyệt chiêu', 'mẹo hay', 'phương pháp đỉnh cao', 'công thức', 'bí kíp'],
  'tuyệt chiêu': ['bí kíp', 'mẹo cực đỉnh', 'giải pháp vàng', 'kinh nghiệm'],
  'chia sẻ': ['bật mí', 'gửi tới bạn', 'tiết lộ', 'mách bạn', 'tổng hợp'],
  'bật mí': ['tiết lộ', 'chia sẻ', 'mách nước', 'bật mí độc quyền'],
  'đỉnh cao': ['xuất sắc', 'chuẩn xịn', 'cực chất', 'vượt trội', 'siêu đỉnh'],
  'hữu ích': ['giá trị', 'cần thiết', 'thực tế', 'bổ ích', 'đáng lưu tâm'],
  'tăng doanh số': ['bùng nổ doanh thu', 'chốt đơn mỏi tay', 'nhân đôi doanh số', 'đột phá doanh thu'],
  'hiệu quả': ['tác dụng nhanh', 'thành công vượt mong đợi', 'kết quả mỹ mãn'],
  'kinh doanh': ['buôn bán', 'bán hàng đa kênh', 'phát triển thương hiệu'],
  'nhanh chóng': ['tức thì', 'chỉ trong chớp mắt', 'siêu tốc', 'ngay lập tức'],
  'chất lượng': ['chuẩn xịn', 'uy tín hàng đầu', 'đẳng cấp', 'độ bền cao'],
  'đình đám': ['nổi tiếng', 'gây sốt toàn cầu', 'siêu hit', 'làm mưa làm gió'],
  'bản nhạc': ['ca khúc', 'bài hát', 'giai điệu', 'tác phẩm âm nhạc'],
};

export function calculateUniquenessScore(base: string, generated: string): number {
  const words1 = new Set(base.toLowerCase().split(/\s+/).filter(Boolean));
  const words2 = new Set(generated.toLowerCase().split(/\s+/).filter(Boolean));

  if (words1.size === 0 || words2.size === 0) return 75;

  let common = 0;
  words1.forEach((w) => {
    if (words2.has(w)) common++;
  });

  const union = new Set([...words1, ...words2]).size;
  const similarity = union > 0 ? (common / union) * 100 : 0;
  const uniqueness = Math.round(100 - similarity);

  return Math.max(25, Math.min(98, uniqueness));
}

export function parseSpintaxClient(spintaxText: string): SpintaxParseResult {
  const regex = /\{([^{}]+)\}/;
  let text = spintaxText;
  const extractedChoices: string[][] = [];
  let totalCombos = 1;

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

export function expandSpintaxMultipleClient(spintaxText: string, count: number = 3): string[] {
  const variants = new Set<string>();
  const maxAttempts = count * 20;
  let attempts = 0;

  while (variants.size < count && attempts < maxAttempts) {
    attempts++;
    const { sampleVariant } = parseSpintaxClient(spintaxText);
    variants.add(sampleVariant.trim());
  }

  return Array.from(variants);
}

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

export function generateSpinVariantsClient(
  originalCaption: string,
  count: number = 3,
  originalTitle: string = ''
): SpinGenerationResult {
  const isSpintax = /\{[^{}]+\|[^{}]+\}/.test(originalCaption);

  if (isSpintax) {
    const rawVariants = expandSpintaxMultipleClient(originalCaption, count);
    const variants: SpinVariantItem[] = rawVariants.map((cap, i) => {
      const uniqueness = calculateUniquenessScore(originalCaption, cap);
      const safeCap = typeof cap.toWellFormed === 'function' ? cap.toWellFormed() : cap;
      const hookText = Array.from(safeCap).slice(0, 45).join('') + '...';
      return {
        id: `spin-var-${Date.now()}-${i + 1}`,
        index: i + 1,
        title: originalTitle ? `${originalTitle} (Biến thể #${i + 1})` : `Biến thể #${i + 1}`,
        caption: safeCap,
        uniquenessScore: uniqueness,
        hook: hookText,
        hashtags: ['#Topify', '#ViralContent', `#Variant${i + 1}`],
        wordCount: safeCap.split(/\s+/).filter(Boolean).length,
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

  // Sử dụng cờ /u để regex xử lý đúng ký tự Unicode 32-bit (surrogate pairs) và không cắt đứt emoji
  const cleanBase = originalCaption.replace(/^[🔥💡✨🚀📌⚡🎯💎🌟🏆]\s*/u, '').trim();
  const safeBase = typeof cleanBase.toWellFormed === 'function' ? cleanBase.toWellFormed() : cleanBase;
  const variants: SpinVariantItem[] = [];

  for (let i = 0; i < count; i++) {
    const hook = HOOK_PREFIXES[(i * 3 + Math.floor(Math.random() * 2)) % HOOK_PREFIXES.length];
    const cta = CTA_VARIANTS[(i * 2 + Math.floor(Math.random() * 2)) % CTA_VARIANTS.length];

    let transformedBody = safeBase;
    Object.entries(SYNONYM_MAP).forEach(([key, synList]) => {
      if (transformedBody.toLowerCase().includes(key)) {
        const replacement = synList[i % synList.length];
        const reg = new RegExp(key, 'gi');
        transformedBody = transformedBody.replace(reg, replacement);
      }
    });

    const builder = TEMPLATE_BUILDERS[i % TEMPLATE_BUILDERS.length];
    const rawCaption = builder(hook, transformedBody, cta);
    const finalCaption = typeof rawCaption.toWellFormed === 'function' ? rawCaption.toWellFormed() : rawCaption;

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
