import { NextRequest, NextResponse } from 'next/server';
import { generateSocialComment } from '@/lib/ai/9router';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { postText, tone = 'natural', customPrompt } = body;

    if (!postText || typeof postText !== 'string' || postText.trim().length === 0) {
      return NextResponse.json({
        success: true,
        comment: 'Thả tim cho bài viết ạ ❤️',
        isAiGenerated: false,
      });
    }

    const result = await generateSocialComment({
      postText,
      tone,
      customPrompt,
    });

    return NextResponse.json({
      success: true,
      comment: result.comment,
      isAiGenerated: result.isAiGenerated,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('[API /api/ai/generate-comment] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to generate comment',
        comment: 'Thả tim cho bài viết ạ ❤️',
      },
      { status: 500 }
    );
  }
}
