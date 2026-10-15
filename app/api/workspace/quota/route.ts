import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceUsageAndQuota, PLAN_LIMITS } from '@/lib/workspace/quota';

export async function GET(req: NextRequest) {
  try {
    const quota = await getWorkspaceUsageAndQuota('default-workspace');
    return NextResponse.json({
      success: true,
      data: quota,
      allPlans: PLAN_LIMITS,
    });
  } catch (error: any) {
    console.error('[API_QUOTA_GET]', error);
    return NextResponse.json({ error: 'Không thể tải thông tin định mức sử dụng' }, { status: 500 });
  }
}
