import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { executeCustomerMerge } from '@/lib/crm/scoring-and-duplicates';

export const dynamic = 'force-dynamic';

// POST /api/crm/customers/merge - Controlled customer profile merge (F101)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { masterId, duplicateIds, fieldOverrides } = body;

    if (!masterId) {
      return NextResponse.json({ error: 'Vui lòng chọn hồ sơ chính (Master Record)' }, { status: 400 });
    }

    if (!duplicateIds || !Array.isArray(duplicateIds) || duplicateIds.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất một hồ sơ phụ cần hợp nhất' }, { status: 400 });
    }

    const mergedMaster = await executeCustomerMerge({
      masterId,
      duplicateIds,
      fieldOverrides,
      workspaceId,
      userId: session.user.id,
      req,
    });

    return NextResponse.json({
      success: true,
      masterCustomer: mergedMaster,
      message: `Đã hợp nhất thành công ${duplicateIds.length} hồ sơ vào [${mergedMaster.name}]`,
    });
  } catch (error: any) {
    console.error('Error merging customers:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi hợp nhất hồ sơ' }, { status: 500 });
  }
}
