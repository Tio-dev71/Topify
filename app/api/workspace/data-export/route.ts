import { NextRequest, NextResponse } from 'next/server';
import { workspaceStore } from '@/lib/workspace/workspace-engine';

export async function GET(req: NextRequest) {
  try {
    const exportManifest = await workspaceStore.getExportManifest();
    return NextResponse.json({
      success: true,
      export: exportManifest,
    });
  } catch (error: any) {
    console.error('[API_DATA_EXPORT_GET]', error);
    return NextResponse.json({ error: 'Không thể tạo tệp xuất dữ liệu' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'request_deletion';

    if (action === 'request_deletion') {
      const { confirmationText } = body;
      const res = workspaceStore.requestDeletion(confirmationText);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (action === 'cancel_deletion') {
      const res = workspaceStore.cancelDeletion();
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_DATA_EXPORT_POST]', error);
    return NextResponse.json({ error: 'Lỗi xử lý xoá dữ liệu' }, { status: 500 });
  }
}
