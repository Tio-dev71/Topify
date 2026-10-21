import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import axios from 'axios';

export const dynamic = 'force-dynamic';

// GET/POST /api/social/telegram/setup-webhook - Check or re-register Webhook
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const account = await prisma.socialAccount.findFirst({
      where: { userId, provider: 'TELEGRAM' },
    });

    if (!account || !account.accessToken) {
      return NextResponse.json({ error: 'Chưa kết nối Telegram Bot' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const publicUrl = body.customWebhookUrl || process.env.NEXTAUTH_URL || process.env.AUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const webhookUrl = `${publicUrl}/api/webhooks/telegram`;

    const res = await axios.post(`https://api.telegram.org/bot${account.accessToken}/setWebhook`, {
      url: webhookUrl,
      allowed_updates: ['message', 'edited_message', 'channel_post'],
    });

    return NextResponse.json({
      success: res.data?.ok === true,
      description: res.data?.description,
      webhookUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
