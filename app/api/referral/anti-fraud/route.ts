import { NextRequest, NextResponse } from 'next/server';
import { 
  memoryFraudAlerts, 
  checkReferralFraud, 
  FraudInspectionResult 
} from '@/lib/wallet/wallet-engine';

// GET /api/referral/anti-fraud - List fraud inspection alerts (F155)
export async function GET() {
  try {
    const highRiskCount = memoryFraudAlerts.filter(a => a.riskLevel === 'HIGH_RISK').length;
    const suspiciousCount = memoryFraudAlerts.filter(a => a.riskLevel === 'SUSPICIOUS').length;
    const safeCount = memoryFraudAlerts.filter(a => a.riskLevel === 'SAFE').length;

    return NextResponse.json({
      alerts: memoryFraudAlerts,
      total: memoryFraudAlerts.length,
      highRiskCount,
      suspiciousCount,
      safeCount,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/referral/anti-fraud - Run anti-fraud scan or update alert action
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, alertId, newStatus, scanData } = body;

    // Sub-action 1: Update action taken on an alert
    if (action === 'UPDATE_STATUS' && alertId && newStatus) {
      const alert = memoryFraudAlerts.find(a => a.id === alertId);
      if (!alert) {
        return NextResponse.json({ error: 'Cảnh báo không tồn tại' }, { status: 404 });
      }
      alert.actionTaken = newStatus;
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật biện pháp xử lý: ${newStatus}`,
        alert,
      });
    }

    // Sub-action 2: Run simulation fraud check
    const referrerIp = scanData?.referrerIp || '118.69.182.10';
    const referredIp = scanData?.referredIp || '118.69.182.10'; // Trùng IP demo
    const fingerprint = scanData?.fingerprint || 'fp_demo_device_99';

    const check = checkReferralFraud({
      referrerIp,
      referredIp,
      referrerFingerprint: fingerprint,
      referredFingerprint: fingerprint,
      registrationsInLastHour: 6,
      hasActivity: false,
    });

    const newAlert: FraudInspectionResult = {
      id: `frd_${Date.now()}`,
      referralCode: 'TOP-VIET99',
      suspectedUserId: `usr_sim_${Date.now()}`,
      suspectedUserName: scanData?.userName || 'nghi_van_clone@gmail.com',
      ipAddress: referredIp,
      deviceFingerprint: fingerprint,
      reasons: check.reasons,
      riskScore: check.riskScore,
      riskLevel: check.riskLevel,
      actionTaken: check.riskLevel === 'HIGH_RISK' ? 'COMMISSION_HELD' : 'FLAGGED',
      detectedAt: new Date().toISOString(),
    };

    memoryFraudAlerts.unshift(newAlert);

    return NextResponse.json({
      success: true,
      message: `Quét gian lận hoàn tất: Điểm rủi ro ${check.riskScore}/100 (${check.riskLevel})`,
      result: check,
      alert: newAlert,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
