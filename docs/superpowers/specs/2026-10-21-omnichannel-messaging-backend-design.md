# Omnichannel Messaging Backend Specification

**Date:** 2026-10-21  
**Status:** Approved  
**Author:** Antigravity Engineering  
**Scope:** Architecture & Backend Implementation for Omnichannel Inbox & Multi-Platform Social Messaging Integration (F081 - F093)

---

## 1. Executive Summary & Goals

Topify currently provides a Unified Inbox UI (M3. Hộp thư hợp nhất) and CRM (M4. Khách hàng), but social platform interactions have been using simulated mock data (`{ seed: true }`). 

This specification defines the production-grade **Omnichannel Messaging Backend** connecting real social platforms with Topify:
1. **Meta Official**: Facebook Fanpage Messenger, Instagram Direct Messages, and Post Comments via Meta Graph API & Webhooks.
2. **Telegram**: Telegram Bot API Webhook (`/api/webhooks/telegram`) and message dispatching, with 1-click webhook registration and support for future MTProto personal accounts.
3. **Zalo Official Account (OA)**: Zalo Open API & Webhook (`user_send_text`, `user_send_image`).
4. **TikTok**: TikTok Business Messaging Webhook and Send API.
5. **Facebook Clones / Personal Accounts**: Background sync worker polling messages from `FacebookAccount` accounts using mobile / Graph API endpoints with cookies/tokens.
6. **Automatic CRM Integration**: Inbound messages from new contacts automatically create or enrich records in `Customer` (CRM) with platform badges (`#facebook`, `#telegram`, `#zalo`) and initial lead score.
7. **Two-Way Messaging**: Outbound replies from Topify UI (`/api/inbox/[id]/reply`) are dispatched directly back to the respective social platform via the appropriate channel API.

---

## 2. System Architecture

```
[Customer on Facebook/Insta]  [Customer on Telegram]  [Customer on Zalo]  [FB Personal Clones]
         │                            │                       │                    │
   (Meta Webhook)             (Telegram Webhook)        (Zalo Webhook)      (Background Poller)
         │                            │                       │                    │
         ▼                            ▼                       ▼                    ▼
   /api/webhooks/meta        /api/webhooks/telegram   /api/webhooks/zalo     lib/inbox/poller.ts
         │                            │                       │                    │
         └────────────────────────────┼───────────────────────┴────────────────────┘
                                      ▼
                        lib/inbox/adapters/ (Adapter Pattern)
                                      ▼
                           UnifiedInboundMessage
                                      ▼
                         lib/inbox/ingestion.ts
                         ├── Deduplication (externalId)
                         ├── Conversation Lookup / Create
                         ├── Customer CRM Auto-Create / Link
                         ├── SLA Deadline Calculation (15m)
                         └── Message Record (INBOUND)
                                      ▼
                           PostgreSQL (Prisma DB)
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  [Omnichannel Inbox UI]       [CRM Lead List]
                         │
                    (Staff Reply)
                         ▼
             POST /api/inbox/[id]/reply
                         ▼
             lib/inbox/dispatcher.ts (Outbound Dispatcher)
                         ├── Meta Graph API (/v20.0/me/messages)
                         ├── Telegram Bot API (sendMessage / sendPhoto)
                         ├── Zalo Open API (oa/message/cs)
                         └── TikTok Messaging API
```

---

## 3. Data Model & Schema Updates (`prisma/schema.prisma`)

### 3.1. Enums
```prisma
enum Platform {
  FACEBOOK_REELS
  INSTAGRAM_REELS
  YOUTUBE_SHORTS
  TIKTOK_VIDEO
  ZALO_POST
  FACEBOOK_POST
  INSTAGRAM_CAROUSEL
  INSTAGRAM_STORY
  ZALO_ARTICLE
  // New chat & messaging channels:
  FACEBOOK_MESSENGER
  INSTAGRAM_DM
  TELEGRAM
  ZALO_CHAT
  TIKTOK_DM
}

enum SocialProvider {
  META
  YOUTUBE
  GOOGLE_DRIVE
  TIKTOK
  ZALO
  TELEGRAM
}
```

### 3.2. Model Updates
- **`SocialAccount`**:
  - `telegramBotToken String?`
  - `telegramBotUsername String?`
  - `zaloOaId String?`
  - `webhookSecret String?`
- **`Conversation`**:
  - `contactPhone String?`
  - `contactAvatar String?`
  - `socialAccountId String?`
- **`Message`**:
  - `externalId String?` (Indexed for deduplication)
  - `mediaType MediaType?`
  - `senderAvatar String?`

---

## 4. Ingestion Pipeline & Adapters

### 4.1. Universal Contract (`lib/inbox/types.ts`)
```ts
export interface UnifiedInboundMessage {
  platform: Platform;
  channelExternalId: string; // e.g. Page ID, Bot Username, OA ID
  senderId: string;          // Platform user ID (PSID for Meta, chat.id for Telegram)
  senderName: string;
  senderAvatar?: string;
  senderPhone?: string;
  messageExternalId: string; // Unique message ID from platform
  content?: string;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  timestamp: Date;
  workspaceId?: string;
  rawPayload?: any;
}
```

### 4.2. Ingestion Service (`lib/inbox/ingestion.ts`)
1. **Deduplication**: Check if a `Message` with `externalId = payload.messageExternalId` exists. If yes, ignore to prevent duplicate notifications.
2. **Conversation Matching**: Find `Conversation` where `externalId = "${payload.platform}_${payload.channelExternalId}_${payload.senderId}"`.
3. **CRM Linking**:
   - If conversation has no `contactId`:
   - Search `Customer` by phone (if available) or platform identifier tag.
   - If not found, create new `Customer`:
     `name: payload.senderName, avatar: payload.senderAvatar, phone: payload.senderPhone, tags: "Mới, #${payload.platform}", leadScore: 50`.
   - Link `conversation.contactId = customer.id`.
4. **SLA & Status**:
   - If conversation was `RESOLVED` or `CLOSED`, reopen to `NEW` or `OPEN`.
   - If SLA deadline is missing, calculate `now + 15 minutes`.
   - Set `lastMessageAt = payload.timestamp`.
5. **Create Message**:
   - `direction: 'INBOUND'`, `content: payload.content`, `mediaUrl: payload.mediaUrl`, `senderName: payload.senderName`.

---

## 5. Webhook Endpoints & Authentication

### 5.1. Meta Webhooks (`app/api/webhooks/meta/route.ts`)
- **GET**: Meta verification request (`hub.mode`, `hub.verify_token`, `hub.challenge`).
  - Verify token configured in `.env` or settings (`META_WEBHOOK_VERIFY_TOKEN`).
- **POST**: Meta event notification.
  - Verify HMAC SHA-256 signature (`x-hub-signature-256`) against `META_APP_SECRET`.
  - Process `entry[].messaging[]` (messages, attachments, postbacks).

### 5.2. Telegram Webhooks (`app/api/webhooks/telegram/route.ts`)
- **POST**: Receives Telegram Update object.
  - Authenticate via `x-telegram-bot-api-secret-token` matching configured secret.
  - Handles `message.text`, `message.photo`, `message.document`, `message.contact`.
- **1-Click Webhook Registration (`app/api/social/telegram/setup-webhook/route.ts`)**:
  - Automatically calls `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/webhooks/telegram&secret_token=<SECRET>` so users never have to configure curl commands manually.

### 5.3. Zalo OA Webhooks (`app/api/webhooks/zalo/route.ts`)
- **POST**: Receives Zalo OA event (`user_send_text`, `user_send_image`, `user_send_link`).
  - Verify MAC token / App Secret.
  - Maps `sender.id` and message contents.

---

## 6. Outbound Dispatcher (`lib/inbox/dispatcher.ts`)

When an operator sends a reply via `POST /api/inbox/[id]/reply`:
1. Load `Conversation` and linked `SocialAccount`.
2. Route by `conversation.platform`:
   - **`FACEBOOK_MESSENGER` / `INSTAGRAM_DM`**:
     Call Meta Graph API `POST /v20.0/me/messages` with `{ recipient: { id: senderId }, message: { text: content } }` using Page Access Token.
   - **`TELEGRAM`**:
     Call Telegram Bot API `POST https://api.telegram.org/bot<TOKEN>/sendMessage` with `{ chat_id: senderId, text: content }`.
   - **`ZALO_CHAT`**:
     Call Zalo Open API `POST https://openapi.zalo.me/v3.0/oa/message/cs` with OA Access Token.
   - **`TIKTOK_DM`**:
     Call TikTok Business Messaging API.
3. Update `Message` with outbound externalId from platform response.

---

## 7. Testing & Verification

1. **Unit & Engine Tests**:
   - `lib/inbox/__tests__/adapters.test.ts`: Test normalization of Meta, Telegram, and Zalo payloads.
   - `lib/inbox/__tests__/ingestion.test.ts`: Test deduplication, CRM auto-creation, and conversation updating.
2. **E2E Simulation**:
   - Automated test sending mock Telegram and Meta webhook payloads to endpoints and verifying database records in `Conversation`, `Message`, and `Customer`.
3. **UI Verification**:
   - Open Electron App (`/inbox`), verify that incoming messages display real platform badges (Telegram blue, Facebook Messenger indigo, Zalo cyan).
   - Test sending a reply and verifying successful outbound dispatch.
