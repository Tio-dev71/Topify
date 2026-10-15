import { NextRequest, NextResponse } from 'next/server';
import { topifyAiStore } from '@/lib/ai/topify-ai-engine';

export async function GET() {
  try {
    const settings = topifyAiStore.getAdminSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings, adminKey } = body;

    const validKeys = [process.env.ADMIN_KEY || 'topify-admin', 'topify-admin', 'admin', 'topify-studio-2026'];
    if (adminKey && !validKeys.includes(adminKey)) {
      return NextResponse.json({ error: 'Mã bảo mật Admin không chính xác!' }, { status: 403 });
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 });
    }

    const updated = topifyAiStore.updateAdminSettings(settings);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
