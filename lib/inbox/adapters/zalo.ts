import { UnifiedInboundMessage } from '../types';

/**
 * Zalo Official Account Webhook Adapter
 * Handles user_send_text, user_send_image, user_send_link
 */
export function parseZaloWebhook(body: any): UnifiedInboundMessage[] {
  const results: UnifiedInboundMessage[] = [];
  if (!body || !body.event_name) return results;

  const eventName = body.event_name;
  const oaId = body.oa_id || body.recipient?.id || 'zalo_oa';
  const senderId = body.sender?.id || body.user_id_by_app;
  if (!senderId) return results;

  const msg = body.message || {};
  const msgId = msg.msg_id || `zalo_${Date.now()}`;
  const timestamp = body.timestamp ? new Date(Number(body.timestamp)) : new Date();

  let content = msg.text || '';
  let mediaUrl: string | undefined;
  let mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | undefined;

  if (eventName === 'user_send_image' && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
    mediaUrl = msg.attachments[0].payload?.url;
    mediaType = 'IMAGE';
  } else if (eventName === 'user_send_link') {
    content = `${content} ${msg.attachments?.[0]?.payload?.url || ''}`.trim();
  }

  results.push({
    platform: 'ZALO_CHAT',
    channelExternalId: oaId,
    senderId,
    senderName: `Khách Zalo (${senderId.slice(-4)})`,
    messageExternalId: msgId,
    content: content || (mediaType ? `[Hình ảnh Zalo]` : ''),
    mediaUrl,
    mediaType,
    timestamp,
    rawPayload: body,
  });

  return results;
}
