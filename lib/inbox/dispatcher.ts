import prisma from '@/lib/db';
import axios from 'axios';

export interface DispatchResult {
  dispatched: boolean;
  platformMessageId?: string;
  error?: string;
}

/**
 * Outbound Dispatcher Engine
 * Sends staff replies from Topify back to external social platforms (Telegram, Meta, Zalo).
 */
export async function dispatchReply(
  conversationId: string,
  content: string,
  mediaUrl?: string
): Promise<DispatchResult> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        socialAccount: true,
      },
    });

    if (!conversation) {
      return { dispatched: false, error: 'Không tìm thấy cuộc hội thoại' };
    }

    const { platform, externalId, workspaceId } = conversation;
    if (!externalId) {
      // Demo / simulated conversation
      return { dispatched: true, platformMessageId: `mock_${Date.now()}` };
    }

    // Extract recipientId from externalId
    // Format: PLATFORM_CHANNEL_SENDER
    const parts = externalId.split('_');
    const recipientId = parts[parts.length - 1]; // last segment is platform user ID

    // 1. Dispatch to Telegram
    if (platform === 'TELEGRAM') {
      let botToken = conversation.socialAccount?.telegramBotToken || conversation.socialAccount?.accessToken;

      if (!botToken && workspaceId) {
        const tgAccount = await prisma.socialAccount.findFirst({
          where: { workspaceId, provider: 'TELEGRAM', status: 'CONNECTED' },
        });
        botToken = tgAccount?.telegramBotToken || tgAccount?.accessToken;
      }

      if (!botToken) {
        console.warn('[DISPATCH_TG] No Telegram bot token found, simulated dispatch');
        return { dispatched: false, error: 'Chưa có Token Telegram Bot để gửi tin' };
      }

      let res: any;
      if (mediaUrl) {
        res = await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          chat_id: recipientId,
          photo: mediaUrl,
          caption: content || undefined,
        });
      } else {
        res = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: recipientId,
          text: content,
        });
      }

      const sentMsgId = res.data?.result?.message_id;
      return {
        dispatched: true,
        platformMessageId: sentMsgId ? `tg_${sentMsgId}` : undefined,
      };
    }

    // 2. Dispatch to Meta (Facebook Messenger & Instagram DM)
    if (platform === 'FACEBOOK_MESSENGER' || platform === 'INSTAGRAM_DM' || platform === 'FACEBOOK_POST') {
      let pageAccessToken = conversation.socialAccount?.accessToken;

      if (!pageAccessToken && workspaceId) {
        const metaAccount = await prisma.socialAccount.findFirst({
          where: { workspaceId, provider: 'META', status: 'CONNECTED' },
        });
        pageAccessToken = metaAccount?.accessToken;
      }

      if (!pageAccessToken) {
        console.warn('[DISPATCH_META] No Meta access token found');
        return { dispatched: false, error: 'Chưa kết nối Meta Page Access Token' };
      }

      const bodyPayload: any = {
        recipient: { id: recipientId },
        message: mediaUrl
          ? {
              attachment: {
                type: 'image',
                payload: { url: mediaUrl, is_reusable: true },
              },
            }
          : { text: content },
      };

      const res = await axios.post(
        `https://graph.facebook.com/v20.0/me/messages?access_token=${pageAccessToken}`,
        bodyPayload
      );

      return {
        dispatched: true,
        platformMessageId: res.data?.message_id,
      };
    }

    // 3. Dispatch to Zalo OA
    if (platform === 'ZALO_CHAT' || platform === 'ZALO_POST') {
      let oaToken = conversation.socialAccount?.accessToken;

      if (!oaToken && workspaceId) {
        const zaloAccount = await prisma.socialAccount.findFirst({
          where: { workspaceId, provider: 'ZALO', status: 'CONNECTED' },
        });
        oaToken = zaloAccount?.accessToken;
      }

      if (!oaToken) {
        return { dispatched: false, error: 'Chưa có Token Zalo OA' };
      }

      const res = await axios.post(
        'https://openapi.zalo.me/v3.0/oa/message/cs',
        {
          recipient: { user_id: recipientId },
          message: { text: content },
        },
        {
          headers: { access_token: oaToken },
        }
      );

      return {
        dispatched: res.data?.error === 0,
        platformMessageId: res.data?.data?.message_id,
        error: res.data?.error !== 0 ? res.data?.message : undefined,
      };
    }

    // Default fallback
    return { dispatched: true, platformMessageId: `mock_${Date.now()}` };
  } catch (error: any) {
    console.error('[OUTBOUND_DISPATCH_ERROR]', error?.response?.data || error.message);
    return {
      dispatched: false,
      error: error?.response?.data?.error?.message || error?.message || 'Dispatch failed',
    };
  }
}
