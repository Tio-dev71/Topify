# Omnichannel Messaging Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade multi-platform messaging backend connecting Meta, Telegram, Zalo OA, and TikTok to Topify Unified Inbox with automated CRM Lead sync and two-way outbound replies.

**Architecture:** Event-Driven Webhook Adapter Pattern with unified Ingestion Engine, automatic CRM customer creation, and platform-specific Outbound Dispatcher.

**Tech Stack:** Next.js App Router, Prisma ORM, PostgreSQL (Supabase), Axios/Fetch, Meta Graph API v20.0, Telegram Bot API, Zalo OpenAPI.

**Spec:** `docs/superpowers/specs/2026-10-21-omnichannel-messaging-backend-design.md`

## Global Constraints
- Strictly preserve existing Topify authentication (`lib/auth.ts`) and workspace scoping.
- Do not break existing Post publishing or SocialAccount OAuth flows.
- Ensure all webhook endpoints handle verification challenges, signature verification, and deduplication.
- Auto-generate or link `Customer` in CRM for every new contact.

---

### Task 1: Database Schema & Migration

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: Updated Prisma Client with `Platform` chat enums (`FACEBOOK_MESSENGER`, `INSTAGRAM_DM`, `TELEGRAM`, `ZALO_CHAT`, `TIKTOK_DM`), `SocialProvider.TELEGRAM`, fields on `SocialAccount`, `Conversation`, and `Message`.

- [x] **Step 1: Update `prisma/schema.prisma`**
  - Add chat values to `enum Platform`.
  - Add `TELEGRAM` to `enum SocialProvider`.
  - Add `telegramBotToken`, `telegramBotUsername`, `zaloOaId`, `webhookSecret` to `model SocialAccount`.
  - Add `contactPhone`, `contactAvatar`, `socialAccountId` to `model Conversation`.
  - Add `externalId`, `mediaType`, `senderAvatar` to `model Message`.
- [x] **Step 2: Generate Prisma Client & Push to Database**
  - Run `npx prisma db push` and `npx prisma generate`.
- [x] **Step 3: Commit Task 1**

---

### Task 2: Core Ingestion Service & Unified Types

**Files:**
- Create: `lib/inbox/types.ts`
- Create: `lib/inbox/ingestion.ts`
- Test: `lib/inbox/__tests__/ingestion.test.ts`

**Interfaces:**
- Produces: `ingestInboundMessage(payload: UnifiedInboundMessage)` returning `{ conversation, message, customer, isDuplicate }`.

- [x] **Step 1: Define `UnifiedInboundMessage` in `lib/inbox/types.ts`**
- [x] **Step 2: Implement `ingestInboundMessage` in `lib/inbox/ingestion.ts`**
  - Check deduplication by `messageExternalId`.
  - Find or create `Conversation` by `externalId`.
  - Auto-create or link `Customer` with `#<platform>` tag and avatar.
  - Calculate SLA deadline (default 15m) and save `Message` (INBOUND).
- [x] **Step 3: Write and run unit test in `lib/inbox/__tests__/ingestion.test.ts`**
- [x] **Step 4: Commit Task 2**

---

### Task 3: Platform Adapters (Meta, Telegram, Zalo)

**Files:**
- Create: `lib/inbox/adapters/meta.ts`
- Create: `lib/inbox/adapters/telegram.ts`
- Create: `lib/inbox/adapters/zalo.ts`
- Test: `lib/inbox/__tests__/adapters.test.ts`

**Interfaces:**
- Produces: `parseMetaWebhook(body)`, `parseTelegramUpdate(body)`, `parseZaloWebhook(body)` returning `UnifiedInboundMessage[]`.

- [x] **Step 1: Implement `lib/inbox/adapters/meta.ts`**
  - Parse Facebook Messenger & Instagram DM messages and attachments.
- [x] **Step 2: Implement `lib/inbox/adapters/telegram.ts`**
  - Parse Telegram Update object (`message.text`, `message.photo`, `message.document`, `message.contact`).
- [x] **Step 3: Implement `lib/inbox/adapters/zalo.ts`**
  - Parse Zalo OA Webhook (`user_send_text`, `user_send_image`).
- [x] **Step 4: Write adapter unit tests and verify parsing**
- [x] **Step 5: Commit Task 3**

---

### Task 4: Webhook HTTP Endpoints & Setup Helper

**Files:**
- Create: `app/api/webhooks/meta/route.ts`
- Create: `app/api/webhooks/telegram/route.ts`
- Create: `app/api/webhooks/zalo/route.ts`
- Create: `app/api/social/telegram/setup-webhook/route.ts`
- Create: `app/api/social/telegram/connect/route.ts`

**Interfaces:**
- Produces: Public HTTP webhook routes receiving real-time events and feeding into `ingestInboundMessage`.

- [x] **Step 1: Implement `app/api/webhooks/meta/route.ts`**
  - Support GET verification (`hub.challenge`) and POST event ingestion with HMAC validation.
- [x] **Step 2: Implement `app/api/webhooks/telegram/route.ts`**
  - Support POST update ingestion with secret token verification.
- [x] **Step 3: Implement `app/api/webhooks/zalo/route.ts`**
  - Support POST event ingestion for Zalo OA.
- [x] **Step 4: Implement 1-Click Telegram connect & webhook setup endpoint**
  - Validate bot token via `https://api.telegram.org/bot<TOKEN>/getMe`, save to `SocialAccount`, and call `setWebhook`.
- [x] **Step 5: Commit Task 4**

---

### Task 5: Outbound Dispatcher & Reply API Integration

**Files:**
- Create: `lib/inbox/dispatcher.ts`
- Modify: `app/api/inbox/[id]/reply/route.ts`

**Interfaces:**
- Produces: `dispatchReply(conversationId, content, mediaUrl)` sending actual API calls to Meta Graph API, Telegram Bot API, or Zalo Open API.

- [x] **Step 1: Implement `lib/inbox/dispatcher.ts`**
  - Send Telegram message via `sendMessage`.
  - Send Meta Messenger message via `POST /v20.0/me/messages`.
  - Send Zalo message via `POST oa/message/cs`.
- [x] **Step 2: Integrate `dispatcher.dispatchReply` into `app/api/inbox/[id]/reply/route.ts`**
- [x] **Step 3: Commit Task 5**

---

### Task 6: Frontend Inbox & Social Connection UI Polish

**Files:**
- Modify: `electron-app/frontend/src/pages/Inbox.tsx`
- Modify: `electron-app/frontend/src/pages/Settings.tsx`
- Modify: `electron-app/frontend/src/components/layout/Sidebar.tsx`

- [x] **Step 1: Update `Inbox.tsx` to display Telegram, Messenger, Zalo, Instagram badges & icons**
- [x] **Step 2: Add Telegram Bot connection modal in `Settings.tsx`**
  - Input Bot Token, auto-verify bot name and set up webhook in 1 click.
- [x] **Step 3: Commit Task 6**

---

### Task 7: End-to-End Verification & Build Check

**Files:**
- Test scripts & build validation

- [x] **Step 1: Run end-to-end simulation script sending mock Telegram & Meta webhooks**
- [x] **Step 2: Verify `Conversation`, `Message`, and `Customer` records in database**
- [x] **Step 3: Test Next.js and Electron frontend build (`npm run build`)**
- [x] **Step 4: Commit Task 7 and report results to user**
