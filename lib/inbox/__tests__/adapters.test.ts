import { describe, it, expect } from 'vitest';
import { parseMetaWebhook } from '../adapters/meta';
import { parseTelegramUpdate } from '../adapters/telegram';
import { parseZaloWebhook } from '../adapters/zalo';

describe('Omnichannel Platform Adapters', () => {
  describe('Meta Webhook Adapter', () => {
    it('should parse Facebook Messenger text message', () => {
      const payload = {
        object: 'page',
        entry: [
          {
            id: 'page_123456',
            messaging: [
              {
                sender: { id: 'psid_789' },
                recipient: { id: 'page_123456' },
                timestamp: 1690000000000,
                message: {
                  mid: 'm_mid12345',
                  text: 'Shop còn áo màu đen size L không?',
                },
              },
            ],
          },
        ],
      };

      const messages = parseMetaWebhook(payload);
      expect(messages).toHaveLength(1);
      expect(messages[0].platform).toBe('FACEBOOK_MESSENGER');
      expect(messages[0].channelExternalId).toBe('page_123456');
      expect(messages[0].senderId).toBe('psid_789');
      expect(messages[0].content).toBe('Shop còn áo màu đen size L không?');
      expect(messages[0].messageExternalId).toBe('m_mid12345');
    });

    it('should parse Instagram Direct message with image attachment', () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'ig_biz_999',
            messaging: [
              {
                sender: { id: 'igsid_444' },
                recipient: { id: 'ig_biz_999' },
                timestamp: 1690000000000,
                message: {
                  mid: 'ig_mid_555',
                  text: 'Sản phẩm này giá bao nhiêu ạ?',
                  attachments: [
                    {
                      type: 'image',
                      payload: { url: 'https://example.com/photo.jpg' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const messages = parseMetaWebhook(payload);
      expect(messages).toHaveLength(1);
      expect(messages[0].platform).toBe('INSTAGRAM_DM');
      expect(messages[0].mediaUrl).toBe('https://example.com/photo.jpg');
      expect(messages[0].mediaType).toBe('IMAGE');
    });
  });

  describe('Telegram Webhook Adapter', () => {
    it('should parse Telegram text message with sender details', () => {
      const update = {
        update_id: 10001,
        message: {
          message_id: 42,
          from: {
            id: 12345678,
            first_name: 'Minh',
            last_name: 'Hoang',
            username: 'minhhoang26',
          },
          chat: { id: 12345678, type: 'private' },
          date: 1690000000,
          text: 'Tư vấn giúp em gói phần mềm Topify với ạ!',
        },
      };

      const messages = parseTelegramUpdate(update, '@topify_official_bot');
      expect(messages).toHaveLength(1);
      expect(messages[0].platform).toBe('TELEGRAM');
      expect(messages[0].channelExternalId).toBe('@topify_official_bot');
      expect(messages[0].senderId).toBe('12345678');
      expect(messages[0].senderName).toBe('Minh Hoang (@minhhoang26)');
      expect(messages[0].content).toBe('Tư vấn giúp em gói phần mềm Topify với ạ!');
    });

    it('should extract shared phone number from Telegram contact', () => {
      const update = {
        update_id: 10002,
        message: {
          message_id: 43,
          from: { id: 888888, first_name: 'Thu Trang' },
          chat: { id: 888888 },
          date: 1690000000,
          contact: {
            phone_number: '+84912345678',
            first_name: 'Thu Trang',
          },
        },
      };

      const messages = parseTelegramUpdate(update);
      expect(messages).toHaveLength(1);
      expect(messages[0].senderPhone).toBe('+84912345678');
      expect(messages[0].content).toContain('+84912345678');
    });
  });

  describe('Zalo OA Webhook Adapter', () => {
    it('should parse user_send_text event', () => {
      const body = {
        event_name: 'user_send_text',
        app_id: 'app_123',
        oa_id: 'oa_456',
        sender: { id: 'user_zalo_789' },
        recipient: { id: 'oa_456' },
        message: {
          msg_id: 'zalo_msg_111',
          text: 'Xin chào shop, shop có ship hoả tốc không?',
        },
        timestamp: '1690000000000',
      };

      const messages = parseZaloWebhook(body);
      expect(messages).toHaveLength(1);
      expect(messages[0].platform).toBe('ZALO_CHAT');
      expect(messages[0].channelExternalId).toBe('oa_456');
      expect(messages[0].senderId).toBe('user_zalo_789');
      expect(messages[0].content).toBe('Xin chào shop, shop có ship hoả tốc không?');
    });
  });
});
