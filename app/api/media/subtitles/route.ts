import { NextRequest, NextResponse } from 'next/server';
import { generateAutoSubtitles } from '@/lib/ai/9router';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = body.title || 'Video ngắn';
    const durationSeconds = body.durationSeconds || 60;
    const speechText = body.speechText || '';

    const subtitles = await generateAutoSubtitles({
      title,
      durationSeconds,
      speechText,
    });

    return NextResponse.json({
      success: true,
      data: subtitles,
    });
  } catch (error: any) {
    console.error('[API_MEDIA_SUBTITLES_POST]', error);
    return NextResponse.json({ error: 'Không thể nhận diện và tạo phụ đề' }, { status: 500 });
  }
}
