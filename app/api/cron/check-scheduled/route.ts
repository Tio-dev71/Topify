import { NextRequest, NextResponse } from 'next/server';
import { checkAndPublishDuePosts } from '@/lib/queue/publisher-service';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const result = await checkAndPublishDuePosts();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  try {
    const result = await checkAndPublishDuePosts();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
