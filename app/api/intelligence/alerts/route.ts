import { NextRequest, NextResponse } from 'next/server';

export interface AlertRule {
  id: string;
  name: string;
  minViralScore: number;
  keywords: string[];
  notifyInApp: boolean;
  notifyEmail: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface TriggeredAlertItem {
  id: string;
  ruleName: string;
  title: string;
  sourceUrl?: string;
  platform: string;
  viralScore: number;
  detectedAt: string;
  isRead: boolean;
}

// Initial state with realistic rules and alerts for F112
let alertRules: AlertRule[] = [
  {
    id: 'rule_1',
    name: 'Cảnh báo Khủng hoảng & Dư luận Tiêu cực',
    minViralScore: 85,
    keywords: ['Khủng hoảng', 'Tẩy chay', 'Phốt', 'Lừa đảo', 'Sai phạm'],
    notifyInApp: true,
    notifyEmail: true,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'rule_2',
    name: 'Theo dõi Sản phẩm Bùng nổ TMĐT & TikTok Shop',
    minViralScore: 75,
    keywords: ['Review', 'Hot trend', 'Săn sale', 'Gia dụng thông minh', 'Mỹ phẩm'],
    notifyInApp: true,
    notifyEmail: false,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'rule_3',
    name: 'Bắt nhịp Chiến dịch Viral & Đối thủ Cạnh tranh',
    minViralScore: 90,
    keywords: ['Viral video', 'Bùng nổ', 'Chiến dịch mới', 'KOLs', 'Livestream'],
    notifyInApp: true,
    notifyEmail: true,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

let triggeredAlerts: TriggeredAlertItem[] = [
  {
    id: 'alert_1',
    ruleName: 'Theo dõi Sản phẩm Bùng nổ TMĐT & TikTok Shop',
    title: 'Video "Top 3 Nồi chiên không dầu mini bán chạy nhất tháng" cán mốc 185,000 views trong 6 giờ',
    platform: 'TIKTOK',
    viralScore: 98,
    detectedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    isRead: false,
    sourceUrl: 'https://www.tiktok.com/@bepthongminh/video/738291038291'
  },
  {
    id: 'alert_2',
    ruleName: 'Bắt nhịp Chiến dịch Viral & Đối thủ Cạnh tranh',
    title: 'Chiến dịch "Săn sale bùng nổ mùa Thu Đông" thu hút hơn 4,400 lượt chia sẻ trong 4 giờ',
    platform: 'FACEBOOK',
    viralScore: 92,
    detectedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    isRead: false,
    sourceUrl: 'https://www.facebook.com/tintucvtv24/posts/91823719283'
  },
  {
    id: 'alert_3',
    ruleName: 'Theo dõi Sản phẩm Bùng nổ TMĐT & TikTok Shop',
    title: 'Reels "Phối đồ công sở thanh lịch tôn dáng" lọt Top 10 xu hướng thịnh hành Reels Instagram',
    platform: 'INSTAGRAM',
    viralScore: 89,
    detectedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isRead: true,
    sourceUrl: 'https://www.instagram.com/reel/C8a9d012f'
  },
  {
    id: 'alert_4',
    ruleName: 'Cảnh báo Khủng hoảng & Dư luận Tiêu cực',
    title: 'Phát hiện 35 bài viết và bình luận tiêu cực liên quan đến sự cố giao hàng chậm sau đợt bão',
    platform: 'FACEBOOK',
    viralScore: 86,
    detectedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    isRead: true,
    sourceUrl: 'https://www.facebook.com/groups/congdongreview/posts/102938472'
  }
];

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      rules: alertRules,
      alerts: triggeredAlerts,
      triggeredAlerts: triggeredAlerts,
      unreadCount: triggeredAlerts.filter((a) => !a.isRead).length,
    });
  } catch (error: any) {
    console.error('[API_ALERTS_GET]', error);
    return NextResponse.json({ error: 'Không thể tải cấu hình cảnh báo' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || (body.name ? 'create_rule' : '');

    if (action === 'mark_read') {
      const { id } = body;
      triggeredAlerts = triggeredAlerts.map((a) => (a.id === id || !id ? { ...a, isRead: true } : a));
      return NextResponse.json({ success: true, message: 'Đã đánh dấu đã đọc' });
    }

    if (action === 'create_rule') {
      const newRule: AlertRule = {
        id: `rule_${Date.now()}`,
        name: body.name || 'Quy tắc cảnh báo mới',
        minViralScore: Number(body.minViralScore) || 80,
        keywords: Array.isArray(body.keywords) ? body.keywords : (body.keywords || 'Topify').split(',').map((s: string) => s.trim()),
        notifyInApp: body.notifyInApp ?? true,
        notifyEmail: body.notifyEmail ?? false,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      alertRules.unshift(newRule);
      return NextResponse.json({
        success: true,
        rule: newRule,
        rules: alertRules
      });
    }

    if (action === 'toggle_rule') {
      const { id } = body;
      alertRules = alertRules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r));
      return NextResponse.json({ success: true, rules: alertRules });
    }

    if (action === 'delete_rule') {
      const { id } = body;
      alertRules = alertRules.filter((r) => r.id !== id);
      return NextResponse.json({ success: true, rules: alertRules });
    }

    if (action === 'test_trigger') {
      const testScore = Number(body.viralScore) || 95;
      const testKeyword = body.keyword || 'Review sản phẩm hot';
      const newAlert: TriggeredAlertItem = {
        id: `alert_test_${Date.now()}`,
        ruleName: body.ruleName || 'Quy tắc theo dõi bùng nổ',
        title: `[CẢNH BÁO MỚI] Nội dung chứa từ khóa "${testKeyword}" vừa đạt vận tốc viral ${testScore}/100`,
        platform: body.platform || 'TIKTOK',
        viralScore: testScore,
        detectedAt: new Date().toISOString(),
        isRead: false,
        sourceUrl: 'https://www.tiktok.com'
      };
      triggeredAlerts.unshift(newAlert);
      return NextResponse.json({
        success: true,
        message: 'Đã kích hoạt cảnh báo thử nghiệm thành công',
        alert: newAlert,
        triggeredAlerts
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_ALERTS_POST]', error);
    return NextResponse.json({ error: 'Lỗi cập nhật cấu hình cảnh báo' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    triggeredAlerts = triggeredAlerts.map((a) => (a.id === id || !id ? { ...a, isRead: true } : a));

    return NextResponse.json({
      success: true,
      message: 'Đã đánh dấu đã đọc',
      unreadCount: triggeredAlerts.filter((a) => !a.isRead).length
    });
  } catch (error: any) {
    console.error('[API_ALERTS_PATCH]', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật trạng thái' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get('id');
    const alertId = searchParams.get('alertId');

    if (alertId) {
      triggeredAlerts = triggeredAlerts.filter((a) => a.id !== alertId);
      return NextResponse.json({
        success: true,
        message: 'Đã xóa thông báo cảnh báo',
        alerts: triggeredAlerts,
        triggeredAlerts
      });
    }

    if (ruleId) {
      alertRules = alertRules.filter((r) => r.id !== ruleId);
      return NextResponse.json({
        success: true,
        message: 'Đã xóa quy tắc cảnh báo',
        rules: alertRules
      });
    }

    return NextResponse.json({ error: 'Vui lòng cung cấp id hoặc alertId cần xóa' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_ALERTS_DELETE]', error);
    return NextResponse.json({ error: 'Lỗi khi xóa' }, { status: 500 });
  }
}
