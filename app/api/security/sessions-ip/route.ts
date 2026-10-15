import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';

export async function GET() {
  try {
    const data = securityEngineStore.getActiveSessionsAndIps();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch sessions and IPs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sessionId, ipAddressOrCidr, label, trustedIpId } = body;

    if (action === 'revoke_session') {
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
      }
      const success = securityEngineStore.revokeSession(sessionId);
      const data = securityEngineStore.getActiveSessionsAndIps();
      return NextResponse.json({ success, ...data });
    }

    if (action === 'revoke_all_others') {
      const revokedCount = securityEngineStore.revokeAllOtherSessions();
      const data = securityEngineStore.getActiveSessionsAndIps();
      return NextResponse.json({ success: true, revokedCount, ...data });
    }

    if (action === 'add_trusted_ip') {
      if (!ipAddressOrCidr || !label) {
        return NextResponse.json({ error: 'ipAddressOrCidr and label are required' }, { status: 400 });
      }
      const newIp = securityEngineStore.addTrustedIp(ipAddressOrCidr, label);
      const data = securityEngineStore.getActiveSessionsAndIps();
      return NextResponse.json({ success: true, trustedIp: newIp, ...data });
    }

    if (action === 'remove_trusted_ip') {
      if (!trustedIpId) {
        return NextResponse.json({ error: 'trustedIpId is required' }, { status: 400 });
      }
      const success = securityEngineStore.removeTrustedIp(trustedIpId);
      const data = securityEngineStore.getActiveSessionsAndIps();
      return NextResponse.json({ success, ...data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process session or IP action' }, { status: 500 });
  }
}
