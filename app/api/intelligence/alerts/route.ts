import { NextRequest, NextResponse } from 'next/server';

export interface AlertRule {
  id: string;
  name: string;
  minViralScore: number;
  keywords: string[];
  notifyInApp: boolean;
  notifyEmail: boolean;
  isActive: boolean;
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

// In-memory state for dev & demo
let alertRules: AlertRule[] = [
  {
    id: 'rule_1',
    name: 'Cảnh báo bài viết Siêu Viral đối thủ',
    minViralScore: 85,
    keywords: ['Topify', 'Review', 'Sale'],
    notifyInApp: true,
    notifyEmail: true,
    isActive: true,
  },
  {
    id: 'rule_2',
    name: 'Theo dõi từ khóa Khuyến mãi mùa hè',
    minViralScore: 75,
    keywords: ['Khuyến mãi', 'Freeship', 'Giảm giá'],
    notifyInApp: true,
    notifyEmail: false,
    isActive: true,
  },
];

let triggeredAlerts: TriggeredAlertItem[] = [
  {
    id: 'alert_ev_1',
    ruleName: 'Cảnh báo bài viết Siêu Viral đối thủ',
    title: 'Phát hiện bài viết đạt 95 điểm Viral từ kênh @ReviewThoiTrang: "Review mẫu áo sơ mi lụa tay bồng..."',
    sourceUrl: 'https://tiktok.com/@sample/video/1',
    platform: 'TIKTOK',
    viralScore: 95,
    detectedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'alert_ev_2',
    ruleName: 'Theo dõi từ khóa Khuyến mãi mùa hè',
    title: 'Từ khóa "Freeship" xuất hiện 140 lần trong 1 giờ qua trên cộng đồng Facebook Hội Mua Sắm',
    sourceUrl: 'https://facebook.com/group/sample',
    platform: 'FACEBOOK',
    viralScore: 78,
    detectedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    isRead: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      rules: alertRules,
      alerts: triggeredAlerts,
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
    const action = body.action || 'create_rule';

    if (action === 'mark_read') {
      const { id } = body;
      triggeredAlerts = triggeredAlerts.map((a) => (a.id === id || !id ? { ...a, isRead: true } : a));
      return NextResponse.json({ success: true, message: 'Đã đánh dấu đã đọc' });
    }

    if (action === 'create_rule') {
      const newRule: AlertRule = {
        id: `rule_${Date.now()}`,
        name: body.name || 'Quy tắc cảnh báo mới',
        minViralScore: body.minViralScore || 80,
        keywords: body.keywords || ['Topify'],
        notifyInApp: body.notifyInApp ?? true,
        notifyEmail: body.notifyEmail ?? false,
        isActive: true,
      };
      alertRules.unshift(newRule);
      return NextResponse.json({ success: true, rule: newRule });
    }

    if (action === 'toggle_rule') {
      const { id } = body;
      alertRules = alertRules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_ALERTS_POST]', error);
    return NextResponse.json({ error: 'Lỗi cập nhật cấu hình cảnh báo' }, { status: 500 });
  }
}
