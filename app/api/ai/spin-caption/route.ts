import { NextRequest, NextResponse } from 'next/server';
import { generateSpinVariants } from '@/lib/content-studio/content-studio-engine';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/spin-caption
 * Backward-compatible endpoint for inline AI Spin Caption in CreatePost & DuplicateWarningCard
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title = '', caption = '' } = body;

    const sourceText = caption || title || 'Khám phá ngay giải pháp tuyệt vời này!';
    const result = generateSpinVariants(sourceText, 3, title);
    const topVariant = result.variants[0]?.caption || sourceText;

    return NextResponse.json({
      success: true,
      newCaption: topVariant,
      uniquenessScore: result.variants[0]?.uniquenessScore || 85,
      variants: result.variants,
    });
  } catch (error: any) {
    console.error('Error in POST /api/ai/spin-caption:', error);
    return NextResponse.json(
      { error: error?.message || 'Không thể spin caption' },
      { status: 500 }
    );
  }
}
