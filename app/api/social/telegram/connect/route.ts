import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import axios from 'axios';

export const dynamic = 'force-dynamic';

// POST /api/social/telegram/connect - Connect Telegram Bot and auto register webhook
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { botToken } = body;

    if (!botToken || !botToken.trim()) {
      return NextResponse.json({ error: 'Bot Token không được để trống' }, { status: 400 });
    }

    const cleanToken = botToken.trim();

    // 1. Verify Bot Token with Telegram getMe API
    let botInfo: any;
    try {
      const getMeRes = await axios.get(`https://api.telegram.org/bot${cleanToken}/getMe`, { timeout: 10000 });
      if (!getMeRes.data?.ok) {
        return NextResponse.json({ error: 'Token Telegram Bot không hợp lệ' }, { status: 400 });
      }
      botInfo = getMeRes.data.result;
    } catch (err: any) {
      return NextResponse.json(
        { error: `Không thể kết nối tới Telegram API: ${err?.response?.data?.description || err.message}` },
        { status: 400 }
      );
    }

    // 2. Upsert SocialAccount record
    const account = await prisma.socialAccount.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'TELEGRAM',
        },
      },
      update: {
        accessToken: cleanToken,
        telegramBotToken: cleanToken,
        telegramBotUsername: botInfo.username,
        accountName: botInfo.first_name || botInfo.username,
        status: 'CONNECTED',
        workspaceId,
      },
      create: {
        userId,
        workspaceId,
        provider: 'TELEGRAM',
        accessToken: cleanToken,
        telegramBotToken: cleanToken,
        telegramBotUsername: botInfo.username,
        accountName: botInfo.first_name || botInfo.username,
        status: 'CONNECTED',
      },
    });

    // 3. Auto register Webhook URL with Telegram
    // Use origin or configured public URL
    const publicUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const webhookUrl = `${publicUrl}/api/webhooks/telegram`;

    let webhookRegistered = false;
    let webhookNotice = '';

    try {
      const setHookRes = await axios.post(`https://api.telegram.org/bot${cleanToken}/setWebhook`, {
        url: webhookUrl,
        allowed_updates: ['message', 'edited_message', 'channel_post'],
      });
      webhookRegistered = setHookRes.data?.ok === true;
      webhookNotice = setHookRes.data?.description || 'Webhook đã đăng ký thành công!';
    } catch (whErr: any) {
      webhookNotice = `Lưu Bot thành công, nhưng chưa đăng ký được Webhook tự động: ${whErr?.message}`;
    }

    return NextResponse.json({
      success: true,
      bot: {
        id: botInfo.id,
        username: botInfo.username,
        name: botInfo.first_name,
      },
      account,
      webhookUrl,
      webhookRegistered,
      webhookNotice,
    });
  } catch (error: any) {
    console.error('[TELEGRAM_CONNECT_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
