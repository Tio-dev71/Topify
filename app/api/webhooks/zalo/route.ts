import { NextRequest, NextResponse } from 'next/server';
import { parseZaloWebhook } from '@/lib/inbox/adapters/zalo';
import { ingestInboundMessage } from '@/lib/inbox/ingestion';

export const dynamic = 'force-dynamic';

// POST /api/webhooks/zalo - Ingest Zalo OA webhook events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const messages = parseZaloWebhook(body);
    const results = [];

    for (const msg of messages) {
      const res = await ingestInboundMessage(msg);
      results.push(res);
    }

    return NextResponse.json({
      error: 0,
      message: 'Success',
      processed: results.length,
    });
  } catch (error: any) {
    console.error('[ZALO_WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: -1, message: error.message }, { status: 500 });
  }
}
