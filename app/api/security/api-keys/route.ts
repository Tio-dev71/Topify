import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';

export async function GET() {
  try {
    const apiKeys = securityEngineStore.getApiKeys();
    return NextResponse.json({ apiKeys });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch API keys' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, roleScope, ipWhitelist, rateLimitPerMin, daysValid, keyId } = body;

    if (action === 'create') {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Key name is required' }, { status: 400 });
      }
      const { key, fullSecret } = securityEngineStore.createApiKey({
        name,
        roleScope,
        ipWhitelist,
        rateLimitPerMin,
        daysValid,
      });
      return NextResponse.json({ success: true, key, fullSecret });
    }

    if (action === 'revoke') {
      if (!keyId) {
        return NextResponse.json({ error: 'keyId is required' }, { status: 400 });
      }
      const success = securityEngineStore.revokeApiKey(keyId);
      const apiKeys = securityEngineStore.getApiKeys();
      return NextResponse.json({ success, apiKeys });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process API key action' }, { status: 500 });
  }
}
