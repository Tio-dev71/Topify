import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';

export async function GET() {
  try {
    const storageConfigs = securityEngineStore.getStorageConfigs();
    return NextResponse.json({ storageConfigs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch storage configs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, provider } = body;

    if (action === 'test_connection') {
      if (!provider) {
        return NextResponse.json({ error: 'provider is required' }, { status: 400 });
      }
      const success = securityEngineStore.testStorageConnection(provider);
      const storageConfigs = securityEngineStore.getStorageConfigs();
      return NextResponse.json({ success, storageConfigs });
    }

    if (action === 'set_default') {
      if (!provider) {
        return NextResponse.json({ error: 'provider is required' }, { status: 400 });
      }
      const success = securityEngineStore.setDefaultStorage(provider);
      const storageConfigs = securityEngineStore.getStorageConfigs();
      return NextResponse.json({ success, storageConfigs });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process storage action' }, { status: 500 });
  }
}
