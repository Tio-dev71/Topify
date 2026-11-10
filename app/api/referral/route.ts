import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { walletStore } from '@/lib/wallet/wallet-engine';

// GET /api/referral - Get referral profile, funnel tracking, and referred users (F151, F152)
export async function GET(req: NextRequest) {
  try {
    const session = await auth().catch(() => null);
    const profile = walletStore.getReferralProfile();
    const referredUsers = walletStore.getReferredUsers();

    const funnel = [
      {
        stage: 'Lượt click link (Clicks)',
        count: profile.totalClicks,
        rate: 100,
      },
      {
        stage: 'Đăng ký tài khoản (Registrations)',
        count: profile.totalRegistrations,
        rate: profile.totalClicks > 0
          ? Number(((profile.totalRegistrations / profile.totalClicks) * 100).toFixed(1))
          : 0,
      },
      {
        stage: 'Dùng thử 14 ngày (Trial)',
        count: profile.totalTrialUsers,
        rate: profile.totalClicks > 0
          ? Number(((profile.totalTrialUsers / profile.totalClicks) * 100).toFixed(1))
          : 0,
      },
      {
        stage: 'Nâng cấp trả phí (Paid Subscribers)',
        count: profile.totalPaidSubscribers,
        rate: profile.totalClicks > 0
          ? Number(((profile.totalPaidSubscribers / profile.totalClicks) * 100).toFixed(1))
          : 0,
      },
    ];

    return NextResponse.json({
      success: true,
      profile,
      referredUsers,
      totalUsers: referredUsers.length,
      funnel,
    });
  } catch (error: any) {
    const fallbackProfile = walletStore.getReferralProfile();
    const fallbackUsers = walletStore.getReferredUsers();
    return NextResponse.json({
      success: true,
      profile: fallbackProfile,
      referredUsers: fallbackUsers,
      totalUsers: fallbackUsers.length,
      fallback: true,
    });
  }
}

// POST /api/referral - Customize referral code (F151) or simulate referred user / event (F152)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, customCode, userSimulation, event, eventData } = body;

    // Action 1: Simulate new referred user (F152)
    if (action === 'SIMULATE_USER' && userSimulation) {
      const newUser = walletStore.simulateReferredUser({
        name: userSimulation.name || 'Khách hàng giới thiệu mới',
        emailMasked: userSimulation.emailMasked || 'khach_***@gmail.com',
        plan: userSimulation.plan || 'PRO',
        status: userSimulation.status || 'ACTIVE_PAID',
        commissionEarned: Number(userSimulation.commissionEarned || 598000),
      });

      return NextResponse.json({
        success: true,
        message: 'Thêm khách hàng giới thiệu thử nghiệm thành công',
        user: newUser,
        profile: walletStore.getReferralProfile(),
        referredUsers: walletStore.getReferredUsers(),
      }, { status: 201 });
    }

    // Action 2: Track referral event (Click/Register/Subscribe) (F152)
    if (action === 'TRACK_EVENT' && event) {
      const result = walletStore.trackReferralEvent(event, eventData);
      return NextResponse.json({
        success: true,
        message: `Đã ghi nhận sự kiện giới thiệu: ${event}`,
        profile: result.profile,
        user: result.user,
      });
    }

    // Action 3: Customize Referral Code (F151)
    const targetCode = customCode || body.code;
    if (!targetCode || typeof targetCode !== 'string' || targetCode.trim().length < 3) {
      return NextResponse.json(
        { error: 'Mã giới thiệu phải có độ dài từ 3 ký tự trở lên (chữ hoa, số)' },
        { status: 400 }
      );
    }

    const updatedProfile = walletStore.updateReferralCode(targetCode);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật mã giới thiệu thành công: ${updatedProfile.code}`,
      profile: updatedProfile,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi xử lý yêu cầu' }, { status: 500 });
  }
}
