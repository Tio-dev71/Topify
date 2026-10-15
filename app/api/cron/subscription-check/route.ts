import { NextRequest, NextResponse } from 'next/server';
import { processExpiringSubscriptions } from '@/lib/workspace/subscription-cron';

export async function GET(req: NextRequest) {
  try {
    const result = await processExpiringSubscriptions();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API_CRON_SUBSCRIPTION_CHECK_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi thực thi quét hạn sử dụng thuê bao' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
