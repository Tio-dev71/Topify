import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';

export async function GET() {
  try {
    const alerts = securityEngineStore.getSuspiciousAlerts();
    const config = securityEngineStore.getAlertConfig();
    return NextResponse.json({
      success: true,
      data: {
        alerts,
        config,
        activeAlertsCount: alerts.filter((a) => a.status === 'ACTIVE').length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải danh sách cảnh báo đăng nhập bất thường' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'resolve', alertId, resolution = 'dismiss', config } = body;

    if (action === 'resolve') {
      if (!alertId) {
        return NextResponse.json({ success: false, error: 'alertId là bắt buộc' }, { status: 400 });
      }
      const res = securityEngineStore.resolveSuspiciousAlert(alertId, resolution);
      const alerts = securityEngineStore.getSuspiciousAlerts();
      return NextResponse.json({
        success: res.success,
        message:
          resolution === 'block' || resolution === 'BLOCKED'
            ? 'Đã khóa phiên đăng nhập khả nghi thành công'
            : 'Đã bỏ qua cảnh báo',
        data: { alert: res.alert, alerts },
      });
    }

    if (action === 'update_config') {
      if (!config) {
        return NextResponse.json({ success: false, error: 'config là bắt buộc' }, { status: 400 });
      }
      const updatedConfig = securityEngineStore.updateAlertConfig(config);
      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật cấu hình phát hiện đăng nhập bất thường',
        data: { config: updatedConfig },
      });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi xử lý cảnh báo bảo mật' },
      { status: 500 }
    );
  }
}
