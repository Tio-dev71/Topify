import { NextRequest, NextResponse } from 'next/server';
import {
  generateAiContent,
  INDUSTRIES_METADATA,
  TONES_METADATA,
  GOALS_METADATA,
  FORMATS_METADATA,
  type AiWriterRequest,
} from '@/lib/content-studio/content-studio-engine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/content-studio/ai-writer
 * Lấy danh mục metadata hỗ trợ (10 ngành hàng, 6 tone giọng, 4 mục tiêu, 3 định dạng)
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      industries: INDUSTRIES_METADATA,
      tones: TONES_METADATA,
      goals: GOALS_METADATA,
      formats: FORMATS_METADATA,
      popularPrompts: [
        'Kịch bản TikTok giới thiệu son môi lì không trôi',
        'Caption Facebook bán căn hộ chung cư cao cấp view hồ',
        'Bài viết chia sẻ bí quyết học tiếng Anh giao tiếp cấp tốc',
        'Kịch bản video ngắn đồ gia dụng thông minh robot hút bụi',
        'Caption chia sẻ kinh nghiệm đầu tư tài chính thông minh',
      ],
    },
  });
}

/**
 * POST /api/content-studio/ai-writer
 * F016: Trợ lý AI viết caption/kịch bản theo ngành hàng & tone giọng
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AiWriterRequest;
    const { industry, tone, goal, format, topic } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp chủ đề hoặc ý tưởng bài viết' },
        { status: 400 }
      );
    }

    const writerRequest: AiWriterRequest = {
      industry: industry || 'B2B_SERVICES',
      tone: tone || 'EXPERT',
      goal: goal || 'ENGAGEMENT',
      format: format || 'SOCIAL_CAPTION',
      topic: topic.trim(),
      productName: body.productName?.trim(),
      keyBenefits: body.keyBenefits?.trim(),
      targetAudience: body.targetAudience?.trim(),
      callToAction: body.callToAction?.trim(),
    };

    const result = await generateAiContent(writerRequest);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in POST /api/content-studio/ai-writer:', error);
    return NextResponse.json(
      { error: error?.message || 'Không thể sinh nội dung với AI Writer' },
      { status: 500 }
    );
  }
}
