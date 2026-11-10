import { NextRequest, NextResponse } from 'next/server';
import { walletStore, FraudActionTaken } from '@/lib/wallet/wallet-engine';

// GET /api/referral/anti-fraud - List fraud inspection alerts (F155)
export async function GET() {
  try {
    const alerts = walletStore.getFraudAlerts();
    const highRiskCount = alerts.filter((a) => a.riskLevel === 'HIGH_RISK').length;
    const suspiciousCount = alerts.filter((a) => a.riskLevel === 'SUSPICIOUS').length;
    const safeCount = alerts.filter((a) => a.riskLevel === 'SAFE').length;

    return NextResponse.json({
      success: true,
      alerts,
      total: alerts.length,
      highRiskCount,
      suspiciousCount,
      safeCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi lấy danh sách cảnh báo gian lận' }, { status: 500 });
  }
}

// POST /api/referral/anti-fraud - Run anti-fraud scan or update alert action (F155)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, alertId, newStatus, scanData } = body;

    // Sub-action 1: Update action taken on an alert
    if (action === 'UPDATE_STATUS' && alertId && newStatus) {
      const updated = walletStore.updateFraudAlertAction(alertId, newStatus as FraudActionTaken);
      if (!updated) {
        return NextResponse.json({ error: 'Cảnh báo gian lận không tồn tại' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Đã áp dụng biện pháp xử lý: ${newStatus}`,
        alert: updated,
        alerts: walletStore.getFraudAlerts(),
      });
    }

    // Sub-action 2: Run anti-fraud scan / simulation
    const newAlert = walletStore.runFraudScan({
      suspectedUserId: scanData?.userId,
      suspectedUserName: scanData?.userName || 'nghi_van_clone@gmail.com',
      referrerIp: scanData?.referrerIp || '118.69.182.10',
      referredIp: scanData?.referredIp || '118.69.182.10', // Trùng IP để phát hiện self-referral
      referrerFingerprint: scanData?.fingerprint || 'fp_demo_mac_chrome',
      referredFingerprint: scanData?.fingerprint || 'fp_demo_mac_chrome',
      registrationsInLastHour: scanData?.registrationsInLastHour ?? 7,
      hasActivity: scanData?.hasActivity ?? false,
    });

    return NextResponse.json({
      success: true,
      message: `Quét gian lận hoàn tất: Điểm rủi ro ${newAlert.riskScore}/100 (${newAlert.riskLevel})`,
      alert: newAlert,
      alerts: walletStore.getFraudAlerts(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi quét rủi ro gian lận' }, { status: 500 });
  }
}
