import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';

export async function GET() {
  try {
    const data = securityEngineStore.getWebhooks();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch webhooks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, endpointUrl, subscribedEvents, webhookId } = body;

    if (action === 'create') {
      if (!name || !endpointUrl || !subscribedEvents || subscribedEvents.length === 0) {
        return NextResponse.json({ error: 'name, endpointUrl and subscribedEvents are required' }, { status: 400 });
      }
      const newWebhook = securityEngineStore.createWebhook({
        name,
        endpointUrl,
        subscribedEvents,
      });
      return NextResponse.json({ success: true, webhook: newWebhook });
    }

    if (action === 'test_ping') {
      if (!webhookId) {
        return NextResponse.json({ error: 'webhookId is required' }, { status: 400 });
      }
      const pingResult = securityEngineStore.testWebhookPing(webhookId);
      const data = securityEngineStore.getWebhooks();
      return NextResponse.json({ success: true, pingResult, ...data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process webhook action' }, { status: 500 });
  }
}
