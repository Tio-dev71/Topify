import { NextRequest, NextResponse } from 'next/server';
import { generateVideoRepurposeHighlights } from '@/lib/ai/9router';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = body.title || 'Video chia sẻ kiến thức kinh doanh đa kênh';
    const durationSeconds = body.durationSeconds || 180; // default 3 mins
    const transcriptText = body.transcriptText || '';

    const result = await generateVideoRepurposeHighlights({
      title,
      durationSeconds,
      transcriptText,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[API_MEDIA_REPURPOSE_POST]', error);
    return NextResponse.json({ error: 'Không thể tách clip highlight từ video' }, { status: 500 });
  }
}
