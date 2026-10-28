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

// In-memory state for dev & demo (Clean state for testing)
let alertRules: AlertRule[] = [];

let triggeredAlerts: TriggeredAlertItem[] = [];

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
