import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';

export async function GET() {
  try {
    const twoFactor = securityEngineStore.getTwoFactorState();
    return NextResponse.json({ twoFactor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch 2FA state' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, enable } = body;

    const result = securityEngineStore.verifyAndToggle2FA(code, enable);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const twoFactor = securityEngineStore.getTwoFactorState();
    return NextResponse.json({ success: true, message: result.message, twoFactor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update 2FA state' }, { status: 500 });
  }
}
