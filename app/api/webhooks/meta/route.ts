import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { parseMetaWebhook } from '@/lib/inbox/adapters/meta';
import { ingestInboundMessage } from '@/lib/inbox/ingestion';

export const dynamic = 'force-dynamic';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'topify_meta_verify_token';
const APP_SECRET = process.env.META_APP_SECRET || '';

// GET /api/webhooks/meta - Webhook verification by Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[META_WEBHOOK] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden verification token' }, { status: 403 });
}

// POST /api/webhooks/meta - Ingest Messenger & Instagram events
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // Verify signature if APP_SECRET is present
    if (APP_SECRET && signature) {
      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', APP_SECRET)
        .update(rawBody)
        .digest('hex')}`;
      if (signature !== expectedSignature) {
        console.warn('[META_WEBHOOK] Invalid HMAC signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const messages = parseMetaWebhook(body);

    const results = [];
    for (const msg of messages) {
      const res = await ingestInboundMessage(msg);
      results.push(res);
    }

    return NextResponse.json({
      success: true,
      received: messages.length,
      processed: results.length,
    });
  } catch (error: any) {
    console.error('[META_WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
