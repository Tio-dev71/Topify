import OpenAI from 'openai';

/**
 * 9router AI Gateway Adapter
 * Standardized OpenAI-compatible interface for 9router (hosted on server)
 * With intelligent Heuristic/Rule-Based fallback for development and offline testing.
 */

export interface ContentScoreResult {
  overallScore: number;
  hookScore: number;
  ctaScore: number;
  brandVoiceScore: number;
  platformFitScore: number;
  hookAnalysis: string;
  ctaAnalysis: string;
  brandVoiceAnalysis: string;
  platformFitAnalysis: string;
  strengths: string[];
  improvements: string[];
  suggestedCaption: string;
  isAiGenerated: boolean;
  modelUsed?: string;
}

export interface SuggestedRepliesResult {
  replies: Array<{
    id: string;
    text: string;
    tone: 'friendly' | 'professional' | 'closing';
    description: string;
  }>;
  isAiGenerated: boolean;
}

export interface ConversationSummaryResult {
  needsSummary: string;
  agreements: string;
  pendingIssues: string;
  nextAction: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  isAiGenerated: boolean;
}

export interface LeadDetectionResult {
  isLead: boolean;
  confidence: number;
  detectedPhone?: string | null;
  detectedEmail?: string | null;
  detectedAddress?: string | null;
  buyingIntent: string;
  suggestedDealName: string;
  suggestedDealValue?: number;
  reason: string;
  isAiGenerated: boolean;
}

/**
 * Check if 9router is configured in environment
 */
export function isNineRouterConfigured(): boolean {
  return Boolean(process.env.NINE_ROUTER_API_KEY && process.env.NINE_ROUTER_API_KEY.trim() !== '');
}

/**
 * Get OpenAI client configured with 9router baseURL
 */
export function getNineRouterClient(): OpenAI | null {
  const apiKey = process.env.NINE_ROUTER_API_KEY?.trim();
  if (!apiKey) return null;

  const baseURL = process.env.NINE_ROUTER_URL?.trim() || 'http://localhost:8000/v1';

  return new OpenAI({
    apiKey,
    baseURL,
  });
}

export function cleanJsonOutput(text: string): string {
  if (!text) return '{}';
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  if (startIdx > 0) {
    cleaned = cleaned.substring(startIdx);
  }
  return cleaned.trim();
}

const DEFAULT_MODEL = process.env.NINE_ROUTER_MODEL?.trim() || 'mainTop';

// =========================================================================
// MODULE F084: AI CONTENT SCORE
// =========================================================================

/**
 * Analyze and score content (Hook, CTA, Brand Voice, Platform Fit)
 */
export async function analyzeContentScore(params: {
  title?: string;
  caption: string;
  platform?: string;
  brandVoice?: string;
}): Promise<ContentScoreResult> {
  const { title = '', caption, platform = 'TIKTOK', brandVoice = 'Thân thiện, trẻ trung, truyền cảm hứng' } = params;

  // 1. Try 9router if configured
  if (isNineRouterConfigured()) {
    try {
      const client = getNineRouterClient();
      if (client) {
        const systemPrompt = `Bạn là chuyên gia thẩm định nội dung video ngắn & mạng xã hội hàng đầu (TikTok, Facebook Reels, YouTube Shorts).
Nhiệm vụ của bạn là chấm điểm nội dung theo thang điểm 100 và 4 trụ cột:
1. Hook (Câu mở đầu 3s đầu): Đánh giá tính tò mò, số liệu, câu hỏi kích thích, giữ chân người xem.
2. CTA (Lời kêu gọi hành động): Đánh giá mức độ rõ ràng của hành động mong muốn (comment, lưu, chia sẻ, đặt mua).
3. Brand Voice (Giọng điệu thương hiệu): Đánh giá phong cách, cảm xúc so với định hướng: "${brandVoice}".
4. Platform Fit (Độ phù hợp nền tảng ${platform}): Đánh giá độ dài, cấu trúc, hashtag, tính viral của nền tảng.

Bạn BẮT BUỘC trả về định dạng JSON thuần túy (không kèm markdown) theo cấu trúc sau:
{
  "overallScore": number (0-100),
  "hookScore": number (0-100),
  "ctaScore": number (0-100),
  "brandVoiceScore": number (0-100),
  "platformFitScore": number (0-100),
  "hookAnalysis": "nhận xét chi tiết về câu mở đầu",
  "ctaAnalysis": "nhận xét chi tiết về lời kêu gọi hành động",
  "brandVoiceAnalysis": "nhận xét về phong cách và cảm xúc",
  "platformFitAnalysis": "nhận xét về định dạng và nền tảng",
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "improvements": ["điểm cần sửa 1", "điểm cần sửa 2"],
  "suggestedCaption": "bản caption được viết lại tối ưu hơn để đạt > 90 điểm"
}`;

        const userPrompt = `Tiêu đề: ${title || '(Không có)'}
Nền tảng: ${platform}
Nội dung Caption cần thẩm định:
"""
${caption}
"""`;

        const completion = await client.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.4,
          response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content?.trim();
        if (raw) {
          const parsed = JSON.parse(cleanJsonOutput(raw));
          return {
            overallScore: Math.min(100, Math.max(0, Number(parsed.overallScore) || 75)),
            hookScore: Math.min(100, Math.max(0, Number(parsed.hookScore) || 75)),
            ctaScore: Math.min(100, Math.max(0, Number(parsed.ctaScore) || 70)),
            brandVoiceScore: Math.min(100, Math.max(0, Number(parsed.brandVoiceScore) || 80)),
            platformFitScore: Math.min(100, Math.max(0, Number(parsed.platformFitScore) || 80)),
            hookAnalysis: parsed.hookAnalysis || 'Mở đầu tương đối ổn định.',
            ctaAnalysis: parsed.ctaAnalysis || 'Cần làm rõ lời kêu gọi hành động hơn.',
            brandVoiceAnalysis: parsed.brandVoiceAnalysis || 'Giọng văn tự nhiên, đúng định hướng.',
            platformFitAnalysis: parsed.platformFitAnalysis || 'Cấu trúc phù hợp với nền tảng.',
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Thông điệp rõ ràng'],
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Tối ưu thêm câu mở đầu'],
            suggestedCaption: parsed.suggestedCaption || caption,
            isAiGenerated: true,
            modelUsed: DEFAULT_MODEL,
          };
        }
      }
    } catch (err) {
      console.warn('[9router] Request failed or timed out, falling back to heuristic engine:', err);
    }
  }

  // 2. Intelligent Heuristic Fallback Engine
  return calculateHeuristicContentScore({ title, caption, platform, brandVoice });
}

/**
 * Intelligent Rule-based NLP Scoring when 9router is offline or unconfigured
 */
function calculateHeuristicContentScore(params: {
  title?: string;
  caption: string;
  platform?: string;
  brandVoice?: string;
}): ContentScoreResult {
  const { title = '', caption, platform = 'TIKTOK' } = params;
  const fullText = `${title} ${caption}`.trim();
  const lowerText = fullText.toLowerCase();

  // 1. Hook Score calculation
  let hookScore = 50;
  const hookKeywords = [
    'bí quyết', 'bật mí', 'tại sao', 'làm thế nào', 'cảnh báo', 'đừng', 'sai lầm',
    'bạn có biết', 'top', 'bí mật', 'check ngay', 'sốc', 'kinh nghiệm', 'sự thật',
    'hướng dẫn', 'cách để', 'ai cũng', 'nguy hiểm', 'chú ý'
  ];
  const hasHookKeyword = hookKeywords.some(kw => lowerText.includes(kw));
  if (hasHookKeyword) hookScore += 25;
  if (/[0-9]+/.test(fullText)) hookScore += 10; // Contains numbers (e.g. 5 bước, 3 cách)
  if (fullText.includes('?') || fullText.includes('!')) hookScore += 10;
  if (/[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(fullText)) hookScore += 5; // Has emojis
  hookScore = Math.min(95, hookScore);

  // 2. CTA Score calculation
  let ctaScore = 40;
  const ctaKeywords = [
    'lưu ngay', 'lưu lại', 'follow', 'theo dõi', 'chia sẻ', 'share', 'comment',
    'bình luận', 'inbox', 'nhắn tin', 'link bio', 'mua ngay', 'đặt hàng',
    'tag bạn bè', 'xem thêm', 'liên hệ', 'bấm vào', 'nhận ngay', 'đăng ký'
  ];
  const foundCta = ctaKeywords.filter(kw => lowerText.includes(kw));
  if (foundCta.length >= 1) ctaScore += 30;
  if (foundCta.length >= 2) ctaScore += 20;
  if (lowerText.includes('ngay') || lowerText.includes('nhé') || lowerText.includes('nha')) ctaScore += 5;
  ctaScore = Math.min(95, ctaScore);

  // 3. Platform Fit Score
  let platformFitScore = 60;
  const charLength = fullText.length;
  const hashtagCount = (fullText.match(/#[a-zA-Z0-9_\p{L}]+/gu) || []).length;

  if (hashtagCount >= 3 && hashtagCount <= 8) {
    platformFitScore += 20;
  } else if (hashtagCount >= 1) {
    platformFitScore += 10;
  }

  // Length suitability for short video captions
  if (platform.toUpperCase() === 'TIKTOK' || platform.toUpperCase() === 'REELS') {
    if (charLength >= 50 && charLength <= 400) platformFitScore += 15;
    else if (charLength > 400) platformFitScore -= 5;
  } else {
    if (charLength >= 100 && charLength <= 800) platformFitScore += 15;
  }
  platformFitScore = Math.min(95, platformFitScore);

  // 4. Brand Voice Score
  let brandVoiceScore = 70;
  const politeWords = ['dạ', 'ạ', 'mình', 'bạn', 'chúng mình', 'cả nhà', 'các bạn'];
  if (politeWords.some(w => lowerText.includes(w))) brandVoiceScore += 15;
  if (charLength > 30) brandVoiceScore += 10;
  brandVoiceScore = Math.min(95, brandVoiceScore);

  // Overall Score (Weighted: Hook 35%, CTA 25%, PlatformFit 20%, BrandVoice 20%)
  const overallScore = Math.round(
    hookScore * 0.35 + ctaScore * 0.25 + platformFitScore * 0.20 + brandVoiceScore * 0.20
  );

  // Dynamic feedback
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (hasHookKeyword) {
    strengths.push('Câu mở đầu có từ khóa gây tò mò, kích thích người xem dừng lại 3s đầu.');
  } else {
    improvements.push('Thêm câu hỏi hoặc số liệu giật tít ở câu đầu (vd: "3 Sai lầm khiến...", "Bạn đã biết chưa?").');
  }

  if (foundCta.length > 0) {
    strengths.push(`Có lời kêu gọi hành động rõ ràng (${foundCta.slice(0, 2).join(', ')}).`);
  } else {
    improvements.push('Bổ sung lời kêu gọi hành động cụ thể ở cuối bài (vd: "Lưu lại ngay khi cần", "Comment để nhận file").');
  }

  if (hashtagCount >= 3) {
    strengths.push(`Hashtag phong phú (${hashtagCount} thẻ) giúp thuật toán phân loại đúng đối tượng.`);
  } else {
    improvements.push('Cần bổ sung thêm từ 3 - 5 hashtag liên quan đến ngành và chủ đề video.');
  }

  if (strengths.length === 0) strengths.push('Nội dung súc tích, đi thẳng vào vấn đề chính.');
  if (improvements.length === 0) improvements.push('Có thể test thử thêm emoji ở các đầu mục để bài viết thoáng mắt hơn.');

  // Create an enhanced suggested caption
  let suggested = caption;
  if (!hasHookKeyword) {
    suggested = `🔥 Bạn đã biết điều này chưa? Đừng bỏ qua nếu không muốn bỏ lỡ!\n\n${suggested}`;
  }
  if (foundCta.length === 0) {
    suggested = `${suggested}\n\n👉 Lưu ngay video này để áp dụng & comment câu hỏi bên dưới mình giải đáp nhé!`;
  }
  if (hashtagCount < 3) {
    suggested = `${suggested}\n#topify #chiase #kinhnghiem #trending`;
  }

  return {
    overallScore,
    hookScore,
    ctaScore,
    brandVoiceScore,
    platformFitScore,
    hookAnalysis: hasHookKeyword
      ? 'Mở đầu ấn tượng, có yếu tố giữ chân người xem trong 3 giây vàng.'
      : 'Câu mở đầu còn khá bình thường, nên bổ sung câu hỏi hoặc giật tít để tăng retention.',
    ctaAnalysis: foundCta.length > 0
      ? 'CTA rõ ràng, hướng dẫn khán giả hành động cụ thể.'
      : 'Chưa có CTA rõ nét. Người xem có thể lướt qua mà không để lại tương tác.',
    brandVoiceAnalysis: 'Văn phong tự nhiên, phù hợp với định hướng thương hiệu.',
    platformFitAnalysis: `Định dạng tương thích tốt với ${platform}, độ dài vừa vặn với thói quen đọc nhanh.`,
    strengths,
    improvements,
    suggestedCaption: suggested,
    isAiGenerated: false,
    modelUsed: 'Heuristic Rule-Engine',
  };
}

// =========================================================================
// MODULE F087: AI SUGGESTED REPLY
// =========================================================================

export async function generateSuggestedReplies(params: {
  conversationHistory: Array<{ role: 'customer' | 'agent'; content: string }>;
  contactName?: string;
  brandVoice?: string;
}): Promise<SuggestedRepliesResult> {
  const { conversationHistory, contactName = 'khách hàng', brandVoice = 'Thân thiện, lễ phép, hỗ trợ tận tâm' } = params;
  const lastCustomerMsg = conversationHistory.filter(m => m.role === 'customer').slice(-1)[0]?.content || '';

  if (isNineRouterConfigured()) {
    try {
      const client = getNineRouterClient();
      if (client) {
        const systemPrompt = `Bạn là trợ lý chăm sóc khách hàng chuyên nghiệp cho thương hiệu.
Phong cách thương hiệu: "${brandVoice}".
Tên khách: ${contactName}.
Nhiệm vụ: Dựa vào lịch sử hội thoại, đề xuất chính xác 3 câu trả lời ngắn gọn, tự nhiên, hiệu quả theo 3 phong cách:
1. "friendly": Thân thiện, gần gũi, nhiều cảm xúc tích cực kèm emoji.
2. "professional": Chuyên nghiệp, súc tích, giải quyết thẳng vào vấn đề.
3. "closing": Hướng tới chốt đơn / xin SĐT / xin địa chỉ / hẹn lịch cụ thể.

BẮT BUỘC trả về JSON:
{
  "replies": [
    { "id": "1", "tone": "friendly", "text": "...", "description": "Gần gũi, niềm nở" },
    { "id": "2", "tone": "professional", "text": "...", "description": "Súc tích, đầy đủ thông tin" },
    { "id": "3", "tone": "closing", "text": "...", "description": "Kêu gọi chốt đơn & xin SĐT" }
  ]
}`;

        const completion = await client.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(conversationHistory.slice(-6)) },
          ],
          temperature: 0.5,
          response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content?.trim();
        if (raw) {
          const parsed = JSON.parse(cleanJsonOutput(raw));
          if (Array.isArray(parsed.replies) && parsed.replies.length > 0) {
            return {
              replies: parsed.replies,
              isAiGenerated: true,
            };
          }
        }
      }
    } catch (e) {
      console.warn('[9router] generateSuggestedReplies failed, using fallback:', e);
    }
  }

  // Heuristic Fallback
  return {
    replies: [
      {
        id: '1',
        tone: 'friendly',
        text: `Dạ em chào ${contactName} ạ! Cảm ơn ${contactName} đã nhắn shop. Bên em đang có sẵn hàng và hỗ trợ ship ngay trong ngày, mình cần em tư vấn thêm chi tiết nào không ạ? ✨`,
        description: 'Thân thiện, chào đón',
      },
      {
        id: '2',
        tone: 'professional',
        text: `Chào ${contactName}, bên mình đã nhận được yêu cầu của bạn. Thông tin sản phẩm và chính sách bảo hành đã được gửi kèm, bạn có thể kiểm tra giúp mình nhé.`,
        description: 'Chuyên nghiệp, thẳng vào vấn đề',
      },
      {
        id: '3',
        tone: 'closing',
        text: `Dạ mã này bên em đang có ưu đãi freeship duy nhất hôm nay ạ! ${contactName} để lại giúp em Số điện thoại và Địa chỉ nhận hàng để em lên đơn giữ khuyến mãi cho mình liền nha! 🎁`,
        description: 'Chốt đơn, xin thông tin giao hàng',
      },
    ],
    isAiGenerated: false,
  };
}

// =========================================================================
// MODULE F088: AI CONVERSATION SUMMARY
// =========================================================================

export async function generateConversationSummary(params: {
  conversationHistory: Array<{ role: 'customer' | 'agent'; content: string }>;
  contactName?: string;
}): Promise<ConversationSummaryResult> {
  const { conversationHistory, contactName = 'Khách' } = params;

  if (isNineRouterConfigured()) {
    try {
      const client = getNineRouterClient();
      if (client) {
        const systemPrompt = `Bạn là trợ lý quản lý hội thoại khách hàng.
Đọc hiểu toàn bộ lịch sử trao đổi và tóm tắt ngắn gọn thành 4 mục chuẩn cho nhân viên tiếp nhận:
1. needsSummary: Tóm tắt nhu cầu chính của khách hàng.
2. agreements: Những điều 2 bên đã thỏa thuận (sản phẩm, giá, mẫu mã).
3. pendingIssues: Vấn đề còn tồn đọng hoặc thắc mắc chưa giải quyết.
4. nextAction: Hành động tiếp theo nhân viên cần làm ngay.
5. urgency: "LOW" | "MEDIUM" | "HIGH"

BẮT BUỘC trả về JSON:
{
  "needsSummary": "...",
  "agreements": "...",
  "pendingIssues": "...",
  "nextAction": "...",
  "urgency": "HIGH"
}`;

        const completion = await client.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(conversationHistory) },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content?.trim();
        if (raw) {
          const parsed = JSON.parse(cleanJsonOutput(raw));
          return {
            needsSummary: parsed.needsSummary || 'Khách quan tâm đến sản phẩm.',
            agreements: parsed.agreements || 'Chưa có thỏa thuận cụ thể.',
            pendingIssues: parsed.pendingIssues || 'Chờ phản hồi thêm từ khách.',
            nextAction: parsed.nextAction || 'Nhắn tin chăm sóc lại sau 24h.',
            urgency: parsed.urgency || 'MEDIUM',
            isAiGenerated: true,
          };
        }
      }
    } catch (e) {
      console.warn('[9router] generateConversationSummary failed, using fallback:', e);
    }
  }

  // Fallback
  return {
    needsSummary: `${contactName} đang quan tâm thông tin sản phẩm và cần tư vấn chi tiết về giá cả & chính sách giao hàng.`,
    agreements: 'Đã cung cấp bảng thông số và giải đáp thắc mắc ban đầu.',
    pendingIssues: 'Đang đợi khách hàng xác nhận mẫu và chốt số lượng.',
    nextAction: 'Gửi bảng báo giá chi tiết kèm ưu đãi freeship để kích thích chốt đơn sớm.',
    urgency: 'MEDIUM',
    isAiGenerated: false,
  };
}

// =========================================================================
// MODULE F089: LEAD DETECTION
// =========================================================================

export async function detectLeadFromConversation(params: {
  conversationHistory: Array<{ role: 'customer' | 'agent'; content: string }>;
  contactName?: string;
}): Promise<LeadDetectionResult> {
  const { conversationHistory, contactName = 'Khách' } = params;
  const customerMessages = conversationHistory
    .filter(m => m.role === 'customer')
    .map(m => m.content)
    .join('\n');

  // Regex check for Vietnamese Phone Number
  const phoneRegex = /(?:\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}\b/;
  const phoneMatch = customerMessages.match(phoneRegex);
  const detectedPhone = phoneMatch ? phoneMatch[0] : null;

  // Regex check for Email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = customerMessages.match(emailRegex);
  const detectedEmail = emailMatch ? emailMatch[0] : null;

  // Buying Intent keywords
  const buyingKeywords = [
    'chốt', 'mua', 'đặt', 'ship', 'báo giá', 'giá sỉ', 'lấy cái này',
    'gửi về', 'địa chỉ', 'stk', 'chuyển khoản', 'thanh toán', 'số lượng'
  ];
  const lowerMsg = customerMessages.toLowerCase();
  const hasBuyingKeyword = buyingKeywords.some(kw => lowerMsg.includes(kw));

  const isPotentialLead = Boolean(detectedPhone || detectedEmail || (hasBuyingKeyword && customerMessages.length > 10));

  return {
    isLead: isPotentialLead,
    confidence: detectedPhone ? 95 : hasBuyingKeyword ? 75 : 30,
    detectedPhone,
    detectedEmail,
    detectedAddress: null,
    buyingIntent: detectedPhone
      ? 'Khách đã cung cấp thông tin liên hệ để nhận tư vấn hoặc nhận hàng.'
      : hasBuyingKeyword
      ? 'Khách đang bày tỏ nhu cầu mua sắm / hỏi giá rõ rệt.'
      : 'Chưa có tín hiệu mua hàng rõ ràng.',
    suggestedDealName: `Đơn hàng tiềm năng - ${contactName}`,
    suggestedDealValue: 500000,
    reason: detectedPhone
      ? `Phát hiện số điện thoại: ${detectedPhone}`
      : hasBuyingKeyword
      ? 'Phát hiện từ khóa có ý định đặt hàng trong tin nhắn khách'
      : 'Hội thoại thông thường',
    isAiGenerated: false,
  };
}

// =========================================================================
// MODULE F106: AI INSIGHT & RECOMMENDATION (M5. ANALYTICS)
// =========================================================================

export interface AnalyticsInsightsInput {
  timeframe?: string;
  totalPosts: number;
  avgPerformanceScore: number;
  topPosts: Array<{ title: string; score: number; platform: string }>;
  campaignsRoi: Array<{ name: string; roi: number; spent: number; revenue: number }>;
  funnelMetrics: {
    interactions: number;
    leads: number;
    deals: number;
    won: number;
    leadConversionRate: number;
    dealWonRate: number;
  };
  channelBenchmarks: Array<{
    platform: string;
    avgScore: number;
    avgEngagement: number;
  }>;
}

export interface AnalyticsInsightsResult {
  summary: string;
  keyDrivers: Array<{
    factor: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    description: string;
  }>;
  recommendations: Array<{
    id: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    action: string;
    expectedOutcome: string;
  }>;
  benchmarkFeedback: string;
  isAiGenerated: boolean;
  modelUsed?: string;
}

export async function generateAnalyticsInsights(input: AnalyticsInsightsInput): Promise<AnalyticsInsightsResult> {
  if (isNineRouterConfigured()) {
    try {
      const client = getNineRouterClient();
      if (client) {
        const systemPrompt = `Bạn là Giám đốc Tăng trưởng & Phân tích Tiếp thị (CMO / Growth Marketing Director) cấp cao.
Nhiệm vụ: Phân tích số liệu hiệu quả nội dung (Content Score F103), ROI chiến dịch (F104), phễu chuyển đổi (Funnel F105) và so sánh kênh (F107).
Sau đó đưa ra:
1. "summary": Bản tóm tắt súc tích, chuyên nghiệp về tình hình kinh doanh (2-3 câu).
2. "keyDrivers": 3-4 nguyên nhân chính dẫn đến biến động số liệu (impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL").
3. "recommendations": 3-4 đề xuất hành động cụ thể, thực tế theo thứ tự ưu tiên (priority: "HIGH" | "MEDIUM" | "LOW"), gồm tiêu đề, hành động chi tiết và kết quả kỳ vọng.
4. "benchmarkFeedback": Lời nhận xét so sánh giữa các kênh phân phối (kênh nào bứt phá, kênh nào cần tối ưu).

BẮT BUỘC TRẢ VỀ JSON FORMAT CHUẨN:
{
  "summary": "...",
  "keyDrivers": [
    { "factor": "...", "impact": "POSITIVE", "description": "..." }
  ],
  "recommendations": [
    { "id": "1", "priority": "HIGH", "title": "...", "action": "...", "expectedOutcome": "..." }
  ],
  "benchmarkFeedback": "..."
}`;

        const completion = await client.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(input) },
          ],
          temperature: 0.4,
          response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content?.trim();
        if (raw) {
          const parsed = JSON.parse(cleanJsonOutput(raw));
          if (parsed.summary && Array.isArray(parsed.recommendations)) {
            return {
              summary: parsed.summary,
              keyDrivers: Array.isArray(parsed.keyDrivers) ? parsed.keyDrivers : [],
              recommendations: parsed.recommendations,
              benchmarkFeedback: parsed.benchmarkFeedback || 'Hiệu suất các kênh đang duy trì ổn định.',
              isAiGenerated: true,
              modelUsed: DEFAULT_MODEL,
            };
          }
        }
      }
    } catch (e) {
      console.warn('[9router] generateAnalyticsInsights failed, using fallback:', e);
    }
  }

  // Heuristic Fallback Analysis Engine
  return generateHeuristicAnalyticsInsights(input);
}

function generateHeuristicAnalyticsInsights(input: AnalyticsInsightsInput): AnalyticsInsightsResult {
  const { avgPerformanceScore, campaignsRoi, funnelMetrics, channelBenchmarks, topPosts } = input;

  // Best channel
  const bestChannel = [...channelBenchmarks].sort((a, b) => b.avgScore - a.avgScore)[0] || { platform: 'TIKTOK', avgScore: 82 };
  
  // High ROI campaigns
  const highRoiCampaign = [...campaignsRoi].sort((a, b) => b.roi - a.roi)[0];
  const lowRoiCampaign = [...campaignsRoi].sort((a, b) => a.roi - b.roi)[0];

  const keyDrivers: AnalyticsInsightsResult['keyDrivers'] = [];

  if (avgPerformanceScore >= 70) {
    keyDrivers.push({
      factor: 'Chất lượng nội dung đạt mức cao',
      impact: 'POSITIVE',
      description: `Điểm hiệu quả nội dung trung bình đạt ${avgPerformanceScore.toFixed(1)}/100, tạo độ phủ tự nhiên tốt.`,
    });
  } else {
    keyDrivers.push({
      factor: 'Chất lượng Hook & CTA cần cải thiện',
      impact: 'NEGATIVE',
      description: `Điểm nội dung trung bình đạt ${avgPerformanceScore.toFixed(1)}/100, chưa tối ưu lượt giữ chân người xem.`,
    });
  }

  if (highRoiCampaign && highRoiCampaign.roi > 50) {
    keyDrivers.push({
      factor: `Chiến dịch "${highRoiCampaign.name}" bứt phá`,
      impact: 'POSITIVE',
      description: `Đạt tỷ suất sinh lời ROI ấn tượng +${highRoiCampaign.roi.toFixed(0)}%, đóng góp phần lớn doanh thu.`,
    });
  }

  if (funnelMetrics.leadConversionRate < 5) {
    keyDrivers.push({
      factor: 'Điểm nghẽn chuyển đổi từ Tương tác sang Lead',
      impact: 'NEGATIVE',
      description: `Tỷ lệ người tương tác để lại thông tin liên hệ chỉ đạt ${funnelMetrics.leadConversionRate.toFixed(1)}%, thất thoát lượng lớn khách tiềm năng.`,
    });
  } else {
    keyDrivers.push({
      factor: 'Tỷ lệ thu thập Lead ổn định',
      impact: 'POSITIVE',
      description: `Tỷ lệ chuyển đổi tương tác sang Lead đạt ${funnelMetrics.leadConversionRate.toFixed(1)}%, vận hành hiệu quả qua Hộp thư.`,
    });
  }

  const recommendations: AnalyticsInsightsResult['recommendations'] = [];

  // Top post to Evergreen
  if (topPosts.length > 0) {
    recommendations.push({
      id: 'rec_1',
      priority: 'HIGH',
      title: 'Tái sử dụng bài viết đạt điểm cao (Evergreen Recycle)',
      action: `Bài viết "${topPosts[0].title.slice(0, 40)}..." đạt ${topPosts[0].score} điểm. Hãy bật chế độ Evergreen Auto-Recycle để định kỳ đăng lại sau 30 ngày.`,
      expectedOutcome: 'Tận dụng nội dung viral để duy trì tương tác đều đặn mà không tốn công tạo mới.',
    });
  }

  // Reallocate budget
  if (highRoiCampaign && lowRoiCampaign && highRoiCampaign.id !== lowRoiCampaign.id) {
    recommendations.push({
      id: 'rec_2',
      priority: 'HIGH',
      title: 'Tái phân bổ ngân sách sang chiến dịch lợi nhuận cao',
      action: `Cắt giảm 30% ngân sách từ "${lowRoiCampaign.name}" (ROI ${lowRoiCampaign.roi.toFixed(0)}%) và dồn sang "${highRoiCampaign.name}" (ROI ${highRoiCampaign.roi.toFixed(0)}%).`,
      expectedOutcome: 'Tối ưu hóa chi phí quảng cáo, tăng tỷ suất ROI tổng thể toàn Workspace lên ít nhất 20%.',
    });
  }

  // Channel focus
  recommendations.push({
    id: 'rec_3',
    priority: 'MEDIUM',
    title: `Tập trung sản xuất nội dung ngắn cho ${bestChannel.platform}`,
    action: `Nền tảng ${bestChannel.platform} đang dẫn đầu với điểm hiệu quả trung bình ${bestChannel.avgScore.toFixed(0)}đ. Nên tăng tần suất đăng từ 1 lên 2 video/ngày.`,
    expectedOutcome: 'Chiếm lĩnh thuật toán đề xuất và mở rộng tệp khách hàng tiềm năng thế hệ mới.',
  });

  return {
    summary: `Tổng quan hệ thống ghi nhận ${input.totalPosts} bài viết với điểm hiệu quả trung bình ${avgPerformanceScore.toFixed(1)}/100. Phễu chuyển đổi ghi nhận ${funnelMetrics.leads} Leads và ${funnelMetrics.won} giao dịch chốt thành công. Kênh ${bestChannel.platform} đang có hiệu suất dẫn đầu.`,
    keyDrivers,
    recommendations,
    benchmarkFeedback: `Kênh ${bestChannel.platform} đạt điểm hiệu quả cao nhất (${bestChannel.avgScore.toFixed(0)}đ), trong khi các kênh khác cần bổ sung thêm Call-To-Action rõ ràng hơn để tăng lượng tương tác.`,
    isAiGenerated: false,
  };
}

// =========================================================================
// MODULE F114: REPURPOSE VIDEO HIGHLIGHTS (M7. MEDIA STUDIO)
// =========================================================================

export interface VideoHighlightClip {
  id: string;
  title: string;
  hookPoint: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  duration: number;
  viralPotentialScore: number;
  suggestedCaption: string;
  suggestedTags: string[];
}

export interface RepurposeHighlightsResult {
  sourceTitle: string;
  totalDuration: number;
  clips: VideoHighlightClip[];
  isAiGenerated: boolean;
  modelUsed?: string;
}

export async function generateVideoRepurposeHighlights(params: {
  title: string;
  durationSeconds: number;
  transcriptText?: string;
}): Promise<RepurposeHighlightsResult> {
  const { title, durationSeconds, transcriptText } = params;

  if (isNineRouterConfigured()) {
    try {
      const client = getNineRouterClient();
      if (client) {
        const systemPrompt = `Bạn là Đạo diễn Biên tập Video Viral (Viral Video Editor & Repurposing Specialist).
Nhiệm vụ: Phân tích video dài hoặc bản ghi thoại để trích xuất ra 3-4 clip ngắn (Highlights/Shorts/Reels) có độ dài 30s-60s đạt tiềm năng giữ chân người xem cao nhất.
Với mỗi clip ngắn, cung cấp:
- "title": Tiêu đề giật tít hấp dẫn
- "hookPoint": Câu mở đầu giữ chân 3 giây đầu
- "startTime": Giây bắt đầu
- "endTime": Giây kết thúc
- "duration": Số giây
- "viralPotentialScore": Điểm tiềm năng viral (70-98)
- "suggestedCaption": Đoạn mô tả bài đăng kèm kêu gọi hành động
- "suggestedTags": Mảng 3-5 hashtag phù hợp

BẮT BUỘC TRẢ VỀ JSON:
{
  "clips": [
    {
      "id": "clip_1",
      "title": "...",
      "hookPoint": "...",
      "startTime": 0,
      "endTime": 45,
      "duration": 45,
      "viralPotentialScore": 95,
      "suggestedCaption": "...",
      "suggestedTags": ["#Shorts", "#Viral"]
    }
  ]
}`;

        const completion = await client.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Tiêu đề video gốc: "${title}", Độ dài: ${durationSeconds} giây.\nNội dung/Transcript: ${transcriptText || 'Video chia sẻ kinh nghiệm kinh doanh, tư vấn sản phẩm và giải đáp khách hàng.'}` },
          ],
          temperature: 0.5,
          response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content?.trim();
        if (raw) {
          const parsed = JSON.parse(cleanJsonOutput(raw));
          if (Array.isArray(parsed.clips) && parsed.clips.length > 0) {
            return {
              sourceTitle: title,
              totalDuration: durationSeconds,
              clips: parsed.clips,
              isAiGenerated: true,
              modelUsed: DEFAULT_MODEL,
            };
          }
        }
      }
    } catch (e) {
      console.warn('[9router] generateVideoRepurposeHighlights failed, using fallback:', e);
    }
  }

  // Heuristic Fallback for Repurpose
  const step = Math.max(35, Math.floor(durationSeconds / 4));
  return {
    sourceTitle: title,
    totalDuration: durationSeconds,
    clips: [
      {
        id: 'clip_1',
        title: '🔥 Đoạn Mở Đầu Gây Sốc: Bí Quyết Ít Người Biết',
        hookPoint: 'Nếu bạn vẫn đang làm theo cách cũ, bạn đang đốt tiền mỗi ngày!',
        startTime: 0,
        endTime: Math.min(42, durationSeconds),
        duration: Math.min(42, durationSeconds),
        viralPotentialScore: 94,
        suggestedCaption: 'Bí quyết giúp bạn tiết kiệm 50% thời gian mà doanh số vẫn tăng vọt. Xem ngay để không bỏ lỡ! #Trending #KinhDoanh #Topify',
        suggestedTags: ['#Trending', '#TikTokShop', '#MeoHay', '#Reels'],
      },
      {
        id: 'clip_2',
        title: '⚡ Cao Trào: Sai Lầm Chết Người Ai Cũng Mắc Phải',
        hookPoint: 'Tại sao 90% người mới bắt đầu đều thất bại ở bước này?',
        startTime: Math.min(step, durationSeconds - 50),
        endTime: Math.min(step + 48, durationSeconds),
        duration: 48,
        viralPotentialScore: 88,
        suggestedCaption: 'Đừng mắc phải sai lầm ngớ ngẩn này nếu bạn muốn đơn hàng nổ liên tục! Chia sẻ ngay cho đồng đội cùng biết nha. #KinhNghiem #Review',
        suggestedTags: ['#KinhNghiem', '#GocNhin', '#ViralVideo'],
      },
      {
        id: 'clip_3',
        title: '🎯 Hướng Dẫn Từng Bước (Step-by-Step Action)',
        hookPoint: 'Chỉ cần làm đúng 3 bước này, kết quả sẽ đến ngay tuần đầu tiên.',
        startTime: Math.max(0, durationSeconds - 55),
        endTime: durationSeconds,
        duration: 55,
        viralPotentialScore: 86,
        suggestedCaption: 'Lưu lại ngay công thức 3 bước đơn giản này để áp dụng cho kênh của bạn ngay hôm nay! #Tutorial #HuongDan #Topify',
        suggestedTags: ['#HuongDan', '#CongThuc', '#Shorts'],
      },
    ],
    isAiGenerated: false,
  };
}

// =========================================================================
// MODULE F115: AUTO SUBTITLES & SPEECH TRANSCRIPTION (M7. MEDIA STUDIO)
// =========================================================================

export interface SubtitleCue {
  id: string;
  index: number;
  startTime: string; // e.g. "00:00:01.200"
  endTime: string;   // e.g. "00:00:03.500"
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface AutoSubtitlesResult {
  vttContent: string;
  srtContent: string;
  cues: SubtitleCue[];
  language: string;
  isAiGenerated: boolean;
  modelUsed?: string;
}

export async function generateAutoSubtitles(params: {
  title: string;
  durationSeconds: number;
  speechText?: string;
}): Promise<AutoSubtitlesResult> {
  const { title, durationSeconds, speechText } = params;

  if (isNineRouterConfigured() && speechText) {
    try {
      const client = getNineRouterClient();
      if (client) {
        const systemPrompt = `Bạn là Trợ lý Phiên âm Phụ đề Video Chuyên nghiệp (Subtitle & Speech Recognition Assistant).
Nhiệm vụ: Cắt bản ghi lời thoại tiếng Việt thành từng câu phụ đề ngắn gọn (3-7 từ/dòng), phân bổ thời gian hợp lý theo tổng độ dài video (${durationSeconds}s).
BẮT BUỘC TRẢ VỀ JSON:
{
  "cues": [
    {
      "id": "1",
      "index": 1,
      "startTime": "00:00:00.500",
      "endTime": "00:00:02.800",
      "startSeconds": 0.5,
      "endSeconds": 2.8,
      "text": "Chào mừng các bạn đã quay trở lại"
    }
  ]
}`;

        const completion = await client.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Đoạn thoại: "${speechText}"` },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content?.trim();
        if (raw) {
          const parsed = JSON.parse(cleanJsonOutput(raw));
          if (Array.isArray(parsed.cues) && parsed.cues.length > 0) {
            const vtt = buildVttString(parsed.cues);
            const srt = buildSrtString(parsed.cues);
            return {
              vttContent: vtt,
              srtContent: srt,
              cues: parsed.cues,
              language: 'vi-VN',
              isAiGenerated: true,
              modelUsed: DEFAULT_MODEL,
            };
          }
        }
      }
    } catch (e) {
      console.warn('[9router] generateAutoSubtitles failed, using fallback:', e);
    }
  }

  // Heuristic Fallback Subtitle Generator
  const sampleSentences = [
    'Chào mừng các bạn đã quay trở lại với Topify!',
    'Hôm nay mình sẽ chia sẻ một bí quyết cực kỳ quan trọng,',
    'Giúp bạn tối ưu quy trình đăng bài và chăm sóc khách hàng tự động.',
    'Chỉ với 1-click chuột, toàn bộ đơn hàng đều được xử lý mượt mà.',
    'Hãy nhớ thả tim và lưu video này lại để áp dụng ngay nhé!',
  ];

  const total = sampleSentences.length;
  const slot = Math.max(2.5, durationSeconds / total);

  const fallbackCues: SubtitleCue[] = sampleSentences.map((text, idx) => {
    const start = Math.round(idx * slot * 10) / 10;
    const end = Math.round(Math.min((idx + 1) * slot - 0.2, durationSeconds) * 10) / 10;
    return {
      id: `cue_${idx + 1}`,
      index: idx + 1,
      startTime: formatTimeVtt(start),
      endTime: formatTimeVtt(end),
      startSeconds: start,
      endSeconds: end,
      text,
    };
  });

  return {
    vttContent: buildVttString(fallbackCues),
    srtContent: buildSrtString(fallbackCues),
    cues: fallbackCues,
    language: 'vi-VN',
    isAiGenerated: false,
  };
}

function formatTimeVtt(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const mmm = String(ms).padStart(3, '0');
  return `00:${mm}:${ss}.${mmm}`;
}

function formatTimeSrt(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const mmm = String(ms).padStart(3, '0');
  return `00:${mm}:${ss},${mmm}`;
}

function buildVttString(cues: SubtitleCue[]): string {
  let vtt = 'WEBVTT\n\n';
  cues.forEach((c) => {
    vtt += `${c.startTime} --> ${c.endTime}\n${c.text}\n\n`;
  });
  return vtt;
}

function buildSrtString(cues: SubtitleCue[]): string {
  let srt = '';
  cues.forEach((c, i) => {
    srt += `${i + 1}\n${formatTimeSrt(c.startSeconds)} --> ${formatTimeSrt(c.endSeconds)}\n${c.text}\n\n`;
  });
  return srt;
}


