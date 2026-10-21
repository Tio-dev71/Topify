import { UnifiedInboundMessage } from '../types';

/**
 * Meta Webhook Adapter (Facebook Messenger & Instagram Direct Messages)
 */
export function parseMetaWebhook(body: any): UnifiedInboundMessage[] {
  const results: UnifiedInboundMessage[] = [];
  if (!body || !Array.isArray(body.entry)) return results;

  const isInstagram = body.object === 'instagram';
  const platform = isInstagram ? 'INSTAGRAM_DM' : 'FACEBOOK_MESSENGER';

  for (const entry of body.entry) {
    const channelId = entry.id; // Page ID or Instagram Business ID

    if (Array.isArray(entry.messaging)) {
      for (const event of entry.messaging) {
        const senderId = event.sender?.id;
        const recipientId = event.recipient?.id || channelId;
        const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();

        // 1. Regular text / attachment message
        if (event.message) {
          const mid = event.message.mid;
          const text = event.message.text;

          let mediaUrl: string | undefined;
          let mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | undefined;

          if (Array.isArray(event.message.attachments) && event.message.attachments.length > 0) {
            const firstAtt = event.message.attachments[0];
            mediaUrl = firstAtt.payload?.url;
            if (firstAtt.type === 'image') mediaType = 'IMAGE';
            else if (firstAtt.type === 'video') mediaType = 'VIDEO';
            else if (firstAtt.type === 'audio') mediaType = 'AUDIO';
            else mediaType = 'DOCUMENT';
          }

          results.push({
            platform,
            channelExternalId: recipientId,
            senderId,
            senderName: `Khách ${isInstagram ? 'Instagram' : 'Facebook'} (${senderId.slice(-4)})`,
            messageExternalId: mid,
            content: text,
            mediaUrl,
            mediaType,
            timestamp,
            rawPayload: event,
          });
        }
        // 2. Postback event (Click button in Messenger)
        else if (event.postback) {
          results.push({
            platform,
            channelExternalId: recipientId,
            senderId,
            senderName: `Khách ${isInstagram ? 'Instagram' : 'Facebook'} (${senderId.slice(-4)})`,
            messageExternalId: `postback_${event.postback.mid || Date.now()}`,
            content: `[Bấm nút] ${event.postback.title || event.postback.payload}`,
            timestamp,
            rawPayload: event,
          });
        }
      }
    }
  }

  return results;
}
