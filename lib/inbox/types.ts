import { Platform, MediaType } from '@prisma/client';

export interface UnifiedInboundMessage {
  platform: Platform;
  channelExternalId: string; // e.g. Page ID, Bot ID/Username, OA ID
  senderId: string;          // User ID on platform (PSID for Facebook, chat_id for Telegram, user_id for Zalo)
  senderName: string;
  senderAvatar?: string;
  senderPhone?: string;
  messageExternalId: string; // Message ID from platform for deduplication
  content?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  timestamp?: Date;
  workspaceId?: string;
  socialAccountId?: string;
  rawPayload?: any;
}

export interface UnifiedOutboundMessage {
  conversationId: string;
  platform: Platform;
  channelExternalId: string;
  recipientId: string;       // User ID on platform to send to
  content?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  workspaceId?: string;
}

export interface IngestionResult {
  success: boolean;
  isDuplicate: boolean;
  conversation?: any;
  message?: any;
  customer?: any;
  error?: string;
}
