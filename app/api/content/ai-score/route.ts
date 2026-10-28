import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { analyzeContentScore } from '@/lib/ai/9router';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// OPTIONS /api/content/ai-score
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

async function getAuthContext() {
  let session = await auth();
  let userId = session?.user?.id;

  if (!userId && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const mockUser = await prisma.user.findFirst().catch(() => null);
    if (mockUser) {
      userId = mockUser.id;
    }
  }

  return { userId };
}

// POST /api/content/ai-score - Score content using 9router or heuristic fallback
export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { title, caption, platform, brandVoice } = body;

    if (!caption || caption.trim() === '') {
      return NextResponse.json(
        { error: 'Vui lòng nhập nội dung (caption) để chấm điểm' },
        { status: 400, headers: corsHeaders }
      );
    }

    const scoreResult = await analyzeContentScore({
      title,
      caption,
      platform,
      brandVoice,
    });

    return NextResponse.json(
      {
        success: true,
        data: scoreResult,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error in /api/content/ai-score:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi chấm điểm nội dung' },
      { status: 500, headers: corsHeaders }
    );
  }
}
