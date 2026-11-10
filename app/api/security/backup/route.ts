import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';

export async function GET() {
  try {
    const policies = securityEngineStore.getRetentionPolicies();
    const backups = securityEngineStore.getBackupsList();

    const summary = {
      totalBackups: backups.length,
      latestBackupAt: backups[0]?.createdAt || new Date().toISOString(),
      totalStorageUsed: '79.9 MB',
      autoPurgeEnabledCount: policies.filter((p) => p.autoPurge).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        policies,
        backups,
        summary,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải chính sách lưu trữ & sao lưu' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'create_backup', name, backupId, category, retentionDays, autoPurge } = body;

    if (action === 'create_backup') {
      const snapshot = securityEngineStore.createBackupSnapshot(name);
      const backups = securityEngineStore.getBackupsList();
      return NextResponse.json({
        success: true,
        message: `Đã tạo bản sao lưu snapshot "${snapshot.name}" thành công!`,
        data: { snapshot, backups },
      });
    }

    if (action === 'restore_backup') {
      if (!backupId) {
        return NextResponse.json({ success: false, error: 'backupId là bắt buộc' }, { status: 400 });
      }
      const res = securityEngineStore.restoreBackup(backupId);
      return NextResponse.json({
        success: true,
        message: res.message,
      });
    }

    if (action === 'update_retention') {
      if (!category || retentionDays === undefined) {
        return NextResponse.json({ success: false, error: 'category và retentionDays là bắt buộc' }, { status: 400 });
      }
      const updatedPolicy = securityEngineStore.updateRetentionPolicy(category, Number(retentionDays), autoPurge);
      const policies = securityEngineStore.getRetentionPolicies();
      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật chính sách lưu trữ dữ liệu',
        data: { policy: updatedPolicy, policies },
      });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi xử lý thao tác sao lưu' },
      { status: 500 }
    );
  }
}

