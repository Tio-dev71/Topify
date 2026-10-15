import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  memoryReferralProfile, 
  memoryReferredUsers 
} from '@/lib/wallet/wallet-engine';

// GET /api/referral - Get referral profile, funnel tracking, and referred users (F151, F152)
export async function GET(req: NextRequest) {
  try {
    const session = await auth().catch(() => null);

    return NextResponse.json({
      profile: memoryReferralProfile,
      referredUsers: memoryReferredUsers,
      totalUsers: memoryReferredUsers.length,
      funnel: [
        { stage: 'Clicks', count: memoryReferralProfile.totalClicks, rate: 100 },
        { stage: 'Đăng ký (Registrations)', count: memoryReferralProfile.totalRegistrations, rate: Number(((memoryReferralProfile.totalRegistrations / memoryReferralProfile.totalClicks) * 100).toFixed(1)) },
        { stage: 'Dùng thử (Trial)', count: memoryReferralProfile.totalTrialUsers, rate: Number(((memoryReferralProfile.totalTrialUsers / memoryReferralProfile.totalClicks) * 100).toFixed(1)) },
        { stage: 'Đã trả phí (Paid Subscribers)', count: memoryReferralProfile.totalPaidSubscribers, rate: Number(((memoryReferralProfile.totalPaidSubscribers / memoryReferralProfile.totalClicks) * 100).toFixed(1)) },
      ],
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({
      profile: memoryReferralProfile,
      referredUsers: memoryReferredUsers,
      success: true,
      fallback: true,
    });
  }
}

// POST /api/referral - Customize referral code (F151)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customCode } = body;

    if (!customCode || customCode.trim().length < 4) {
      return NextResponse.json({
        error: 'Mã giới thiệu phải có độ dài từ 4 ký tự trở lên',
      }, { status: 400 });
    }

    const cleanCode = customCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    memoryReferralProfile.code = cleanCode;
    memoryReferralProfile.referralLink = `https://topify.app/ref/${cleanCode}`;
    memoryReferralProfile.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://topify.app/ref/${cleanCode}`;

    return NextResponse.json({
      success: true,
      message: `Đã đổi mã giới thiệu thành công: ${cleanCode}`,
      profile: memoryReferralProfile,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
