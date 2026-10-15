import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeContentScore } from '@/lib/ai/9router';

export const dynamic = 'force-dynamic';

// POST /api/content/ai-score - Score content using 9router or heuristic fallback
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, caption, platform, brandVoice } = body;

    if (!caption || caption.trim() === '') {
      return NextResponse.json(
        { error: 'Vui lòng nhập nội dung (caption) để chấm điểm' },
        { status: 400 }
      );
    }

    const scoreResult = await analyzeContentScore({
      title,
      caption,
      platform,
      brandVoice,
    });

    return NextResponse.json({
      success: true,
      data: scoreResult,
    });
  } catch (error: any) {
    console.error('Error in /api/content/ai-score:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi chấm điểm nội dung' },
      { status: 500 }
    );
  }
}
