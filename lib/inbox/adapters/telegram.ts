import { UnifiedInboundMessage } from '../types';

/**
 * Telegram Bot Webhook Adapter
 * Normalizes Telegram Update objects (message, photo, document, contact)
 */
export function parseTelegramUpdate(body: any, botUsername?: string): UnifiedInboundMessage[] {
  const results: UnifiedInboundMessage[] = [];
  if (!body) return results;

  const msg = body.message || body.channel_post || body.edited_message;
  if (!msg) return results;

  const sender = msg.from || {};
  const senderId = String(sender.id || msg.chat?.id);
  const fullName = [sender.first_name, sender.last_name].filter(Boolean).join(' ') || sender.username || `User ${senderId}`;
  const username = sender.username ? `@${sender.username}` : undefined;
  const channelId = botUsername || String(msg.chat?.id || 'telegram_bot');

  const timestamp = msg.date ? new Date(msg.date * 1000) : new Date();
  const messageExternalId = `tg_${msg.message_id}_${senderId}`;

  let content = msg.text || msg.caption || '';
  let mediaUrl: string | undefined;
  let mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | undefined;
  let senderPhone: string | undefined;

  // Handle Photo
  if (Array.isArray(msg.photo) && msg.photo.length > 0) {
    const largestPhoto = msg.photo[msg.photo.length - 1];
    mediaUrl = largestPhoto.file_id; // file_id can be downloaded via getFile
    mediaType = 'IMAGE';
  }
  // Handle Document
  else if (msg.document) {
    mediaUrl = msg.document.file_id;
    mediaType = 'DOCUMENT';
  }
  // Handle Video
  else if (msg.video) {
    mediaUrl = msg.video.file_id;
    mediaType = 'VIDEO';
  }
  // Handle Shared Contact
  if (msg.contact?.phone_number) {
    senderPhone = msg.contact.phone_number;
    content = content ? `${content}\n[SĐT liên hệ: ${senderPhone}]` : `[Đã chia sẻ số điện thoại: ${senderPhone}]`;
  }

  results.push({
    platform: 'TELEGRAM',
    channelExternalId: channelId,
    senderId,
    senderName: fullName + (username ? ` (${username})` : ''),
    senderPhone,
    messageExternalId,
    content: content || (mediaType ? `[Tệp ${mediaType} gửi từ Telegram]` : ''),
    mediaUrl,
    mediaType,
    timestamp,
    rawPayload: body,
  });

  return results;
}
