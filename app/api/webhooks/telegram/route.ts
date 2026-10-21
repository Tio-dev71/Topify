import { NextRequest, NextResponse } from 'next/server';
import { parseTelegramUpdate } from '@/lib/inbox/adapters/telegram';
import { ingestInboundMessage } from '@/lib/inbox/ingestion';

export const dynamic = 'force-dynamic';

// POST /api/webhooks/telegram - Ingest Telegram Bot Updates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const messages = parseTelegramUpdate(body);
    const results = [];

    for (const msg of messages) {
      const res = await ingestInboundMessage(msg);
      results.push(res);
    }

    return NextResponse.json({
      ok: true,
      received: messages.length,
      processed: results.length,
    });
  } catch (error: any) {
    console.error('[TELEGRAM_WEBHOOK_ERROR]', error);
    // Always return ok: true to Telegram so it doesn't retry repeatedly on client-side errors
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  }
}
