import { NextRequest, NextResponse } from 'next/server';
import { ASPECT_RATIO_PROFILES, calculateResizeTransform, AspectRatio, ResizeMode } from '@/lib/media/studio';

export async function GET() {
  return NextResponse.json({
    success: true,
    profiles: ASPECT_RATIO_PROFILES,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sourceWidth = body.sourceWidth || 1920;
    const sourceHeight = body.sourceHeight || 1080;
    const targetRatio = (body.targetRatio || '9:16') as AspectRatio;
    const mode = (body.mode || 'FIT_BLUR') as ResizeMode;

    const transform = calculateResizeTransform({
      sourceWidth,
      sourceHeight,
      targetRatio,
      mode,
    });

    return NextResponse.json({
      success: true,
      transform,
      targetProfile: ASPECT_RATIO_PROFILES[targetRatio],
    });
  } catch (error: any) {
    console.error('[API_MEDIA_RESIZE_POST]', error);
    return NextResponse.json({ error: 'Không thể tính toán thông số resize' }, { status: 500 });
  }
}
