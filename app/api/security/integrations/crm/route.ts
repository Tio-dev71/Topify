import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';

export async function GET() {
  try {
    const crmIntegrations = securityEngineStore.getCrmIntegrations();
    return NextResponse.json({ crmIntegrations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch CRM integrations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, serviceId, syncType, value } = body;

    if (action === 'toggle_sync') {
      if (!serviceId || !syncType || typeof value !== 'boolean') {
        return NextResponse.json({ error: 'serviceId, syncType, and value are required' }, { status: 400 });
      }
      const success = securityEngineStore.toggleCrmSync(serviceId, syncType, value);
      const crmIntegrations = securityEngineStore.getCrmIntegrations();
      return NextResponse.json({ success, crmIntegrations });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process CRM action' }, { status: 500 });
  }
}
