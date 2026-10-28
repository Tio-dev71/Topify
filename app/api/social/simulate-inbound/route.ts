import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { ingestInboundMessage } from '@/lib/inbox/ingestion';
import { Platform } from '@prisma/client';

export const dynamic = 'force-dynamic';

// POST /api/social/simulate-inbound - Simulate receiving a real message via connected social channel
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const currentUser = session.user as any;
    let workspaceId = currentUser.workspaceId;

    if (!workspaceId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true },
      });
      workspaceId = dbUser?.workspaceId || 'default-workspace';
    }

    const body = await req.json();
    const channelType = (body.platform || 'TELEGRAM').toUpperCase();
    const customContent = body.content?.trim();
    const customSenderName = body.senderName?.trim();

    let targetPlatform: Platform = Platform.TELEGRAM;
    let channelExternalId = 'bot_default';
    let defaultSenderName = 'Khách hàng Telegram (@demo)';
    let defaultContent = 'Chào shop, em cần tư vấn mua sắm sản phẩm này ạ!';
    let providerName = 'TELEGRAM';

    if (channelType === 'META' || channelType === 'FACEBOOK') {
      targetPlatform = Platform.FACEBOOK_MESSENGER;
      channelExternalId = 'fb_page_live';
      defaultSenderName = 'Phạm Thu Hằng (Facebook)';
      defaultContent = 'Shop ơi cho em hỏi mẫu áo hoodie này còn hàng size L không ạ?';
      providerName = 'META';
    } else if (channelType === 'ZALO') {
      targetPlatform = Platform.ZALO_CHAT;
      channelExternalId = 'zalo_oa_live';
      defaultSenderName = 'Nguyễn Tuấn Anh (Zalo OA)';
      defaultContent = 'Chào shop, gửi giúp mình bảng giá sỉ và chính sách đại lý nhé!';
      providerName = 'ZALO';
    }

    // Find if user has a connected social account for this provider
    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        provider: providerName as any,
        OR: [
          { userId },
          ...(workspaceId ? [{ workspaceId }] : []),
        ],
      },
      select: {
        id: true,
        accountName: true,
        pageId: true,
        telegramBotUsername: true,
        zaloOaId: true,
      },
    });

    if (socialAccount) {
      if (providerName === 'TELEGRAM' && socialAccount.telegramBotUsername) {
        channelExternalId = socialAccount.telegramBotUsername;
      } else if (providerName === 'META' && socialAccount.pageId) {
        channelExternalId = socialAccount.pageId;
      } else if (providerName === 'ZALO' && socialAccount.zaloOaId) {
        channelExternalId = socialAccount.zaloOaId;
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const senderId = `user_${Date.now()}_${randomSuffix}`;
    const messageExternalId = `msg_${Date.now()}_${randomSuffix}`;

    const inboundResult = await ingestInboundMessage({
      platform: targetPlatform,
      channelExternalId,
      senderId,
      senderName: customSenderName || defaultSenderName,
      messageExternalId,
      content: customContent || defaultContent,
      timestamp: new Date(),
      workspaceId,
      socialAccountId: socialAccount?.id,
    });

    return NextResponse.json({
      success: true,
      result: inboundResult,
      channel: {
        platform: targetPlatform,
        channelExternalId,
        senderName: customSenderName || defaultSenderName,
        content: customContent || defaultContent,
        connectedAccountName: socialAccount?.accountName || null,
      },
      message: `Đã kích hoạt đồng bộ tin nhắn từ kênh ${channelType} vào Hộp thư hợp nhất!`,
    });
  } catch (error: any) {
    console.error('[SIMULATE_INBOUND_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
