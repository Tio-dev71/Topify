import prisma from '@/lib/db';
import { UnifiedInboundMessage, IngestionResult } from './types';

/**
 * Core Ingestion Service for Multi-Platform Social Inbound Messages
 * Deduplicates, finds/creates Conversation, auto-links/creates CRM Customer, and persists Message.
 */
export async function ingestInboundMessage(payload: UnifiedInboundMessage): Promise<IngestionResult> {
  try {
    const {
      platform,
      channelExternalId,
      senderId,
      senderName,
      senderAvatar,
      senderPhone,
      messageExternalId,
      content,
      mediaUrl,
      mediaType,
      timestamp = new Date(),
      workspaceId: providedWorkspaceId,
      socialAccountId: providedSocialAccountId,
    } = payload;

    // 1. Deduplication check
    if (messageExternalId) {
      const existingMessage = await prisma.message.findFirst({
        where: { externalId: messageExternalId },
        include: { conversation: true },
      });
      if (existingMessage) {
        return {
          success: true,
          isDuplicate: true,
          message: existingMessage,
          conversation: existingMessage.conversation,
        };
      }
    }

    // Resolve workspaceId & socialAccountId if not provided
    let workspaceId = providedWorkspaceId;
    let socialAccountId = providedSocialAccountId;

    if (!workspaceId && channelExternalId) {
      const account = await prisma.socialAccount.findFirst({
        where: {
          OR: [
            { pageId: channelExternalId },
            { instagramBusinessId: channelExternalId },
            { zaloOaId: channelExternalId },
            { telegramBotUsername: channelExternalId },
            { telegramBotToken: { contains: channelExternalId } },
          ],
        },
        select: { id: true, workspaceId: true },
      });

      if (account) {
        workspaceId = account.workspaceId || undefined;
        socialAccountId = account.id;
      }
    }

    // Fallback: If still no workspaceId, use default first active workspace
    if (!workspaceId) {
      const defaultWs = await prisma.workspace.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      workspaceId = defaultWs?.id;
    }

    // 2. Find or create Conversation
    // Format unique externalId for conversation: PLATFORM_CHANNEL_SENDER
    const convExternalId = `${platform}_${channelExternalId || 'default'}_${senderId}`;

    let conversation = await prisma.conversation.findFirst({
      where: {
        externalId: convExternalId,
        ...(workspaceId ? { workspaceId } : {}),
      },
      include: { assignedTo: true },
    });

    const isReopen = conversation && (conversation.status === 'RESOLVED' || conversation.status === 'CLOSED');
    const slaDeadline = new Date(Date.now() + 15 * 60 * 1000); // 15 mins SLA default

    if (conversation) {
      // Update existing conversation
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: timestamp,
          ...(isReopen ? { status: 'NEW', slaDeadline } : {}),
          ...(senderAvatar && !conversation.contactAvatar ? { contactAvatar: senderAvatar } : {}),
          ...(senderName && (!conversation.contactName || conversation.contactName === 'Khách hàng') ? { contactName: senderName } : {}),
          ...(senderPhone && !conversation.contactPhone ? { contactPhone: senderPhone } : {}),
          ...(socialAccountId && !conversation.socialAccountId ? { socialAccountId } : {}),
        },
        include: { assignedTo: true },
      });
    } else {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          externalId: convExternalId,
          platform,
          contactName: senderName || 'Khách hàng',
          contactAvatar: senderAvatar,
          contactPhone: senderPhone,
          status: 'NEW',
          slaDeadline,
          lastMessageAt: timestamp,
          workspaceId,
          socialAccountId,
        },
        include: { assignedTo: true },
      });
    }

    // 3. CRM Customer Auto-Link / Creation
    let customer = null;
    if (workspaceId) {
      if (conversation.contactId) {
        customer = await prisma.customer.findUnique({
          where: { id: conversation.contactId },
        });
      }

      if (!customer) {
        // Try to find customer by phone or name in this workspace
        if (senderPhone) {
          customer = await prisma.customer.findFirst({
            where: { workspaceId, phone: senderPhone },
          });
        }

        if (!customer && senderName && senderName !== 'Khách hàng') {
          customer = await prisma.customer.findFirst({
            where: {
              workspaceId,
              name: senderName,
              tags: { contains: platform },
            },
          });
        }

        // If still not found, create new CRM Customer
        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              ...(workspaceId ? { workspaceId } : {}),
              name: senderName || `Khách ${platform}`,
              phone: senderPhone,
              avatar: senderAvatar,
              source: platform,
              tags: `Mới, #${platform.toLowerCase()}`,
              notes: `Tự động tạo từ tin nhắn đến của kênh ${platform}`,
            },
          });
        }

        // Link customer to conversation
        if (customer && conversation.contactId !== customer.id) {
          conversation = await prisma.conversation.update({
            where: { id: conversation.id },
            data: { contactId: customer.id },
            include: { assignedTo: true },
          });
        }
      }
    }

    // 4. Create Message record
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'INBOUND',
        content: content || (mediaUrl ? `[Tệp đính kèm ${mediaType || 'MEDIA'}]` : ''),
        mediaUrl,
        mediaType,
        senderName: senderName || 'Khách hàng',
        senderAvatar,
        externalId: messageExternalId,
        isRead: false,
        createdAt: timestamp,
      },
    });

    return {
      success: true,
      isDuplicate: false,
      conversation,
      message,
      customer,
    };
  } catch (error: any) {
    console.error('[INGESTION_ERROR]', error);
    return {
      success: false,
      isDuplicate: false,
      error: error?.message || 'Ingestion failed',
    };
  }
}
