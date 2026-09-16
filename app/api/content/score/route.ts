import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// POST /api/content/score - AI-based content scoring
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { caption, platform, hashtags, cta } = body;

    if (!caption) {
      return NextResponse.json({ error: 'Caption is required' }, { status: 400 });
    }

    // Try AI scoring
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    if (apiKey) {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Bạn là chuyên gia phân tích content marketing. Hãy chấm điểm nội dung sau theo thang 0-100 và đánh giá chi tiết.

Caption: ${caption}
${platform ? `Nền tảng: ${platform}` : ''}
${hashtags ? `Hashtags: ${hashtags}` : ''}
${cta ? `CTA: ${cta}` : ''}

Trả về JSON với format:
{
  "overallScore": 75,
  "hookScore": 80,
  "clarityScore": 70,
  "ctaScore": 65,
  "brandFitScore": 75,
  "platformFitScore": 80,
  "suggestions": ["gợi ý 1", "gợi ý 2"],
  "summary": "Nhận xét tổng quan"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      try {
        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const score = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ score });
        }
      } catch {
        // fallback below
      }
    }

    // Algorithmic fallback scoring
    const score = calculateBasicScore(caption, hashtags, cta);
    return NextResponse.json({ score });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculateBasicScore(caption: string, hashtags?: string, cta?: string) {
  let overallScore = 50;
  const suggestions: string[] = [];

  // Length check
  if (caption.length > 50 && caption.length < 500) overallScore += 10;
  else if (caption.length <= 50) suggestions.push('Caption quá ngắn, nên viết dài hơn 50 ký tự');
  else suggestions.push('Caption khá dài, cân nhắc rút gọn');

  // Hook check (first 50 chars)
  const hookScore = caption.match(/[!?🔥✨💡🎯⚡🚀]/) ? 75 : 50;
  if (hookScore < 75) suggestions.push('Thêm hook mạnh ở đầu (emoji, câu hỏi, số liệu)');

  // CTA check
  const ctaScore = cta ? 80 : (caption.match(/(click|xem|mua|đăng ký|comment|share|link)/i) ? 65 : 40);
  if (ctaScore < 65) suggestions.push('Thêm CTA rõ ràng (kêu gọi hành động)');

  // Hashtags check
  const hashtagCount = hashtags ? hashtags.split(/[#\s,]+/).filter(Boolean).length : 0;
  if (hashtagCount === 0) suggestions.push('Thêm hashtags để tăng reach');
  else if (hashtagCount > 30) suggestions.push('Giảm bớt hashtags, chỉ nên dùng 5-15 hashtags');

  overallScore = Math.min(100, Math.round((overallScore + hookScore + ctaScore) / 3));

  return {
    overallScore,
    hookScore,
    clarityScore: Math.min(100, 50 + Math.floor(caption.length / 10)),
    ctaScore,
    brandFitScore: 60,
    platformFitScore: 65,
    suggestions,
    summary: overallScore >= 70 ? 'Nội dung khá tốt, có thể cải thiện thêm.' : 'Nội dung cần cải thiện nhiều để đạt hiệu quả.',
  };
}
