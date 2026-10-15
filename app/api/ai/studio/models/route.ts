import { NextRequest, NextResponse } from 'next/server';
import { topifyAiStore } from '@/lib/ai/topify-ai-engine';

export async function GET() {
  try {
    const models = topifyAiStore.getModels();
    const gateway = topifyAiStore.getGatewayStatus();
    return NextResponse.json({ models, gateway });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch models' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, modelId } = body;

    if (action === 'switch_model') {
      if (!modelId) {
        return NextResponse.json({ error: 'modelId is required' }, { status: 400 });
      }
      const success = topifyAiStore.setActiveModel(modelId);
      const models = topifyAiStore.getModels();
      const gateway = topifyAiStore.getGatewayStatus();
      return NextResponse.json({ success, models, gateway });
    }

    if (action === 'ping_gateway') {
      const start = Date.now();
      // Test ping simulation
      await new Promise((r) => setTimeout(r, 45));
      const latencyMs = Date.now() - start;
      const gateway = topifyAiStore.getGatewayStatus();
      gateway.latencyMs = latencyMs;
      return NextResponse.json({ success: true, latencyMs, gateway });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update model settings' }, { status: 500 });
  }
}
